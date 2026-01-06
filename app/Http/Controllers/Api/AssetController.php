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
        // Return assets belonging to the authenticated user with images
        return $request->user()->assets()->with('images')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'nullable|numeric',
            'status' => 'required|in:available,leased,rented,sold',
            'images.*' => 'nullable|image|max:5120', // Max 5MB per image
            'address_house_no' => 'nullable|string',
            'address_village' => 'nullable|string',
            'address_floor' => 'nullable|string',
            'address_moo' => 'nullable|string',
            'address_soi' => 'nullable|string',
            'address_road' => 'nullable|string',
            'address_sub_district' => 'nullable|string',
            'address_district' => 'nullable|string',
            'address_province' => 'nullable|string',
            'address_postal_code' => 'nullable|string',
        ]);

        $assetData = $request->except('images');
        $asset = $request->user()->assets()->create($assetData);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('assets', 'public');
                $asset->images()->create([
                    'image_path' => '/storage/' . $path,
                    'is_main' => $index === 0, // First image is main by default
                ]);
            }
        }

        return response()->json($asset->load('images'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Asset $asset)
    {
        if ($request->user()->id !== $asset->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $asset->load('images');
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
            'status' => 'sometimes|in:available,leased,rented,sold',
            'images.*' => 'nullable|image|max:5120',
            'address_house_no' => 'nullable|string',
            'address_village' => 'nullable|string',
            'address_floor' => 'nullable|string',
            'address_moo' => 'nullable|string',
            'address_soi' => 'nullable|string',
            'address_road' => 'nullable|string',
            'address_sub_district' => 'nullable|string',
            'address_district' => 'nullable|string',
            'address_province' => 'nullable|string',
            'address_postal_code' => 'nullable|string',
        ]);

        $asset->update($request->except('images'));

        // Handle new images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('assets', 'public');
                $asset->images()->create([
                    'image_path' => '/storage/' . $path,
                    'is_main' => false,
                ]);
            }

            // If no main image exists, make the first one main
            if (!$asset->images()->where('is_main', true)->exists()) {
                $first = $asset->images()->first();
                if ($first) {
                    $first->update(['is_main' => true]);
                }
            }
        }

        return $asset->load('images');
    }

    public function setMainImage(Request $request, Asset $asset, $imageId)
    {
        if ($request->user()->id !== $asset->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Reset all
        $asset->images()->update(['is_main' => false]);

        // Set new main
        $asset->images()->where('id', $imageId)->update(['is_main' => true]);

        return response()->json(['message' => 'Main image updated', 'asset' => $asset->load('images')]);
    }

    public function deleteImage(Request $request, Asset $asset, $imageId)
    {
        if ($request->user()->id !== $asset->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $image = $asset->images()->where('id', $imageId)->first();
        if ($image) {
            // Delete file from storage if needed
            // Storage::disk('public')->delete(str_replace('/storage/', '', $image->image_path));
            $image->delete();
        }

        return response()->json(['message' => 'Image deleted', 'asset' => $asset->load('images')]);
    }
}
