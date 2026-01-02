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
            'interest_rate' => 'required|numeric', // Annual or Monthly? Assuming Flat Monthly for simplicity based on common leasing or Annual Flat. Let's assume Annual Flat for now.
            // Actually, requirements said "calculate interest". Common th Leasing is Flat Rate Monthly or Yearly.
            // Let's implement Simple Interest Calculation:
            // Principal = Total - Down
            // Total Interest = Principal * (Rate/100) * (Months/12) -> If rate is annual.
            // OR Principal * (Rate/100) * Months -> If rate is monthly.
            // Let's assume Rate is YEARLY PERCENTAGE for now.
            'installments_count' => 'required|integer|min:1',
            'start_date' => 'required|date',
        ]);

        $preview = $this->calculateSchedule(
            $request->total_price,
            $request->down_payment,
            $request->interest_rate,
            $request->installments_count,
            $request->start_date
        );

        return response()->json($preview);
    }

    private function calculateSchedule($total, $down, $rate, $months, $startDate)
    {
        $principal = $total - $down;
        // Simple Interest Formula: Interest = Principal * Rate * Time
        // Rate is percentage per year? Let's assume Rate is % per Year.
        $interestTotal = $principal * ($rate / 100) * ($months / 12);

        $totalWithInterest = $principal + $interestTotal;
        $installmentAmount = ceil($totalWithInterest / $months); // Round up to avoid decimals issues

        $schedule = [];
        $date = Carbon::parse($startDate);

        for ($i = 1; $i <= $months; $i++) {
            // Next due date: typically same day next month
            $dueDate = $date->copy()->addMonths($i);

            $schedule[] = [
                'installment_number' => $i,
                'due_date' => $dueDate->format('Y-m-d'),
                'amount_due' => $installmentAmount,
            ];
        }

        return [
            'total_price' => $total,
            'down_payment' => $down,
            'principal' => $principal,
            'interest_total' => $interestTotal,
            'total_payable' => $totalWithInterest,
            'installment_amount' => $installmentAmount,
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
        ]);

        // Verify ownership of customer and asset
        // (Simplified check)

        $calc = $this->calculateSchedule(
            $request->total_price,
            $request->down_payment,
            $request->interest_rate,
            $request->installments_count,
            $request->start_date
        );

        DB::beginTransaction();
        try {
            $contract = $request->user()->contracts()->create([
                'customer_id' => $request->customer_id,
                'asset_id' => $request->asset_id,
                'contract_number' => $request->contract_number,
                'type' => $request->type ?? 'hire_purchase',
                'total_price' => $request->total_price,
                'down_payment' => $request->down_payment,
                'principal_amount' => $calc['principal'],
                'interest_rate' => $request->interest_rate,
                'installments_count' => $request->installments_count,
                'installment_amount' => $calc['installment_amount'],
                'start_date' => $request->start_date,
                'status' => 'active',
            ]);

            // Create Installments
            foreach ($calc['schedule'] as $inst) {
                $contract->installments()->create([
                    'installment_number' => $inst['installment_number'],
                    'due_date' => $inst['due_date'],
                    'amount_due' => $inst['amount_due'],
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
