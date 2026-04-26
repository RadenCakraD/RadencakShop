<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Withdrawal;
use App\Models\Order;

class WithdrawalController extends Controller
{
    public function index(Request $request) 
    {
        $user = $request->user();
        $withdrawals = Withdrawal::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        return response()->json($withdrawals);
    }

    public function requestWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'type' => 'required|in:courier,shop',
            'bank_info' => 'required|string'
        ]);

        $user = $request->user();
        $type = $request->type;
        $amount = $request->amount;

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $user, $type, $amount) {
            // Lock user row to prevent concurrent withdrawal requests bypassing balance checks
            \App\Models\User::where('id', $user->id)->lockForUpdate()->first();

            // Check Balance
            $availableBalance = 0;
            
            if ($type === 'courier') {
                $completedPickups = Order::where('pickup_courier_id', $user->id)
                    ->whereIn('status', ['at_logistics', 'delivering', 'delivered', 'completed'])->sum('pickup_fee_earned');
                $completedDeliveries = Order::where('delivery_courier_id', $user->id)
                    ->whereIn('status', ['delivered', 'completed'])->sum('delivery_fee_earned');
                    
                $totalEarned = $completedPickups + $completedDeliveries;
                $totalWithdrawn = Withdrawal::where('user_id', $user->id)->where('type', 'courier')->where('status', '!=', 'rejected')->sum('amount');
                $availableBalance = $totalEarned - $totalWithdrawn;
            } 
            else if ($type === 'shop') {
                if (!$user->shop) return response()->json(['message' => 'Anda tidak memiliki toko'], 400);
                
                $completedOrderIds = Order::where('shop_id', $user->shop->id)
                    ->where('status', 'completed')
                    ->pluck('id');
                    
                $itemsTotal = \App\Models\OrderItem::whereIn('order_id', $completedOrderIds)
                    ->selectRaw('SUM(price * qty) as total')
                    ->value('total') ?? 0;
                    
                // Deduct shop discounts
                $shopDiscounts = 0;
                $completedOrdersWithVoucher = Order::whereIn('id', $completedOrderIds)->whereNotNull('voucher_code')->get();
                foreach ($completedOrdersWithVoucher as $order) {
                    $voucher = \App\Models\Voucher::where('code', $order->voucher_code)->first();
                    if ($voucher && $voucher->shop_id == $user->shop->id) {
                        $shopDiscounts += $order->discount_amount;
                    }
                }
                
                $actualShopEarnings = $itemsTotal - $shopDiscounts;
                    
                $totalWithdrawn = Withdrawal::where('user_id', $user->id)->where('type', 'shop')->where('status', '!=', 'rejected')->sum('amount');
                $availableBalance = $actualShopEarnings - $totalWithdrawn;
            }

            if ($amount > $availableBalance) {
                return response()->json(['message' => 'Saldo tidak mencukupi. Saldo penarikan tersedia: Rp ' . number_format($availableBalance, 0, ',', '.')], 400);
            }

            $w = Withdrawal::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'status' => 'pending',
                'type' => $type,
                'notes' => 'Permintaan penarikan ke ' . $request->bank_info,
            ]);

            return response()->json(['message' => 'Penarikan berhasil diajukan', 'withdrawal' => $w], 201);
        });
    }
}
