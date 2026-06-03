<?php

use App\Models\Product;
use App\Models\Order;

it('creates an order in the database and returns a snap token', function () {
    $product = Product::create([
        'name' => 'Luna Silk Scarf',
        'slug' => 'luna-silk-scarf',
        'category' => 'silk',
        'price' => 289000,
        'is_featured' => true,
    ]);

    $response = $this->postJson('/checkout', [
        'name' => 'Fatimah Azzahra',
        'phone' => '081234567890',
        'address' => 'Jl. Kemang Raya No. 42B, Mampang Prapatan, Jakarta Selatan',
        'items' => [
            [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'quantity' => 2,
            ]
        ]
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'snap_token',
        'order_id',
    ]);

    $this->assertDatabaseHas('orders', [
        'customer_name' => 'Fatimah Azzahra',
        'customer_phone' => '081234567890',
        'total_price' => 578000,
        'status' => 'pending',
    ]);

    $this->assertDatabaseHas('order_items', [
        'product_name' => 'Luna Silk Scarf',
        'price' => 289000,
        'quantity' => 2,
    ]);
});

it('processes webhook notification from midtrans and updates order status to paid', function () {
    $order = Order::create([
        'order_id' => 'YPI-TEST-123456',
        'customer_name' => 'Fatimah Azzahra',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Kemang Raya No. 42B',
        'total_price' => 578000,
        'status' => 'pending',
        'snap_token' => 'test-snap-token-123',
    ]);

    $serverKey = config('services.midtrans.server_key');
    $statusCode = '200';
    $grossAmount = '578000';
    $signatureKey = hash('sha512', $order->order_id . $statusCode . $grossAmount . $serverKey);

    $response = $this->postJson('/checkout/webhook', [
        'order_id' => $order->order_id,
        'status_code' => $statusCode,
        'gross_amount' => $grossAmount,
        'signature_key' => $signatureKey,
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
    ]);

    $response->assertStatus(200);
    $response->assertJson(['message' => 'Webhook processed successfully']);

    $order->refresh();
    expect($order->status)->toBe('paid');
});

it('rejects webhook notifications with invalid signature keys', function () {
    $order = Order::create([
        'order_id' => 'YPI-TEST-654321',
        'customer_name' => 'Fatimah Azzahra',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Kemang Raya No. 42B',
        'total_price' => 578000,
        'status' => 'pending',
        'snap_token' => 'test-snap-token-456',
    ]);

    $response = $this->postJson('/checkout/webhook', [
        'order_id' => $order->order_id,
        'status_code' => '200',
        'gross_amount' => '578000',
        'signature_key' => 'invalid-signature-key-goes-here',
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
    ]);

    $response->assertStatus(403);
    $response->assertJson(['message' => 'Invalid signature']);

    $order->refresh();
    expect($order->status)->toBe('pending');
});
