<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    protected $fillable = [
        'contract_id',
        'due_date',
        'amount',
        'paid_amount',
        'fine_amount',
        'fine_note',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'fine_amount' => 'decimal:2',
    ];

    protected $appends = ['latest_payment_proof', 'total_amount'];

    public function getTotalAmountAttribute()
    {
        return $this->amount + ($this->fine_amount ?? 0);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class);
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class)->latest();
    }

    public function paymentProofs()
    {
        return $this->hasMany(PaymentProof::class);
    }

    public function getLatestPaymentProofAttribute()
    {
        return $this->paymentProofs->sortByDesc('created_at')->first();
    }
}
