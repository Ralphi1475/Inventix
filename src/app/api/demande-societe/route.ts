import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, nomSociete, description, telephone } = body;

    // Enregistrer la demande dans Supabase
    const { error } = await supabase
      .from('demandes_societes')
      .insert([{
        user_email: userEmail,
        nom_societe: nomSociete,
        description: description || '',
        telephone: telephone || '',
        statut: 'en_attente',
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    // TODO: Envoyer email (Resend, SendGrid, ou Supabase Edge Function)
    // Pour l'instant, juste logger
    console.log('📧 Nouvelle demande de société:', { userEmail, nomSociete });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur demande société:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}