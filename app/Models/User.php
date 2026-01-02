<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function assets()
    {
        return $this->hasMany(Asset::class, 'owner_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'owner_id');
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class, 'owner_id');
    }

    public function contractsAsCustomer()
    {
        return $this->hasMany(Contract::class, 'customer_id')->orWhereHas('customer', function ($q) {
            $q->where('user_id', $this->id);
        });
    }

    // Role helper methods
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    /**
     * Check if user can create a specific role
     */
    public function canCreateRole(string $role): bool
    {
        if ($this->isAdmin()) {
            return true; // Admin can create any role
        }

        if ($this->isOwner() && $role === 'customer') {
            return true; // Owner can only create customers
        }

        return false;
    }

    /**
     * Get the customer record linked to this user (for customer users)
     */
    public function customerProfile()
    {
        return $this->hasOne(Customer::class, 'user_id');
    }
}
