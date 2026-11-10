<?php

namespace App\Support;

final class Geo
{
    /** Rayon moyen de la Terre, en kilomètres. */
    public const RAYON_TERRE_KM = 6371;

    
    public static function distanceSql(string $colonneLat, string $colonneLng): string
    {
        return '(' . self::RAYON_TERRE_KM . " * acos(least(1, greatest(-1,
            cos(radians(?)) * cos(radians({$colonneLat})) * cos(radians({$colonneLng}) - radians(?))
            + sin(radians(?)) * sin(radians({$colonneLat}))
        ))))";
    }

    /**
     * Rectangle autour d'un point, pour un premier filtre rapide (utilise l'index) avant le calcul exact.
     * @return array{0: float, 1: float, 2: float, 3: float} [latMin, latMax, lngMin, lngMax]
     */
    public static function rectangle(float $lat, float $lng, float $rayonKm): array
    {
        $dLat = $rayonKm / 111.0;                                       // 1° de latitude ≈ 111 km
        $dLng = $rayonKm / (111.0 * max(0.1, cos(deg2rad($lat))));     // dépend de la latitude

        return [$lat - $dLat, $lat + $dLat, $lng - $dLng, $lng + $dLng];
    }

    /** Arrondit une coordonnée à ~1 km (2 décimales) pour protéger la vie privée. */
    public static function approximer(?float $coordonnee): ?float
    {
        return $coordonnee === null ? null : round($coordonnee, 2);
    }
}