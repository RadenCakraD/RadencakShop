<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    protected $appends = ['primary_image'];

    public function getPrimaryImageAttribute()
    {
        // First check for is_primary
        $primary = $this->images->where('is_primary', true)->first();
        if ($primary) {
            return '/storage/' . $primary->image_url;
        }

        // Fallback to first image
        $first = $this->images->first();
        if ($first) {
            return '/storage/' . $first->image_url;
        }

        // Fallback to constant placeholder (No Picsum)
        return '/logo_web/no-product.png'; 
    }

    public function shop() { return $this->belongsTo(Shop::class); }
    public function variants() { return $this->hasMany(ProductVariant::class); }
    public function images() { return $this->hasMany(ProductImage::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function orderItems() { return $this->hasMany(OrderItem::class); }
}
