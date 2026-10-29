<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CodeList extends Model
{
     protected $fillable = ['type', 'value', 'description', 'active'];

     protected $casts = ['active' => 'boolean'];
}
