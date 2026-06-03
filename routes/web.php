<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $products = \App\Models\Product::latest()->get();
    $featuredProduct = \App\Models\Product::where('is_featured', true)->latest()->first();

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'products' => $products,
        'featuredProduct' => $featuredProduct,
    ]);
});

Route::post('/products/{product}/view', function (\App\Models\Product $product) {
    $product->increment('views_count');
    return response()->json(['success' => true]);
})->middleware('throttle:30,1');

Route::post('/products/{product}/add-to-cart', function (\App\Models\Product $product) {
    $product->increment('cart_additions_count');
    return response()->json(['success' => true]);
})->middleware('throttle:30,1');

Route::get('/faq', function () {
    return Inertia::render('Faq');
})->name('faq');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

use App\Http\Controllers\CheckoutController;

Route::post('/checkout', [CheckoutController::class, 'process']);
Route::post('/checkout/webhook', [CheckoutController::class, 'webhook']);

require __DIR__.'/auth.php';
