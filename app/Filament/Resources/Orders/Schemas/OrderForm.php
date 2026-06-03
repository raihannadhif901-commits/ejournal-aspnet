<?php

namespace App\Filament\Resources\Orders\Schemas;

use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informasi Transaksi')
                    ->components([
                        Grid::make(3)
                            ->components([
                                TextInput::make('order_id')
                                    ->label('ID Pesanan')
                                    ->disabled()
                                    ->required(),
                                TextInput::make('total_price')
                                    ->label('Total Pembayaran')
                                    ->numeric()
                                    ->prefix('Rp')
                                    ->disabled()
                                    ->required(),
                                Select::make('status')
                                    ->label('Status Pembayaran')
                                    ->options([
                                        'pending' => 'Pending',
                                        'paid' => 'Paid',
                                        'failed' => 'Failed',
                                    ])
                                    ->required()
                                    ->native(false),
                            ]),
                    ]),

                Section::make('Informasi Pelanggan')
                    ->components([
                        Grid::make(2)
                            ->components([
                                TextInput::make('customer_name')
                                    ->label('Nama Pelanggan')
                                    ->disabled()
                                    ->required(),
                                TextInput::make('customer_phone')
                                    ->label('Nomor Telepon')
                                    ->disabled()
                                    ->required(),
                            ]),
                        Textarea::make('customer_address')
                            ->label('Alamat Pengiriman')
                            ->disabled()
                            ->required()
                            ->columnSpanFull(),
                    ]),

                Section::make('Barang yang Dibeli')
                    ->components([
                        Repeater::make('items')
                            ->relationship('items')
                            ->label('Daftar Produk')
                            ->schema([
                                TextInput::make('product_name')
                                    ->label('Nama Produk')
                                    ->disabled(),
                                TextInput::make('price')
                                    ->label('Harga Satuan')
                                    ->numeric()
                                    ->prefix('Rp')
                                    ->disabled(),
                                TextInput::make('quantity')
                                    ->label('Jumlah')
                                    ->numeric()
                                    ->disabled(),
                                TextInput::make('total')
                                    ->label('Total Harga')
                                    ->numeric()
                                    ->prefix('Rp')
                                    ->disabled()
                                    ->statePath('quantity')
                                    ->formatStateUsing(fn ($state, $record) => $record ? ($record->price * $record->quantity) : 0),
                            ])
                            ->columns(4)
                            ->disabled()
                            ->addable(false)
                            ->deletable(false)
                            ->reorderable(false)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
