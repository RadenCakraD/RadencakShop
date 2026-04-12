<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    protected $guarded = [];

    public function user() { return $this->belongsTo(User::class); }
    public function products() { return $this->hasMany(Product::class); }
    public function orders() { return $this->hasMany(Order::class); }
    public function vouchers() { return $this->hasMany(Voucher::class); }
    public function chats() { return $this->hasMany(Chat::class); }
}
