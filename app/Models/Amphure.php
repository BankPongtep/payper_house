<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Amphure extends Model
{
    protected $table = 'amphures';

    public function province()
    {
        return $this->belongsTo(Province::class);
    }

    public function tambons()
    {
        return $this->hasMany(Tambon::class);
    }
}
