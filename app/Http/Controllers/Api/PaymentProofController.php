<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PaymentProof;
use App\Models\Installment;
use App\Models\Contract;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PaymentProofController extends Controller
{
    /**
     * Customer: List submitted payment proofs
     */
    public function customerIndex(Request $request)
    {
        $user = $request->user();
        $customer = \App\Models\Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json([]);
        }

        $proofs = PaymentProof::where('customer_id', $customer->id)
            ->with([
                'installment' => function ($q) {
                    $q->with('contract:id,contract_number');
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($proofs);
    }

    /**
     * Customer: Submit payment proof
     */
    public function store(Request $request)
    {
        $request->validate([
            'installment_id' => 'required|exists:installments,id',
            'image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'note' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $customer = \App\Models\Customer::where('user_id', $user->id)->firstOrFail();

        // Verify the installment belongs to a contract owned by this customer
        $installment = Installment::with('contract')->findOrFail($request->installment_id);

        if ($installment->contract->customer_id !== $customer->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Store image
        $path = $request->file('image')->store('payment_proofs', 'public');

        $proof = PaymentProof::create([
            'installment_id' => $request->installment_id,
            'customer_id' => $customer->id,
            'image_path' => $path,
            'note' => $request->note,
            'status' => 'pending',
            'submitted_at' => Carbon::now(),
        ]);

        // Update installment status
        $installment->update(['status' => 'pending_verification']);

        return response()->json([
            'message' => 'Payment proof submitted successfully',
            'proof' => $proof,
        ], 201);
    }

    /**
     * Owner: List pending payment proofs
     */
    public function ownerIndex(Request $request)
    {
        $owner = $request->user();

        $proofs = PaymentProof::whereHas('installment.contract', function ($q) use ($owner) {
            $q->where('owner_id', $owner->id);
        })
            ->with([
                'installment' => function ($q) {
                    $q->with('contract:id,contract_number,asset_id');
                },
                'customer:id,name'
            ])
            ->orderBy('submitted_at', 'desc')
            ->get();

        // Add image URL
        $proofs = $proofs->map(function ($proof) {
            $proof->image_url = asset('storage/' . $proof->image_path);
            return $proof;
        });

        return response()->json($proofs);
    }

    /**
     * Owner: Approve payment proof
     */
    public function approve(Request $request, $id)
    {
        $owner = $request->user();

        $proof = PaymentProof::whereHas('installment.contract', function ($q) use ($owner) {
            $q->where('owner_id', $owner->id);
        })->findOrFail($id);

        $proof->update([
            'status' => 'approved',
            'reviewed_at' => Carbon::now(),
        ]);

        // Update installment status to paid
        $installment = $proof->installment;
        $installment->update([
            'status' => 'paid',
            'paid_amount' => $installment->amount,
        ]);

        // Create Receipt
        $receiptNumber = 'RCP-' . now()->format('Ymd') . '-' . str_pad($installment->id, 4, '0', STR_PAD_LEFT);

        // Ensure uniqueness if needed, but timestamp+id is usually unique enough for this scale.

        \App\Models\Receipt::create([
            'receipt_number' => $receiptNumber,
            'contract_id' => $installment->contract_id,
            'installment_id' => $installment->id,
            'payment_proof_id' => $proof->id,
            'amount' => $installment->amount,
            'payment_method' => 'transfer',
            'issued_by' => $owner->id,
            'paid_at' => now(),
        ]);

        return response()->json(['message' => 'Payment approved']);
    }

    /**
     * Owner: Reject payment proof
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'note' => 'nullable|string|max:500',
        ]);

        $owner = $request->user();

        $proof = PaymentProof::whereHas('installment.contract', function ($q) use ($owner) {
            $q->where('owner_id', $owner->id);
        })->findOrFail($id);

        $proof->update([
            'status' => 'rejected',
            'note' => $request->note,
            'reviewed_at' => Carbon::now(),
        ]);

        return response()->json(['message' => 'Payment rejected']);
    }
}
