'use client';
import { usePathname } from 'next/navigation';
import { DataProvider } from '@/context/DataContext';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const needsData = pathname?.startsWith('/gestion') || 
                    pathname?.startsWith('/select-organization');

  if (needsData) {
    return <DataProvider>{children}</DataProvider>;
  }

  return <>{children}</>;
}