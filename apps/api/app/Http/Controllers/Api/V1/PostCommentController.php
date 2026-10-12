<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostCommentController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $comment = PostComment::create([
            'post_id' => $post->id,
            'author_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        return response()->json($comment->load('author:id,name'), 201);
    }
}
