<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;
use App\Models\Installment;
use App\Notifications\PaymentDueSoon;
use App\Notifications\PaymentDueToday;
use App\Notifications\PaymentOverdue;

class CheckPaymentStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-payment-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check payment status and send notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::now()->format('Y-m-d');
        $dueSoon = Carbon::now()->addDays(3)->format('Y-m-d');
        $overdueDays = [3, 5, 7];

        // 1. Due Soon (3 days before)
        $this->notifyInstallments($dueSoon, \App\Notifications\PaymentDueSoon::class);

        // 2. Due Today
        $this->notifyInstallments($today, \App\Notifications\PaymentDueToday::class);

        // 3. Overdue (3, 5, 7 days after)
        foreach ($overdueDays as $days) {
            $date = Carbon::now()->subDays($days)->format('Y-m-d');
            $this->notifyInstallments($date, PaymentOverdue::class, $days);
        }
    }

    protected function notifyInstallments($date, $notificationClass, $daysOverdue = null)
    {
        $installments = Installment::where('status', '!=', 'paid')
            ->whereDate('due_date', $date)
            ->with('contract.customer.user')
            ->get();

        foreach ($installments as $installment) {
            $user = $installment->contract->customer->user ?? null;
            if ($user) {
                if ($daysOverdue) {
                    $user->notify(new $notificationClass($installment, $daysOverdue));
                } else {
                    $user->notify(new $notificationClass($installment));
                }
            }
        }
    }
}
