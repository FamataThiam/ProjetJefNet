<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;


class EstAdministrateur
{
    public function handle(Request $request, Closure $next, string ...$niveaux): Response
    {
        $admin = $request->user()?->administrateur()->with('niveauAcces')->first();

        if (! $admin) {
            return response()->json([
                'message' => 'Accès réservé aux administrateurs.',
                'code'    => 'NON_ADMINISTRATEUR',
            ], 403);
        }

        $niveau = $admin->niveauAcces?->value;

        if ($niveaux && ! in_array($niveau, $niveaux, true)) {
            return response()->json([
                'message' => "Votre niveau d'accès ({$niveau}) ne permet pas cette action.",
                'code'    => 'NIVEAU_INSUFFISANT',
            ], 403);
        }

  
        $request->attributes->set('administrateur', $admin);

        return $next($request);
    }
}