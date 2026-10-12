<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

/**
 * Contrôle les fichiers déposés dans WINE avant d'autoriser le téléchargement.
 * ClamAV est utilisé quand le binaire est installé. Sinon, les signatures
 * connues (EICAR, exécutables, scripts) sont refusées.
 */
class FileScanner
{
    public const CLEAN = 'ready';

    public const INFECTED = 'infected';

    public function scanStored(string $path): string
    {
        if (! Storage::disk('local')->exists($path)) {
            return self::INFECTED;
        }

        $bytes = Storage::disk('local')->get($path);

        return $this->scanContents($bytes, $path);
    }

    public function scanContents(string $bytes, ?string $path = null): string
    {
        if ($this->matchesKnownThreat($bytes)) {
            return self::INFECTED;
        }

        if ($path && $this->clamRejects($path)) {
            return self::INFECTED;
        }

        return self::CLEAN;
    }

    protected function matchesKnownThreat(string $bytes): bool
    {
        if (str_contains($bytes, 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
            return true;
        }

        return str_starts_with($bytes, "MZ")
            || str_starts_with($bytes, "\x7fELF")
            || str_starts_with(ltrim($bytes), '<?php');
    }

    protected function clamRejects(string $path): bool
    {
        if (! function_exists('shell_exec')) {
            return false;
        }

        $binary = trim((string) shell_exec('command -v clamscan 2>/dev/null'));
        if ($binary === '') {
            return false;
        }

        $absolute = Storage::disk('local')->path($path);
        $command = escapeshellcmd($binary).' --no-summary '.escapeshellarg($absolute);
        exec($command, $output, $code);

        // 0 = propre, 1 = infecté, autre = scanner indisponible (on ne bloque pas à tort).
        return $code === 1;
    }
}
