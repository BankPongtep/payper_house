<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = [
        'receipt_number',
        'contract_id',
        'installment_id',
        'payment_proof_id',
        'amount',
        'payment_method',
        'issued_by',
        'paid_at',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute()
    {
        return encrypt($this->id);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
