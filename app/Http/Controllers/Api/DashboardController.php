<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Asset;
use App\Models\Contract;
use App\Models\Installment;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function ownerStats(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();

        // Total assets owned by user
        $totalAssets = $user->assets()->count();

        // Vacant assets (status = 'available')
        $vacantAssets = $user->assets()->where('status', 'available')->count();

        // Get contracts for this owner
        $ownerContractsQuery = Contract::where('owner_id', $user->id);

        // Active contracts
        $activeContracts = (clone $ownerContractsQuery)->where('status', 'active')->count();

        // Contracts expiring in 30 days
        $expiringContracts = (clone $ownerContractsQuery)
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [$now, $now->copy()->addDays(30)])
            ->count();

        // Calculate expected monthly revenue from active contracts
        $expectedMonthlyRevenue = (clone $ownerContractsQuery)
            ->where('status', 'active')
            ->sum('installment_amount');

        // Get contract IDs for this owner
        $ownerContractIds = (clone $ownerContractsQuery)->pluck('id');

        // Monthly revenue from actual paid installments (last 6 months) using Receipts
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $now->copy()->subMonths($i)->startOfMonth();
            $monthEnd = $monthStart->copy()->endOfMonth();

            $paidAmount = \App\Models\Receipt::whereIn('contract_id', $ownerContractIds)
                ->whereBetween('paid_at', [$monthStart, $monthEnd])
                ->sum('amount');

            $monthlyRevenue[] = [
                'month' => $monthStart->format('M'),
                'revenue' => (int) $paidAmount,
            ];
        }

        // Count installment statuses for this month's pending payments
        $currentMonthStart = $now->copy()->startOfMonth();
        $currentMonthEnd = $now->copy()->endOfMonth();

        $paidInstallments = Installment::whereIn('contract_id', $ownerContractIds)
            ->where('status', 'paid')
            ->count();

        $pendingInstallments = Installment::whereIn('contract_id', $ownerContractIds)
            ->where('status', 'pending')
            ->where('due_date', '>=', $now->toDateString())
            ->count();

        $overdueInstallments = Installment::whereIn('contract_id', $ownerContractIds)
            ->where('status', 'pending')
            ->where('due_date', '<', $now->toDateString())
            ->count();

        // Recent contracts
        $recentContracts = (clone $ownerContractsQuery)
            ->with(['asset:id,name', 'customer:id,name'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'asset_id', 'customer_id', 'status', 'created_at', 'installment_amount']);

        // Map installment_amount to monthly_rent for frontend compatibility
        $recentContracts = $recentContracts->map(function ($contract) {
            $contract->monthly_rent = $contract->installment_amount;
            return $contract;
        });

        return response()->json([
            'stats' => [
                'total_assets' => $totalAssets,
                'vacant_assets' => $vacantAssets,
                'active_contracts' => $activeContracts,
                'expiring_contracts' => $expiringContracts,
                'expected_revenue' => (int) $expectedMonthlyRevenue,
            ],
            'monthly_revenue' => $monthlyRevenue,
            'payment_status' => [
                'paid' => $paidInstallments,
                'pending' => $pendingInstallments,
                'overdue' => $overdueInstallments,
            ],
            'recent_contracts' => $recentContracts,
        ]);
    }
}
