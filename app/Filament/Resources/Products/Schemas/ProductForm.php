<?php

namespace App\Filament\Resources\Products\Schemas;

use App\Models\Product;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Product Details')
                    ->components([
                        Grid::make(2)
                            ->components([
                                TextInput::make('name')
                                    ->required()
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn (Set $set, ?string $state) => $set('slug', Str::slug($state))),
                                TextInput::make('slug')
                                    ->disabled()
                                    ->dehydrated()
                                    ->required()
                                    ->unique(Product::class, 'slug', ignoreRecord: true),
                            ]),

                        Grid::make(3)
                            ->components([
                                Select::make('category')
                                    ->options([
                                        'silk' => 'Premium Silk',
                                        'chiffon' => 'Crinkled Chiffon',
                                        'jersey' => 'Luxury Jersey',
                                        'cotton' => 'Soft Cotton',
                                    ])
                                    ->required(),
                                TextInput::make('price')
                                    ->numeric()
                                    ->prefix('Rp')
                                    ->required(),
                                TextInput::make('tag')
                                    ->placeholder('e.g., Best Seller, New In, Sale')
                                    ->nullable(),
                            ]),

                        RichEditor::make('description')
                            ->nullable()
                            ->columnSpanFull(),
                    ]),

                Section::make('Visuals')
                    ->components([
                        TextInput::make('image')
                            ->label('Link/URL Gambar')
                            ->placeholder('https://example.com/gambar.jpg')
                            ->helperText('Masukkan URL gambar eksternal (Google Drive/Cloud) ATAU unggah gambar menggunakan kolom di bawah.')
                            ->required()
                            ->live(),

                        FileUpload::make('uploaded_image')
                            ->label('Upload File Gambar')
                            ->disk('public')
                            ->directory('products')
                            ->image()
                            ->dehydrated(false)
                            ->live()
                            ->afterStateUpdated(function ($state, Set $set) {
                                if ($state) {
                                    $path = is_array($state) ? reset($state) : $state;
                                    $set('image', $path);
                                } else {
                                    $set('image', null);
                                }
                            })
                            ->formatStateUsing(function ($state, $record) {
                                if ($record && $record->image && !Str::startsWith($record->image, ['http://', 'https://'])) {
                                    return $record->image;
                                }
                                return null;
                            }),

                        Toggle::make('is_featured')
                            ->label('Featured di Hero Banner')
                            ->default(false),
                    ]),
            ]);
    }
}
