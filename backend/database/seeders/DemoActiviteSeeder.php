<?php

namespace Database\Seeders;

use App\Models\Avis;
use App\Models\CommentairePublication;
use App\Models\Facture;
use App\Models\Membre;
use App\Models\Paiement;
use App\Models\ProfilProfessionnel;
use App\Models\Publication;
use App\Models\RapportPrestation;
use App\Models\Reservation;
use App\Models\User;
use App\Services\CodeListService;
use Carbon\Carbon;
use Database\Seeders\Concerns\TirageAleatoire;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Données de démonstration pour la soutenance :
 *  1. corrections des données de test (biographies, doubles paiements, positions GPS) ;
 *  2. 12 mois d'activité réaliste pour Moussa et 4 autres prestataires
 *     (réservations, paiements, factures, rapports signés, avis) -> beaux tableaux de bord ;
 *  3. un fil d'actualité vivant : publications sur 12 mois, avec photos et commentaires.
 *
 * Lancement :  php artisan db:seed --class=DemoActiviteSeeder
 * Relançable : l'activité n'est générée qu'une seule fois.
 */
class DemoActiviteSeeder extends Seeder
{
    use TirageAleatoire;

    private const MOIS = 12;

    /** Heures de rendez-vous, avec leur poids (beaucoup le matin, un pic en fin d'après-midi). */
    private const HEURES = ['08:00' => 10, '09:00' => 18, '10:00' => 20, '11:00' => 12, '14:00' => 8, '15:00' => 12, '16:00' => 12, '17:00' => 8];

    /** Jours de la semaine (1 = lundi ... 7 = dimanche) : le samedi est le plus chargé. */
    private const JOURS = [1 => 13, 2 => 13, 3 => 14, 4 => 14, 5 => 12, 6 => 26, 7 => 8];

    /** Saisonnalité (mois => coefficient) : Tabaski (mai-juin), rentrée, fêtes de fin d'année. */
    private const SAISON = [1 => 0.9, 2 => 0.9, 3 => 1.0, 4 => 1.0, 5 => 1.3, 6 => 1.35, 7 => 1.1, 8 => 0.85, 9 => 1.15, 10 => 1.05, 11 => 1.1, 12 => 1.35];

    private const MOTIFS = [
        'Empêchement de dernière minute',
        "J'ai trouvé une autre solution",
        'Changement de date de la cérémonie',
        'Voyage imprévu',
    ];

    private const COMMENTAIRES = [
        5 => [
            'Travail impeccable, ponctuel et très professionnel. Je recommande vivement !',
            'Excellent ! Le résultat a dépassé mes attentes. Merci beaucoup.',
            'Très satisfaite, travail propre et prix correct. Je ferai à nouveau appel à ce prestataire.',
            "Sérieux, rapide et à l'écoute. Rien à redire.",
        ],
        4 => [
            "Bon travail dans l'ensemble, juste un petit retard à l'arrivée.",
            'Prestataire compétent et aimable. Résultat très correct.',
            'Satisfait du service, je recommande.',
        ],
        3 => [
            "Travail correct mais il a fallu repasser sur certains détails.",
            "Prestation moyenne, le délai annoncé n'a pas été respecté.",
        ],
        2 => ["Déçu du résultat, le travail n'était pas très soigné."],
    ];

    private const TITRES = [
        'Nouvelle réalisation : %s',
        'Avant / après : %s',
        '%s terminé(e) aujourd\'hui',
        'Encore un client satisfait : %s',
        'Chantier du jour : %s',
        'Retour en images : %s',
    ];

    private const ACCROCHES = [
        'Travail soigné et dans les délais. Contactez-moi pour un devis !',
        'Merci à ma cliente pour sa confiance. Disponible cette semaine pour de nouveaux projets.',
        'Matériel de qualité et finitions propres. Je me déplace dans toute la ville.',
        'Intervention rapide, client satisfait. Réservez directement sur mon profil.',
        'Encore un beau projet terminé. N\'hésitez pas à m\'écrire pour toute question.',
    ];

    private const COMMENTAIRES_PUB = [
        'Magnifique travail !', 'Très propre, bravo.', 'Vous intervenez à Pikine ?',
        'Quel est votre tarif pour ce type de travail ?', 'J\'ai fait appel à vous le mois dernier, toujours aussi satisfait.',
        'Superbe résultat, je vous contacte bientôt.', 'Est-ce que vous êtes disponible ce week-end ?',
        'Le rendu est vraiment top.', 'Vous faites aussi des devis gratuits ?',
    ];

    private const REPONSES_PUB = [
        'Merci beaucoup !', 'Oui, n\'hésitez pas à me contacter par la messagerie.',
        'Merci pour votre confiance.', 'Oui, je me déplace dans toute la ville. Réservez directement sur mon profil.',
    ];

    private Collection $clients;
    private array $ids = [];

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        DB::disableQueryLog();

        $this->chargerCodes();
        $this->corrigerBiographies();
        $this->corrigerDoublesPaiements();
        $this->completerPositions();

        $moussa = User::where('email', 'prestataire@jefnet.test')->first()?->membre?->profilProfessionnel;
        if (! $moussa) {
            $this->command->error('Compte de démo prestataire@jefnet.test introuvable.');
            return;
        }

        $actif = $this->codeLists->idOf('StatutCompte', 'ACTIF');
        $this->clients = Membre::with('user')
            ->whereHas('user', fn ($q) => $q->where('statut_compte_id', $actif))
            ->get();

        $this->publications($moussa);

        // Relançable : si l'activité ancienne existe déjà, on ne recrée rien
        if (Reservation::where('profil_professionnel_id', $moussa->id)->where('date_prevue', '<', now()->subDays(60))->exists()) {
            $this->command->warn("L'activité de démonstration existe déjà : rien à générer.");
            return;
        }

        $prestataires = collect([$moussa])->merge($this->autresPrestataires($moussa));

        DB::transaction(function () use ($prestataires, $moussa) {
            foreach ($prestataires as $profil) {
                $profil->load(['services' => fn ($q) => $q->where('est_actif', true), 'services.domaine', 'membre.user']);
                if ($profil->services->isEmpty()) {
                    continue;
                }

                $estMoussa = $profil->id === $moussa->id;
                $total     = $this->genererActivite($profil, $estMoussa ? 1.0 : 0.45, $estMoussa);

                $this->command->info("  {$profil->membre->user->prenom} {$profil->membre->user->nom} ({$profil->titre_professionnel}) : {$total} réservations");
            }
        });

        $prestataires->each(fn ($p) => $p->fresh()->recalculerNoteMoyenne());

        $this->command->info('Activité de démonstration générée sur ' . self::MOIS . ' mois.');
    }

    /* =================================================================
     |  1. CORRECTIONS DES DONNÉES DE TEST
     * ================================================================= */

    /** Une biographie qui ne correspond pas au métier (ex. "Maquilleuse" pour un électricien) est réécrite. */
    private function corrigerBiographies(): void
    {
        $corrigees = 0;

        foreach (ProfilProfessionnel::all() as $profil) {
            $metier = Str::lower(Str::ascii(explode(' ', (string) $profil->titre_professionnel)[0]));
            $bio    = Str::lower(Str::ascii((string) $profil->biographie));

            if ($metier !== '' && ! Str::contains($bio, Str::substr($metier, 0, 6))) {
                $profil->timestamps = false;
                $experience = $profil->experience ?: 'plusieurs années d\'expérience';
                $profil->biographie = "{$profil->titre_professionnel} passionné(e), {$experience}. "
                    . 'Travail soigné, ponctuel et à l\'écoute des clients.';
                $profil->save();
                $corrigees++;
            }
        }

        $this->command->info("Biographies corrigées : {$corrigees}");
    }

    /** Une réservation ne doit avoir qu'un seul paiement PAYEE : les doublons (et leurs factures) sont retirés. */
    private function corrigerDoublesPaiements(): void
    {
        $payee  = $this->ids['paiement']['PAYEE'];
        $retirs = 0;

        $doublons = Paiement::select('reservation_id')
            ->where('statut_id', $payee)
            ->groupBy('reservation_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('reservation_id');

        foreach ($doublons as $reservationId) {
            $enTrop = Paiement::where('reservation_id', $reservationId)
                ->where('statut_id', $payee)
                ->orderBy('date_paiement')
                ->orderBy('id')
                ->get()
                ->slice(1);                                        // on garde le premier

            foreach ($enTrop as $paiement) {
                Facture::where('paiement_id', $paiement->id)->delete();
                $paiement->delete();
                $retirs++;
            }
        }

        $this->command->info("Paiements en double retirés : {$retirs}");
    }

    /** Les prestataires sans position reçoivent celle de leur quartier (à quelques centaines de mètres près). */
    private function completerPositions(): void
    {
        $completes = 0;

        foreach (ProfilProfessionnel::with('membre')->whereNull('latitude')->get() as $profil) {
            [$lat, $lng] = SenegalData::COORDONNEES[$profil->membre?->localite] ?? SenegalData::COORDONNEES['Médina'];

            $profil->timestamps = false;
            $profil->forceFill([
                'latitude'        => round($lat + fake()->randomFloat(5, -0.006, 0.006), 6),
                'longitude'       => round($lng + fake()->randomFloat(5, -0.006, 0.006), 6),
                'position_maj_le' => now()->subDays(fake()->numberBetween(1, 30)),
            ])->save();
            $completes++;
        }

        $this->command->info("Positions GPS ajoutées : {$completes}");
    }

    /* =================================================================
     |  2. ACTIVITÉ SUR 12 MOIS
     * ================================================================= */

    /** 4 prestataires de domaines différents (en priorité certifiés et à Dakar). */
    private function autresPrestataires(ProfilProfessionnel $moussa): Collection
    {
        $certifie = $this->codeLists->idOf('StatutProfil', 'CERTIFIE');

        return ProfilProfessionnel::with(['membre', 'services'])
            ->where('id', '!=', $moussa->id)
            ->whereHas('services', fn ($q) => $q->where('est_actif', true))
            ->get()
            ->sortByDesc(fn ($p) => ($p->statut_certification_id === $certifie ? 2 : 0) + ($p->membre?->ville === 'Dakar' ? 1 : 0))
            ->unique(fn ($p) => $p->services->first()?->domaine_id)   // un domaine différent chacun
            ->take(4)
            ->values();
    }

    private function genererActivite(ProfilProfessionnel $profil, float $echelle, bool $estMoussa): int
    {
        $total = 0;

        // Mois passés : de -12 à 0 (le mois en cours jusqu'à hier)
        for ($m = self::MOIS; $m >= 0; $m--) {
            $mois       = now()->startOfMonth()->subMonths($m);
            $progres    = (self::MOIS - $m) / self::MOIS;               // 0 au début, 1 à la fin : croissance
            $volume     = (int) round((6 + 12 * $progres) * self::SAISON[$mois->month] * $echelle);
            $reactivite = (int) round(20 - 16 * $progres);              // délai de confirmation qui s'améliore

            for ($i = 0; $i < $volume; $i++) {
                $jour = $this->jourDansLeMois($mois);
                if ($jour->gte(now()->startOfDay())) {
                    continue;                                            // le futur est géré plus bas
                }

                $statut = $this->tirage(['TERMINEE' => 80, 'ANNULEE' => 11, 'REFUSEE' => 9]);
                $this->creerReservation($profil, $jour, $statut, $reactivite, $estMoussa);
                $total++;
            }
        }

        // Réservations à venir (pour "À faire" et l'emploi du temps)
        $avenir = $estMoussa ? 6 : 2;
        for ($i = 0; $i < $avenir; $i++) {
            $jour = now()->addDays(fake()->numberBetween(1, 14))->startOfDay();
            $this->creerReservation($profil, $jour, $this->tirage(['CONFIRMEE' => 60, 'EN_ATTENTE' => 40]), 4, $estMoussa);
            $total++;
        }

        return $total;
    }

    private function creerReservation(ProfilProfessionnel $profil, Carbon $jour, string $statut, int $reactivite, bool $estMoussa): void
    {
        $client   = $this->clients->where('id', '!=', $profil->membre_id)->random();
        $heure    = $this->tirage(self::HEURES);
        $creation = $jour->copy()->subDays(fake()->numberBetween(1, 6))->setTime(fake()->numberBetween(7, 22), fake()->numberBetween(0, 59));
        if ($creation->gt(now())) {
            $creation = now()->subHours(fake()->numberBetween(1, 12));
        }

        $confirmee  = in_array($statut, ['CONFIRMEE', 'TERMINEE'], true);
        $dateConfirm = $confirmee ? $creation->copy()->addMinutes(fake()->numberBetween(20, max(60, $reactivite * 60))) : null;
        if ($dateConfirm && $dateConfirm->gt(now())) {
            $dateConfirm = now();
        }
        $annulee    = $statut === 'ANNULEE';

        $reservation = new Reservation([
            'membre_id'               => $client->id,
            'profil_professionnel_id' => $profil->id,
            'date_prevue'             => $jour->toDateString(),
            'heure_prevue'            => $heure,
            'adresse_intervention'    => fake()->numberBetween(1, 250) . ', ' . $client->localite . ', ' . $client->ville,
            'prix_final'              => 0,
            'statut_id'               => $this->ids['reservation'][$statut],
            'date_confirmation'       => $dateConfirm,
            'date_annulation'         => $annulee ? $creation->copy()->addHours(fake()->numberBetween(2, 48)) : null,
            'raison_annulation'       => $annulee ? fake()->randomElement(self::MOTIFS) : null,
        ]);
        $this->dater($reservation, $creation);

        $services = $profil->services->random(min(fake()->numberBetween(1, 2), $profil->services->count()));
        foreach ($services as $service) {
            $detail = $reservation->details()->make([
                'service_id'   => $service->id,
                'prix_service' => $service->prix,
            ]);
            $this->dater($detail, $creation);
        }

        $reservation->timestamps = false;
        $reservation->prix_final = $reservation->calculerPrixTotal();
        $reservation->save();

        if ($statut === 'TERMINEE') {
            $fin = $jour->copy()->setTimeFromTimeString($heure)->addHours(fake()->numberBetween(1, 4));
            $this->payer($reservation, $fin);
            $signee = $this->rapport($reservation, $profil, $client, $services->first()->domaine->libelle, $fin);
            if ($signee && fake()->boolean(72)) {
                $this->avis($reservation, $signee, $estMoussa);
            }
        }
    }

    private function payer(Reservation $reservation, Carbon $fin): void
    {
        $mode = $this->tirage(['MOBILE_MONEY' => 62, 'ESPECES' => 20, 'CARTE' => 12, 'VIREMENT' => 6]);

        // 5 % des paiements mobiles échouent d'abord, puis réussissent
        if ($mode === 'MOBILE_MONEY' && fake()->boolean(5)) {
            $this->creerPaiement($reservation, 'ECHOUE', $mode, $fin->copy()->addMinutes(5));
            $fin = $fin->copy()->addMinutes(fake()->numberBetween(10, 60));
        }

        $paiement = $this->creerPaiement($reservation, 'PAYEE', $mode, $fin->copy()->addMinutes(fake()->numberBetween(5, 90)));

        $facture = new Facture([
            'paiement_id'    => $paiement->id,
            'numero_facture' => Facture::prochainNumero($paiement->date_paiement->year),
            'date_emission'  => $paiement->date_paiement->toDateString(),
            'montant'        => $paiement->montant,
            'fichier_pdf'    => null,                              // généré à la demande par l'application
        ]);
        $this->dater($facture, $paiement->date_paiement);
    }

    private function creerPaiement(Reservation $reservation, string $statut, string $mode, Carbon $date): Paiement
    {
        $prefixe = match ($mode) {
            'MOBILE_MONEY' => fake()->randomElement(['WAVE', 'OM', 'FREE']),
            'CARTE'        => 'CARTE',
            'ESPECES'      => 'CASH',
            default        => 'VIR',
        };

        $paiement = new Paiement([
            'reservation_id'        => $reservation->id,
            'montant'               => $reservation->prix_final,
            'mode_id'               => $this->ids['mode'][$mode],
            'statut_id'             => $this->ids['paiement'][$statut],
            'reference_transaction' => $prefixe . '-' . $date->format('ymd') . '-' . strtoupper(Str::random(6)),
            'date_paiement'         => $statut === 'PAYEE' ? $date : null,
        ]);
        $this->dater($paiement, $date);

        return $paiement;
    }

    /** Rapport signé par les deux (90 %) ou en attente de la signature du client. Retourne la date de signature du client. */
    private function rapport(Reservation $reservation, ProfilProfessionnel $profil, Membre $client, string $domaine, Carbon $fin): ?Carbon
    {
        $signe     = fake()->boolean(90);
        $sigPresta = $fin->copy()->addMinutes(fake()->numberBetween(5, 40));
        $sigClient = $signe ? $sigPresta->copy()->addMinutes(fake()->numberBetween(5, 240)) : null;

        $this->assurerSignature($profil->membre);
        if ($signe) {
            $this->assurerSignature($client);
        }

        $rapport = new RapportPrestation([
            'reservation_id'             => $reservation->id,
            'description_prestation'     => SenegalData::descriptionRapport($domaine),
            'observations'               => $signe ? fake()->randomElement(SenegalData::OBSERVATIONS_CLIENT) : null,
            'photos_avant'               => null,
            'photos_apres'               => null,
            'date_signature_prestataire' => $sigPresta,
            'date_signature_client'      => $sigClient,
            'statut_rapport_id'          => $this->ids['rapport'][$signe ? 'SIGNE' : 'EN_ATTENTE_SIGNATURE'],
            'fichier_pdf'                => null,
        ]);
        $rapport->timestamps = false;
        $rapport->created_at = $fin;
        $rapport->updated_at = $sigClient ?? $sigPresta;
        $rapport->save();

        return $sigClient;
    }

    private function avis(Reservation $reservation, Carbon $apres, bool $estMoussa): void
    {
        $note = (int) ($estMoussa
            ? $this->tirage(['5' => 62, '4' => 30, '3' => 8])
            : $this->tirage(['5' => 45, '4' => 35, '3' => 14, '2' => 6]));

        $avis = new Avis([
            'reservation_id' => $reservation->id,
            'note'           => $note,
            'commentaire'    => fake()->boolean(80) ? fake()->randomElement(self::COMMENTAIRES[$note]) : null,
        ]);
        $date = $apres->copy()->addHours(fake()->numberBetween(1, 72));
        $this->dater($avis, $date->gt(now()) ? now()->subMinutes(5) : $date);
    }

    /* =================================================================
     |  3. FIL D'ACTUALITÉ : PUBLICATIONS SUR 12 MOIS
     * ================================================================= */

    /**
     * Photos : si le dossier storage/app/public/demo/{domaine}/ contient des images
     * (ex. demo/plomberie/1.jpg), elles sont utilisées ; sinon, l'image du domaine.
     */
    private function publications(ProfilProfessionnel $moussa): void
    {
        if (Publication::where('date_publication', '<', now()->subDays(90))->exists()) {
            $this->command->warn('Les publications de démonstration existent déjà : rien à générer.');
            return;
        }

        $image = $this->codeLists->idOf('TypeMedia', 'IMAGE');
        $total = 0;

        $profils = ProfilProfessionnel::with(['services' => fn ($q) => $q->where('est_actif', true), 'services.domaine', 'membre.user'])->get();

        DB::transaction(function () use ($profils, $moussa, $image, &$total) {
            foreach ($profils as $profil) {
                if ($profil->services->isEmpty()) {
                    continue;
                }

                $domaine = $profil->services->first()->domaine->libelle;
                $photos  = $this->photosDuDomaine($domaine);
                $nombre  = $profil->id === $moussa->id ? 10 : fake()->numberBetween(2, 7);

                for ($i = 0; $i < $nombre; $i++) {
                    $service = $profil->services->random()->nom;
                    $date    = Carbon::instance(fake()->dateTimeBetween('-' . self::MOIS . ' months', '-3 days'));

                    $publication = new Publication([
                        'profil_professionnel_id' => $profil->id,
                        'titre'                   => sprintf(fake()->randomElement(self::TITRES), $service),
                        'description'             => "{$service} réalisé(e) à {$profil->membre->localite}. " . fake()->randomElement(self::ACCROCHES),
                        'date_publication'        => $date,
                        'est_active'              => fake()->boolean(95),
                    ]);
                    $this->dater($publication, $date);

                    // 1 à 3 photos
                    if ($photos) {
                        foreach (array_values(fake()->randomElements($photos, min(count($photos), fake()->numberBetween(1, 3)))) as $ordre => $url) {
                            $publication->medias()->create(['type_id' => $image, 'url' => $url, 'ordre' => $ordre + 1]);
                        }
                    }

                    $this->commenterPublication($publication, $profil, $date);
                    $total++;
                }
            }
        });

        $this->command->info("Publications de démonstration : {$total}");
    }

    private function photosDuDomaine(string $domaine): array
    {
        $slug    = Str::slug(explode(' ', $domaine)[0]);
        $dossier = "demo/{$slug}";

        $photos = collect(Storage::disk('public')->files($dossier))
            ->filter(fn ($f) => preg_match('/\.(jpe?g|png|webp)$/i', $f))
            ->values()
            ->all();

        if ($photos) {
            return $photos;
        }

        $parDefaut = "domaines/{$slug}.jpg";

        return Storage::disk('public')->exists($parDefaut) ? [$parDefaut] : [];
    }

    private function commenterPublication(Publication $publication, ProfilProfessionnel $profil, Carbon $datePublication): void
    {
        $auteurs = $this->clients->where('id', '!=', $profil->membre_id)->random(fake()->numberBetween(0, 5));

        foreach ($auteurs as $auteur) {
            $date = Carbon::instance(fake()->dateTimeBetween($datePublication, 'now'));
            $commentaire = $this->creerCommentaire($publication->id, $auteur->id, null, fake()->randomElement(self::COMMENTAIRES_PUB), $date);

            // Le prestataire répond une fois sur deux
            if (fake()->boolean(50)) {
                $this->creerCommentaire($publication->id, $profil->membre_id, $commentaire->id,
                    fake()->randomElement(self::REPONSES_PUB), Carbon::instance(fake()->dateTimeBetween($date, 'now')));
            }
        }
    }

    private function creerCommentaire(int $publicationId, int $membreId, ?int $parentId, string $contenu, Carbon $date): CommentairePublication
    {
        $commentaire = new CommentairePublication([
            'publication_id' => $publicationId,
            'membre_id'      => $membreId,
            'parent_id'      => $parentId,
            'contenu'        => $contenu,
        ]);
        $this->dater($commentaire, $date);

        return $commentaire;
    }

    /* =================================================================
     |  OUTILS
     * ================================================================= */

    private function chargerCodes(): void
    {
        foreach (['TERMINEE', 'ANNULEE', 'REFUSEE', 'CONFIRMEE', 'EN_ATTENTE'] as $v) {
            $this->ids['reservation'][$v] = $this->codeLists->idOf('StatutReservation', $v);
        }
        foreach (['PAYEE', 'ECHOUE'] as $v) {
            $this->ids['paiement'][$v] = $this->codeLists->idOf('StatutPaiement', $v);
        }
        foreach (['MOBILE_MONEY', 'ESPECES', 'CARTE', 'VIREMENT'] as $v) {
            $this->ids['mode'][$v] = $this->codeLists->idOf('ModePaiement', $v);
        }
        foreach (['SIGNE', 'EN_ATTENTE_SIGNATURE'] as $v) {
            $this->ids['rapport'][$v] = $this->codeLists->idOf('StatutRapport', $v);
        }
    }

    /** Un jour du mois, avec plus de chances le samedi. */
    private function jourDansLeMois(Carbon $mois): Carbon
    {
        for ($essai = 0; $essai < 20; $essai++) {
            $jour = $mois->copy()->addDays(fake()->numberBetween(0, $mois->daysInMonth - 1));
            if (fake()->numberBetween(1, 26) <= self::JOURS[$jour->dayOfWeekIso]) {
                return $jour->startOfDay();
            }
        }

        return $mois->copy()->addDays(fake()->numberBetween(0, $mois->daysInMonth - 1))->startOfDay();
    }

    private function assurerSignature(Membre $membre): void
    {
        if (! $membre->signature_electronique) {
            $membre->timestamps = false;
            $membre->signature_electronique = 'signatures/signature-' . Str::slug((string) $membre->user?->nom) . '.png';
            $membre->save();
        }
    }

    private function dater($modele, Carbon $date): void
    {
        $modele->timestamps = false;
        $modele->created_at = $date;
        $modele->updated_at = $date;
        $modele->save();
    }
}
