<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = [
        'contract_id',
        'installment_id',
        'amount',
        'issued_by',
    ];

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
