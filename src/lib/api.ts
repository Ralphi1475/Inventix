// /src/lib/api.ts
import { Article, Contact, Mouvement, Parametres, FactureResume, Categorie } from '@/types';
import { supabase, getCurrentUserEmail } from './supabase';

// ============================================================================
// FONCTIONS DE CONVERSION ENTRE camelCase ET snake_case
// ============================================================================

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      // ✅ Gestion correcte des acronymes comme TVA, IBAN, etc.
      const snakeKey = key
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // TVANumero -> TVA_Numero
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')     // numeroTVA -> numero_TVA
        .toLowerCase();                             // numero_TVA -> numero_tva
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

// ============================================================================
// CHARGEMENT DES DONNÉES (filtré par utilisateur)
// ============================================================================

export const chargerDonnees = async (forceRefresh: boolean = false) => {
  console.log('📡 Chargement des données depuis Supabase...');
  const startTime = Date.now();

  const userEmail = getCurrentUserEmail();
  if (!userEmail) {
    throw new Error('Utilisateur non connecté');
  }

  console.log('👤 Chargement des données pour:', userEmail);

  try {
    // Chargement parallèle de toutes les données (filtré par user_email)
    const [
      { data: articlesRaw, error: articlesError },
      { data: contactsRaw, error: contactsError },
      { data: achatsRaw, error: achatsError },
      { data: mouvementsRaw, error: mouvementsError },
      { data: facturesRaw, error: facturesError },
      { data: parametresRaw, error: parametresError },
      { data: categoriesRaw, error: categoriesError }
    ] = await Promise.all([
      supabase.from('articles').select('*').eq('user_email', userEmail).order('nom'),
      supabase.from('contacts').select('*').eq('user_email', userEmail).order('societe'),
      supabase.from('achats').select('*').eq('user_email', userEmail).order('date_achat', { ascending: false }),
      supabase.from('mouvements').select('*').eq('user_email', userEmail).order('date', { ascending: false }),
      supabase.from('factures').select('*').eq('user_email', userEmail).order('date', { ascending: false }),
      supabase.from('parametres').select('*').eq('user_email', userEmail),
      supabase.from('categories').select('*').eq('user_email', userEmail).order('denomination')
    ]);

    // Gestion des erreurs
    if (articlesError) throw articlesError;
    if (contactsError) throw contactsError;
    if (achatsError) throw achatsError;
    if (mouvementsError) throw mouvementsError;
    if (facturesError) throw facturesError;
    if (parametresError) throw parametresError;
    if (categoriesError) throw categoriesError;

    // Conversion en camelCase et typage
    const articles: Article[] = articlesRaw ? articlesRaw.map(article => ({
      ...toCamelCase(article),
      prixVenteHT: article.prix_achat * (1 + (article.marge_percent || 0) / 100),
      prixVenteTTC: article.prix_achat * (1 + (article.marge_percent || 0) / 100) * (1 + (article.taux_tva || 0) / 100)
    })) : [];

    const contacts: Contact[] = contactsRaw ? toCamelCase(contactsRaw) : [];
    const clients = contacts.filter(c => c.type === 'client');
    const fournisseurs = contacts.filter(c => c.type === 'fournisseur');

    const achats = achatsRaw ? toCamelCase(achatsRaw) : [];
    const mouvements: Mouvement[] = mouvementsRaw ? toCamelCase(mouvementsRaw) : [];
    const factures: FactureResume[] = facturesRaw ? toCamelCase(facturesRaw) : [];
    
    // Conversion des paramètres en objet
const parametres: Parametres = parametresRaw && parametresRaw.length > 0 
  ? toCamelCase(parametresRaw[0]) 
  : {
      societe_nom: '',           // ✅ Bon
      societe_adresse: '',       // ✅ Bon
      societe_code_postal: '',   // ✅ Bon
      societe_ville: '',         // ✅ Bon
      societe_pays: '',          // ✅ Bon
      societe_telephone: '',     // ✅ Bon
      societe_email: '',         // ✅ Bon
      societe_tva: '',           // ✅ Bon
      societe_iban: ''           // ✅ Bon
    } as Parametres;

    const categories: Categorie[] = categoriesRaw ? toCamelCase(categoriesRaw) : [];

    const loadTime = Date.now() - startTime;
    console.log(`✅ Données chargées depuis Supabase en ${loadTime}ms`);
    console.log(`📊 Stats: ${articles.length} articles, ${contacts.length} contacts, ${mouvements.length} mouvements`);

    return {
      articles,
      clients,
      fournisseurs,
      achats,
      mouvements,
      factures,
      parametres,
      categories
    };
  } catch (error) {
    console.error('❌ Erreur chargement données:', error);
    throw error;
  }
};

// ============================================================================
// ARTICLES
// ============================================================================

export const sauvegarderArticle = async (article: Article, isUpdate: boolean = false) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const articleData = toSnakeCase({
      id: article.id,
      numero: article.numero,
      categorie: article.categorie,
      nom: article.nom,
      description: article.description,
      image: article.image,
      prixAchat: article.prixAchat,
      margePercent: article.margePercent,
      tauxTva: article.tauxTVA,
      stock: article.stock,
      emplacement: article.emplacement,
      unite: article.unite,
      conditionnement: article.conditionnement,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    if (isUpdate) {
      const { error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', article.id)
        .eq('user_email', userEmail);  // ✅ Sécurité supplémentaire
      
      if (error) throw error;
      console.log('✅ Article modifié:', article.nom);
    } else {
      const { error } = await supabase
        .from('articles')
        .insert([articleData]);
      
      if (error) throw error;
      console.log('✅ Article créé:', article.nom);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde article:', error);
    throw error;
  }
};

export const supprimerArticle = async (id: string) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);  // ✅ Ne peut supprimer que ses propres articles
    
    if (error) throw error;
    console.log('✅ Article supprimé:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression article:', error);
    throw error;
  }
};

// ============================================================================
// CONTACTS (Clients & Fournisseurs)
// ============================================================================

export const sauvegarderContact = async (contact: Contact, isUpdate: boolean = false) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const contactData = toSnakeCase({
      ...contact,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    if (isUpdate) {
      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', contact.id)
        .eq('user_email', userEmail);
      
      if (error) throw error;
      console.log('✅ Contact modifié:', contact.societe);
    } else {
      const { error } = await supabase
        .from('contacts')
        .insert([contactData]);
      
      if (error) throw error;
      console.log('✅ Contact créé:', contact.societe);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde contact:', error);
    throw error;
  }
};

export const supprimerContact = async (id: string) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    console.log('✅ Contact supprimé:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression contact:', error);
    throw error;
  }
};

// ============================================================================
// MOUVEMENTS
// ============================================================================

export const sauvegarderMouvement = async (mouvement: Mouvement) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const mouvementData = toSnakeCase({
      ...mouvement,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    const { error } = await supabase
      .from('mouvements')
      .insert([mouvementData]);
    
    if (error) throw error;
    console.log('✅ Mouvement enregistré');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde mouvement:', error);
    throw error;
  }
};

// Alias pour compatibilité avec l'ancien code
export const enregistrerMouvement = sauvegarderMouvement;

export const supprimerMouvement = async (mouvementId: string) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('mouvements')
      .delete()
      .eq('id', mouvementId)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    console.log('✅ Mouvement supprimé:', mouvementId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression mouvement:', error);
    throw error;
  }
};

// ============================================================================
// FACTURES
// ============================================================================

export const sauvegarderFacture = async (facture: any) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const factureData = toSnakeCase({
      id: facture.id || String(Date.now()),
      reference: facture.reference,
      date: facture.date,
      client: facture.client,
      modePaiement: facture.modePaiement,
      montant: facture.montant,
      emplacement: facture.emplacement || '',
      commentaire: facture.commentaire || '',
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    const { error } = await supabase
      .from('factures')
      .insert([factureData]);
    
    if (error) throw error;
    console.log('✅ Facture sauvegardée:', facture.reference);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde facture:', error);
    throw error;
  }
};

export const supprimerFacture = async (factureId: string) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', factureId)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    console.log('✅ Facture supprimée:', factureId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression facture:', error);
    throw error;
  }
};

// ============================================================================
// ACHATS
// ============================================================================

export const sauvegarderAchat = async (achat: any, fournisseurs: Contact[]) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
    const nomFournisseur = fournisseur?.societe || '';
    
    const achatData = toSnakeCase({
      id: achat.id,
      reference: achat.reference,
      dateAchat: achat.date_achat,
      dateEcheance: achat.date_echeance || '',
      datePaiement: achat.date_paiement || '',
      fournisseurId: achat.fournisseurId,
      modePaiement: achat.modePaiement,
      montantHtva: achat.montantHTVA,
      montantTtc: achat.montantTTC,
      description: achat.description || '',
      categorie: achat.categorie,
      nomFournisseur: nomFournisseur,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    const { error } = await supabase
      .from('achats')
      .insert([achatData]);
    
    if (error) throw error;
    console.log('✅ Achat sauvegardé:', achat.reference);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde achat:', error);
    throw error;
  }
};

export const modifierAchat = async (achat: any, fournisseurs: Contact[]) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
    const nomFournisseur = fournisseur?.societe || '';
    
    const achatData = toSnakeCase({
      reference: achat.reference,
      dateAchat: achat.date_achat,
      dateEcheance: achat.date_echeance || '',
      datePaiement: achat.date_paiement || '',
      fournisseurId: achat.fournisseurId,
      modePaiement: achat.modePaiement,
      montantHtva: achat.montantHTVA,
      montantTtc: achat.montantTTC,
      description: achat.description || '',
      categorie: achat.categorie,
      nomFournisseur: nomFournisseur
    });

    const { error } = await supabase
      .from('achats')
      .update(achatData)
      .eq('id', achat.id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    console.log('✅ Achat modifié:', achat.reference);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur modification achat:', error);
    throw error;
  }
};

export const supprimerAchat = async (id: string) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('achats')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    console.log('✅ Achat supprimé:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression achat:', error);
    throw error;
  }
};

// ============================================================================
// PARAMÈTRES
// ============================================================================

export const sauvegarderParametres = async (params: Parametres) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const parametresData = toSnakeCase({
      ...params,
      userEmail: userEmail
    });

    // Upsert basé sur user_email (une seule ligne par utilisateur)
    const { error } = await supabase
      .from('parametres')
      .upsert([parametresData], { onConflict: 'user_email' });
    
    if (error) throw error;
    console.log('✅ Paramètres sauvegardés');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    throw error;
  }
};

// ============================================================================
// CATÉGORIES
// ============================================================================

export async function chargerCategories(): Promise<Categorie[]> {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_email', userEmail)
      .order('denomination');
    
    if (error) throw error;
    
    return data ? toCamelCase(data) : [];
  } catch (error) {
    console.error('❌ Erreur chargement catégories:', error);
    throw error;
  }
}

export async function sauvegarderCategorie(categorie: Categorie, isUpdate: boolean = false): Promise<void> {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const categorieData = toSnakeCase({
      ...categorie,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    if (isUpdate) {
      const { error } = await supabase
        .from('categories')
        .update(categorieData)
        .eq('id', categorie.id)
        .eq('user_email', userEmail);
      
      if (error) throw error;
      console.log('✅ Catégorie modifiée:', categorie.denomination);
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([categorieData]);
      
      if (error) throw error;
      console.log('✅ Catégorie créée:', categorie.denomination);
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde catégorie:', error);
    throw error;
  }
}

export async function supprimerCategorie(id: string): Promise<void> {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    console.log('✅ Catégorie supprimée:', id);
  } catch (error) {
    console.error('❌ Erreur suppression catégorie:', error);
    throw error;
  }
}

// ============================================================================
// UPLOAD D'IMAGES
// ============================================================================

export const uploadImage = async (file: File): Promise<string> => {
  try {
    console.log('📤 Upload image:', file.name, file.size, 'bytes');
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur upload');
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Image uploadée:', result.url);
      return result.url;
    } else {
      throw new Error(result.error || 'Erreur upload');
    }
  } catch (error) {
    console.error('❌ Erreur uploadImage:', error);
    throw error;
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES (compatibilité)
// ============================================================================

// Ces fonctions ne sont plus nécessaires avec Supabase mais sont gardées pour compatibilité
export const clearCache = (): void => {
  console.log('ℹ️ Cache non utilisé avec Supabase');
};

const invalidateCache = (): void => {
  // Non nécessaire avec Supabase
};
