<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Banner;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    private function isAdmin($user) {
        return $user && $user->role === 'admin';
    }

    public function getBanners()
    {
        return response()->json(Banner::orderBy('position', 'asc')->orderBy('created_at', 'desc')->get());
    }

    public function getActiveBanners()
    {
        return response()->json(Banner::where('is_active', true)->orderBy('position', 'asc')->orderBy('created_at', 'desc')->get());
    }

    public function storeBanner(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'image' => 'required|image|max:5120', // 5MB
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'link_url' => 'nullable|string',
        ]);

        $path = $request->file('image')->store('banners', 'public');

        $maxPosition = Banner::max('position');

        $banner = Banner::create([
            'image_url' => $path,
            'title' => $request->title,
            'description' => $request->description,
            'link_url' => $request->link_url,
            'position' => $maxPosition !== null ? $maxPosition + 1 : 0,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Banner ditambahkan', 'banner' => $banner], 201);
    }

    public function updateBanner(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'image' => 'nullable|image|max:5120', // 5MB
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'link_url' => 'nullable|string',
        ]);

        $banner = Banner::findOrFail($id);

        if ($request->hasFile('image')) {
            if ($banner->image_url) {
                Storage::disk('public')->delete($banner->image_url);
            }
            $banner->image_url = $request->file('image')->store('banners', 'public');
        }

        $banner->title = $request->title;
        $banner->description = $request->description;
        $banner->link_url = $request->link_url;
        $banner->save();

        return response()->json(['message' => 'Banner diperbarui', 'banner' => $banner]);
    }

    public function reorderBanners(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'integer|exists:banners,id',
        ]);

        foreach ($request->ordered_ids as $index => $id) {
            Banner::where('id', $id)->update(['position' => $index]);
        }

        return response()->json(['message' => 'Urutan banner berhasil disimpan']);
    }

    public function destroyBanner(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $banner = Banner::findOrFail($id);
        if ($banner->image_url) {
            Storage::disk('public')->delete($banner->image_url);
        }
        $banner->delete();

        return response()->json(['message' => 'Banner dihapus']);
    }

    public function fetchAllProducts(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $products = Product::with(['shop'])->orderBy('created_at', 'desc')->get();
        return response()->json($products);
    }

    public function toggleFlashSale(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $product = Product::findOrFail($id);
        $product->is_flash_sale = !$product->is_flash_sale;
        $product->save();

        return response()->json([
            'message' => 'Status flash sale diubah', 
            'is_flash_sale' => $product->is_flash_sale
        ]);
    }

    public function getAllUsers(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);
        $users = User::orderBy('created_at', 'desc')->get(['id', 'name', 'username', 'email', 'role']);
        return response()->json($users);
    }

    public function updateUserRole(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate(['role' => 'required|in:admin,toko,kurir,user']);

        $targetUser = User::findOrFail($id);

        if ($targetUser->email === 'radencakstudio@gmail.com') {
            return response()->json(['message' => 'Akun Super Admin (Utama) tidak bisa diubah rolenya!'], 403);
        }

        $targetUser->role = $request->role;
        $targetUser->save();

        return response()->json(['message' => "Role berhasil diperbarui menjadi {$request->role}", 'user' => $targetUser]);
    }

    // Role Kurir Helpers
    public function getShippedOrders(Request $request)
    {
        // Akses untuk admin atau kurir
        if ($request->user()->role !== 'admin' && $request->user()->role !== 'kurir') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $orders = \App\Models\Order::with(['user', 'shop'])
            ->where('status', 'shipped')
            ->orderBy('updated_at', 'desc')
            ->get();
            
        return response()->json($orders);
    }

    public function markAsDelivered(Request $request, $id)
    {
        if ($request->user()->role !== 'admin' && $request->user()->role !== 'kurir') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order = \App\Models\Order::findOrFail($id);
        if ($order->status !== 'shipped') {
            return response()->json(['message' => 'Hanya pesanan sedang dikirim yang bisa diselesaikan'], 400);
        }

        $order->status = 'completed';
        $order->save();

        return response()->json(['message' => 'Pesanan berhasil ditandai selesai/diterima!']);
    }
}
