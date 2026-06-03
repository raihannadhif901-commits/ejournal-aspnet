<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Luna Silk Scarf',
                'category' => 'silk',
                'price' => 289000,
                'image' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop',
                'tag' => 'Best Seller',
                'description' => 'Dibuat dari 100% serat sutra mulberry murni. Draping yang jatuh dengan kilau mewah alami.'
            ],
            [
                'name' => 'Sofia Crinkled Chiffon',
                'category' => 'chiffon',
                'price' => 189000,
                'image' => 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop',
                'tag' => 'New In',
                'description' => 'Chiffon crinkle premium yang super ringan. Ironless, adem, dan sangat praktis untuk hari sibuk Anda.'
            ],
            [
                'name' => 'Aura Premium Jersey',
                'category' => 'jersey',
                'price' => 159000,
                'image' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
                'tag' => 'Daily Choice',
                'description' => 'Jersey modal premium dengan sensasi dingin instan. Meregang sempurna dan tegak seharian.'
            ],
            [
                'name' => 'Linen Cotton Voile',
                'category' => 'cotton',
                'price' => 199000,
                'image' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop',
                'tag' => 'Essential',
                'description' => 'Perpaduan serat linen organik dan katun voile halus. Sangat sejuk di iklim tropis.'
            ],
            [
                'name' => 'Zahra Pleated Satin',
                'category' => 'silk',
                'price' => 299000,
                'image' => 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=600&auto=format&fit=crop',
                'tag' => 'Limited',
                'description' => 'Satin dengan lipatan mikro presisi tinggi yang memberikan efek kilau butik berkelas.'
            ],
            [
                'name' => 'Medina Silk Chiffon',
                'category' => 'chiffon',
                'price' => 249000,
                'image' => 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?q=80&w=600&auto=format&fit=crop',
                'tag' => 'Popular',
                'description' => 'Campuran lembut sutra dan chiffon premium. Memeluk kontur wajah dengan anggun.'
            ]
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(
                ['slug' => Str::slug($p['name'])],
                [
                    'name' => $p['name'],
                    'category' => $p['category'],
                    'price' => $p['price'],
                    'image' => $p['image'],
                    'colors' => null, // Explicitly clear any colors field
                    'tag' => $p['tag'],
                    'description' => $p['description'],
                    'is_featured' => ($p['name'] === 'Luna Silk Scarf'),
                ]
            );
        }
    }
}
