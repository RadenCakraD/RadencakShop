<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with(['images', 'shop.user', 'variants'])->withSum('orderItems', 'qty')->withAvg('reviews', 'rating')->orderBy('created_at', 'desc');
            
        if ($request->has('category') && !empty($request->category) && $request->category !== 'Semua') {
            $products->where('kategori', $request->category);
        }

        if ($request->has('q') && !empty($request->q)) {
            $q = $request->q;
            $products->where(function($qq) use ($q) {
                $qq->where('nama_produk', 'like', "%{$q}%")
                   ->orWhereHas('shop', function($sq) use ($q) {
                       $sq->where('nama_toko', 'like', "%{$q}%");
                   });
            });
        }

        return response()->json($products->paginate(12));
    }

    public function getFlashSales(Request $request)
    {
        $products = Product::with(['images', 'shop.user', 'variants'])
            ->withSum('orderItems', 'qty')
            ->withAvg('reviews', 'rating')
            ->where('is_flash_sale', true)
            ->where(function($q) {
                $q->whereNull('flash_sale_end')
                  ->orWhere('flash_sale_end', '>=', now());
            })
            ->where(function($q) {
                $q->whereNull('flash_sale_start')
                  ->orWhere('flash_sale_start', '<=', now());
            })
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($products);
    }

    public function show($slug)
    {
        $product = Product::with(['images', 'variants', 'shop.user', 'reviews.user'])
                          ->withSum('orderItems', 'qty')
                          ->where('slug', $slug)
                          ->firstOrFail();
        return response()->json($product);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_produk' => 'required|string|max:255',
            'harga_jual' => 'required|numeric|max:999999999',
            'harga_dasar' => 'nullable|numeric|max:999999999',
            'kategori' => 'required|string',
            'kondisi' => 'required|in:baru,bekas',
            'stok' => 'required|integer|max:999999999',
            'deskripsi' => 'required|string',
            'berat' => 'required|numeric',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ], [
            'harga_jual.max' => 'Peringatan: Harga Jual tidak boleh melebihi Rp 999 Juta!',
            'harga_dasar.max' => 'Peringatan: Harga Dasar (Coret) tidak boleh melebihi Rp 999 Juta!',
            'stok.max' => 'Peringatan: Stok batas maksimal adalah 999,999,999!'
        ]); 

        $shop = $request->user()->shop;
        if (!$shop) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 403);
        }

        try {
            return DB::transaction(function () use ($request, $shop) {
                $product = new Product();
                $product->shop_id = $shop->id;
                $product->nama_produk = $request->nama_produk;
                $product->slug = Str::slug($request->nama_produk . '-' . uniqid());
                $product->harga_jual = $request->harga_jual;
                $product->harga_dasar = $request->harga_dasar ?? 0;
                $product->kategori = $request->kategori;
                $product->kondisi = $request->kondisi;
                $product->stok = $request->stok;
                $product->deskripsi = $request->deskripsi;
                $product->berat = $request->berat;
                $product->panjang = 1;
                $product->lebar = 1;
                $product->tinggi = 1;
                $product->save();

                $imagePaths = [];
                $variantPaths = [];
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $index => $file) {
                        $path = $file->store('products', 'public');
                        $imagePaths[] = $path;
                        
                        ProductImage::create([
                            'product_id' => $product->id,
                            'is_primary' => ($index == 0),
                            'image_url' => $path
                        ]);
                    }
                }

                if ($request->has('variants') && is_array($request->variants)) {
                    foreach($request->variants as $var) {
                        if (!empty($var['nama']) && isset($var['harga_jual']) && isset($var['stok'])) {
                            $imgPath = null;
                            if (isset($var['image']) && $var['image'] instanceof \Illuminate\Http\UploadedFile) {
                                $imgPath = $var['image']->store('products/variants', 'public');
                                $variantPaths[] = $imgPath;
                            }
                            \App\Models\ProductVariant::create([
                                'product_id' => $product->id,
                                'nama_jenis' => $var['nama'],
                                'harga_asli' => isset($var['harga_asli']) ? $var['harga_asli'] : $var['harga_jual'], 
                                'harga_jual' => $var['harga_jual'],
                                'stok' => $var['stok'],
                                'image_url' => $imgPath,
                            ]);
                        }
                    }
                }



                if (!empty($imagePaths) || !empty($variantPaths)) {
                    \App\Jobs\ProcessProductImages::dispatch($product->id, $imagePaths, $variantPaths);
                }

                return response()->json([
                    'message' => 'Produk berhasil ditambahkan!',
                    'product' => $product->load('images')
                ], 201);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Product Store Error: ' . $e->getMessage());
            $msg = app()->isProduction() ? 'Terjadi kesalahan sistem saat menyimpan produk.' : $e->getMessage();
            return response()->json(['message' => 'Gagal menyimpan produk: ' . $msg], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $shop = $request->user()->shop;
        if (!$shop) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 403);
        }

        $product = Product::where('id', $id)->where('shop_id', $shop->id)->firstOrFail();

        $request->validate([
            'nama_produk' => 'string|max:255',
            'harga_jual' => 'numeric|max:999999999',
            'harga_dasar' => 'nullable|numeric|max:999999999',
            'kategori' => 'string',
            'kondisi' => 'in:baru,bekas',
            'stok' => 'integer|max:999999999',
            'deskripsi' => 'string',
            'berat' => 'numeric',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ], [
            'harga_jual.max' => 'Peringatan: Harga Jual tidak boleh melebihi Rp 999 Juta!',
            'harga_dasar.max' => 'Peringatan: Harga Dasar (Coret) tidak boleh melebihi Rp 999 Juta!',
            'stok.max' => 'Peringatan: Stok batas maksimal adalah 999,999,999!'
        ]);

        try {
            return DB::transaction(function () use ($request, $product) {
                $imagePaths = [];
                $variantPaths = [];
                $product->update($request->only([
                    'nama_produk', 'harga_jual', 'harga_dasar', 'kategori', 'kondisi', 'stok', 'deskripsi', 'berat'
                ]));

                if ($request->has('nama_produk') && $request->nama_produk !== $product->nama_produk) {
                    $product->slug = Str::slug($request->nama_produk . '-' . uniqid());
                    $product->save();
                }

                // 1. Handle Surgical Deletion of Images
                if ($request->has('deleted_image_ids') && is_array($request->deleted_image_ids)) {
                    foreach ($request->deleted_image_ids as $imgId) {
                        $image = \App\Models\ProductImage::where('id', $imgId)->where('product_id', $product->id)->first();
                        if ($image) {
                            Storage::disk('public')->delete($image->image_url);
                            $image->delete();
                        }
                    }
                }

                // 2. Handle New Image Uploads (Appending)
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $file) {
                        $path = $file->store('products', 'public');
                        $imagePaths[] = $path;
                        ProductImage::create([
                            'product_id' => $product->id,
                            'is_primary' => false, // Will re-evaluate below
                            'image_url' => $path
                        ]);
                    }
                }

                // 3. Ensure a Primary Image exists
                $images = \App\Models\ProductImage::where('product_id', $product->id)->get();
                if ($images->count() > 0) {
                    $hasPrimary = $images->where('is_primary', true)->count() > 0;
                    if (!$hasPrimary) {
                        $first = $images->first();
                        $first->is_primary = true;
                        $first->save();
                    }
                }

                // Variant replacement (Overwrite existing)
                if ($request->has('variants') && is_array($request->variants)) {
                    $oldVariants = \App\Models\ProductVariant::where('product_id', $product->id)->get();
                    foreach($oldVariants as $oldVar) {
                        if($oldVar->image_url) { Storage::disk('public')->delete($oldVar->image_url); }
                    }
                    \App\Models\ProductVariant::where('product_id', $product->id)->delete();

                    foreach($request->variants as $var) {
                        if (!empty($var['nama']) && isset($var['harga_jual']) && isset($var['stok'])) {
                            $imgPath = null;
                            if (isset($var['image']) && $var['image'] instanceof \Illuminate\Http\UploadedFile) {
                                $imgPath = $var['image']->store('products/variants', 'public');
                                $variantPaths[] = $imgPath;
                            }
                            \App\Models\ProductVariant::create([
                                'product_id' => $product->id,
                                'nama_jenis' => $var['nama'],
                                'harga_asli' => isset($var['harga_asli']) ? $var['harga_asli'] : $var['harga_jual'], 
                                'harga_jual' => $var['harga_jual'],
                                'stok' => $var['stok'],
                                'image_url' => $imgPath,
                            ]);
                        }
                    }
                } else if ($request->has('clear_variants') && $request->clear_variants) {
                    $oldVariants = \App\Models\ProductVariant::where('product_id', $product->id)->get();
                    foreach($oldVariants as $oldVar) {
                        if($oldVar->image_url) { Storage::disk('public')->delete($oldVar->image_url); }
                    }
                    \App\Models\ProductVariant::where('product_id', $product->id)->delete();
                }



                if (!empty($imagePaths) || !empty($variantPaths)) {
                    \App\Jobs\ProcessProductImages::dispatch($product->id, $imagePaths, $variantPaths);
                }

                return response()->json([
                    'message' => 'Produk berhasil diperbarui', 
                    'product' => $product->load('images', 'variants')
                ]);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Product Update Error: ' . $e->getMessage());
            $msg = app()->isProduction() ? 'Terjadi kesalahan sistem saat memperbarui produk.' : $e->getMessage();
            return response()->json(['message' => 'Gagal memperbarui produk: ' . $msg], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $shop = $request->user()->shop;
        if (!$shop) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 403);
        }

        $product = Product::where('id', $id)->where('shop_id', $shop->id)->firstOrFail();
        
        return DB::transaction(function () use ($product) {
            $images = \App\Models\ProductImage::where('product_id', $product->id)->get();
            foreach($images as $img) {
                Storage::disk('public')->delete($img->image_url);
            }
            \App\Models\ProductImage::where('product_id', $product->id)->delete();
            
            $variants = \App\Models\ProductVariant::where('product_id', $product->id)->get();
            foreach($variants as $var) {
                if($var->image_url) { Storage::disk('public')->delete($var->image_url); }
            }
            \App\Models\ProductVariant::where('product_id', $product->id)->delete();
            
            $product->delete();



            return response()->json(['message' => 'Produk berhasil dihapus']);
        });
    }
}
