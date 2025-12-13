'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import {
  chargerDonneesSupabase as chargerDonnees,
  chargerCategoriesSupabase as chargerCategories
} from '@/lib/api-supabase';
import { 
  Article, 
  Contact, 
  Mouvement, 
  Parametres, 
  FactureResume,
  Categorie 
} from '@/types';

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
  viderCache: () => void;
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
    societe_nom: '',
    societe_adresse: '',
    societe_code_postal: '',
    societe_ville: '',
    societe_pays: 'Belgique',
    societe_telephone: '',
    societe_email: '',
    societe_tva: '',
    societe_iban: ''
  });

  const rechargerDonnees = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      // Verifier que l'utilisateur est connecte
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        console.log('Attente de la session utilisateur...');
        setLoading(false);
        return;
      }

      console.log('Chargement des donnees pour:', session.user.email);
      
      const data = await chargerDonnees(forceRefresh);
      const cats = await chargerCategories();
      
      setArticles(data.articles);
      setClients(data.clients);
      setFournisseurs(data.fournisseurs);
      setMouvements(data.mouvements);
      setFactures(data.factures);
      setAchats(data.achats);
      setParametres(data.parametres);
      setCategories(cats);
      
      console.log('Donnees chargees avec succes');
    } catch (err) {
      console.error('Erreur chargement:', err);
      // Ne pas throw l'erreur pour eviter de bloquer l'app
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    let mounted = true;
    
    const initData = async () => {
      // Attendre que la session soit prete
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('Pas de session, attente...');
        setLoading(false);
        return;
      }
      
      if (mounted) {
        await rechargerDonnees();
      }
    };

    // Petit delai pour laisser l'auth se stabiliser
    const timer = setTimeout(() => {
      initData();
    }, 100);

    // Ecouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session && mounted) {
        console.log('Utilisateur connecte, chargement des donnees...');
        await rechargerDonnees();
      } else if (event === 'SIGNED_OUT') {
        console.log('Utilisateur deconnecte');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
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