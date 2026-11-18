<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccueilService;
use Illuminate\Http\JsonResponse;

class AccueilController extends Controller
{
    public function __construct(private AccueilService $accueil) {}


    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->accueil->donnees()]);
    }
}