<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function show(Request $request, $encryptedId)
    {
        try {
            // Decrypt the ID
            $id = decrypt($encryptedId);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid receipt link'], 400);
        }

        // Find receipt. No auth check needed since the encrypted ID is the "token"
        $receipt = Receipt::with(['contract.customer', 'contract.asset'])
            ->findOrFail($id);

        return response()->json($receipt);
    }
}
