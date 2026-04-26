<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $carts = \App\Models\Cart::with(['product.shop', 'product.images', 'variant'])
            ->where('user_id', $request->user()->id)
            ->get();
        return response()->json($carts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|integer|min:1'
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $product = \App\Models\Product::lockForUpdate()->findOrFail($request->product_id);
            
            if ($request->product_variant_id) {
                $variant = \App\Models\ProductVariant::lockForUpdate()->findOrFail($request->product_variant_id);
                if ($variant->product_id !== $product->id) {
                    return response()->json(['message' => 'Varian tidak cocok dengan produk yang dipilih'], 400);
                }
                if ($request->quantity > $variant->stok) {
                     return response()->json(['message' => 'Kuantitas melebihi stok varian yang tersedia'], 400);
                }
            } else {
                if ($request->quantity > $product->stok) {
                     return response()->json(['message' => 'Kuantitas melebihi stok produk yang tersedia'], 400);
                }
            }

            $cart = \App\Models\Cart::where('user_id', $request->user()->id)
                ->where('product_id', $request->product_id)
                ->where('variant_id', $request->product_variant_id)
                ->first();

            if ($cart) {
                $newQuantity = $cart->qty + $request->quantity;
                $maxStok = $request->product_variant_id ? $variant->stok : $product->stok;
                
                if ($newQuantity > $maxStok) {
                    return response()->json(['message' => 'Kuantitas melebihi stok yang tersedia'], 400);
                }
                $cart->qty = $newQuantity;
                $cart->save();
            } else {
                $cart = \App\Models\Cart::create([
                    'user_id' => $request->user()->id,
                    'product_id' => $request->product_id,
                    'variant_id' => $request->product_variant_id,
                    'qty' => $request->quantity
                ]);
            }

            return response()->json(['message' => 'Berhasil ditambahkan ke keranjang', 'cart' => $cart], 201);
        });
    }

    public function show(string $id) { /* Not strictly needed */ }

    public function update(Request $request, string $id)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);
        $cart = \App\Models\Cart::with(['product', 'variant'])->where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        
        $maxStok = $cart->variant ? $cart->variant->stok : $cart->product->stok;
        if ($request->quantity > $maxStok) {
             return response()->json(['message' => 'Kuantitas melebihi stok yang tersedia'], 400);
        }

        $cart->qty = $request->quantity;
        $cart->save();
        return response()->json(['message' => 'Kuantitas diupdate']);
    }

    public function destroy(string $id, Request $request)
    {
        $cart = \App\Models\Cart::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $cart->delete();
        return response()->json(['message' => 'Item dihapus']);
    }
}
