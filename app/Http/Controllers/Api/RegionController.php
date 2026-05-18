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
            'country' => 'required|string',
            'type' => 'required|string',
            'code' => 'required|string',
            'cross_island_fee' => 'required|numeric',
            'export_tax_rate' => 'required|numeric',
            'import_tax_rate' => 'required|numeric',
            'service_fee' => 'required|numeric',
            'logistics_fee_regular' => 'required|numeric',
            'courier_fee_regular' => 'required|numeric',
            'logistics_fee_fast' => 'required|numeric',
            'courier_fee_fast' => 'required|numeric',
            'currency_code' => 'required|string',
            'currency_symbol' => 'required|string',
            'islands' => 'nullable|array',
            'regencies' => 'nullable|array',
            'districts' => 'nullable|array',
        ]);
        
        $validated['shipping_fee_santai'] = $validated['logistics_fee_regular'] + $validated['courier_fee_regular'];
        $validated['shipping_fee_cepat'] = $validated['logistics_fee_fast'] + $validated['courier_fee_fast'];
        
        $region = Region::create($validated);
        return response()->json($region, 201);
    }

    public function update(Request $request, $id)
    {
        $region = Region::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'country' => 'sometimes|string',
            'type' => 'sometimes|string',
            'code' => 'sometimes|string',
            'cross_island_fee' => 'sometimes|numeric',
            'export_tax_rate' => 'sometimes|numeric',
            'import_tax_rate' => 'sometimes|numeric',
            'service_fee' => 'sometimes|numeric',
            'logistics_fee_regular' => 'sometimes|numeric',
            'courier_fee_regular' => 'sometimes|numeric',
            'logistics_fee_fast' => 'sometimes|numeric',
            'courier_fee_fast' => 'sometimes|numeric',
            'currency_code' => 'sometimes|string',
            'currency_symbol' => 'sometimes|string',
            'islands' => 'nullable|array',
            'regencies' => 'nullable|array',
            'districts' => 'nullable|array',
        ]);
        
        if (isset($validated['logistics_fee_regular']) || isset($validated['courier_fee_regular'])) {
            $validated['shipping_fee_santai'] = ($validated['logistics_fee_regular'] ?? $region->logistics_fee_regular) + ($validated['courier_fee_regular'] ?? $region->courier_fee_regular);
        }
        if (isset($validated['logistics_fee_fast']) || isset($validated['courier_fee_fast'])) {
            $validated['shipping_fee_cepat'] = ($validated['logistics_fee_fast'] ?? $region->logistics_fee_fast) + ($validated['courier_fee_fast'] ?? $region->courier_fee_fast);
        }
        
        $region->update($validated);
        return response()->json($region);
    }

    public function destroy($id)
    {
        Region::destroy($id);
        return response()->json(['message' => 'Region deleted']);
    }

    public function bulkUpdateByCountry(Request $request)
    {
        $request->validate([
            'country' => 'required|string',
            'cross_island_fee' => 'required|numeric',
            'export_tax_rate' => 'required|numeric',
            'import_tax_rate' => 'required|numeric',
            'service_fee' => 'required|numeric',
            'logistics_fee_regular' => 'required|numeric',
            'courier_fee_regular' => 'required|numeric',
            'logistics_fee_fast' => 'required|numeric',
            'courier_fee_fast' => 'required|numeric',
            'currency_code' => 'required|string',
            'currency_symbol' => 'required|string',
        ]);

        Region::where('country', $request->country)->update([
            'cross_island_fee' => $request->cross_island_fee,
            'export_tax_rate' => $request->export_tax_rate,
            'import_tax_rate' => $request->import_tax_rate,
            'service_fee' => $request->service_fee,
            'logistics_fee_regular' => $request->logistics_fee_regular,
            'courier_fee_regular' => $request->courier_fee_regular,
            'logistics_fee_fast' => $request->logistics_fee_fast,
            'courier_fee_fast' => $request->courier_fee_fast,
            'shipping_fee_santai' => $request->logistics_fee_regular + $request->courier_fee_regular,
            'shipping_fee_cepat' => $request->logistics_fee_fast + $request->courier_fee_fast,
            'currency_code' => $request->currency_code,
            'currency_symbol' => $request->currency_symbol,
        ]);

        return response()->json(['message' => "Seluruh wilayah di {$request->country} telah disinkronkan."]);
    }
}
