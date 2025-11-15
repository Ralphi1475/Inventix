import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Pour l'instant, retourner une erreur car l'upload Google Drive nécessite une configuration
    // TODO: Implémenter l'upload vers Supabase Storage ou Google Drive
    return NextResponse.json(
      { 
        success: false, 
        error: 'Upload d\'images non configuré. Veuillez configurer Supabase Storage ou Google Drive.' 
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
