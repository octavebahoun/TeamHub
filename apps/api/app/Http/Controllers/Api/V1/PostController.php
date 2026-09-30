<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Services\RealtimePublisher;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(protected RealtimePublisher $realtime) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Post::class);

        $posts = Post::query()
            ->when($request->boolean('pinned_only'), fn ($q) => $q->where('pinned', true))
            ->with('author:id,name,avatar')
            ->withCount('reactions', 'comments')
            ->orderByDesc('pinned')
            ->orderByDesc('pinned_at')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Post::class);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $post = Post::create([
            'author_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $this->realtime->notifyOrganization(
            CurrentOrganization::id(),
            'post.created',
            ['post_id' => $post->id, 'author' => $request->user()->name]
        );

        return response()->json($post->load('author:id,name,avatar'), 201);
    }

    public function show(Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        return response()->json(
            $post->load('author:id,name,avatar', 'comments.author:id,name', 'reactions')
        );
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $post->update($data);

        return response()->json($post);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);
        $post->delete();

        return response()->json(['message' => 'Publication supprimée.']);
    }

    public function pin(Request $request, Post $post): JsonResponse
    {
        $this->authorize('pin', $post);

        $pin = $request->boolean('pinned', ! $post->pinned);

        $post->update([
            'pinned' => $pin,
            'pinned_at' => $pin ? now() : null,
        ]);

        return response()->json($post);
    }
}
