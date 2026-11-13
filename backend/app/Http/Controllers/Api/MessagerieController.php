<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messagerie\DemarrerConversationRequest;
use App\Http\Requests\Messagerie\EnvoyerMessageRequest;
use App\Http\Resources\Messagerie\ConversationResource;
use App\Http\Resources\Messagerie\MessageResource;
use App\Services\MessagerieService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\AppelService;
use Illuminate\Validation\Rule;

class MessagerieController extends Controller
{
    public function __construct(private MessagerieService $messagerie) {}

    /** GET /conversations?archivees=1 */
    public function index(Request $request)
    {
        $moi = $request->user()->membre;

        return ConversationResource::collection($this->messagerie->mesConversations($moi, $request->boolean('archivees')))
            ->additional(['non_lus_total' => $this->messagerie->nombreNonLus($moi)]);
    }

    /** POST /conversations  { destinataire_id } : ouvre ou retrouve la conversation */
    public function store(DemarrerConversationRequest $request): JsonResponse
    {
        $conversation = $this->messagerie->demarrer($request->user()->membre, $request->validated('destinataire_id'));

        return response()->json([
            'data' => new ConversationResource($conversation),
        ], $conversation->wasRecentlyCreated ? 201 : 200);
    }

    /** GET /conversations/non-lus : badge "Messages" */
    public function nonLus(Request $request): JsonResponse
    {
        return response()->json(['non_lus' => $this->messagerie->nombreNonLus($request->user()->membre)]);
    }

    /** GET /conversations/{uuid} */
    public function show(Request $request, string $uuid): ConversationResource
    {
        return new ConversationResource($this->messagerie->consulter($request->user()->membre, $uuid));
    }

    /** GET /conversations/{uuid}/messages?page= (du plus récent au plus ancien) */
    public function messages(Request $request, string $uuid)
    {
        return MessageResource::collection($this->messagerie->messages($request->user()->membre, $uuid));
    }

    /** POST /conversations/{uuid}/messages  (form-data : contenu, fichier, vocal, reponse_a_id) */
    public function envoyer(EnvoyerMessageRequest $request, string $uuid): JsonResponse
    {
        $message = $this->messagerie->envoyer(
            $request->user()->membre,
            $uuid,
            $request->validated('contenu'),
            $request->file('fichier'),
            $request->boolean('vocal'),
            $request->validated('reponse_a_id'),
        );

        return response()->json(['data' => new MessageResource($message)], 201);
    }

    /** PATCH /conversations/{uuid}/lire */
    public function lire(Request $request, string $uuid): JsonResponse
    {
        [$marques, $restants] = $this->messagerie->marquerLus($request->user()->membre, $uuid);

        return response()->json(['marques_lus' => $marques, 'non_lus_total' => $restants]);
    }

    /** PATCH /conversations/{uuid}/archiver */
    public function archiver(Request $request, string $uuid): JsonResponse
    {
        return response()->json([
            'message' => 'Conversation archivée.',
            'data'    => new ConversationResource($this->messagerie->archiver($request->user()->membre, $uuid, true)),
        ]);
    }

    /** PATCH /conversations/{uuid}/desarchiver */
    public function desarchiver(Request $request, string $uuid): JsonResponse
    {
        return response()->json([
            'message' => 'Conversation désarchivée.',
            'data'    => new ConversationResource($this->messagerie->archiver($request->user()->membre, $uuid, false)),
        ]);
    }


        /** POST /conversations/{uuid}/appel : lancer un appel vidéo */
    public function lancerAppel(Request $request, string $uuid, AppelService $appels): JsonResponse
    {
        return response()->json(['data' => $appels->lancer($request->user()->membre, $uuid)], 201);
    }

    /** POST /conversations/{uuid}/appel/rejoindre : décrocher */
    public function rejoindreAppel(Request $request, string $uuid, AppelService $appels): JsonResponse
    {
        return response()->json(['data' => $appels->rejoindre($request->user()->membre, $uuid)]);
    }

    /** POST /conversations/{uuid}/appel/terminer  { raison: REFUSE | ANNULE | TERMINE } */
    public function terminerAppel(Request $request, string $uuid, AppelService $appels): JsonResponse
    {
        $request->validate(['raison' => ['required', Rule::in(['REFUSE', 'ANNULE', 'TERMINE'])]]);

        $appels->terminer($request->user()->membre, $uuid, $request->input('raison'));

        return response()->json(['message' => 'Appel terminé.']);
    }

    /** GET /messages/{id}/fichier?expires=&signature= : lien signé (1 h), sans token */
    public function fichier(int $id)
    {
        return Storage::disk('local')->response($this->messagerie->cheminFichier($id));
    }
}