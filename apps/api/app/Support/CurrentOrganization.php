<?php

namespace App\Support;

use App\Models\Organization;

class CurrentOrganization
{
    protected static ?Organization $organization = null;

    public static function set(?Organization $organization): void
    {
        static::$organization = $organization;
    }

    public static function get(): ?Organization
    {
        return static::$organization;
    }

    public static function id(): ?int
    {
        return static::$organization?->id;
    }
}
