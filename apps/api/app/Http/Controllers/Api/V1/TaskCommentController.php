<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Task;
use App\Models\TaskComment;
use App\Services\InboxNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function __construct(protected InboxNotifier $inbox) {}

    public function store(Request $request, Task $task): JsonResponse
    {
        $this->authorize('comment', $task);

        $data = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);
        Activity::log($task->project, 'task.commented', $request->user()->id, ['title' => $task->title, 'task_id' => $task->id]);

        if ($task->assignee_id && $task->assignee_id !== $request->user()->id) {
            $this->inbox->toUser($task->assignee_id, 'task.commented', 'Nouveau commentaire sur une de vos tâches', $request->user()->name, '/taches/'.$task->id, [
                'task_id' => $task->id,
                'comment_id' => $comment->id,
                'by' => $request->user()->name,
            ]);
        }

        return response()->json($comment->load('author'), 201);
    }
}
