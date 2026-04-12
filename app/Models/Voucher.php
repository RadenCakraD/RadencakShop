<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $guarded = [];

    public function shop() { return $this->belongsTo(Shop::class); }
}
