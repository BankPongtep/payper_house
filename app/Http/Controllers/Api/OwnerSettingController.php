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
        ]);

        $user = $request->user();

        $user->update([
            'bank_name' => $request->bank_name,
            'bank_account_number' => $request->bank_account_number,
            'bank_account_name' => $request->bank_account_name,
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
        $path = $request->file('qr_code')->store('qr_codes', 'public');

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
