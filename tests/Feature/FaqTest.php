<?php

it('can view FAQ page', function () {
    $response = $this->get('/faq');

    $response->assertStatus(200);

    // Verify Inertia data is loaded
    $response->assertInertia(fn ($page) => $page
        ->component('Faq')
    );
});
