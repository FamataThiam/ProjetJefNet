<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;


class CodeOtpMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    // si Mailtrap ne répond pas : 3 essais, à 10 s puis 30 s d'intervalle
    public int $tries = 3;
    public array $backoff = [10, 30];

    public function __construct(
        public string $prenom,
        public string $code,
        public string $objet = 'verification'
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->objet === 'verification'
                ? 'Votre code de vérification JefNet'
                : 'Réinitialisation de votre mot de passe JefNet',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.code-otp');
    }
}