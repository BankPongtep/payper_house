<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;
use App\Models\Installment;
use App\Notifications\PaymentDueSoon;
use App\Notifications\PaymentDueToday;
use App\Notifications\PaymentOverdue;
use App\Notifications\OwnerPaymentDue;
use App\Notifications\OwnerPaymentOverdue;

class CheckPaymentStatus extends Command
{
    protected $signature = 'app:check-payment-status';
    protected $description = 'Check payment status and send notifications in batches of 50';

    const BATCH_SIZE = 50;

    public function handle()
    {
        $today = Carbon::now()->format('Y-m-d');
        $dueSoonDate = Carbon::now()->addDays(3)->format('Y-m-d');
        $overdueDays = [3, 5, 7];

        // 1. Due Soon (3 days before) — Customer only
        $this->processBatched($dueSoonDate, 'customer', PaymentDueSoon::class);

        // 2. Due Today — Customer + Owner
        $this->processBatched($today, 'customer', PaymentDueToday::class);
        $this->processBatched($today, 'owner', OwnerPaymentDue::class);

        // 3. Overdue (3, 5, 7 days after) — Customer + Owner
        foreach ($overdueDays as $days) {
            $date = Carbon::now()->subDays($days)->format('Y-m-d');
            $this->processBatched($date, 'customer', PaymentOverdue::class, $days);
            $this->processBatched($date, 'owner', OwnerPaymentOverdue::class, $days);
        }

        $this->info('Payment status check completed.');
    }

    /**
     * Process installments in batches of BATCH_SIZE to avoid server timeout.
     */
    protected function processBatched($date, $target, $notificationClass, $daysOverdue = null)
    {
        $offset = 0;

        do {
            $installments = Installment::where('status', '!=', 'paid')
                ->whereDate('due_date', $date)
                ->with(['contract.customer.user', 'contract.owner'])
                ->skip($offset)
                ->take(self::BATCH_SIZE)
                ->get();

            foreach ($installments as $installment) {
                try {
                    if ($target === 'customer') {
                        $user = $installment->contract->customer->user ?? null;
                        if ($user) {
                            if ($daysOverdue) {
                                $user->notify(new $notificationClass($installment, $daysOverdue));
                            } else {
                                $user->notify(new $notificationClass($installment));
                            }
                        }
                    } elseif ($target === 'owner') {
                        $owner = $installment->contract->owner ?? null;
                        if ($owner) {
                            if ($daysOverdue) {
                                $owner->notify(new $notificationClass($installment, $daysOverdue));
                            } else {
                                $owner->notify(new $notificationClass($installment));
                            }
                        }
                    }
                } catch (\Exception $e) {
                    $this->error("Failed to notify for installment #{$installment->id}: " . $e->getMessage());
                }
            }

            $count = $installments->count();
            $offset += self::BATCH_SIZE;

            if ($count > 0) {
                $this->info("Processed batch: {$count} installments for {$target} ({$notificationClass}) date={$date}");
            }

        } while ($count >= self::BATCH_SIZE);
    }
}
