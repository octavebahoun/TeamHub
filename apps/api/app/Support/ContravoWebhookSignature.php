<?php

namespace App\Support;

/**
 * Contravo documente un HMAC-SHA256 du body brut, mais les secrets `whsec_…`
 * et certains headers (`sha256=…`, `t=…,v1=…`) suivent le schéma Stripe.
 * On accepte les variantes courantes pour ne pas rejeter une livraison valide.
 */
class ContravoWebhookSignature
{
    public static function matches(string $secret, string $body, string $header): bool
    {
        $provided = self::extractProvided($header);
        if ($provided === [] || $secret === '') {
            return false;
        }

        foreach (self::keys($secret) as $key) {
            foreach (self::payloads($body, $header) as $payload) {
                $hex = hash_hmac('sha256', $payload, $key);
                $b64 = base64_encode(hash_hmac('sha256', $payload, $key, true));

                foreach ([$hex, strtoupper($hex), $b64] as $expected) {
                    foreach ($provided as $got) {
                        if (hash_equals($expected, $got)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    public static function describeHeader(string $header): string
    {
        return match (true) {
            $header === '' => 'empty',
            str_contains($header, 'v1=') => 'stripe',
            str_starts_with(strtolower($header), 'sha256=') => 'sha256-prefix',
            (bool) preg_match('/^[a-f0-9]{64}$/i', $header) => 'hex',
            default => 'other',
        };
    }

    /**
     * @return list<string>
     */
    protected static function keys(string $secret): array
    {
        $keys = [$secret];

        if (str_starts_with($secret, 'whsec_')) {
            $rest = substr($secret, strlen('whsec_'));
            $keys[] = $rest;
            $decoded = base64_decode($rest, true);
            if (is_string($decoded) && $decoded !== '') {
                $keys[] = $decoded;
            }
        }

        return array_values(array_unique($keys));
    }

    /**
     * @return list<string>
     */
    protected static function payloads(string $body, string $header): array
    {
        $payloads = [$body];

        if (preg_match('/(?:^|[,;\s])t=(\d+)/', $header, $match)) {
            $payloads[] = $match[1].'.'.$body;
        }

        return $payloads;
    }

    /**
     * @return list<string>
     */
    protected static function extractProvided(string $header): array
    {
        $header = trim($header);
        if ($header === '') {
            return [];
        }

        $values = [$header];

        if (preg_match_all('/v1=([A-Za-z0-9+\/=]+)/', $header, $matches)) {
            $values = array_merge($values, $matches[1]);
        }

        if (preg_match('/^sha256=(.+)$/i', $header, $match)) {
            $values[] = $match[1];
        }

        return array_values(array_unique(array_map('trim', $values)));
    }
}
