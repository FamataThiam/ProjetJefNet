<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProfilComplet
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->estAdministrateur() && ! $user->membre()->exists()) {
            return response()->json([
                'message' => 'Veuillez compléter votre profil pour accéder à cette fonctionnalité.',
                'code'    => 'PROFIL_INCOMPLET',
            ], 403);
        }

        return $next($request);
    }
}