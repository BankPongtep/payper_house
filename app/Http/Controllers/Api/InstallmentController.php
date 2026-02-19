<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Installment::whereHas('contract', function ($q) use ($user) {
            $q->where('owner_id', $user->id);
        })->with(['contract.asset', 'contract.customer']);

        if ($request->has('status')) {
            $status = $request->status;
            if ($status == 'overdue') {
                $query->where('status', 'pending')
                      ->where('due_date', '<', now()->toDateString());
            } elseif ($status == 'paid') {
                $query->where('status', 'paid');
            } elseif ($status == 'pending') {
                $query->where('status', 'pending')
                      ->where('due_date', '>=', now()->toDateString());
            }
        }

        $installments = $query->orderBy('due_date', 'asc')->get();

        return response()->json($installments);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Installment $installment)
    {
        // Check authorization
        if ($request->user()->id !== $installment->contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'fine_amount' => 'nullable|numeric|min:0',
            'fine_note' => 'nullable|string',
            'status' => 'nullable|in:pending,paid,overdue,partial',
        ]);

        $installment->update($validated);

        return response()->json($installment);
    }
}
