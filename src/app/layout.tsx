import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OrganizationProvider } from '@/context/OrganizationContext';
import { ClientLayout } from './ClientLayout';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventix",
  description: "Application de gestion de stock, ventes et achats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <OrganizationProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </OrganizationProvider>
      </body>
    </html>
  );
}