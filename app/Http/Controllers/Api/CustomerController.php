<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return $request->user()->customers;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'id_card_number' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $customer = $request->user()->customers()->create($request->all());

        return response()->json($customer, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Customer $customer)
    {
        if ($request->user()->id !== $customer->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return $customer;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        if ($request->user()->id !== $customer->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string',
        ]);

        $customer->update($request->all());

        return $customer;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Customer $customer)
    {
        if ($request->user()->id !== $customer->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $customer->delete();
        return response()->json(['message' => 'Customer deleted']);
    }
}
