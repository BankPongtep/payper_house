<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Installment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ContractController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $search = $request->input('search');

        if ($user->role === 'owner') {
            $query = $user->contracts()->with(['customer', 'asset']);
        } else {
            // If customer, find contracts linked to their customer profile (if user_id linked)
            $query = Contract::whereHas('customer', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->with(['asset']);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('contract_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cQ) use ($search) {
                        $cQ->where('name', 'like', "%{$search}%")
                            ->orWhere('id_card_number', 'like', "%{$search}%");
                    });
            });
        }

        return $query->latest()->get();
    }

    /**
     * Preview calculation for contract.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'total_price' => 'required|numeric',
            'down_payment' => 'required|numeric',
            'interest_rate' => 'required|numeric',
            'installments_count' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'contract_type' => 'nullable|in:installment,hire_purchase',
            'balloon_percent' => 'nullable|numeric|min:0|max:100', // % of principal for balloon
        ]);

        $preview = $this->calculateSchedule(
            $request->total_price,
            $request->down_payment,
            $request->interest_rate,
            $request->installments_count,
            $request->start_date,
            $request->contract_type ?? 'installment',
            $request->balloon_percent ?? 0
        );

        return response()->json($preview);
    }

    private function calculateSchedule($total, $down, $rate, $months, $startDate, $contractType = 'installment', $balloonPercent = 0)
    {
        $principal = $total - $down;

        // For hire_purchase, calculate balloon payment (ยอดกู้ธนาคาร)
        $balloonPayment = 0;
        $financedPrincipal = $principal;

        if ($contractType === 'hire_purchase' && $balloonPercent > 0) {
            $balloonPayment = $principal * ($balloonPercent / 100);
            $financedPrincipal = $principal - $balloonPayment; // ส่วนที่ผ่อนกับเจ้าของ
        }

        // Simple Interest Formula: Interest = Principal * Rate * Time
        // Rate is percentage per year
        $interestTotal = $financedPrincipal * ($rate / 100) * ($months / 12);

        $totalWithInterest = $financedPrincipal + $interestTotal;
        $installmentAmount = ceil($totalWithInterest / $months); // Round up

        $schedule = [];
        $date = Carbon::parse($startDate);

        for ($i = 1; $i <= $months; $i++) {
            $dueDate = $date->copy()->addMonths($i);

            $schedule[] = [
                'installment_number' => $i,
                'due_date' => $dueDate->format('Y-m-d'),
                'amount_due' => $installmentAmount,
            ];
        }

        // Calculate end date
        $endDate = $date->copy()->addMonths($months)->format('Y-m-d');

        return [
            'total_price' => $total,
            'down_payment' => $down,
            'principal' => $principal,
            'financed_principal' => $financedPrincipal,
            'interest_total' => round($interestTotal, 2),
            'total_payable' => round($totalWithInterest, 2),
            'installment_amount' => $installmentAmount,
            'balloon_payment' => round($balloonPayment, 2),
            'end_date' => $endDate,
            'schedule' => $schedule,
        ];
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'asset_id' => 'required|exists:assets,id',
            'contract_number' => 'required|string|unique:contracts,contract_number',
            'total_price' => 'required|numeric',
            'down_payment' => 'required|numeric',
            'interest_rate' => 'required|numeric',
            'installments_count' => 'required|integer',
            'start_date' => 'required|date',
            'contract_type' => 'nullable|in:installment,hire_purchase',
            'balloon_percent' => 'nullable|numeric',
        ]);

        $contractType = $request->contract_type ?? 'installment';
        $balloonPercent = $request->balloon_percent ?? 0;

        $calc = $this->calculateSchedule(
            $request->total_price,
            $request->down_payment,
            $request->interest_rate,
            $request->installments_count,
            $request->start_date,
            $contractType,
            $balloonPercent
        );

        DB::beginTransaction();
        try {
            $contract = $request->user()->contracts()->create([
                'customer_id' => $request->customer_id,
                'asset_id' => $request->asset_id,
                'contract_number' => $request->contract_number,
                'type' => $request->type ?? 'hire_purchase',
                'contract_type' => $contractType,
                'total_price' => $request->total_price,
                'down_payment' => $request->down_payment,
                'principal_amount' => $calc['principal'],
                'interest_rate' => $request->interest_rate,
                'installments_count' => $request->installments_count,
                'installment_amount' => $calc['installment_amount'],
                'balloon_payment' => $calc['balloon_payment'],
                'start_date' => $request->start_date,
                'end_date' => $calc['end_date'],
                'original_end_date' => $calc['end_date'],
                'status' => 'active',
            ]);

            // Create Installments
            foreach ($calc['schedule'] as $inst) {
                $contract->installments()->create([
                    'due_date' => $inst['due_date'],
                    'amount' => $inst['amount_due'],
                    'status' => 'pending',
                ]);
            }

            // Update Asset status
            $contract->asset()->update(['status' => 'leased']);

            DB::commit();

            return response()->json($contract->load('installments'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create contract: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return $contract->load('installments', 'customer', 'asset');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contract $contract)
    {
        // Typically strict on updates, maybe specific fields only
        return response()->json(['message' => 'Not implemented fully yet'], 501);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contract->delete();
        return response()->json(['message' => 'Contract deleted']);
    }
}
