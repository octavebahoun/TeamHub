<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

trait HasStringUuid
{
    public function initializeHasStringUuid(): void
    {
        $this->keyType = 'string';
        $this->incrementing = false;
    }

    protected static function bootHasStringUuid(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}
