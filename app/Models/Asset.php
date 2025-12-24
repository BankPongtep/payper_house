<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'price',
        'status',
        'image_path',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
