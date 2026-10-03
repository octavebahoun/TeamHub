<?php

namespace App\Services;

use App\Models\InboxNotification;
use App\Support\CurrentOrganization;

class InboxNotifier
{
    public function __construct(protected RealtimePublisher $realtime) {}

    /**
     * Enregistre la notification pour la cloche, puis la publie sur Redis.
     * Le payload temps réel garde ses clés (title de tâche, etc.) : les champs
     * d'affichage persistés ne les écrasent pas.
     *
     * @param  array<string, mixed>  $payload
     */
    public function toUser(int $userId, string $type, string $title, ?string $body, ?string $link, array $payload = []): InboxNotification
    {
        $notification = InboxNotification::create([
            'organization_id' => CurrentOrganization::id(),
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);

        $this->realtime->notify($userId, $type, $payload + [
            'notification_id' => $notification->id,
            'link' => $link,
        ]);

        return $notification;
    }

    /**
     * Une ligne par destinataire, et un seul événement d'organisation pour la cloche.
     *
     * @param  array<int>  $userIds
     * @param  array<string, mixed>  $payload
     */
    public function toUsers(array $userIds, int $organizationId, string $type, string $title, ?string $body, ?string $link, array $payload = []): void
    {
        foreach ($userIds as $userId) {
            InboxNotification::create([
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'link' => $link,
            ]);
        }

        $this->realtime->notifyOrganization($organizationId, $type, $payload + [
            'link' => $link,
        ]);
    }
}
