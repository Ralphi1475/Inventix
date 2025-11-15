'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfigPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique vers la page de gestion
    // Cette page n'est plus nécessaire avec Supabase
    router.push('/gestion');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection...</p>
      </div>
    </div>
  );
}
