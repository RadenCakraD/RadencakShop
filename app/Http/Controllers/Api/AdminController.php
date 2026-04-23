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
        return $user && in_array($user->role, ['super_admin', 'admin_staff', 'admin']); // fallback to 'admin' if old
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

        foreach ($request->ordered_ids as $index => $id) {
            Banner::where('id', $id)->update(['position' => $index]);
        }
        return response()->json(['message' => 'Urutan banner berhasil disimpan']);
    }

    public function destroyBanner(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $banner = Banner::findOrFail($id);
        if ($banner->image_url) Storage::disk('public')->delete($banner->image_url);
        $banner->delete();

        return response()->json(['message' => 'Banner dihapus']);
    }

    // Products (Flash Sale)
    public function fetchAllProducts(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $query = Product::with(['shop', 'images']);
        if ($request->q) {
            $query->where('nama_produk', 'like', '%' . $request->q . '%');
        }
        $products = $query->orderBy('created_at', 'desc')->get();
        return response()->json($products);
    }

    public function toggleFlashSale(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $product = Product::findOrFail($id);
        $product->is_flash_sale = !$product->is_flash_sale;
        $product->save();

        return response()->json(['message' => 'Status flash sale diubah']);
    }

    // Users
    public function getAllUsers(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);
        
        $query = User::query();
        if ($request->q) {
            $query->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('username', 'like', '%' . $request->q . '%')
                  ->orWhere('email', 'like', '%' . $request->q . '%');
        }
        
        $users = $query->orderBy('created_at', 'desc')->get(['id', 'name', 'username', 'email', 'role']);
        return response()->json($users);
    }

    public function updateUserRole(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Hanya Super Admin yang bisa ubah role!'], 403);
        }

        $request->validate(['role' => 'required|in:super_admin,admin_staff,admin_logistik,logistik_staff,admin_kurir,kurir_staff,user,toko,admin']);

        $targetUser = User::findOrFail($id);

        if ($targetUser->email === 'radencakstudio@gmail.com') {
            return response()->json(['message' => 'Akun Super Admin (Utama) tidak bisa diubah rolenya!'], 403);
        }

        $targetUser->role = $request->role;
        $targetUser->save();

        return response()->json(['message' => "Role diperbarui menjadi {$request->role}"]);
    }

    public function getAllWithdrawals(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $withdrawals = \App\Models\Withdrawal::with(['user', 'shop'])->orderBy('created_at', 'desc')->get();
        return response()->json($withdrawals);
    }

    public function approveWithdrawal(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $w = \App\Models\Withdrawal::findOrFail($id);
        if ($w->status !== 'pending') return response()->json(['message' => 'Hanya status pending yang bisa disetujui'], 400);

        $w->status = 'completed';
        $w->save();
        return response()->json(['message' => 'Penarikan dana disetujui dan dilabeli Selesai.']);
    }

    public function rejectWithdrawal(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $w = \App\Models\Withdrawal::findOrFail($id);
        if ($w->status !== 'pending') return response()->json(['message' => 'Hanya status pending yang bisa ditolak'], 400);

        $w->status = 'rejected';
        $w->save();
        return response()->json(['message' => 'Penarikan dana DITOLAK (saldo dikembalikan/gagal potong).']);
    }
}
