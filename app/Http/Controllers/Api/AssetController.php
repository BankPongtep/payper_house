<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Return assets belonging to the authenticated user
        return $request->user()->assets;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'nullable|numeric',
            'status' => 'required|in:available,leased,sold',
        ]);

        $asset = $request->user()->assets()->create($request->all());

        return response()->json($asset, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Asset $asset)
    {
        if ($request->user()->id !== $asset->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $asset;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Asset $asset)
    {
        if ($request->user()->id !== $asset->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'price' => 'nullable|numeric',
            'status' => 'sometimes|in:available,leased,sold',
        ]);

        $asset->update($request->all());

        return $asset;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Asset $asset)
    {
        if ($request->user()->id !== $asset->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $asset->delete();

        return response()->json(['message' => 'Asset deleted successfully']);
    }
}
