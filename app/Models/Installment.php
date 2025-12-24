<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    protected $fillable = [
        'contract_id',
        'installment_number',
        'due_date',
        'amount_due',
        'amount_paid',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class);
    }
}
