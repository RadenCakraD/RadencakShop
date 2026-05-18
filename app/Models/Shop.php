<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    protected $guarded = [];
    protected $appends = ['full_profil_url', 'full_banner_url'];

    public function user() { return $this->belongsTo(User::class); }
    public function products() { return $this->hasMany(Product::class); }
    public function orders() { return $this->hasMany(Order::class); }
    public function vouchers() { return $this->hasMany(Voucher::class); }
    public function chats() { return $this->hasMany(Chat::class); }
    public function region() { return $this->belongsTo(Region::class); }

    public function getFullProfilUrlAttribute()
    {
        if (!empty($this->foto_profil)) {
            if (str_starts_with($this->foto_profil, 'http')) return $this->foto_profil;
            return asset('storage/' . $this->foto_profil);
        }
        return "https://ui-avatars.com/api/?name=" . urlencode($this->nama_toko) . "&background=27272a&color=FFCC00&bold=true&size=512";
    }

    public function getFullBannerUrlAttribute()
    {
        if (!empty($this->banner_toko)) {
            if (str_starts_with($this->banner_toko, 'http')) return $this->banner_toko;
            return asset('storage/' . $this->banner_toko);
        }
        // Very reliable fallback URL
        return "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80";
    }
}
