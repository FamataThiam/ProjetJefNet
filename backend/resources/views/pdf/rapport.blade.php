@php
    $prestataire = $reservation->prestataire;
    $presta      = $prestataire->membre;
    $client      = $reservation->client;
    $demande     = $reservation->demande;
    $codeResa    = 'JN-' . strtoupper(substr($reservation->uuid, -8, 4)) . '-' . strtoupper(substr($reservation->uuid, -4));
    $fcfa        = fn ($n) => number_format((float) $n, 0, ',', ' ') . ' FCFA';
    $heureFr     = fn ($d) => $d ? $d->format('d/m/Y') . ' à ' . $d->format('H') . ' h ' . $d->format('i') : '—';
    $mois        = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    $dateLongue  = fn ($d) => $d->format('j') . ' ' . $mois[(int) $d->format('n') - 1] . ' ' . $d->format('Y');
    $dateFait    = $rapport->date_signature_client ?? $rapport->created_at;
    $paiement    = collect($reservation->paiements ?? [])->first(fn ($p) => $p->statut?->value === 'PAYEE');
    $operateurs  = ['WAVE' => ' (Wave)', 'OM' => ' (Orange Money)', 'FREE' => ' (Free Money)'];
    $modes       = ['MOBILE_MONEY' => 'Mobile Money', 'CARTE' => 'Carte bancaire', 'ESPECES' => 'Espèces', 'VIREMENT' => 'Virement'];

    // Chronologie de la prestation
    $chronologie = [
        ['Réservation enregistrée sur JefNet', $reservation->created_at],
        ['Réservation confirmée par le prestataire', $reservation->date_confirmation],
        ['Date prévue de l\'intervention', $reservation->date_prevue],
        ['Rapport rédigé et signé par le prestataire', $rapport->date_signature_prestataire],
        ['Rapport signé par le client', $rapport->date_signature_client],
    ];
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport {{ $rapport->numero() }}</title>
    <style>
        @page { margin: 14mm 17mm 17mm 17mm; }
        * { font-family: DejaVu Serif, serif; }
        body { margin: 0; color: #000; font-size: 9pt; line-height: 1.35; }
        table { width: 100%; border-collapse: collapse; }

        /* En-tête */
        .entete td { vertical-align: top; font-size: 9pt; }
        .organisme { font-size: 13pt; font-weight: bold; letter-spacing: 3px; }
        .petit { font-size: 8.5pt; }
        .reference table td { border: 0.6pt solid #000; padding: 2px 7px; font-size: 8.5pt; }

        /* Titre */
        .titre { text-align: center; margin: 14px 0 2px 0; font-size: 15pt; font-weight: bold; letter-spacing: 2px; }
        .sous-titre { text-align: center; font-size: 9pt; font-style: italic; margin-bottom: 6px; }
        .statut { text-align: center; margin-bottom: 8px; }
        .statut span { border: 0.8pt solid #000; padding: 2px 12px; font-size: 8.5pt; font-weight: bold; letter-spacing: 1.5px; }

        /* Sections */
        h2 { font-size: 9.5pt; font-weight: bold; margin: 10px 0 4px 0; text-transform: uppercase; }
        h3 { font-size: 9pt; font-weight: bold; font-style: italic; margin: 5px 0 3px 0; }
        .texte { text-align: justify; }

        /* Tableaux */
        .grille td { border: 0.6pt solid #000; padding: 2px 7px; vertical-align: top; }
        .grille td.lib { width: 34%; font-weight: bold; }
        .liste th { border: 0.6pt solid #000; padding: 2px 7px; font-size: 9pt; text-align: left; font-weight: bold; }
        .liste td { border: 0.6pt solid #000; padding: 2px 7px; vertical-align: top; }
        .droite { text-align: right; }
        .centre { text-align: center; }

        /* Cases à cocher */
        .case { width: 16px; padding-top: 2px; }
        .boite { display: inline-block; width: 9px; height: 9px; border: 0.8pt solid #000; font-family: DejaVu Sans, sans-serif; font-size: 7.5pt; line-height: 9px; text-align: center; font-weight: bold; }
        .declarations td { padding: 1px 0; vertical-align: top; }

        /* Photos */
        .photos td { width: 50%; text-align: center; vertical-align: top; padding: 0 8px; }
        .photos img { max-width: 220px; max-height: 115px; border: 0.6pt solid #000; }
        .legende { font-size: 8.5pt; font-style: italic; margin-top: 3px; }
        .sans-photo { border: 0.6pt dashed #000; height: 120px; font-size: 8.5pt; font-style: italic; text-align: center; vertical-align: middle; }

        /* Signatures */
        .fait { text-align: right; margin-top: 10px; }
        .signatures { margin-top: 10px; }
        .signatures td { width: 50%; text-align: center; vertical-align: top; }
        .signatures .qualite { font-weight: bold; text-decoration: underline; }
        .signatures img { max-height: 45px; max-width: 180px; margin: 8px 0 4px 0; }
        .signatures .vide { height: 45px; margin: 8px 0 4px 0; }
        .mention { font-size: 8pt; font-style: italic; }

        .encadre { border: 0.6pt solid #000; padding: 5px 9px; font-size: 7.5pt; margin-top: 8px; text-align: justify; }
        .saut { page-break-before: always; }
        .pied { position: fixed; bottom: -10mm; left: 0; right: 0; font-size: 7.5pt; text-align: center; }
        .pied .page:after { content: counter(page); }
    </style>
</head>
<body>

    <div class="pied">
        JefNet · Rapport de prestation N° {{ $rapport->numero() }} · Réservation {{ $codeResa }} · Page <span class="page"></span>
    </div>

    {{-- ======================= PAGE 1 ======================= --}}

    <table class="entete">
        <tr>
            <td style="width: 58%;">
                <div class="organisme">JEFNET</div>
                <div class="petit">Plateforme de mise en relation<br>entre prestataires et clients</div>
                <div class="petit">Dakar – Sénégal</div>
            </td>
            <td class="reference">
                <table>
                    <tr><td><strong>Rapport N°</strong></td><td>{{ $rapport->numero() }}</td></tr>
                    <tr><td><strong>Réservation</strong></td><td>{{ $codeResa }}</td></tr>
                    <tr><td><strong>Rédigé le</strong></td><td>{{ $rapport->created_at->format('d/m/Y') }}</td></tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="titre">RAPPORT DE PRESTATION</div>
    <div class="sous-titre">Compte rendu de fin d'intervention</div>
    <div class="statut">
        <span>{{ $rapport->estSigneParLesDeux() ? 'SIGNÉ PAR LES DEUX PARTIES' : 'EN ATTENTE DE LA SIGNATURE DU CLIENT' }}</span>
    </div>

    {{-- I. Parties --}}
    <h2>I. Identification des parties</h2>
    <table>
        <tr>
            <td style="width: 49%; vertical-align: top;">
                <h3>1. Le prestataire</h3>
                <table class="grille">
                    <tr><td class="lib">Nom</td><td>{{ mb_strtoupper($presta->user->nom) }} {{ $presta->user->prenom }}</td></tr>
                    <tr><td class="lib">Activité</td><td>{{ $prestataire->titre_professionnel }}{{ $prestataire->statutCertification?->value === 'CERTIFIE' ? ' (certifié JefNet)' : '' }}</td></tr>
                    <tr><td class="lib">Localisation</td><td>{{ $presta->localite ? $presta->localite . ', ' : '' }}{{ $presta->ville }}</td></tr>
                    <tr><td class="lib">Téléphone</td><td>{{ $presta->telephone }}</td></tr>
                </table>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 49%; vertical-align: top;">
                <h3>2. Le client</h3>
                <table class="grille">
                    <tr><td class="lib">Nom</td><td>{{ mb_strtoupper($client->user->nom) }} {{ $client->user->prenom }}</td></tr>
                    <tr><td class="lib">Identifiant</td><td>{{ $client->username }}</td></tr>
                    <tr><td class="lib">Téléphone</td><td>{{ $client->telephone }}</td></tr>
                    <tr><td class="lib">Ville</td><td>{{ $client->ville ?? '—' }}</td></tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- II. Objet --}}
    <h2>II. Objet de l'intervention</h2>
    <table class="grille">
        <tr><td class="lib">Origine</td><td>{{ $demande ? 'Demande de service publiée par le client' : 'Réservation directe auprès du prestataire' }}</td></tr>
        @if ($demande)
            <tr><td class="lib">Demande</td><td><strong>{{ $demande->titre }}</strong><br>{{ $demande->description }}</td></tr>
        @endif
        <tr><td class="lib">Lieu d'intervention</td><td>{{ $reservation->adresse_intervention }}</td></tr>
        <tr><td class="lib">Date et heure prévues</td><td>{{ $reservation->date_prevue->format('d/m/Y') }} à {{ str_replace(':', ' h ', substr($reservation->heure_prevue, 0, 5)) }}</td></tr>
    </table>

    {{-- III. Services --}}
    <h2>III. Services réalisés</h2>
    <table class="liste">
        <tr>
            <th class="centre" style="width: 7%;">N°</th>
            <th>Désignation</th>
            <th style="width: 15%;">Unité</th>
            <th class="droite" style="width: 24%;">Montant convenu</th>
        </tr>
        @foreach ($reservation->details as $i => $ligne)
            <tr>
                <td class="centre">{{ $i + 1 }}</td>
                <td>{{ $ligne->service->nom }}</td>
                <td>{{ $ligne->service->unite_tarif }}</td>
                <td class="droite">{{ $fcfa($ligne->prix_service) }}</td>
            </tr>
        @endforeach
        <tr>
            <td colspan="3" class="droite"><strong>Total convenu</strong></td>
            <td class="droite"><strong>{{ $fcfa($reservation->prix_final) }}</strong></td>
        </tr>
    </table>

    {{-- IV. Chronologie --}}
    <h2>IV. Déroulement de la prestation</h2>
    <table class="liste">
        <tr>
            <th class="centre" style="width: 9%;">Étape</th>
            <th>Événement</th>
            <th style="width: 30%;">Date et heure</th>
        </tr>
        @foreach ($chronologie as $i => [$evenement, $date])
            <tr>
                <td class="centre">{{ $i + 1 }}</td>
                <td>{{ $evenement }}</td>
                <td>{{ $i === 2 ? $date->format('d/m/Y') . ' à ' . str_replace(':', ' h ', substr($reservation->heure_prevue, 0, 5)) : $heureFr($date) }}</td>
            </tr>
        @endforeach
    </table>

    {{-- ======================= PAGE 2 ======================= --}}
    <div class="saut"></div>

    {{-- V. Description --}}
    <h2 style="margin-top: 0;">V. Description du travail réalisé</h2>
    <div class="texte">{!! nl2br(e($rapport->description_prestation)) !!}</div>

    {{-- VI. Observations --}}
    <h2>VI. Observations et recommandations du prestataire</h2>
    <div class="texte">
        @if ($rapport->observations)
            {!! nl2br(e($rapport->observations)) !!}
        @else
            <em>Aucune observation particulière.</em>
        @endif
    </div>

    {{-- VII. Photos --}}
    <h2>VII. Photos de l'intervention</h2>
    <table class="photos">
        <tr>
            <td>
                @if ($photoAvant)
                    <img src="{{ $photoAvant }}" alt="Avant">
                @else
                    <table><tr><td class="sans-photo">Aucune photo fournie</td></tr></table>
                @endif
                <div class="legende">Photo 1 : état avant l'intervention</div>
            </td>
            <td>
                @if ($photoApres)
                    <img src="{{ $photoApres }}" alt="Après">
                @else
                    <table><tr><td class="sans-photo">Aucune photo fournie</td></tr></table>
                @endif
                <div class="legende">Photo 2 : état après l'intervention</div>
            </td>
        </tr>
    </table>

    {{-- VIII. Paiement --}}
    <h2>VIII. Situation du paiement</h2>
    <table class="grille">
        <tr><td class="lib">Montant</td><td>{{ $fcfa($reservation->prix_final) }}</td></tr>
        @if ($paiement)
            <tr><td class="lib">Statut</td><td>Payé le {{ $heureFr($paiement->date_paiement) }}</td></tr>
            <tr><td class="lib">Mode de paiement</td><td>{{ $modes[$paiement->mode?->value] ?? $paiement->mode?->value }}{{ $operateurs[\Illuminate\Support\Str::before((string) $paiement->reference_transaction, '-')] ?? '' }}</td></tr>
            <tr><td class="lib">Référence</td><td>{{ $paiement->reference_transaction }}</td></tr>
            <tr><td class="lib">Facture</td><td>{{ $paiement->facture?->numero_facture ?? '—' }}</td></tr>
        @else
            <tr><td class="lib">Statut</td><td>Non payé à la date du rapport</td></tr>
        @endif
    </table>

    {{-- IX. Déclarations --}}
    <h2>IX. Déclarations des parties</h2>
    <table class="declarations">
        <tr>
            <td class="case"><span class="boite">{{ $rapport->date_signature_prestataire ? 'X' : '' }}</span></td>
            <td>Le prestataire déclare avoir réalisé les services décrits ci-dessus, conformément à la réservation et dans les règles de l'art.</td>
        </tr>
        <tr>
            <td class="case"><span class="boite">{{ $rapport->date_signature_client ? 'X' : '' }}</span></td>
            <td>Le client reconnaît que la prestation a été réalisée et accepte le présent rapport sans réserve.</td>
        </tr>
        <tr>
            <td class="case"><span class="boite">{{ $rapport->estSigneParLesDeux() ? 'X' : '' }}</span></td>
            <td>Les deux parties prennent acte que le rapport, une fois signé, ne peut plus être modifié.</td>
        </tr>
    </table>

    {{-- X. Signatures --}}
    <div style="page-break-inside: avoid;">
        <h2>X. Signatures</h2>
        <div class="fait">Fait à Dakar, le {{ $dateLongue($dateFait) }}</div>

        <table class="signatures">
            <tr>
                <td>
                    <div class="qualite">Le prestataire</div>
                    @if ($signaturePrestataire)
                        <img src="{{ $signaturePrestataire }}" alt="Signature du prestataire">
                    @else
                        <div class="vide"></div>
                    @endif
                    <div>{{ $presta->user->prenom }} {{ mb_strtoupper($presta->user->nom) }}</div>
                    <div class="mention">{{ $rapport->date_signature_prestataire ? 'Signé électroniquement le ' . $heureFr($rapport->date_signature_prestataire) : 'Non signé' }}</div>
                </td>
                <td>
                    <div class="qualite">Le client</div>
                    @if ($signatureClient)
                        <img src="{{ $signatureClient }}" alt="Signature du client">
                    @else
                        <div class="vide"></div>
                    @endif
                    <div>{{ $client->user->prenom }} {{ mb_strtoupper($client->user->nom) }}</div>
                    <div class="mention">{{ $rapport->date_signature_client ? 'Signé électroniquement le ' . $heureFr($rapport->date_signature_client) : 'En attente de signature' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="encadre">
        <strong>Valeur du document.</strong> Ce rapport est établi par la plateforme JefNet à partir des informations saisies par le prestataire.
        Les signatures électroniques sont horodatées au moment où chaque partie valide le rapport depuis son compte.
        Pour toute réclamation, le numéro de rapport&nbsp;<strong>{{ $rapport->numero() }}</strong> et la référence de réservation&nbsp;<strong>{{ $codeResa }}</strong> doivent être indiqués.
    </div>

</body>
</html>