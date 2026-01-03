<?php

namespace App\Helpers;

use App\Models\SystemLog;
use Illuminate\Support\Facades\Request;

class LogActivity
{
    public static function addToLog($action, $description = null)
    {
        $user = auth()->user();

        SystemLog::create([
            'user_id' => $user ? $user->id : null,
            'action' => $action,
            'description' => $description,
            'ip_address' => Request::ip(),
        ]);
    }
}
