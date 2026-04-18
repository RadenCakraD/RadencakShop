<?php

use Illuminate\Support\Facades\Route;
use App\Models\Product;

// KUNCI UTAMA SPA: Tangkap semua navigasi dan serahkan ke React Router
Route::get('/{any}', function ($any = '') {
    $seo = [
        'title' => 'Radencak Shop - AAA E-Commerce',
        'description' => 'Platform Jual Beli Premium dengan pengalaman UI terbaik dan transaksi kilat Midtrans.',
        'image' => url('/favicon.ico')
    ];

    if (str_starts_with($any, 'product/')) {
        $slug = explode('/', $any)[1] ?? '';
        $product = Product::with('images')->where('slug', $slug)->first();
        if ($product) {
            $seo['title'] = $product->nama_produk . ' | Radencak Shop';
            $seo['description'] = substr(strip_tags($product->deskripsi), 0, 150) . '...';
            if ($product->images->count() > 0) {
                $primaryImg = $product->images->where('is_primary', true)->first();
                $imgUrl = $primaryImg ? $primaryImg->image_url : $product->images->first()->image_url;
                if (!str_starts_with($imgUrl, 'http')) {
                    $imgUrl = asset('storage/' . $imgUrl);
                }
                $seo['image'] = $imgUrl;
            }
        }
    }

    return view('react_app', compact('seo'));
})->where('any', '.*');
