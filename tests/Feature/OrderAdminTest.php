<?php

use App\Models\User;
use App\Models\Order;
use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Resources\Orders\Pages\EditOrder;
use Livewire\Livewire;

it('denies guest users from accessing order list page', function () {
    $response = $this->get(OrderResource::getUrl('index'));
    $response->assertRedirect('/admin/login');
});

it('denies non-admin users from accessing order list page', function () {
    $user = User::factory()->create(['is_admin' => false]);
    $response = $this->actingAs($user)->get(OrderResource::getUrl('index'));
    $response->assertStatus(403);
});

it('allows admin users to view order list page', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $response = $this->actingAs($admin)->get(OrderResource::getUrl('index'));
    $response->assertStatus(200);
});

it('allows admin users to view individual order details', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $order = Order::create([
        'order_id' => 'YPI-TEST-999',
        'customer_name' => 'John Doe',
        'customer_phone' => '0812345678',
        'customer_address' => 'Some address',
        'total_price' => 100000,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($admin)->get(OrderResource::getUrl('edit', ['record' => $order]));
    $response->assertStatus(200);
});

it('allows admin to update order status via form', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $order = Order::create([
        'order_id' => 'YPI-TEST-888',
        'customer_name' => 'John Doe',
        'customer_phone' => '0812345678',
        'customer_address' => 'Some address',
        'total_price' => 100000,
        'status' => 'pending',
    ]);

    Livewire::actingAs($admin)
        ->test(EditOrder::class, [
            'record' => $order->getKey(),
        ])
        ->fillForm([
            'status' => 'paid',
        ])
        ->call('save')
        ->assertHasNoFormErrors();

    $order->refresh();
    expect($order->status)->toBe('paid');
});
