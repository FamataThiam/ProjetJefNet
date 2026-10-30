<?php

namespace Database\Seeders;

use App\Models\CommentairePublication;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\Publication;
use App\Services\CodeListService;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PublicationSeeder extends Seeder
{
    private const TITRES = [
        'Nouvelle réalisation : %s',
        '%s terminé(e) aujourd\'hui',
        'Avant / après : %s',
        'Encore un client satisfait : %s',
    ];

    private const COMMENTAIRES = [
        'Magnifique travail !', 'Très propre, bravo ', 'Vous intervenez à Pikine ?',
        'Quel est votre tarif pour ce type de travail ?', 'J\'ai fait appel à vous le mois dernier, toujours aussi satisfait.',
        'Superbe résultat, je vous contacte bientôt.', 'Est-ce que vous êtes disponible ce week-end ?',
    ];

    private const REPONSES = [
        'Merci beaucoup !', 'Oui, n\'hésitez pas à me contacter par la messagerie.',
        'Merci pour votre confiance ', 'Oui, je me déplace dans toute la ville. Réservez directement sur mon profil.',
    ];

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $image   = $this->codeLists->idOf('TypeMedia', 'IMAGE');
        $actif   = $this->codeLists->idOf('StatutCompte', 'ACTIF');
        $membres = Membre::whereHas('user', fn ($q) => $q->where('statut_compte_id', $actif))->get();

        $prestataires = ProfilProfessionnel::with(['services', 'membre.user'])->get();

        foreach ($prestataires as $profil) {
            $domaine = SenegalData::domaineDuTitre($profil->titre_professionnel);
            if (! $domaine || $profil->services->isEmpty()) {
                continue;
            }

            $estDemo = $profil->membre->user->email === 'prestataire@jefnet.test';
            $nombre  = $estDemo ? 3 : fake()->numberBetween(1, 4);

            
            $fichier = 'domaines/' . Str::slug(explode(' ', $domaine)[0]) . '.jpg';
            $url     = Storage::disk('public')->exists($fichier) ? $fichier : null;

            for ($i = 0; $i < $nombre; $i++) {
                $service = $profil->services->random()->nom;

            
                $story = ($estDemo && $i === 0) || fake()->boolean(15);
                $date  = $story ? fake()->dateTimeBetween('-20 hours', 'now') : fake()->dateTimeBetween('-60 days', '-2 days');

                $publication = new Publication([
                    'profil_professionnel_id' => $profil->id,
                    'titre'                   => sprintf(fake()->randomElement(self::TITRES), $service),
                    'description'             => "$service réalisé(e) chez un client à {$profil->membre->localite}. "
                                               . "Travail soigné et dans les délais. Contactez-moi pour un devis !",
                    'date_publication'        => $date,
                    'est_active'              => $estDemo || ! fake()->boolean(10),   // 10 % archivées
                ]);
                $publication->timestamps = false;
                $publication->created_at = $date;
                $publication->updated_at = $date;
                $publication->save();

                if ($url) {
                    $publication->medias()->create(['type_id' => $image, 'url' => $url, 'ordre' => 1]);
                }

                $this->commenter($publication, $profil, $membres, $date);
            }
        }
    }

  
    private function commenter(Publication $publication, ProfilProfessionnel $profil, $membres, $datePublication): void
    {
        $auteurs = $membres->where('id', '!=', $profil->membre_id)->random(fake()->numberBetween(0, 4));

        foreach ($auteurs as $auteur) {
            $date = fake()->dateTimeBetween($datePublication, 'now');

            $commentaire = $this->creerCommentaire($publication->id, $auteur->id, null, fake()->randomElement(self::COMMENTAIRES), $date);

            // Le prestataire répond dans 50 % des cas
            if (fake()->boolean(50)) {
                $this->creerCommentaire($publication->id, $profil->membre_id, $commentaire->id,
                    fake()->randomElement(self::REPONSES), fake()->dateTimeBetween($date, 'now'));
            }
        }
    }

    private function creerCommentaire(int $publicationId, int $membreId, ?int $parentId, string $contenu, $date): CommentairePublication
    {
        $c = new CommentairePublication([
            'publication_id' => $publicationId,
            'membre_id'      => $membreId,
            'parent_id'      => $parentId,
            'contenu'        => $contenu,
        ]);
        $c->timestamps = false;
        $c->created_at = $date;
        $c->updated_at = $date;
        $c->save();

        return $c;
    }
}