import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // 🔐 Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Utilisateur non authentifié - authError:', authError);
      return NextResponse.json({ 
        success: false, 
        error: 'Utilisateur non authentifié. Veuillez vous reconnecter.' 
      }, { status: 401 });
    }

    console.log('✅ Utilisateur authentifié:', user.email);

    const body = await request.json();
    const { userEmail, nomSociete, description, telephone } = body;

    // Enregistrer la demande dans Supabase
    const { error } = await supabase
      .from('demandes_societes')
      .insert([{
        user_email: userEmail,
        nom_societe: nomSociete,
        description: description || '',
        telephone: telephone || ''
      }]);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error.details
      }, { status: 500 });
    }

    console.log('✅ Nouvelle demande de société créée:', { userEmail, nomSociete });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Erreur demande société:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erreur serveur' 
    }, { status: 500 });
  }
}