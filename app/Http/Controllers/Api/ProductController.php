<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['images', 'shop.user', 'variants'])->orderBy('created_at', 'desc');
        
        if ($request->has('category') && !empty($request->category) && $request->category !== 'Semua') {
            $query->where('kategori', $request->category);
        }

        $products = $query->paginate(12);
        return response()->json($products);
    }

    public function show($slug)
    {
        $product = Product::with(['images', 'variants', 'shop.user'])
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
            'images.*' => 'nullable|image|max:2048'
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

                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $index => $file) {
                        $path = $file->store('products', 'public');
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

                return response()->json([
                    'message' => 'Produk berhasil ditambahkan!',
                    'product' => $product->load('images')
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menyimpan produk: ' . $e->getMessage()], 500);
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
            'images.*' => 'nullable|image|max:2048'
        ], [
            'harga_jual.max' => 'Peringatan: Harga Jual tidak boleh melebihi Rp 999 Juta!',
            'harga_dasar.max' => 'Peringatan: Harga Dasar (Coret) tidak boleh melebihi Rp 999 Juta!',
            'stok.max' => 'Peringatan: Stok batas maksimal adalah 999,999,999!'
        ]);

        try {
            return DB::transaction(function () use ($request, $product) {
                $product->update($request->only([
                    'nama_produk', 'harga_jual', 'harga_dasar', 'kategori', 'kondisi', 'stok', 'deskripsi', 'berat'
                ]));

                if ($request->has('nama_produk') && $request->nama_produk !== $product->nama_produk) {
                    $product->slug = Str::slug($request->nama_produk . '-' . uniqid());
                    $product->save();
                }

                // Image replacement (Overwrite existing)
                if ($request->hasFile('images')) {
                    $oldImages = \App\Models\ProductImage::where('product_id', $product->id)->get();
                    foreach($oldImages as $oldImage) {
                        Storage::disk('public')->delete($oldImage->image_url);
                    }
                    \App\Models\ProductImage::where('product_id', $product->id)->delete();
                    
                    foreach ($request->file('images') as $index => $file) {
                        $path = $file->store('products', 'public');
                        ProductImage::create([
                            'product_id' => $product->id,
                            'is_primary' => ($index == 0),
                            'image_url' => $path
                        ]);
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

                return response()->json([
                    'message' => 'Produk berhasil diperbarui', 
                    'product' => $product->load('images', 'variants')
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal memperbarui produk: ' . $e->getMessage()], 500);
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
