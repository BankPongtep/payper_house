<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractDocument extends Model
{
    protected $fillable = [
        'contract_id',
        'type', // main_contract, attachment
        'file_path',
        'original_name',
        'file_type', // pdf, image
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
