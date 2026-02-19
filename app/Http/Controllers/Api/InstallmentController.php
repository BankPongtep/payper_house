<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
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
