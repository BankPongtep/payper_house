<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tambon extends Model
{
    protected $table = 'tambons';

    public function amphure()
    {
        return $this->belongsTo(Amphure::class);
    }
}
