<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Installment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade as PDF;

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
            'contract_type' => 'nullable|in:installment,hire_purchase,rental',
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
        if ($contractType === 'rental') {
            // For Rental:
            // $total = Monthly Rent (Input)
            // $down = Security Deposit (Separate, not deducted)
            $installmentAmount = $total;
            $principal = $total * $months; // Total contract value
            $financedPrincipal = $principal;
            $interestTotal = 0;
            $balloonPayment = 0;
            $totalWithInterest = $principal;
        } else {
            // For Installment / Hire Purchase
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
        }

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
            'contract_type' => 'nullable|in:installment,hire_purchase,rental',
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
        return $contract->load('installments', 'customer', 'asset', 'receipts');
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
    public function getPdfUrl(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Generate a temporary signed URL valid for 5 minutes
        $url = URL::temporarySignedRoute(
            'contracts.pdf.stream',
            now()->addMinutes(5),
            ['contract' => $contract->id]
        );

        return response()->json(['url' => $url]);
    }

    public function streamPdf(Request $request, Contract $contract)
    {
        // Valid Signature Check is handled by middleware 'signed' in routes
        if (!$request->hasValidSignature()) {
            abort(403, 'Invalid or expired signature');
        }

        $contract->load('customer', 'asset', 'installments', 'owner');

        // Ensure locale is Thai for dates
        \Carbon\Carbon::setLocale('th');

        $pdf = PDF::loadView('pdfs.contract', compact('contract'));
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('contract-' . $contract->contract_number . '.pdf');
    }

    public function sign(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'signature' => 'required|string',
        ]);

        try {
            $image = $request->signature;
            // Handle data URI scheme
            if (preg_match('/^data:image\/(\w+);base64,/', $image, $type)) {
                $image = substr($image, strpos($image, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif

                if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                    throw new \Exception('invalid image type');
                }
                $image = str_replace(' ', '+', $image);
                $image = base64_decode($image);

                if ($image === false) {
                    throw new \Exception('base64_decode failed');
                }
            } else {
                throw new \Exception('did not match data URI with image data');
            }

            $imageName = 'signatures/' . $contract->id . '_' . Str::random(10) . '.' . $type;

            Storage::disk('public')->put($imageName, $image);

            // Delete old signature if exists
            if ($contract->signature_path) {
                Storage::disk('public')->delete($contract->signature_path);
            }

            $contract->update(['signature_path' => $imageName]);

            return response()->json(['message' => 'Signature saved successfully', 'path' => $imageName]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to save signature: ' . $e->getMessage()], 500);
        }
    }

    public function cancel(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string',
        ]);

        if ($contract->status === 'cancelled') {
            return response()->json(['message' => 'Contract is already cancelled'], 400);
        }

        DB::beginTransaction();
        try {
            // 1. Log cancellation
            DB::table('contract_cancellations')->insert([
                'contract_id' => $contract->id,
                'cancelled_by' => $request->user()->id,
                'reason' => $request->reason,
                'cancelled_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Update Contract status
            $contract->update(['status' => 'cancelled']);

            // 3. Update Asset status to available
            $contract->asset()->update(['status' => 'available']);

            DB::commit();

            return response()->json(['message' => 'Contract cancelled successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to cancel contract: ' . $e->getMessage()], 500);
        }
    }

    public function renew(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'total_price' => 'required|numeric', // This should be the balloon amount
            'interest_rate' => 'required|numeric',
            'installments_count' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'contract_type' => 'nullable|in:installment,hire_purchase',
            'balloon_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $contractType = $request->contract_type ?? 'installment';
        $balloonPercent = $request->balloon_percent ?? 0;

        // Calculate Schedule for New Contract
        $calc = $this->calculateSchedule(
            $request->total_price,
            0, // No down payment for renewal essentially
            $request->interest_rate,
            $request->installments_count,
            $request->start_date,
            $contractType,
            $balloonPercent
        );

        DB::beginTransaction();
        try {
            // 1. Close Old Contract
            $contract->update(['status' => 'closed']);

            // 2. Create New Contract
            $newContract = $request->user()->contracts()->create([
                'customer_id' => $contract->customer_id,
                'asset_id' => $contract->asset_id,
                'contract_number' => 'RN-' . $contract->contract_number . '-' . Carbon::now()->timestamp, // Generate new number
                'type' => $contract->type,
                'contract_type' => $contractType,
                'total_price' => $request->total_price,
                'down_payment' => 0, // No down payment for renewal essentially
                'principal_amount' => $calc['principal'],
                'interest_rate' => $request->interest_rate,
                'installments_count' => $request->installments_count,
                'installment_amount' => $calc['installment_amount'],
                'balloon_payment' => $calc['balloon_payment'],
                'start_date' => $request->start_date,
                'end_date' => $calc['end_date'],
                'original_end_date' => $calc['end_date'],
                'parent_contract_id' => $contract->id,
                'status' => 'active',
                // signature_path is intentionally left null (new contract needs signing)
            ]);

            // 3. Create Installments for New Contract
            foreach ($calc['schedule'] as $inst) {
                $newContract->installments()->create([
                    'due_date' => $inst['due_date'],
                    'amount' => $inst['amount_due'],
                    'status' => 'pending',
                ]);
            }

            // Asset status remains 'leased' (or similar), no change needed if already leased.

            DB::commit();

            return response()->json([
                'message' => 'Contract renewed successfully',
                'new_contract_id' => $newContract->id,
                'new_contract' => $newContract
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to renew contract: ' . $e->getMessage()], 500);
        }
    }
}
