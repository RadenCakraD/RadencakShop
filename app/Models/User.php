<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use \Laravel\Sanctum\HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'avatar',
        'role',
        'pending_role',
        'no_hp',
        'alamat',
        'region_id',
        'status',
        'parent_id',
        'otp_code',
        'otp_expires_at',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'mitra_type',
        'mitra_name',
        'country',
        'rating',
        'rating_count',
        'coverage_province',
        'coverage_regency',
        'coverage_district',
        'salary_per_package',
    ];

    public function shop() { return $this->hasOne(Shop::class); }
    public function carts() { return $this->hasMany(Cart::class); }
    public function orders() { return $this->hasMany(Order::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function region() { return $this->belongsTo(Region::class); }
    public function parent() { return $this->belongsTo(User::class, 'parent_id'); }
    public function staffs() { return $this->hasMany(User::class, 'parent_id'); }

    protected $appends = ['full_avatar_url'];

    public function getFullAvatarUrlAttribute()
    {
        if (!empty($this->avatar)) {
            if (str_starts_with($this->avatar, 'http')) return $this->avatar;
            return asset('storage/' . $this->avatar);
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->username) . '&background=27272a&color=FFCC00&bold=true';
    }

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
            'otp_expires_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'password' => 'hashed',
        ];
    }
}
