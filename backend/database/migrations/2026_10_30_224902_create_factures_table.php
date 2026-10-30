<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
    public function up(): void
{
    Schema::create('factures', function (Blueprint $table) {
        $table->id();
        $table->foreignId('paiement_id')->unique()->constrained('paiements');
        $table->string('numero_facture', 30)->unique();
        $table->date('date_emission');
        $table->decimal('montant', 12, 2);
        $table->string('fichier_pdf')->nullable();
        $table->timestamps();
    });

    DB::statement('ALTER TABLE factures ADD CONSTRAINT chk_montant_facture CHECK (montant > 0)');

    // Règle n°4 : une facture émise ne peut être ni modifiée ni supprimée
    DB::unprepared("
        CREATE OR REPLACE FUNCTION interdire_modif_facture() RETURNS trigger AS $$
        BEGIN
            
            IF TG_OP = 'UPDATE'
               AND NEW.numero_facture = OLD.numero_facture
               AND NEW.montant = OLD.montant
               AND NEW.date_emission = OLD.date_emission
               AND NEW.paiement_id = OLD.paiement_id
               AND OLD.fichier_pdf IS NULL THEN
                RETURN NEW;
            END IF;
            RAISE EXCEPTION 'Une facture émise ne peut être ni modifiée ni supprimée';
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_facture_immuable
        BEFORE UPDATE OR DELETE ON factures
        FOR EACH ROW EXECUTE FUNCTION interdire_modif_facture();
    ");
}

public function down(): void
{
    DB::unprepared('DROP TRIGGER IF EXISTS trg_facture_immuable ON factures; DROP FUNCTION IF EXISTS interdire_modif_facture();');
    Schema::dropIfExists('factures');
}
};
