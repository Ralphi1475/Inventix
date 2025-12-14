'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { chargerDonnees, chargerCategories } from '@/lib/api';
import { Article, Contact, Mouvement, Parametres, FactureResume, Categorie } from '@/types';

interface DataContextType {
  loading: boolean;
  articles: Article[];
  clients: Contact[];
  fournisseurs: Contact[];
  mouvements: Mouvement[];
  factures: FactureResume[];
  achats: any[];
  categories: Categorie[];
  parametres: Parametres;
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  setClients: React.Dispatch<React.SetStateAction<Contact[]>>;
  setFournisseurs: React.Dispatch<React.SetStateAction<Contact[]>>;
  setMouvements: React.Dispatch<React.SetStateAction<Mouvement[]>>;
  setFactures: React.Dispatch<React.SetStateAction<FactureResume[]>>;
  setAchats: React.Dispatch<React.SetStateAction<any[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Categorie[]>>;
  setParametres: React.Dispatch<React.SetStateAction<Parametres>>;
  rechargerDonnees: (forceRefresh?: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<Contact[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Contact[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [factures, setFactures] = useState<FactureResume[]>([]);
  const [achats, setAchats] = useState<any[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
const [parametres, setParametres] = useState<Parametres>({
  societeNom: '',
  societeAdresse: '',
  societeCodePostal: '',
  societeVille: '',
  societePays: 'Belgique',
  societeTelephone: '',
  societeEmail: '',
  societeTva: '',
  societeIban: ''
});

  const rechargerDonnees = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      const organizationId = localStorage.getItem('current_organization_id');

      if (!organizationId) {
        setLoading(false);
        return;
      }

      const data = await chargerDonnees();
      const cats = await chargerCategories();
      
      setArticles(data.articles);
      setClients(data.clients);
      setFournisseurs(data.fournisseurs);
      setMouvements(data.mouvements);
      setFactures(data.factures);
      setAchats(data.achats);
      setParametres(data.parametres);
      setCategories(cats);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const organizationId = localStorage.getItem('current_organization_id');

      if (!organizationId) {
        setLoading(false);
        return;
      }
      
      await rechargerDonnees();
    };

    initData();
  }, []);

  const value = {
    loading,
    articles,
    clients,
    fournisseurs,
    mouvements,
    factures,
    achats,
    categories,
    parametres,
    setArticles,
    setClients,
    setFournisseurs,
    setMouvements,
    setFactures,
    setAchats,
    setCategories,
    setParametres,
    rechargerDonnees
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData doit etre utilise dans un DataProvider');
  }
  return context;
}