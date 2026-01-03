<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Province;
use App\Models\Amphure;
use App\Models\Tambon;

class ThaiAddressController extends Controller
{
    public function getProvinces()
    {
        return response()->json(Province::orderBy('name_th')->get());
    }

    public function getAmphures($province_id)
    {
        return response()->json(Amphure::where('province_id', $province_id)->orderBy('name_th')->get());
    }

    public function getTambons($amphure_id)
    {
        return response()->json(Tambon::where('amphure_id', $amphure_id)->orderBy('name_th')->get());
    }
}
