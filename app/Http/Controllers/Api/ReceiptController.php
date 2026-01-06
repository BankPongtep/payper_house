<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function show(Request $request, $id)
    {
        $user = $request->user();

        // Find receipt and ensure user has access (Owner or Customer)
        $receipt = Receipt::with(['contract.customer', 'contract.asset'])
            ->findOrFail($id);

        $contract = $receipt->contract;

        // Check Access
        if ($user->role === 'owner') {
            if ($contract->owner_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'customer') {
            // For customer, check matching customer_id (via contract or user link)
            // simplified: check if contract.customer.user_id === user.id
            $customer = \App\Models\Customer::where('user_id', $user->id)->first();
            if (!$customer || $contract->customer_id !== $customer->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($receipt);
    }
}
