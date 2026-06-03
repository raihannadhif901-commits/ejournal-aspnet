<?php

namespace App\Filament\Resources\Products\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ProductsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('image')
                    ->label('Foto Produk')
                    ->square(),
                TextColumn::make('name')
                    ->label('Nama Produk')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('category')
                    ->label('Kategori')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'silk' => 'Premium Silk',
                        'chiffon' => 'Crinkled Chiffon',
                        'jersey' => 'Luxury Jersey',
                        'cotton' => 'Soft Cotton',
                        default => $state,
                    })
                    ->color('info')
                    ->sortable(),
                TextColumn::make('price')
                    ->label('Harga')
                    ->money('IDR')
                    ->sortable(),
                TextColumn::make('tag')
                    ->label('Tag')
                    ->badge()
                    ->color('warning')
                    ->placeholder('-'),
                TextColumn::make('views_count')
                    ->label('Dilihat')
                    ->numeric()
                    ->icon('heroicon-o-eye')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('cart_additions_count')
                    ->label('Masuk Keranjang')
                    ->numeric()
                    ->icon('heroicon-o-shopping-bag')
                    ->alignCenter()
                    ->sortable(),
                ToggleColumn::make('is_featured')
                    ->label('Hero Banner')
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Tanggal Dibuat')
                    ->dateTime('d M Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('category')
                    ->label('Kategori')
                    ->options([
                        'silk' => 'Premium Silk',
                        'chiffon' => 'Crinkled Chiffon',
                        'jersey' => 'Luxury Jersey',
                        'cotton' => 'Soft Cotton',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
