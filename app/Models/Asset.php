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
        'image_path', // Keep for backward compat or quick access
        'address_house_no',
        'address_village',
        'address_floor',
        'address_moo',
        'address_soi',
        'address_road',
        'address_sub_district',
        'address_district',
        'address_province',
        'address_postal_code',
    ];

    protected $appends = ['main_image'];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function images()
    {
        return $this->hasMany(AssetImage::class);
    }

    public function getMainImageAttribute()
    {
        // Return explicit main image, or first image, or the simple image_path, or placeholder
        $main = $this->images->where('is_main', true)->first();
        if ($main)
            return $main->image_path;

        $first = $this->images->first();
        if ($first)
            return $first->image_path;

        return $this->image_path;
    }
}
