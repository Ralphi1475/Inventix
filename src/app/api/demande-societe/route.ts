import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
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
        statut: 'en_attente'
      }]);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Nouvelle demande de société:', { userEmail, nomSociete });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Erreur demande société:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erreur serveur' 
    }, { status: 500 });
  }
}