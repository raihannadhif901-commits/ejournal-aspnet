<?php

use App\Models\User;

it('redirects guest users attempting to access admin dashboard to login page', function () {
    $response = $this->get('/admin');

    // Filament redirects guests to panel login page (usually /admin/login)
    $response->assertRedirect('/admin/login');
});

it('denies access to non-admin logged-in users', function () {
    $user = User::factory()->create([
        'is_admin' => false,
    ]);

    $response = $this->actingAs($user)->get('/admin');

    // When canAccessPanel returns false, Filament throws 403 Forbidden
    $response->assertStatus(403);
});

it('allows access to admin users', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
    ]);

    $response = $this->actingAs($admin)->get('/admin');

    $response->assertStatus(200);
});
