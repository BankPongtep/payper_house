<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;


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
            'password' => ['required', 'confirmed', 'min:8'],
            'role' => ['required', 'in:admin,owner,customer'],
            // Customer specific fields
            'phone' => ['nullable', 'string', 'max:20'],
            'id_card_number' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'address_house_no' => ['nullable', 'string'],
            'address_village' => ['nullable', 'string'],
            'address_floor' => ['nullable', 'string'],
            'address_moo' => ['nullable', 'string'],
            'address_soi' => ['nullable', 'string'],
            'address_road' => ['nullable', 'string'],
            'address_sub_district' => ['nullable', 'string'],
            'address_district' => ['nullable', 'string'],
            'address_province' => ['nullable', 'string'],
            'address_postal_code' => ['nullable', 'string'],
        ]);

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $requestedRole,
            'phone' => $request->phone,
            'id_card_number' => $request->id_card_number,
            'address' => $request->address,
            'address_house_no' => $request->address_house_no,
            'address_village' => $request->address_village,
            'address_floor' => $request->address_floor,
            'address_moo' => $request->address_moo,
            'address_soi' => $request->address_soi,
            'address_road' => $request->address_road,
            'address_sub_district' => $request->address_sub_district,
            'address_district' => $request->address_district,
            'address_province' => $request->address_province,
            'address_postal_code' => $request->address_postal_code,
        ]);

        \App\Helpers\LogActivity::addToLog('CREATE_USER', "Created user: {$user->username} ({$user->id})");

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
            'password' => ['sometimes', 'confirmed', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
            'id_card_number' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'address_house_no' => ['nullable', 'string'],
            'address_village' => ['nullable', 'string'],
            'address_floor' => ['nullable', 'string'],
            'address_moo' => ['nullable', 'string'],
            'address_soi' => ['nullable', 'string'],
            'address_road' => ['nullable', 'string'],
            'address_sub_district' => ['nullable', 'string'],
            'address_district' => ['nullable', 'string'],
            'address_province' => ['nullable', 'string'],
            'address_postal_code' => ['nullable', 'string'],
        ]);

        $data = $request->only([
            'name',
            'email',
            'phone',
            'id_card_number',
            'address',
            'address_house_no',
            'address_village',
            'address_floor',
            'address_moo',
            'address_soi',
            'address_road',
            'address_sub_district',
            'address_district',
            'address_province',
            'address_postal_code'
        ]);

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
            \App\Helpers\LogActivity::addToLog('CHANGE_PASSWORD', "Changed password for user: {$user->username} ({$user->id})");
        }

        $user->update($data);
        \App\Helpers\LogActivity::addToLog('UPDATE_USER', "Updated user details: {$user->username} ({$user->id})");

        // Update customer profile if exists
        if ($user->customerProfile) {
            $user->customerProfile->update([
                'name' => $request->name ?? $user->customerProfile->name,
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
        // Note: With SoftDeletes, we might want to soft delete the profile too, or just leave it. 
        // For now, keeping original logic but User model has SoftDeletes trait so $user->delete() will soft delete.
        if ($user->customerProfile) {
            $user->customerProfile->delete();
        }

        $user->delete();
        \App\Helpers\LogActivity::addToLog('DELETE_USER', "Deleted user: {$user->username} ({$user->id})");

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Toggle user lock status
     */
    public function toggleLock(Request $request, User $user)
    {
        $currentUser = $request->user();

        if (!$currentUser->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent self-lock
        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Cannot lock yourself'], 400);
        }

        $user->is_locked = !$user->is_locked;
        $user->save();

        $action = $user->is_locked ? 'LOCK_USER' : 'UNLOCK_USER';
        \App\Helpers\LogActivity::addToLog($action, "{$action}: {$user->username} ({$user->id})");

        return response()->json([
            'message' => $user->is_locked ? 'User locked' : 'User unlocked',
            'is_locked' => $user->is_locked
        ]);
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
