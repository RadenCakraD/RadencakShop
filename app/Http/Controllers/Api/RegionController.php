<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Region;

class RegionController extends Controller
{
    public function index()
    {
        return response()->json(Region::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'required|string',
            'tax_rate' => 'required|numeric',
            'service_fee' => 'required|numeric',
            'shipping_fee_santai' => 'required|numeric',
            'shipping_fee_cepat' => 'required|numeric',
            'partner_fee' => 'required|numeric',
            'logistics_fee' => 'required|numeric',
            'courier_staff_fee' => 'required|numeric',
            'logistics_staff_fee' => 'required|numeric',
            'currency_code' => 'required|string',
            'currency_symbol' => 'required|string',
            'exchange_rate' => 'required|numeric',
        ]);
        
        $region = Region::create($validated);
        return response()->json($region, 201);
    }

    public function update(Request $request, $id)
    {
        $region = Region::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'code' => 'sometimes|string',
            'tax_rate' => 'sometimes|numeric',
            'service_fee' => 'sometimes|numeric',
            'shipping_fee_santai' => 'sometimes|numeric',
            'shipping_fee_cepat' => 'sometimes|numeric',
            'partner_fee' => 'sometimes|numeric',
            'logistics_fee' => 'sometimes|numeric',
            'courier_staff_fee' => 'sometimes|numeric',
            'logistics_staff_fee' => 'sometimes|numeric',
            'currency_code' => 'sometimes|string',
            'currency_symbol' => 'sometimes|string',
            'exchange_rate' => 'sometimes|numeric',
        ]);
        
        $region->update($validated);
        return response()->json($region);
    }

    public function destroy($id)
    {
        Region::destroy($id);
        return response()->json(['message' => 'Region deleted']);
    }
}
