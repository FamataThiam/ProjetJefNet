@php
    $prestataire = $reservation->prestataire;
    $presta      = $prestataire->membre;
    $client      = $reservation->client;
    $fcfa        = fn ($n) => number_format((float) $n, 0, ',', ' ');
    $codeResa    = 'JN-' . strtoupper(substr($reservation->uuid, -8, 4)) . '-' . strtoupper(substr($reservation->uuid, -4));
    $certifie    = $prestataire->statutCertification?->value === 'CERTIFIE';
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $facture->numero_facture }}</title>
    <style>
        @page { margin: 16mm 18mm 14mm 18mm; }
        * { font-family: DejaVu Sans, sans-serif; }
        body { margin: 0; color: #1a1f24; font-size: 9.5pt; line-height: 1.4; }
        table { width: 100%; border-collapse: collapse; }
        .bleu { color: #0174AB; }
        .gris { color: #5b6670; }

        /* En-tête */
        .logo { width: 40px; height: 40px; padding: 0; background: #0174AB; color: #fff; font-size: 22px; font-weight: bold; text-align: center; vertical-align: middle; border-radius: 9px; }
        .marque { font-size: 18pt; font-weight: bold; color: #0174AB; line-height: 1.1; }
        .petit { font-size: 8pt; color: #5b6670; }
        .titre { text-align: right; font-size: 22pt; font-weight: bold; letter-spacing: 2px; color: #0174AB; line-height: 1.1; }
        .bande { height: 4px; background: #0174AB; margin: 10px 0 14px 0; }

        /* Blocs Émetteur / Client / Prestataire */
        .blocs td.bloc { width: 32%; border: 1px solid #d5dde3; padding: 8px 10px; vertical-align: top; font-size: 9pt; }
        .blocs td.espace { width: 2%; }
        .etiquette { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #0174AB; letter-spacing: 0.4px; margin-bottom: 3px; }
        .nom { font-size: 10pt; font-weight: bold; }

        /* Bande d'infos */
        .infos { background: #f4f8fb; border: 1px solid #d5dde3; margin: 12px 0; }
        .infos td { padding: 7px 10px; width: 25%; vertical-align: top; font-size: 9pt; }
        .infos .lib { display: block; font-size: 7.5pt; color: #5b6670; }

        /* Lignes */
        .lignes th { background: #0174AB; color: #fff; text-align: left; padding: 7px 8px; font-size: 8.5pt; }
        .lignes td { padding: 8px; border-bottom: 1px solid #d5dde3; vertical-align: top; }
        .num { text-align: right; white-space: nowrap; }

        /* Bas : règlement + totaux */
        .bas { margin-top: 14px; }
        .bas td.cellule { vertical-align: top; }
        .reglement { border: 1px solid #d5dde3; padding: 9px 11px; position: relative; }
        .reglement table td { padding: 2px 0; font-size: 9pt; }
        .reglement table td.gris { white-space: nowrap; padding-right: 8px; }
        .tampon { position: absolute; right: 12px; top: -14px; background: #fff; border: 3px solid #17863f; color: #17863f; font-weight: bold; font-size: 13pt; padding: 1px 10px; letter-spacing: 2px; transform: rotate(-12deg); }
        .totaux td { padding: 5px 9px; border-bottom: 1px solid #d5dde3; }
        .totaux tr.final td { background: #0174AB; color: #fff; font-weight: bold; font-size: 11pt; border: none; }
        .lettres { font-size: 8.5pt; color: #5b6670; font-style: italic; margin-top: 7px; }

        .mentions { margin-top: 16px; border-top: 1px dashed #d5dde3; padding-top: 7px; font-size: 8pt; color: #5b6670; }
        .mentions p { margin: 0 0 3px 0; }
        .merci { text-align: center; margin-top: 14px; color: #0174AB; font-weight: bold; }

        .pied { position: fixed; bottom: -6mm; left: 0; right: 0; border-top: 1px solid #1a1f24; padding-top: 4px; font-size: 8pt; color: #5b6670; }
    </style>
</head>
<body>

    {{-- Pied de page (répété sur chaque page) --}}
    <div class="pied">
        <table><tr>
            <td>Facture N° {{ $facture->numero_facture }} · JefNet</td>
            <td style="text-align:right;">Réservation {{ $codeResa }}</td>
        </tr></table>
    </div>

    {{-- En-tête --}}
    <table>
        <tr>
            <td style="width: 48px; vertical-align: middle;">
                <table style="width: 40px;"><tr>
                    <td class="logo">J</td>
                </tr></table>
            </td>
            <td style="vertical-align: middle; padding-left: 8px;">
                <div class="marque">JefNet</div>
                <div class="petit">Plateforme de mise en relation clients – prestataires</div>
                <div class="petit">Dakar, Sénégal · contact@jefnet.sn</div>
            </td>
            <td style="vertical-align: top;">
                <div class="titre">FACTURE</div>
                <div style="text-align:right; font-size:10.5pt; font-weight:bold;">N° {{ $facture->numero_facture }}</div>
                <div style="text-align:right;" class="petit">Émise le {{ $facture->date_emission->format('d/m/Y') }}</div>
            </td>
        </tr>
    </table>
    <div class="bande"></div>

    {{-- Émetteur / Facturé à / Prestataire --}}
    <table class="blocs">
        <tr>
            <td class="bloc">
                <div class="etiquette">Émetteur</div>
                <div class="nom">JefNet</div>
                <span class="gris">Plateforme de services</span><br>
                Dakar, Sénégal<br>
                <span class="gris">[NINEA / RCCM de JefNet]</span>
            </td>
            <td class="espace"></td>
            <td class="bloc">
                <div class="etiquette">Facturé à</div>
                <div class="nom">{{ $client->user->prenom }} {{ mb_strtoupper($client->user->nom) }}</div>
                {{ $reservation->adresse_intervention }}<br>
                {{ $client->telephone }}<br>
                <span class="gris">Client n° {{ $client->username }}</span>
            </td>
            <td class="espace"></td>
            <td class="bloc">
                <div class="etiquette">Prestataire</div>
                <div class="nom">{{ $presta->user->prenom }} {{ mb_strtoupper($presta->user->nom) }}</div>
                {{ $prestataire->titre_professionnel }}{{ $certifie ? ' · certifié JefNet' : '' }}<br>
                {{ $presta->ville }}<br>
                <span class="gris">{{ $presta->telephone }}</span>
            </td>
        </tr>
    </table>

    {{-- Infos de la réservation --}}
    <table class="infos">
        <tr>
            <td><span class="lib">Réservation</span>{{ $codeResa }}</td>
            <td><span class="lib">Date de l'intervention</span>{{ $reservation->date_prevue->format('d/m/Y') }} à {{ str_replace(':', ' h ', substr($reservation->heure_prevue, 0, 5)) }}</td>
            <td><span class="lib">Rapport de prestation</span>{{ $reservation->rapport ? 'RP-' . $reservation->rapport->created_at->format('Y') . '-' . sprintf('%04d', $reservation->rapport->id) : '—' }}</td>
            <td><span class="lib">Lieu</span>{{ $reservation->adresse_intervention }}</td>
        </tr>
    </table>

    {{-- Détail des services --}}
    <table class="lignes">
        <tr>
            <th style="width: 46%;">Désignation</th>
            <th>Unité</th>
            <th class="num">Qté</th>
            <th class="num">Prix unitaire</th>
            <th class="num">Montant (FCFA)</th>
        </tr>
        @foreach ($reservation->details as $ligne)
            <tr>
                <td><strong>{{ $ligne->service->nom }}</strong></td>
                <td>{{ $ligne->service->unite_tarif }}</td>
                <td class="num">1</td>
                <td class="num">{{ $fcfa($ligne->prix_service) }}</td>
                <td class="num">{{ $fcfa($ligne->prix_service) }}</td>
            </tr>
        @endforeach
    </table>

    {{-- Règlement + Totaux --}}
    <table class="bas">
        <tr>
            <td class="cellule" style="width: 52%; padding-right: 18px;">
                <div class="reglement">
                    <div class="tampon">PAYÉE</div>
                    <div class="etiquette">Règlement</div>
                    <table>
                        <tr><td class="gris">Mode de paiement</td><td class="num">{{ $mode }}</td></tr>
                        <tr><td class="gris">Référence de transaction</td><td class="num">{{ $paiement->reference_transaction }}</td></tr>
                        <tr><td class="gris">Date du paiement</td><td class="num">{{ $paiement->date_paiement->format('d/m/Y') }} à {{ $paiement->date_paiement->format('H') }} h {{ $paiement->date_paiement->format('i') }}</td></tr>
                        <tr><td class="gris">Paiement n°</td><td class="num">PAY-{{ sprintf('%06d', $paiement->id) }}</td></tr>
                    </table>
                </div>
            </td>
            <td class="cellule">
                <table class="totaux">
                    <tr><td>Sous-total</td><td class="num">{{ $fcfa($facture->montant) }}</td></tr>
                    <tr><td>[Taxes, selon le régime fiscal]</td><td class="num">—</td></tr>
                    <tr class="final"><td>Total payé</td><td class="num">{{ $fcfa($facture->montant) }} FCFA</td></tr>
                </table>
                @if ($montantLettres)
                    <div class="lettres">Arrêtée la présente facture à la somme de {{ $montantLettres }} francs CFA.</div>
                @endif
            </td>
        </tr>
    </table>

    <div class="mentions">
        <p>Facture générée automatiquement par JefNet après la confirmation du paiement. Elle ne peut être ni modifiée ni supprimée.</p>
        <p>Le montant de la facture correspond au montant du paiement confirmé pour la réservation ci-dessus.</p>
        <p>[Mentions légales et fiscales de JefNet à compléter : forme juridique, NINEA, RCCM, régime de TVA.]</p>
    </div>

    <div class="merci">Merci d'avoir fait confiance à JefNet !</div>

</body>
</html>