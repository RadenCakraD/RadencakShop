<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $fillable = [
        'name', 'code', 'tax_rate', 'service_fee', 
        'shipping_fee_santai', 'shipping_fee_cepat',
        'partner_fee', 'logistics_fee', 'courier_staff_fee', 'logistics_staff_fee',
        'currency_code', 'currency_symbol', 'exchange_rate'
    ];
}
