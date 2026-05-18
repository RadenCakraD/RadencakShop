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
            'region_id' => 'nullable|exists:regions,id',
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
        $shop->region_id = $request->region_id;
        $shop->province = $request->province;
        $shop->regency = $request->regency;
        $shop->district = $request->district;
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

        // Update user role to shop_owner (hanya jika dia user biasa/premium)
        $user = $request->user();
        if(in_array($user->role, ['user', 'user_premium', null])) {
            $user->role = 'shop_owner';
            $user->save();
        }

        return response()->json([
            'message' => 'Toko berhasil dibuat!',
            'shop' => $shop
        ], 201);
    }

    public function getMyShop(Request $request)
    {
        $shop = $this->getShopForUser($request->user());
        if (!$shop) return response()->json(['message' => 'Toko tidak ditemukan'], 404);

        $shop->load(['products.images', 'products.variants', 'orders.items.product']);
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
        if ($request->has('province')) $shop->province = $request->province;
        if ($request->has('regency')) $shop->regency = $request->regency;
        if ($request->has('district')) $shop->district = $request->district;

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
        $user = $request->user();
        $shop = $user->shop;
        
        // Support for shop staff
        if (!$shop && $user->role === 'shop_staff' && $user->parent_id) {
            $shop = Shop::where('user_id', $user->parent_id)->first();
        }

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

                // Notifikasi global atau region (simulasi)
                // Di sini kita buat notifikasi untuk pembeli juga
                \App\Models\Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'message' => "Pesanan #{$order->order_number} Anda di {$shop->nama_toko} sudah siap dan menunggu kurir.",
                    'reference_id' => $order->id
                ]);
            }
        });

        return response()->json(['message' => 'Status pesanan diperbarui menjadi ' . $order->status, 'order' => $order]);
    }

    public function getProfit(Request $request) 
    {
        $shop = $this->getShopForUser($request->user());
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
        
        $totalAdminFee = \App\Models\Order::whereIn('id', $completedOrderIds)
            ->sum('admin_fee_amount');
            
        $netProfit = $totalProfit - $totalAdminFee;
        $completedOrdersCount = $completedOrderIds->count();

        $totalWithdrawn = \App\Models\Withdrawal::where('user_id', $request->user()->id)->where('type', 'shop')->where('status', '!=', 'rejected')->sum('amount');
        
        return response()->json([
            'total_profit' => $netProfit,
            'gross_profit' => $totalProfit,
            'admin_fee_deducted' => $totalAdminFee,
            'completed_orders_count' => $completedOrdersCount,
            'withdrawn' => $totalWithdrawn
        ]);
    }
    public function getShopInsights(Request $request)
    {
        $shop = $this->getShopForUser($request->user());
        if (!$shop) return response()->json(['message' => 'Toko tidak ditemukan'], 404);

        // Weekly Revenue Chart Data
        $revenueData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dailyTotal = \App\Models\Order::where('shop_id', $shop->id)
                ->where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('total_amount');
            $revenueData[] = [
                'name' => now()->subDays($i)->format('D'),
                'revenue' => (float) $dailyTotal
            ];
        }

        // Top Products by Views & Sales
        $topProducts = \App\Models\Product::where('shop_id', $shop->id)
            ->orderBy('views', 'desc')
            ->take(5)
            ->get(['id', 'nama_produk', 'views', 'cart_adds']);

        return response()->json([
            'revenue_chart' => $revenueData,
            'top_products' => $topProducts,
            'summary' => [
                'total_products' => \App\Models\Product::where('shop_id', $shop->id)->count(),
                'total_orders' => \App\Models\Order::where('shop_id', $shop->id)->count(),
                'pending_orders' => \App\Models\Order::where('shop_id', $shop->id)->whereIn('status', ['paid', 'pending'])->count(),
            ]
        ]);
    }

    public function inviteStaff(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $shop = $this->getShopForUser($request->user());
        
        $targetUser = \App\Models\User::where('email', $request->email)->first();
        if (!$targetUser) {
            return response()->json(['message' => 'Pengguna dengan email tersebut tidak ditemukan'], 404);
        }

        if ($targetUser->parent_id) {
            return response()->json(['message' => 'Pengguna ini sudah menjadi staff di tempat lain'], 400);
        }

        \App\Models\Notification::create([
            'user_id' => $targetUser->id,
            'type' => 'staff_invite',
            'message' => "Toko {$shop->nama_toko} mengundang Anda untuk bergabung sebagai Staff Toko.",
            'data' => json_encode([
                'inviter_id' => $request->user()->id,
                'role' => 'shop_staff',
                'shop_name' => $shop->nama_toko
            ])
        ]);

        return response()->json(['message' => 'Undangan berhasil dikirim ke ' . $request->email]);
    }
    private function getShopForUser($user)
    {
        if ($user->shop) return $user->shop;
        
        if ($user->role === 'shop_staff' && $user->parent_id) {
            return Shop::where('user_id', $user->parent_id)->first();
        }

        return null;
    }
}
