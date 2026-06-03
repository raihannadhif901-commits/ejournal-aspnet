<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'customer_name',
        'customer_phone',
        'customer_address',
        'total_price',
        'status',
        'snap_token',
    ];

    /**
     * Get the items for the order.
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'order_id');
    }
}
