<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Shop;
use Illuminate\Support\Facades\Storage;

class ShopController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'nama_toko' => 'required|string',
            'url_toko' => 'required|string|unique:shops',
            'slogan' => 'nullable|string',
            'alamat_toko' => 'required|string',
            'kode_negara' => 'nullable|string',
            'no_telepon' => 'required|string',
            'kurir' => 'required|array',
            'foto_profil' => 'nullable|image|max:2048',
            'banner_toko' => 'nullable|image|max:2048'
        ]);

        if ($request->user()->shop()->exists()) {
            return response()->json(['message' => 'Anda sudah memiliki toko'], 400);
        }

        $shop = new Shop();
        $shop->user_id = $request->user()->id;
        $shop->nama_toko = $request->nama_toko;
        $shop->url_toko = $request->url_toko;
        $shop->slogan = $request->slogan;
        $shop->alamat_toko = $request->alamat_toko;
        $shop->no_telepon = $request->kode_negara . $request->no_telepon;
        $shop->kurir = json_encode($request->kurir);

        if ($request->hasFile('foto_profil')) {
            $shop->foto_profil = $request->file('foto_profil')->store('shops/profiles', 'public');
        }

        if ($request->hasFile('banner_toko')) {
            $shop->banner_toko = $request->file('banner_toko')->store('shops/banners', 'public');
        }

        $shop->save();

        // Update user role to seller
        $user = $request->user();
        $user->role = 'seller';
        $user->save();

        return response()->json([
            'message' => 'Toko berhasil dibuat!',
            'shop' => $shop
        ], 201);
    }

    public function getMyShop(Request $request)
    {
        $shop = $request->user()->shop()->with(['products.images', 'products.variants'])->firstOrFail();
        return response()->json($shop);
    }

    public function showPublic($id)
    {
        $shop = Shop::with(['products.images', 'products.variants', 'user'])->findOrFail($id);
        return response()->json($shop);
    }

    public function updateProfile(Request $request)
    {
        $shop = $request->user()->shop;
        if (!$shop) return response()->json(['message' => 'Toko tidak ditemukan'], 404);

        $request->validate([
            'nama_toko' => 'string|max:255',
            'deskripsi_toko' => 'nullable|string',
            'foto_profil' => 'nullable|image|max:2048',
            'banner_toko' => 'nullable|image|max:2048'
        ]);

        if ($request->has('nama_toko')) $shop->nama_toko = $request->nama_toko;
        if ($request->has('deskripsi_toko')) $shop->deskripsi_toko = $request->deskripsi_toko;

        if ($request->hasFile('foto_profil')) {
            $shop->foto_profil = $request->file('foto_profil')->store('shops/profiles', 'public');
        }
        if ($request->hasFile('banner_toko')) {
            $shop->banner_toko = $request->file('banner_toko')->store('shops/banners', 'public');
        }

        $shop->save();
        return response()->json(['message' => 'Profil berhasil diperbarui', 'shop' => $shop]);
    }
}
