<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostReactionController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        $data = $request->validate([
            'emoji' => ['required', 'string', 'max:16'],
        ]);

        $reaction = PostReaction::firstOrCreate([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'emoji' => $data['emoji'],
        ]);

        return response()->json($reaction, 201);
    }

    public function destroy(Request $request, Post $post, string $emoji): JsonResponse
    {
        $this->authorize('view', $post);

        PostReaction::where([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'emoji' => $emoji,
        ])->delete();

        return response()->json(['message' => 'Réaction retirée.']);
    }
}
