<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $table = 'provinces';

    public function amphures()
    {
        return $this->hasMany(Amphure::class);
    }
}
