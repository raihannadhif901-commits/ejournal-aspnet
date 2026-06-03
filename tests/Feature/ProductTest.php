<?php

use App\Models\Product;

it('can view homepage with products and featured product', function () {
    // Create products using Eloquent
    $featured = Product::create([
        'name' => 'Luna Silk Scarf',
        'slug' => 'luna-silk-scarf',
        'category' => 'silk',
        'price' => 289000,
        'image' => 'https://external-cdn.com/image.jpg',
        'is_featured' => true,
    ]);

    $regular = Product::create([
        'name' => 'Sofia Crinkled Chiffon',
        'slug' => 'sofia-crinkled-chiffon',
        'category' => 'chiffon',
        'price' => 189000,
        'image' => 'products/sofia-crinkled-chiffon.jpg',
        'is_featured' => false,
    ]);

    $response = $this->get('/');

    $response->assertStatus(200);

    // Verify Inertia data properties exist
    $response->assertInertia(fn ($page) => $page
        ->component('Welcome')
        ->has('products')
        ->has('featuredProduct')
    );
});

it('increments views count when a product is viewed', function () {
    $product = Product::create([
        'name' => 'Sofia Crinkled Chiffon',
        'slug' => 'sofia-crinkled-chiffon',
        'category' => 'chiffon',
        'price' => 189000,
        'is_featured' => false,
    ]);

    $response = $this->post("/products/{$product->id}/view");

    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    $product->refresh();
    expect($product->views_count)->toBe(1);
});

it('increments cart additions count when a product is added to cart', function () {
    $product = Product::create([
        'name' => 'Sofia Crinkled Chiffon',
        'slug' => 'sofia-crinkled-chiffon',
        'category' => 'chiffon',
        'price' => 189000,
        'is_featured' => false,
    ]);

    $response = $this->post("/products/{$product->id}/add-to-cart");

    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    $product->refresh();
    expect($product->cart_additions_count)->toBe(1);
});
