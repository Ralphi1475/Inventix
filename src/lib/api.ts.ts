// /src/lib/api.ts
import { createClient } from '@supabase/supabase-js';
import { Article, Contact, Mouvement, Parametres, FactureResume, Categorie } from '@/types';

// Configuration Supabase
const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables Supabase manquantes');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Charge toutes les données depuis Supabase
 */
export const chargerDonnees = async (forceRefresh: boolean = false) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  try {
    // Charger toutes les tables en parallèle
    const [articlesRes, contactsRes, mouvementsRes, facturesRes, achatsRes, parametresRes] = await Promise.all([
      supabase.from('articles').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('mouvements').select('*').order('created_at', { ascending: false }),
      supabase.from('factures').select('*').order('created_at', { ascending: false }),
      supabase.from('achats').select('*').order('created_at', { ascending: false }),
      supabase.from('parametres').select('*')
    ]);

    // Transformer les articles
    const articlesData: Article[] = (articlesRes.data || []).map((row: any) => ({
      id: row.id,
      numero: row.numero || '',
      categorie: row.categorie || '',
      nom: row.nom || '',
      description: row.description || '',
      image: row.image || '',
      prixAchat: parseFloat(row.prix_achat) || 0,
      margePercent: parseFloat(row.marge_percent) || 0,
      tauxTVA: parseFloat(row.taux_tva) || 0,
      stock: parseInt(row.stock) || 0,
      emplacement: row.emplacement || '',
      unite: row.unite || 'Pièce',
      conditionnement: row.conditionnement || '',
      prixVenteTTC: parseFloat(row.prix_vente_ttc) || 0
    }));

    // Transformer les contacts
    const contactsData: Contact[] = (contactsRes.data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      societe: row.societe || '',
      nom: row.nom || '',
      prenom: row.prenom || '',
      adresse: row.adresse || '',
      codePostal: row.code_postal || '',
      ville: row.ville || '',
      pays: row.pays || '',
      mobile: row.mobile || '',
      numeroTVA: row.numero_tva || '',
      numeroCompte: row.numero_compte || '',
      email: row.email || ''
    }));

    const clientsData = contactsData.filter((c: Contact) => c.type === 'client');
    const fournisseursData = contactsData.filter((c: Contact) => c.type === 'fournisseur');

    // Transformer les mouvements
    const mouvementsData: Mouvement[] = (mouvementsRes.data || []).map((row: any) => ({
      id: row.id,
      date: row.date || '',
      type: row.type || '',
      articleId: row.article_id || '',
      quantite: parseFloat(row.quantite) || 0,
      clientId: row.client_id || undefined,
      fournisseurId: row.fournisseur_id || undefined,
      reference: row.reference || '',
      modePaiement: row.mode_paiement || '',
      nomArticle: row.nom_article || '',
      prixUnitaire: parseFloat(row.prix_unitaire) || 0,
      emplacement: row.emplacement || '',
      nomClient: row.nom_client || '',
      rectDate: row.rect_date || '',
      colonne6: row.colonne6 || '',
      commentaire: row.commentaire || ''
    }));

    // Transformer les factures
    const facturesData: FactureResume[] = (facturesRes.data || []).map((row: any) => ({
      id: row.id,
      reference: row.reference || '',
      date: row.date || '',
      client: row.client || '',
      modePaiement: row.mode_paiement || '',
      montant: parseFloat(row.montant) || 0,
      emplacement: row.emplacement || '',
      commentaire: row.commentaire || ''
    }));

    // Transformer les achats
    const achatsData = (achatsRes.data || []).map((row: any) => ({
      id: row.id,
      reference: row.reference || '',
      date_achat: row.date_achat || '',
      date_echeance: row.date_echeance || '',
      date_paiement: row.date_paiement || '',
      fournisseurId: row.fournisseur_id || '',
      modePaiement: row.mode_paiement || '',
      montantHTVA: parseFloat(row.montant_htva) || 0,
      montantTTC: parseFloat(row.montant_ttc) || 0,
      description: row.description || '',
      categorie: row.categorie || '',
      nomFournisseur: row.nom_fournisseur || ''
    }));

    // Transformer les paramètres
    const params: Parametres = {
      societe_nom: '',
      societe_adresse: '',
      societe_code_postal: '',
      societe_ville: '',
      societe_pays: 'Belgique',
      societe_telephone: '',
      societe_email: '',
      societe_tva: '',
      societe_iban: ''
    };

    (parametresRes.data || []).forEach((row: any) => {
      if (params.hasOwnProperty(row.cle)) {
        (params as any)[row.cle] = row.valeur || '';
      }
    });

    return {
      articles: articlesData,
      clients: clientsData,
      fournisseurs: fournisseursData,
      mouvements: mouvementsData,
      factures: facturesData,
      achats: achatsData,
      parametres: params
    };
  } catch (error) {
    console.error('❌ Erreur chargement données:', error);
    throw error;
  }
};

// =============== FONCTIONS DE SAUVEGARDE ===============

export const sauvegarderArticle = async (article: Article, action: 'create' | 'update'): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const prixVenteHT = article.prixAchat * (1 + article.margePercent / 100);
  const prixVenteTTC = prixVenteHT * (1 + article.tauxTVA / 100);

  const data = {
    id: article.id,
    numero: article.numero,
    categorie: article.categorie,
    nom: article.nom,
    description: article.description,
    image: article.image,
    prix_achat: article.prixAchat,
    marge_percent: article.margePercent,
    taux_tva: article.tauxTVA,
    stock: article.stock,
    emplacement: article.emplacement,
    prix_vente_ttc: prixVenteTTC,
    unite: article.unite || 'Pièce',
    conditionnement: article.conditionnement || ''
  };

  if (action === 'create') {
    const { error } = await supabase.from('articles').insert(data);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('articles').update(data).eq('id', article.id);
    if (error) throw error;
  }

  console.log('✅ Article sauvegardé:', article.nom);
};

export const supprimerArticle = async (articleId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { error } = await supabase.from('articles').delete().eq('id', articleId);
  if (error) throw error;
  console.log('✅ Article supprimé:', articleId);
};

export const sauvegarderContact = async (contact: Contact, action: 'create' | 'update'): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const data = {
    id: contact.id,
    type: contact.type,
    societe: contact.societe,
    nom: contact.nom,
    prenom: contact.prenom,
    adresse: contact.adresse,
    code_postal: contact.codePostal,
    ville: contact.ville,
    pays: contact.pays,
    mobile: contact.mobile,
    numero_tva: contact.numeroTVA,
    numero_compte: contact.numeroCompte,
    email: contact.email
  };

  if (action === 'create') {
    const { error } = await supabase.from('contacts').insert(data);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('contacts').update(data).eq('id', contact.id);
    if (error) throw error;
  }

  console.log('✅ Contact sauvegardé:', contact.societe || contact.nom);
};

export const supprimerContact = async (contactId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { error } = await supabase.from('contacts').delete().eq('id', contactId);
  if (error) throw error;
  console.log('✅ Contact supprimé:', contactId);
};

export async function enregistrerMouvement(mouvement: any): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const data = {
    id: mouvement.id || String(Date.now() + Math.floor(Math.random() * 10000)),
    date: mouvement.date,
    type: mouvement.type,
    article_id: mouvement.articleId,
    quantite: mouvement.quantite,
    client_id: mouvement.clientId || null,
    fournisseur_id: mouvement.fournisseurId || null,
    reference: mouvement.reference,
    mode_paiement: mouvement.modePaiement || '',
    nom_article: mouvement.nomArticle || '',
    prix_unitaire: mouvement.prixUnitaire || 0,
    emplacement: mouvement.emplacement || '',
    nom_client: mouvement.nomClient || '',
    rect_date: mouvement.rectDate || '',
    colonne6: mouvement.colonne6 || '',
    commentaire: mouvement.commentaire || ''
  };

  const { error } = await supabase.from('mouvements').insert(data);
  if (error) {
    console.error('❌ Erreur enregistrement mouvement:', error);
    throw error;
  }

  console.log('✅ Mouvement enregistré');
  return true;
}

export const sauvegarderFacture = async (facture: any) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const data = {
    id: facture.id || String(Date.now()),
    reference: facture.reference,
    date: facture.date,
    client: facture.client,
    mode_paiement: facture.modePaiement,
    montant: facture.montant,
    emplacement: facture.emplacement || '',
    commentaire: facture.commentaire || ''
  };

  const { error } = await supabase.from('factures').upsert(data);
  if (error) throw error;

  console.log('✅ Facture sauvegardée');
  return { success: true };
};

export const sauvegarderAchat = async (achat: any, fournisseurs: Contact[]) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
  const nomFournisseur = fournisseur?.societe || '';

  const data = {
    id: achat.id,
    reference: achat.reference,
    date_achat: achat.date_achat,
    date_echeance: achat.date_echeance || '',
    date_paiement: achat.date_paiement || '',
    fournisseur_id: achat.fournisseurId,
    mode_paiement: achat.modePaiement,
    montant_htva: achat.montantHTVA,
    montant_ttc: achat.montantTTC,
    description: achat.description || '',
    categorie: achat.categorie,
    nom_fournisseur: nomFournisseur
  };

  const { error } = await supabase.from('achats').insert(data);
  if (error) throw error;

  console.log('✅ Achat sauvegardé:', achat.reference);
  return { success: true };
};

export const modifierAchat = async (achat: any, fournisseurs: Contact[]) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
  const nomFournisseur = fournisseur?.societe || '';

  const data = {
    reference: achat.reference,
    date_achat: achat.date_achat,
    date_echeance: achat.date_echeance || '',
    date_paiement: achat.date_paiement || '',
    fournisseur_id: achat.fournisseurId,
    mode_paiement: achat.modePaiement,
    montant_htva: achat.montantHTVA,
    montant_ttc: achat.montantTTC,
    description: achat.description || '',
    categorie: achat.categorie,
    nom_fournisseur: nomFournisseur
  };

  const { error } = await supabase.from('achats').update(data).eq('id', achat.id);
  if (error) throw error;

  console.log('✅ Achat modifié:', achat.reference);
  return { success: true };
};

export const supprimerAchat = async (id: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { error } = await supabase.from('achats').delete().eq('id', id);
  if (error) throw error;

  console.log('✅ Achat supprimé:', id);
  return { success: true };
};

export const sauvegarderParametres = async (params: Parametres) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const updates = Object.entries(params).map(([cle, valeur]) => ({
    cle,
    valeur: valeur || ''
  }));

  const { error } = await supabase.from('parametres').upsert(updates);
  if (error) throw error;

  console.log('✅ Paramètres sauvegardés');
  return { success: true };
};

export async function chargerCategories(): Promise<Categorie[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    denomination: row.denomination || ''
  }));
}

export async function sauvegarderCategorie(categorie: Categorie, isUpdate: boolean = false): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const data = {
    id: categorie.id,
    denomination: categorie.denomination
  };

  if (isUpdate) {
    const { error } = await supabase.from('categories').update(data).eq('id', categorie.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('categories').insert(data);
    if (error) throw error;
  }

  console.log('✅ Catégorie sauvegardée:', categorie.denomination);
}

export async function supprimerCategorie(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;

  console.log('✅ Catégorie supprimée:', id);
}

export const supprimerFacture = async (factureId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { error } = await supabase.from('factures').delete().eq('id', factureId);
  if (error) throw error;

  console.log('✅ Facture supprimée:', factureId);
  return { success: true };
};

export const supprimerMouvement = async (mouvementId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { error } = await supabase.from('mouvements').delete().eq('id', mouvementId);
  if (error) throw error;

  console.log('✅ Mouvement supprimé:', mouvementId);
  return { success: true };
};

export const uploadImage = async (file: File): Promise<string> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from('images').upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
  
  console.log('✅ Image uploadée:', publicUrl);
  return publicUrl;
};

// Pour compatibilité - pas de cache nécessaire avec Supabase
export const clearCache = () => {
  console.log('ℹ️ Pas de cache avec Supabase');
};
