<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

class RealtimePublisher
{
    public const CHANNEL_NOTIFICATIONS = 'wine:notifications';
    public const CHANNEL_USER_REVOKED = 'wine:user:revoked';
    public const CHANNEL_PROJECT_EVENTS = 'wine:project:events';

    public function notify(int $userId, string $type, array $payload = []): void
    {
        Redis::publish(self::CHANNEL_NOTIFICATIONS, json_encode([
            'user_id' => $userId,
            'type' => $type,
            'payload' => $payload,
            'at' => now()->toIso8601String(),
        ]));
    }

    public function notifyOrganization(int $organizationId, string $type, array $payload = []): void
    {
        Redis::publish(self::CHANNEL_NOTIFICATIONS, json_encode([
            'organization_id' => $organizationId,
            'type' => $type,
            'payload' => $payload,
            'at' => now()->toIso8601String(),
        ]));
    }

    public function revokeUser(int $userId, int $organizationId): void
    {
        Redis::publish(self::CHANNEL_USER_REVOKED, json_encode([
            'user_id' => $userId,
            'organization_id' => $organizationId,
        ]));
    }

    public function projectEvent(string $action, int $organizationId, int $projectId, array $payload = []): void
    {
        Redis::publish(self::CHANNEL_PROJECT_EVENTS, json_encode([
            'action' => $action,
            'organization_id' => $organizationId,
            'project_id' => $projectId,
            'payload' => $payload,
        ]));
    }
}
