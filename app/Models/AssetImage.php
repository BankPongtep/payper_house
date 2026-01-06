<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssetImage extends Model
{
    protected $fillable = [
        'asset_id',
        'image_path',
        'is_main',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
