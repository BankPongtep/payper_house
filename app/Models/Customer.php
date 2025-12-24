<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'owner_id',
        'user_id',
        'name',
        'phone',
        'id_card_number',
        'address',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
