<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contract;
use App\Models\User;

class CustomerContractController extends Controller
{
    /**
     * Get all contracts for the logged-in customer
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $customer = \App\Models\Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json([]);
        }

        $contracts = Contract::where('customer_id', $customer->id)
            ->with(['asset:id,name', 'owner:id,name,phone,email,payment_qr_code,bank_name,bank_account_number,bank_account_name'])
            ->withCount([
                'installments',
                'installments as paid_installments_count' => function ($q) {
                    $q->where('status', 'paid');
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($contracts);
    }

    /**
     * Get a specific contract with installments
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $customer = \App\Models\Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        $contract = Contract::where('id', $id)
            ->where('customer_id', $customer->id)
            ->with([
                'asset:id,name,description',
                'owner:id,name,phone,email,payment_qr_code,bank_name,bank_account_number,bank_account_name',
                'installments' => function ($q) {
                    $q->orderBy('due_date', 'asc')
                        ->with('receipt');
                }
            ])
            ->first();

        if (!$contract) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        return response()->json($contract);
    }

    /**
     * Get owner's QR code for payment
     */
    public function getQrCode(Request $request, $id)
    {
        $user = $request->user();
        $customer = \App\Models\Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        $contract = Contract::where('id', $id)
            ->where('customer_id', $customer->id)
            ->with('owner:id,payment_qr_code,bank_name,bank_account_number,bank_account_name')
            ->first();

        if (!$contract) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        $owner = $contract->owner;

        return response()->json([
            'qr_code_url' => $owner->payment_qr_code ? asset('storage/' . $owner->payment_qr_code) : null,
            'bank_name' => $owner->bank_name,
            'bank_account_number' => $owner->bank_account_number,
            'bank_account_name' => $owner->bank_account_name,
        ]);
    }
}
