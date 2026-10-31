<!doctype html>
<html lang="fr">
<body style="margin:0; padding:24px; background:#F5F8FA; font-family:Arial, Helvetica, sans-serif; color:#0F1E2B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:16px; border:1px solid #E3EEF5;">
        <tr><td style="padding:28px 32px 8px;">
          <span style="display:inline-block; width:36px; height:36px; line-height:36px; text-align:center; border-radius:10px; background:#0174AB; color:#FFFFFF; font-weight:bold; font-size:19px;">J</span>
          <span style="font-size:20px; font-weight:bold; color:#0174AB; vertical-align:middle; margin-left:8px;">JefNet</span>
        </td></tr>
        <tr><td style="padding:16px 32px;">
          <p style="font-size:16px; margin:0 0 12px;">Bonjour {{ $prenom }},</p>
          <p style="font-size:15px; line-height:1.6; margin:0 0 20px;">
            @if ($objet === 'verification')
              Voici votre code pour confirmer votre adresse e-mail et activer votre compte JefNet :
            @else
              Voici votre code pour choisir un nouveau mot de passe :
            @endif
          </p>
          <div style="text-align:center; font-size:34px; font-weight:bold; letter-spacing:10px; color:#0174AB; background:#EAF5FB; border-radius:12px; padding:18px 0;">
            {{ $code }}
          </div>
          <p style="font-size:13px; color:#5B6B78; line-height:1.6; margin:20px 0 0;">
            Ce code est valable <strong>10 minutes</strong> et ne peut être utilisé qu'une seule fois.<br>
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 28px; font-size:12px; color:#5B6B78; border-top:1px solid #E3EEF5;">
          JefNet · Le bon prestataire, juste à côté de chez vous.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>