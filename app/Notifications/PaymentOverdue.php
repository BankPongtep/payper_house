<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentOverdue extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    protected $installment;
    protected $daysOverdue;

    /**
     * Create a new notification instance.
     */
    public function __construct($installment, $daysOverdue)
    {
        $this->installment = $installment;
        $this->daysOverdue = $daysOverdue;
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
            'title' => 'เกินกำหนดชำระค่างวด',
            'message' => "สัญญาเลขที่ {$this->installment->contract->contract_number} งวดวันที่ {$this->installment->due_date->format('d/m/Y')} เกินกำหนดชำระแล้ว {$this->daysOverdue} วัน",
            'installment_id' => $this->installment->id,
            'contract_id' => $this->installment->contract_id,
            'amount' => $this->installment->total_amount,
            'due_date' => $this->installment->due_date->format('Y-m-d'),
            'type' => 'overdue',
            'days_overdue' => $this->daysOverdue,
        ];
    }
}
