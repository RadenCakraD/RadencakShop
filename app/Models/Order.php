<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    public function user() { return $this->belongsTo(User::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function trackings() { return $this->hasMany(OrderTracking::class)->orderBy('created_at', 'desc'); }
    
    // Logistik phase relations
    public function pickupCourier() { return $this->belongsTo(User::class, 'pickup_courier_id'); }
    public function logisticsStaff() { return $this->belongsTo(User::class, 'logistics_id'); }
    public function deliveryCourier() { return $this->belongsTo(User::class, 'delivery_courier_id'); }
}
