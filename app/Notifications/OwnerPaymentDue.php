<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OwnerPaymentDue extends Notification
{
    use Queueable;

    protected $installment;

    public function __construct($installment)
    {
        $this->installment = $installment;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'ถึงกำหนดชำระค่างวดของผู้เช่า',
            'message' => "สัญญาเลขที่ {$this->installment->contract->contract_number} ลูกค้า: {$this->installment->contract->customer->name} งวดวันที่ {$this->installment->due_date->format('d/m/Y')} ถึงกำหนดชำระวันนี้",
            'installment_id' => $this->installment->id,
            'contract_id' => $this->installment->contract_id,
            'amount' => $this->installment->total_amount,
            'due_date' => $this->installment->due_date->format('Y-m-d'),
            'type' => 'owner_due_today',
        ];
    }
}
