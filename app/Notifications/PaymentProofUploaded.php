<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentProofUploaded extends Notification
{
    use Queueable;

    protected $installment;
    protected $customerName;

    public function __construct($installment, $customerName)
    {
        $this->installment = $installment;
        $this->customerName = $customerName;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'ผู้เช่าส่งหลักฐานการชำระเงิน',
            'message' => "ลูกค้า: {$this->customerName} ส่งสลิปชำระค่างวด สัญญาเลขที่ {$this->installment->contract->contract_number} งวดวันที่ {$this->installment->due_date->format('d/m/Y')} กรุณาตรวจสอบ",
            'installment_id' => $this->installment->id,
            'contract_id' => $this->installment->contract_id,
            'amount' => $this->installment->total_amount,
            'due_date' => $this->installment->due_date->format('Y-m-d'),
            'type' => 'payment_proof_uploaded',
        ];
    }
}
