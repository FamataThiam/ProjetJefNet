<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CodeOtpMail extends Mailable
{
    use Queueable, SerializesModels;

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