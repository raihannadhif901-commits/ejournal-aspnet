<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function __construct()
    {
        // Set Midtrans Configuration
        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
        \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized');
        \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds');

        // Disable SSL certificate verification in local/testing environment for cURL
        if (app()->environment('local', 'testing')) {
            \Midtrans\Config::$curlOptions = [
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_HTTPHEADER => [],
            ];
        }
    }

    public function process(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.name' => 'required|string|max:255',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $orderId = 'YPI-' . time() . '-' . rand(1000, 9999);
        $totalPrice = 0;
        $itemDetails = [];

        foreach ($request->items as $item) {
            $totalPrice += $item['price'] * $item['quantity'];
            $itemDetails[] = [
                'id' => $item['id'],
                'price' => (int) $item['price'],
                'quantity' => (int) $item['quantity'],
                'name' => substr($item['name'], 0, 50), // Midtrans name limit is 50 chars
            ];
        }

        DB::beginTransaction();

        try {
            // Create Order
            $order = Order::create([
                'order_id' => $orderId,
                'customer_name' => $request->name,
                'customer_phone' => $request->phone,
                'customer_address' => $request->address,
                'total_price' => $totalPrice,
                'status' => 'pending',
            ]);

            // Create Order Items
            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $orderId,
                    'product_id' => $item['id'],
                    'product_name' => $item['name'],
                    'price' => (int) $item['price'],
                    'quantity' => (int) $item['quantity'],
                ]);
            }

            // Request Snap Token
            $params = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $totalPrice,
                ],
                'item_details' => $itemDetails,
                'customer_details' => [
                    'first_name' => $request->name,
                    'phone' => $request->phone,
                    'billing_address' => [
                        'first_name' => $request->name,
                        'phone' => $request->phone,
                        'address' => $request->address,
                    ],
                    'shipping_address' => [
                        'first_name' => $request->name,
                        'phone' => $request->phone,
                        'address' => $request->address,
                    ],
                ],
            ];

            $snapToken = \Midtrans\Snap::getSnapToken($params);

            // Save Snap Token
            $order->update(['snap_token' => $snapToken]);

            DB::commit();

            return response()->json([
                'success' => true,
                'snap_token' => $snapToken,
                'order_id' => $orderId,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Midtrans Snap Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses pembayaran. Silakan coba beberapa saat lagi.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function webhook(Request $request)
    {
        $serverKey = config('services.midtrans.server_key');
        $orderId = $request->input('order_id');
        $statusCode = $request->input('status_code');
        $grossAmount = $request->input('gross_amount');
        $requestSignatureKey = $request->input('signature_key');

        // Verify Signature
        // Format signature: sha512(order_id + status_code + gross_amount + ServerKey)
        $signature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        if ($signature !== $requestSignatureKey) {
            Log::warning('Midtrans Webhook: Invalid Signature for Order #' . $orderId);
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $order = Order::where('order_id', $orderId)->first();

        if (!$order) {
            Log::warning('Midtrans Webhook: Order Not Found #' . $orderId);
            return response()->json(['message' => 'Order not found'], 404);
        }

        $transactionStatus = $request->input('transaction_status');
        $type = $request->input('payment_type');
        $fraudStatus = $request->input('fraud_status');

        Log::info("Midtrans Webhook received. Order #{$orderId}. Status: {$transactionStatus}. Payment type: {$type}");

        if ($transactionStatus == 'capture') {
            if ($type == 'credit_card') {
                if ($fraudStatus == 'challenge') {
                    $order->update(['status' => 'challenge']);
                } else {
                    $order->update(['status' => 'paid']);
                }
            }
        } else if ($transactionStatus == 'settlement') {
            $order->update(['status' => 'paid']);
        } else if ($transactionStatus == 'pending') {
            $order->update(['status' => 'pending']);
        } else if ($transactionStatus == 'deny') {
            $order->update(['status' => 'failed']);
        } else if ($transactionStatus == 'expire') {
            $order->update(['status' => 'failed']);
        } else if ($transactionStatus == 'cancel') {
            $order->update(['status' => 'failed']);
        }

        return response()->json(['message' => 'Webhook processed successfully']);
    }
}
