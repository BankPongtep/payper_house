<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentDueSoon extends Notification
{
    use Queueable;

    protected $installment;

    /**
     * Create a new notification instance.
     */
    public function __construct($installment)
    {
        $this->installment = $installment;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'ชำระค่างวดใกล้ถึงกำหนด',
            'message' => "สัญญาเลขที่ {$this->installment->contract->contract_number} งวดวันที่ {$this->installment->due_date->format('d/m/Y')} ใกล้ถึงกำหนดชำระแล้ว",
            'installment_id' => $this->installment->id,
            'contract_id' => $this->installment->contract_id,
            'amount' => $this->installment->total_amount,
            'due_date' => $this->installment->due_date->format('Y-m-d'),
            'type' => 'due_soon',
        ];
    }
}
