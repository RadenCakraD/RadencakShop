<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use App\Models\Order;
use App\Models\Cart;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use DB;

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        $request->validate([
            'cart_ids' => 'nullable|array',
            'cart_ids.*' => 'exists:carts,id',
            'product_id' => 'nullable|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'qty' => 'nullable|integer|min:1',
            'address_id' => 'required|exists:user_addresses,id',
            'address_info' => 'nullable|string',
            'payment_method' => 'string',
            'shipping_method' => 'string',
            'voucher_code' => 'nullable|string'
        ]);

        $user = $request->user();
        
        $address = \App\Models\UserAddress::with('region')->where('id', $request->address_id)->where('user_id', $user->id)->firstOrFail();
        $region = $address->region;
        
        $shippingFee = $region ? ($request->shipping_method === 'Santai' ? $region->shipping_fee_santai : $region->shipping_fee_cepat) : ($request->shipping_method === 'Santai' ? (int) env('DEFAULT_SHIPPING_SANTAI', 10000) : (int) env('DEFAULT_SHIPPING_CEPAT', 15000));
        $serviceFee = $region ? $region->service_fee : (int) env('DEFAULT_SERVICE_FEE', 500);
        $crossIslandFee = $region ? $region->cross_island_fee : 0;

        $courierFee = $region ? ($request->shipping_method === 'Santai' ? $region->courier_fee_regular : $region->courier_fee_fast) : 0;
        $logisticsFee = $region ? ($request->shipping_method === 'Santai' ? $region->logistics_fee_regular : $region->logistics_fee_fast) : 0;

        $pickupFeeEarned = $courierFee / 2;
        $deliveryFeeEarned = $courierFee / 2;
        $logisticsPickupFeeEarned = $logisticsFee / 2;
        $logisticsDeliveryFeeEarned = $logisticsFee / 2;

        // Logic for Direct Buy vs Cart Checkout
        if ($request->filled('cart_ids')) {
            $carts = Cart::with(['product.shop', 'variant'])
                ->whereIn('id', $request->cart_ids)
                ->where('user_id', $user->id)
                ->get();
        } else if ($request->filled('product_id')) {
            // Create a temporary "virtual" cart item for Buy Now
            $product = Product::with('shop')->findOrFail($request->product_id);
            $variant = $request->variant_id ? ProductVariant::findOrFail($request->variant_id) : null;
            
            $tempCart = new Cart([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'variant_id' => $variant ? $variant->id : null,
                'qty' => $request->qty ?? 1
            ]);
            $tempCart->setRelation('product', $product);
            $tempCart->setRelation('variant', $variant);
            
            $carts = collect([$tempCart]);
        } else {
            return response()->json(['message' => 'Pilih produk untuk dibayar'], 400);
        }

        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Produk tidak ditemukan atau tidak valid'], 400);
        }

        $grouped = $carts->groupBy(function($item) {
            return $item->product->shop_id;
        });

        $orders = [];
        $grandTotalAmount = 0;
        
        DB::beginTransaction();
        try {
            // Prevent deadlocks by locking records in deterministic order (by ID)
            $productIds = $carts->pluck('product_id')->filter()->unique()->sort()->values();
            $variantIds = $carts->pluck('variant_id')->filter()->unique()->sort()->values();

            if ($productIds->isNotEmpty()) {
                Product::whereIn('id', $productIds)->orderBy('id')->lockForUpdate()->get();
            }
            if ($variantIds->isNotEmpty()) {
                ProductVariant::whereIn('id', $variantIds)->orderBy('id')->lockForUpdate()->get();
            }

            $voucher = null;
            $voucherAppliedToAtLeastOne = false;
            $remainingFixedDiscount = 0;

            if ($request->filled('voucher_code')) {
                $voucher = \App\Models\Voucher::where('code', $request->voucher_code)->lockForUpdate()->first();
                if ($voucher && $voucher->kuota <= 0) {
                    throw new \Exception("Kuota voucher telah habis.");
                }
                
                $alreadyUsed = \App\Models\Order::where('user_id', $user->id)
                    ->where('voucher_code', $request->voucher_code)
                    ->exists();
                if ($alreadyUsed) {
                    throw new \Exception("Anda sudah pernah menggunakan voucher ini.");
                }

                if ($voucher && $voucher->type === 'fixed') {
                    $remainingFixedDiscount = $voucher->value;
                }
            }

            foreach ($grouped as $shopId => $cartItems) {
                $totalAmount = 0;
                foreach ($cartItems as $item) {
                    $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
                    $totalAmount += $price * $item->qty;
                }

                $firstProduct = $cartItems->first()->product;
                $productCountry = $firstProduct->country;
                $buyerCountry = $region->country;

                $shopProvince = $firstProduct->shop->province;
                $buyerProvince = $address->province;

                $isSameIsland = true;
                if ($region && $shopProvince !== $buyerProvince) {
                    $islands = is_string($region->islands) ? json_decode($region->islands, true) : ($region->islands ?? []);
                    $shopIsland = null;
                    $buyerIsland = null;
                    
                    foreach ($islands as $island) {
                        $provs = collect($island['provinces'] ?? []);
                        if ($provs->contains('name', $shopProvince)) $shopIsland = $island['name'];
                        if ($provs->contains('name', $buyerProvince)) $buyerIsland = $island['name'];
                    }

                    if ($shopIsland !== $buyerIsland) {
                        $isSameIsland = false;
                    }
                }

                $finalTaxAmount = $isSameIsland ? 0 : $crossIslandFee;

                // International Trade Logic
                if (strtolower($productCountry) !== strtolower($buyerCountry)) {
                    $exportTaxRate = \App\Models\Region::where('country', $productCountry)->max('export_tax_rate') ?? 0;
                    $importTaxRate = $region->import_tax_rate;

                    $finalTaxAmount += ($totalAmount * $exportTaxRate) / 100;
                    $finalTaxAmount += ($totalAmount * $importTaxRate) / 100;
                }

                $totalAmount += $finalTaxAmount;
                $totalAmount += $serviceFee;
                $totalAmount += $shippingFee;

                $appliedDiscount = 0;
                $appliedVoucherCode = null;

                if ($voucher && $totalAmount >= $voucher->min_purchase) {
                    if ($voucher->shop_id === null || $voucher->shop_id == $shopId) {
                        $appliedVoucherCode = $voucher->code;
                        if ($voucher->type === 'percentage') {
                            $appliedDiscount = ($voucher->value / 100) * $totalAmount;
                            if ($appliedDiscount > $totalAmount) $appliedDiscount = $totalAmount;
                            $voucherAppliedToAtLeastOne = true;
                        } else {
                            $appliedDiscount = min($remainingFixedDiscount, $totalAmount);
                            $remainingFixedDiscount -= $appliedDiscount;
                            if ($appliedDiscount > 0) {
                                $voucherAppliedToAtLeastOne = true;
                            }
                        }
                    }
                }

                $finalAmount = max(0, $totalAmount - $appliedDiscount);
                
                // Hitung Admin Fee Platform (Misal 2.5% dari harga barang sebelum ongkir/pajak? 
                // Biasanya dari total transaksi atau total barang. Kita ambil dari totalAmount (termasuk pajak & ongkir) atau total barang saja? 
                // Kita ambil dari total barang + pajak (tanpa ongkir) untuk keadilan toko.
                $baseForFee = $totalAmount - $shippingFee - $serviceFee;
                $feePercentage = (float) env('ADMIN_FEE_PERCENTAGE', 2.5);
                $adminFeeAmount = ($baseForFee * $feePercentage) / 100;

                $shop = $cartItems->first()->product->shop;
                
                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'order_number' => 'ORD-' . strtoupper(Str::random(10)),
                    'status' => 'processing',
                    'total_amount' => $finalAmount,
                    'admin_fee_percentage' => $feePercentage,
                    'admin_fee_amount' => $adminFeeAmount,
                    'address_info' => $request->address_info ?? 'Alamat Default User',
                    'shipping_latitude' => $request->shipping_latitude,
                    'shipping_longitude' => $request->shipping_longitude,
                    'payment_method' => $request->payment_method ?? 'Transfer Bank',
                    'shipping_method' => $request->shipping_method ?? 'Reguler',
                    'voucher_code' => $appliedVoucherCode,
                    'discount_amount' => $appliedDiscount,
                    'region_id' => $shop->region_id,
                    'origin_province' => $shop->province,
                    'origin_regency' => $shop->regency,
                    'origin_district' => $shop->district,
                    'destination_province' => $address->province,
                    'destination_regency' => $address->regency,
                    'destination_district' => $address->district,
                    'pickup_fee_earned' => $pickupFeeEarned,
                    'delivery_fee_earned' => $deliveryFeeEarned,
                    'logistics_pickup_fee_earned' => $logisticsPickupFeeEarned,
                    'logistics_delivery_fee_earned' => $logisticsDeliveryFeeEarned,
                ]);

                $grandTotalAmount += max(0, $totalAmount - $appliedDiscount);

                foreach ($cartItems as $item) {
                    $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
                    
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'product_name' => $item->product->nama_produk,
                        'variant_name' => $item->variant ? $item->variant->nama_jenis : null,
                        'price' => $price,
                        'qty' => $item->qty,
                    ]);

                    // Deduct stock safely with Pessimistic Locking (already pre-locked outside loop)
                    if ($item->variant) {
                        $variantDb = ProductVariant::where('id', $item->variant->id)->lockForUpdate()->first();
                        if (!$variantDb || $variantDb->stok < $item->qty) {
                            DB::rollback();
                            return response()->json(['message' => "Stok varian produk {$item->product->nama_produk} tidak mencukupi."], 400);
                        }
                        $variantDb->decrement('stok', $item->qty);
                    } else {
                        $productDb = Product::where('id', $item->product->id)->lockForUpdate()->first();
                        if (!$productDb || $productDb->stok < $item->qty) {
                            DB::rollback();
                            return response()->json(['message' => "Stok produk {$item->product->nama_produk} tidak mencukupi."], 400);
                        }
                        $productDb->decrement('stok', $item->qty);
                    }
                }

                $orders[] = $order;
            }

            if ($voucher && $voucherAppliedToAtLeastOne && $voucher->kuota > 0) {
                $voucher->decrement('kuota', 1);
            }

            if ($request->filled('cart_ids')) {
                Cart::whereIn('id', $request->cart_ids)->where('user_id', $user->id)->delete();
            }

            DB::commit();

            // Request Token Midtrans IF not Cash / COD
            $snapToken = null;
            if ($request->payment_method !== 'Cash / COD') {
                $serverKey = env('MIDTRANS_SERVER_KEY');
                if (!$serverKey) {
                    throw new \Exception("Konfigurasi Midtrans belum diatur.");
                }
                $midtransPayload = [
                    'transaction_details' => [
                        'order_id' => 'PAY-' . time() . '-' . Str::random(5),
                        'gross_amount' => $grandTotalAmount,
                    ],
                    'customer_details' => [
                        'first_name' => $user->username ?? $user->name,
                        'email' => $user->email,
                        'phone' => $user->no_hp ?? '',
                    ],
                ];

                $response = Http::withBasicAuth($serverKey, '')
                    ->post('https://app.sandbox.midtrans.com/snap/v1/transactions', $midtransPayload);

                $snapToken = $response->json('token');

                if ($snapToken) {
                    foreach ($orders as $o) {
                        $o->update(['snap_token' => $snapToken]);
                    }
                }
            }

            return response()->json([
                'message' => 'Checkout Berhasil!',
                'orders' => $orders,
                'snap_token' => $snapToken // Return for frontend
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollback();
            \Illuminate\Support\Facades\Log::error('Checkout Query Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal checkout: Terjadi kesalahan pada sistem database.'], 500);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Gagal checkout: ' . $e->getMessage()], 500);
        }
    }



    public function verifyBank(Request $request)
    {
        $request->validate([
            'provider' => 'required|string',
            'account_number' => 'required|string|min:9'
        ]);

        // Simulasikan delay network bank API (dihapus agar cepat)
        // sleep(1);

        // Daftar nama awalan palsu
        $firstNames = ['BUDI', 'SITI', 'AGUS', 'SRI', 'EKO', 'RATNA', 'HENDRA', 'NUR', 'WAHYU', 'DEWI'];
        $lastNames = ['S.', 'K.', 'W.', 'P.', 'R.', 'H.', 'M.', 'L.', 'T.', 'A.'];

        // Ambil secara random atau deterministik berdasarkan angka terakhir nomor rekening
        $lastDigit = (int) substr($request->account_number, -1);
        
        $randomName = $firstNames[$lastDigit] . ' ' . $lastNames[rand(0, 9)];

        return response()->json([
            'message' => 'Rekening Terverifikasi (Sandbox Simulation)',
            'account_name' => $randomName,
            'provider' => $request->provider,
            'account_number' => $request->account_number,
            'note' => 'Ini adalah data simulasi karena API perbankan asli belum diintegrasikan.'
        ]);
    }
}
