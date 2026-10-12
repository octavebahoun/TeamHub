<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MyTaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tasks = Task::where('assignee_id', $request->user()->id)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->with('project:id,name')
            ->orderByRaw('due_date IS NULL')
            ->orderBy('due_date')
            ->get();

        return response()->json($tasks);
    }
}
