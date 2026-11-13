<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\DiffuseEnDirect;


class CodeList extends Model
{
     use HasFactory, DiffuseEnDirect;
     protected $fillable = ['type', 'value', 'description', 'active'];

     protected $casts = ['active' => 'boolean'];
}
