<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'owner_id',
        'customer_id',
        'asset_id',
        'contract_number',
        'type',
        'total_price',
        'down_payment',
        'principal_amount',
        'interest_rate',
        'installments_count',
        'installment_amount',
        'start_date',
        'status',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class);
    }
}
