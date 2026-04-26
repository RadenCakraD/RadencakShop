<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Shop;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ShopController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'nama_toko' => 'required|string',
            'url_toko' => 'required|string|unique:shops',
            'slogan' => 'nullable|string',
            'alamat_toko' => 'nullable|string',
            'kode_negara' => 'nullable|string',
            'no_telepon' => 'nullable|string',
            'kurir' => 'nullable|array',
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
        $shop->alamat_toko = $request->alamat_toko ?? '-';
        $shop->no_telepon = ($request->kode_negara ?? '') . ($request->no_telepon ?? '');
        $shop->kurir = json_encode($request->kurir ?? []);

        if ($request->hasFile('foto_profil')) {
            $manager = new ImageManager(new Driver());
            $img = $manager->read($request->file('foto_profil'));
            $img->scaleDown(800, 800);
            $path = 'shops/profiles/' . uniqid() . '.jpg';
            Storage::disk('public')->put($path, (string) $img->toJpeg(75));
            $shop->foto_profil = $path;
        }

        if ($request->hasFile('banner_toko')) {
            $manager = new ImageManager(new Driver());
            $img = $manager->read($request->file('banner_toko'));
            $img->scaleDown(1920, 1080);
            $path = 'shops/banners/' . uniqid() . '.jpg';
            Storage::disk('public')->put($path, (string) $img->toJpeg(75));
            $shop->banner_toko = $path;
        }

        $shop->save();

        // Update user role to toko (hanya jika dia user biasa)
        $user = $request->user();
        if($user->role === 'user' || $user->role === null) {
            $user->role = 'toko';
            $user->save();
        }

        return response()->json([
            'message' => 'Toko berhasil dibuat!',
            'shop' => $shop
        ], 201);
    }

    public function getMyShop(Request $request)
    {
        $shop = $request->user()->shop()
             ->with(['products.images', 'products.variants', 'orders.items.product'])
             ->firstOrFail();
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
            'alamat_toko' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'foto_profil' => 'nullable|image|max:2048',
            'banner_toko' => 'nullable|image|max:2048'
        ]);

        if ($request->has('nama_toko')) $shop->nama_toko = $request->nama_toko;
        if ($request->has('deskripsi_toko')) $shop->deskripsi_toko = $request->deskripsi_toko;
        if ($request->has('alamat_toko')) $shop->alamat_toko = $request->alamat_toko;
        if ($request->has('latitude')) $shop->latitude = $request->latitude;
        if ($request->has('longitude')) $shop->longitude = $request->longitude;

        if ($request->hasFile('foto_profil')) {
            $manager = new ImageManager(new Driver());
            $img = $manager->read($request->file('foto_profil'));
            $img->scaleDown(800, 800);
            $path = 'shops/profiles/' . uniqid() . '.jpg';
            Storage::disk('public')->put($path, (string) $img->toJpeg(75));
            $shop->foto_profil = $path;
        }
        if ($request->hasFile('banner_toko')) {
            $manager = new ImageManager(new Driver());
            $img = $manager->read($request->file('banner_toko'));
            $img->scaleDown(1920, 1080);
            $path = 'shops/banners/' . uniqid() . '.jpg';
            Storage::disk('public')->put($path, (string) $img->toJpeg(75));
            $shop->banner_toko = $path;
        }

        $shop->save();
        return response()->json(['message' => 'Profil berhasil diperbarui', 'shop' => $shop]);
    }

    public function upgradeTier(Request $request)
    {
        $shop = $request->user()->shop;
        if (!$shop) return response()->json(['message' => 'Toko tidak ditemukan'], 404);
        
        $shop->shop_tier = 'raden';
        $shop->save();
        
        return response()->json(['message' => 'Toko berhasil diverifikasi menjadi Raden!', 'shop' => $shop]);
    }

    public function updateOrderStatus(Request $request, $orderId)
    {
        $shop = $request->user()->shop;
        if (!$shop) return response()->json(['message' => 'Toko tidak ditemukan'], 404);

        $request->validate(['status' => 'required|in:processing,ready_for_pickup']);

        $order = \App\Models\Order::where('id', $orderId)->where('shop_id', $shop->id)->firstOrFail();
        
        \Illuminate\Support\Facades\DB::transaction(function() use ($order, $request, $shop) {
            $order->status = $request->status;
            $order->save();

            if ($request->status === 'ready_for_pickup') {
                \App\Models\OrderTracking::create([
                    'order_id' => $order->id,
                    'status' => 'Siap Dijemput Kurir',
                    'location' => $shop->nama_toko,
                    'note' => 'Penjual telah mengemas pesanan dan menunggu kurir penjemput.',
                    'user_id' => $request->user()->id
                ]);
            }
        });

        return response()->json(['message' => 'Status pesanan diperbarui menjadi ' . $order->status, 'order' => $order]);
    }

    public function getProfit(Request $request) 
    {
        $shop = $request->user()->shop;
        if (!$shop) return response()->json(['message' => 'Toko tidak ditemukan'], 404);

        $completedOrderIds = \App\Models\Order::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->pluck('id');
            
        $itemsTotal = \App\Models\OrderItem::whereIn('order_id', $completedOrderIds)
            ->selectRaw('SUM(price * qty) as total')
            ->value('total') ?? 0;
            
        $shopDiscounts = 0;
        $completedOrdersWithVoucher = \App\Models\Order::whereIn('id', $completedOrderIds)->whereNotNull('voucher_code')->get();
        foreach ($completedOrdersWithVoucher as $order) {
            $voucher = \App\Models\Voucher::where('code', $order->voucher_code)->first();
            if ($voucher && $voucher->shop_id == $shop->id) {
                $shopDiscounts += $order->discount_amount;
            }
        }
        
        $totalProfit = $itemsTotal - $shopDiscounts;
        $completedOrdersCount = $completedOrderIds->count();

        $totalWithdrawn = \App\Models\Withdrawal::where('user_id', $request->user()->id)->where('type', 'shop')->where('status', '!=', 'rejected')->sum('amount');
        
        return response()->json([
            'total_profit' => $totalProfit,
            'completed_orders_count' => $completedOrdersCount,
            'withdrawn' => $totalWithdrawn
        ]);
    }
}
