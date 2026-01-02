<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     * Admin: sees all users
     * Owner: sees only their customers
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();

        if ($currentUser->isAdmin()) {
            return User::with('customerProfile')->get();
        }

        if ($currentUser->isOwner()) {
            // Return customers that belong to this owner
            return User::where('role', 'customer')
                ->whereHas('customerProfile', function ($q) use ($currentUser) {
                    $q->where('owner_id', $currentUser->id);
                })
                ->with('customerProfile')
                ->get();
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    /**
     * Store a newly created user.
     * Admin: can create any role
     * Owner: can only create customers (linked to themselves)
     */
    public function store(Request $request)
    {
        $currentUser = $request->user();
        $requestedRole = $request->input('role', 'customer');

        // Check if current user can create this role
        if (!$currentUser->canCreateRole($requestedRole)) {
            return response()->json([
                'message' => 'You do not have permission to create a user with this role'
            ], 403);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'in:admin,owner,customer'],
            // Customer specific fields
            'phone' => ['nullable', 'string', 'max:20'],
            'id_card_number' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
        ]);

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $requestedRole,
        ]);

        // If creating a customer, also create customer profile
        if ($requestedRole === 'customer') {
            $ownerId = $currentUser->isAdmin()
                ? ($request->input('owner_id') ?? $currentUser->id)
                : $currentUser->id;

            Customer::create([
                'owner_id' => $ownerId,
                'user_id' => $user->id,
                'name' => $request->name,
                'phone' => $request->phone,
                'id_card_number' => $request->id_card_number,
                'address' => $request->address,
            ]);
        }

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('customerProfile'),
        ], 201);
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, User $user)
    {
        $currentUser = $request->user();

        if (!$this->canAccessUser($currentUser, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $user->load('customerProfile');
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $currentUser = $request->user();

        if (!$this->canAccessUser($currentUser, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['sometimes', 'confirmed', Rules\Password::defaults()],
        ]);

        $data = $request->only(['name', 'email']);

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        // Update customer profile if exists
        if ($user->customerProfile && $request->has('name')) {
            $user->customerProfile->update([
                'name' => $request->name,
                'phone' => $request->phone ?? $user->customerProfile->phone,
                'address' => $request->address ?? $user->customerProfile->address,
            ]);
        }

        return $user->fresh('customerProfile');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user)
    {
        $currentUser = $request->user();

        // Only admin can delete users, or owner can delete their customers
        if (!$this->canAccessUser($currentUser, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent self-deletion
        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 400);
        }

        // Delete customer profile first if exists
        if ($user->customerProfile) {
            $user->customerProfile->delete();
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Check if current user can access/modify target user
     */
    private function canAccessUser(User $currentUser, User $targetUser): bool
    {
        // Admin can access any user
        if ($currentUser->isAdmin()) {
            return true;
        }

        // Owner can only access their customers
        if ($currentUser->isOwner() && $targetUser->isCustomer()) {
            return $targetUser->customerProfile &&
                $targetUser->customerProfile->owner_id === $currentUser->id;
        }

        // Users can access themselves
        return $currentUser->id === $targetUser->id;
    }
}
