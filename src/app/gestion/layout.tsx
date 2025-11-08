import { DataProvider } from '@/context/DataContext';

export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DataProvider>{children}</DataProvider>;
}
