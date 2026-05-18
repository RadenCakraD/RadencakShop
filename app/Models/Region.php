<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $fillable = [
        'name', 'country', 'type', 'code', 'cross_island_fee', 'export_tax_rate', 'import_tax_rate', 'service_fee', 
        'shipping_fee_santai', 'shipping_fee_cepat',
        'logistics_fee_regular', 'courier_fee_regular', 'logistics_fee_fast', 'courier_fee_fast',
        'currency_code', 'currency_symbol',
        'islands', 'regencies', 'districts'
    ];

    protected $casts = [
        'islands' => 'array',
        'regencies' => 'array',
        'districts' => 'array',
    ];
}
