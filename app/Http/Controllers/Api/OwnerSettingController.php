<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OwnerSettingController extends Controller
{
    /**
     * Get owner settings
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'payment_qr_code' => $user->payment_qr_code ? asset('storage/' . $user->payment_qr_code) : null,
            'bank_name' => $user->bank_name,
            'bank_account_number' => $user->bank_account_number,
            'bank_account_name' => $user->bank_account_name,
            'promptpay_type' => $user->promptpay_type,
        ]);
    }

    /**
     * Update owner settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:100',
            'promptpay_type' => 'nullable|string|max:20',
        ]);

        $user = $request->user();

        $user->update([
            'bank_name' => $request->bank_name,
            'bank_account_number' => $request->bank_account_number,
            'bank_account_name' => $request->bank_account_name,
            'promptpay_type' => $request->promptpay_type,
        ]);

        return response()->json(['message' => 'Settings updated successfully']);
    }

    /**
     * Upload QR Code
     */
    public function uploadQrCode(Request $request)
    {
        $request->validate([
            'qr_code' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        // Delete old QR code if exists
        if ($user->payment_qr_code) {
            Storage::disk('public')->delete($user->payment_qr_code);
        }

        // Store new QR code
        $img = \Intervention\Image\Facades\Image::make($request->file('qr_code'));
        if ($img->width() > 1200) {
            $img->resize(1200, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }
        $encoded = $img->encode('jpg', 75);
        $path = 'qr_codes/' . \Illuminate\Support\Str::random(40) . '.jpg';
        \Illuminate\Support\Facades\Storage::disk('public')->put($path, (string) $encoded);

        $user->update(['payment_qr_code' => $path]);

        return response()->json([
            'message' => 'QR Code uploaded successfully',
            'qr_code_url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Delete QR Code
     */
    public function deleteQrCode(Request $request)
    {
        $user = $request->user();

        if ($user->payment_qr_code) {
            Storage::disk('public')->delete($user->payment_qr_code);
            $user->update(['payment_qr_code' => null]);
        }

        return response()->json(['message' => 'QR Code deleted successfully']);
    }
}
