<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OwnerPaymentOverdue extends Notification
{
    use Queueable;

    protected $installment;
    protected $daysOverdue;

    public function __construct($installment, $daysOverdue)
    {
        $this->installment = $installment;
        $this->daysOverdue = $daysOverdue;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'ผู้เช่าเกินกำหนดชำระค่างวด',
            'message' => "สัญญาเลขที่ {$this->installment->contract->contract_number} ลูกค้า: {$this->installment->contract->customer->name} งวดวันที่ {$this->installment->due_date->format('d/m/Y')} เกินกำหนดชำระแล้ว {$this->daysOverdue} วัน",
            'installment_id' => $this->installment->id,
            'contract_id' => $this->installment->contract_id,
            'amount' => $this->installment->total_amount,
            'due_date' => $this->installment->due_date->format('Y-m-d'),
            'type' => 'owner_overdue',
            'days_overdue' => $this->daysOverdue,
        ];
    }
}
