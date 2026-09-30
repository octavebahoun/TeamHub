<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskComment;
use App\Services\RealtimePublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function __construct(protected RealtimePublisher $realtime) {}

    public function store(Request $request, Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $data = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        if ($task->assignee_id && $task->assignee_id !== $request->user()->id) {
            $this->realtime->notify($task->assignee_id, 'task.commented', [
                'task_id' => $task->id,
                'comment_id' => $comment->id,
                'by' => $request->user()->name,
            ]);
        }

        return response()->json($comment->load('author'), 201);
    }
}
