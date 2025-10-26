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

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image trop volumineuse (max 10 MB)' },
        { status: 400 }
      );
    }

    // ✅ La clé API est CACHÉE côté serveur
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

    if (!IMGBB_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Clé API non configurée' },
        { status: 500 }
      );
    }

    // Upload vers ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        url: result.data.url,
        deleteUrl: result.data.delete_url, // Au cas où vous voulez permettre la suppression
      });
    } else {
      throw new Error(result.error?.message || 'Erreur upload ImgBB');
    }

  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}