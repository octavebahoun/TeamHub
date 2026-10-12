<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InboxNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationInboxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = InboxNotification::query()->where('user_id', $request->user()->id);

        $items = (clone $query)->latest()->limit(50)->get();

        return response()->json([
            'data' => $items,
            'unread_count' => (clone $query)->whereNull('read_at')->count(),
        ]);
    }

    public function markAsRead(Request $request, InboxNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 404);

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json($notification);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        InboxNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['unread_count' => 0]);
    }
}
