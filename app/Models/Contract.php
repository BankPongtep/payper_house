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
        'contract_type',
        'total_price',
        'down_payment',
        'principal_amount',
        'interest_rate',
        'installments_count',
        'installment_amount',
        'monthly_rent',
        'balloon_payment',
        'start_date',
        'end_date',
        'original_end_date',
        'parent_contract_id',
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

    public function parentContract()
    {
        return $this->belongsTo(Contract::class, 'parent_contract_id');
    }

    public function extensions()
    {
        return $this->hasMany(Contract::class, 'parent_contract_id');
    }
}
