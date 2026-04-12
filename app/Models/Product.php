<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $guarded = [];

    public function shop() { return $this->belongsTo(Shop::class); }
    public function variants() { return $this->hasMany(ProductVariant::class); }
    public function images() { return $this->hasMany(ProductImage::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function carts() { return $this->hasMany(Cart::class); }
}
