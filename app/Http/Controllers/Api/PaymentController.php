<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Installment;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'contract_id' => 'required|exists:contracts,id',
            'installment_id' => 'required|exists:installments,id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $contract = Contract::findOrFail($request->contract_id);
        
        // Ownership check
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $installment = $contract->installments()->findOrFail($request->installment_id);

        if ($installment->status === 'paid') {
           return response()->json(['message' => 'Installment already paid'], 400); 
        }

        DB::beginTransaction();
        try {
            // Update installment
            $newAmountPaid = $installment->amount_paid + $request->amount;
            $installment->amount_paid = $newAmountPaid;
            
            if ($newAmountPaid >= $installment->amount_due) {
                $installment->status = 'paid';
                $installment->paid_at = now();
            } else {
                $installment->status = 'partial';
            }
            $installment->save();

            // Create Receipt
            $receipt = Receipt::create([
                'contract_id' => $contract->id,
                'installment_id' => $installment->id,
                'amount' => $request->amount,
                'issued_by' => $request->user()->id,
            ]);

            // Check if contract is completed (all installments paid)
            if ($contract->installments()->where('status', '!=', 'paid')->count() === 0) {
                $contract->status = 'completed';
                $contract->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Payment processed successfully',
                'receipt' => $receipt,
                'installment' => $installment
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Payment failed: ' . $e->getMessage()], 500);
        }
    }
}
