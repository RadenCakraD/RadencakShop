<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserAddress;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = UserAddress::with('region')->where('user_id', $request->user()->id)
            ->orderBy('is_primary', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tag' => 'required|string',
            'receiver_name' => 'required|string',
            'phone_number' => 'required|string',
            'full_address' => 'required|string',
            'note' => 'nullable|string',
            'region_id' => 'required|exists:regions,id'
        ]);

        $user = $request->user();
        
        // If it's the first address, make it primary
        $isFirst = UserAddress::where('user_id', $user->id)->count() === 0;

        $address = UserAddress::create([
            'user_id' => $user->id,
            'tag' => $request->tag,
            'receiver_name' => $request->receiver_name,
            'phone_number' => $request->phone_number,
            'full_address' => $request->full_address,
            'note' => $request->note,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'region_id' => $request->region_id,
            'is_primary' => $request->is_primary || $isFirst
        ]);

        if ($address->is_primary && !$isFirst) {
            UserAddress::where('user_id', $user->id)->where('id', '!=', $address->id)->update(['is_primary' => false]);
        }

        $address->load('region');
        return response()->json(['message' => 'Alamat berhasil ditambahkan', 'address' => $address], 201);
    }

    public function update(Request $request, $id)
    {
        $address = UserAddress::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        
        $request->validate([
            'region_id' => 'sometimes|exists:regions,id'
        ]);

        $address->update($request->only([
            'tag', 'receiver_name', 'phone_number', 'full_address', 'note', 'latitude', 'longitude', 'region_id'
        ]));

        if ($request->has('is_primary') && $request->is_primary) {
            UserAddress::where('user_id', $request->user()->id)->update(['is_primary' => false]);
            $address->update(['is_primary' => true]);
        }

        return response()->json(['message' => 'Alamat berhasil diperbarui', 'address' => $address]);
    }

    public function destroy(Request $request, $id)
    {
        $address = UserAddress::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $wasPrimary = $address->is_primary;
        $address->delete();

        if ($wasPrimary) {
            $nextPrimary = UserAddress::where('user_id', $request->user()->id)->first();
            if ($nextPrimary) {
                $nextPrimary->update(['is_primary' => true]);
            }
        }

        return response()->json(['message' => 'Alamat dihapus']);
    }

    public function setPrimary(Request $request, $id)
    {
        $user = $request->user();
        $address = UserAddress::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        UserAddress::where('user_id', $user->id)->update(['is_primary' => false]);
        $address->update(['is_primary' => true]);

        return response()->json(['message' => 'Alamat utama berhasil diubah']);
    }
}
