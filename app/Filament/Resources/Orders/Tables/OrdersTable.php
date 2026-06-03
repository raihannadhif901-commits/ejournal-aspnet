<?php

namespace App\Filament\Resources\Orders\Tables;

use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('order_id')
                    ->label('ID Pesanan')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('customer_name')
                    ->label('Pelanggan')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('customer_phone')
                    ->label('No. Telepon')
                    ->searchable(),
                TextColumn::make('total_price')
                    ->label('Total Belanja')
                    ->money('IDR')
                    ->sortable(),
                TextColumn::make('status')
                    ->label('Status Pembayaran')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'paid' => 'success',
                        'pending' => 'warning',
                        'failed' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Tanggal Pesanan')
                    ->dateTime('d M Y H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status Pembayaran')
                    ->options([
                        'pending' => 'Pending',
                        'paid' => 'Paid',
                        'failed' => 'Failed',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                // We keep it empty to prevent bulk deletion of orders
            ]);
    }
}
