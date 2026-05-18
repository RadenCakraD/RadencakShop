<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handleMidtrans(Request $request)
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');
        $hashed = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);

        if ($hashed !== $request->signature_key) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $transactionStatus = $request->transaction_status;
        $orderId = $request->order_id; // PAY-time-random or internal order_id? 
        // Note: CheckoutController uses PAY-time-random for transaction_details but snap_token is shared among orders.
        // We need to find orders by snap_token if order_id is shared, 
        // OR Midtrans payload needs to be unique per order if handled individually.
        
        // In CheckoutController, snap_token is saved to multiple orders.
        // If we want to update all orders related to this payment:
        $orders = Order::where('snap_token', $request->snap_token)->get();
        if ($orders->isEmpty()) {
            // Fallback: search by order_id if it matches Radencak order numbers
            $orders = Order::where('order_number', $orderId)->get();
        }

        foreach ($orders as $order) {
            if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
                $order->update(['status' => 'paid']);
            } else if ($transactionStatus == 'pending') {
                $order->update(['status' => 'pending_payment']);
            } else if ($transactionStatus == 'deny' || $transactionStatus == 'expire' || $transactionStatus == 'cancel') {
                $order->update(['status' => 'failed']);
            }
        }

        return response()->json(['message' => 'Webhook handled']);
    }
}
