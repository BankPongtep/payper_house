<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\App;

class LanguageMiddleware
{
    public function handle($request, Closure $next)
    {
        if ($request->hasHeader('Accept-Language')) {
            $lang = $request->header('Accept-Language');
            // Simplified check, take first 2 chars
            $lang = substr($lang, 0, 2);
            if (in_array($lang, ['en', 'th'])) {
                App::setLocale($lang);
            }
        }
        return $next($request);
    }
}
