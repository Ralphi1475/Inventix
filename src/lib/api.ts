// /src/lib/api.ts
import { Article, Contact, Mouvement, Parametres, FactureResume, Categorie } from '@/types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTrMkWeN31Eh81waVJ_IE9qPMHKcVzE9_nEIzHAEY0zhHD_Z7EkCys8lisyFvCSkby/exec';

/**
 * Fonction utilitaire pour effectuer des requêtes JSONP vers Google Apps Script
 */
export const fetchJSONP = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonpCallback' + Date.now();
    const script = document.createElement('script');
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };
    script.src = url + '&callback=' + callbackName;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(new Error('JSONP request failed'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Charge toutes les données depuis Google Sheets
 */
export const chargerDonnees = async () => {
  // Articles
  const dataArticles = await fetchJSONP(`${GOOGLE_SCRIPT_URL}?action=read&table=Articles`);
  let articlesData: Article[] = [];
  if (dataArticles.success && dataArticles.data?.length > 1) {
    articlesData = dataArticles.data.slice(1).map((row: any[], index: number) => ({
      id: row[0] ? String(row[0]) : String(Date.now() + index),
      numero: row[1] || '',
      categorie: row[2] || '',
      nom: row[3] || '',
      description: row[4] || '',
      image: row[5] || '',
      prixAchat: parseFloat(row[6]) || 0,
      margePercent: parseFloat(row[7]) || 0,
      tauxTVA: parseFloat(row[8]) || 0,
      stock: parseInt(row[9]) || 0,
      emplacement: row[10] || '',
      unite: row[12] || 'Pièce',
      conditionnement: row[13] || ''
    }));
  }

  // Contacts (clients + fournisseurs)
  const dataContacts = await fetchJSONP(`${GOOGLE_SCRIPT_URL}?action=read&table=Client_Fournisseurs`);
  let clientsData: Contact[] = [], fournisseursData: Contact[] = [];
  if (dataContacts.success && dataContacts.data?.length > 1) {
    const contactsData = dataContacts.data.slice(1).map((row: any[]) => ({
      id: row[0] ? String(row[0]) : String(Date.now() + Math.random()),
      type: row[1] || '',
      societe: row[2] || '',
      nom: row[3] || '',
      prenom: row[4] || '',
      adresse: row[5] || '',
      codePostal: row[6] || '',
      ville: row[7] || '',
      pays: row[8] || '',
      mobile: row[9] || '',
      numeroTVA: row[10] || '',
      numeroCompte: row[11] || '',
      email: row[12] || ''
    }));
    clientsData = contactsData.filter((c: Contact) => c.type === 'client');
    fournisseursData = contactsData.filter((c: Contact) => c.type === 'fournisseur');
  }

  // Achats (doit venir APRÈS les fournisseurs pour remplir les noms)
  const dataAchats = await fetchJSONP(`${GOOGLE_SCRIPT_URL}?action=read&table=Achats`);
  let achatsData: any[] = [];
  if (dataAchats.success && dataAchats.data?.length > 1) {
    achatsData = dataAchats.data.slice(1).map((row: any[]) => {
      const fournisseurId = row[5] || '';
      let nomFournisseur = row[11] || '';
      if (!nomFournisseur && fournisseurId) {
        const fournisseur = fournisseursData.find((f: Contact) => f.id === fournisseurId);
        nomFournisseur = fournisseur?.societe || '';
      }
      return {
        id: row[0] || String(Date.now() + Math.random()),
        reference: row[1] || '',
        date_achat: row[2] || '',
        date_echeance: row[3] || '',
        date_paiement: row[4] || '',
        fournisseurId,
        modePaiement: row[6] || '',
        montantHTVA: parseFloat(row[7]) || 0,
        montantTTC: parseFloat(row[8]) || 0,
        description: row[9] || '',
        categorie: row[10] || '',
        nomFournisseur
      };
    });
  }

  // Mouvements
  // Mouvements
const dataMouvements = await fetchJSONP(`${GOOGLE_SCRIPT_URL}?action=read&table=Mouvements`);
let mouvementsData: Mouvement[] = [];
if (dataMouvements.success && dataMouvements.data?.length > 1) {
  mouvementsData = dataMouvements.data.slice(1).map((row: any[]) => ({
    id: row[0] ? String(row[0]) : String(Date.now() + Math.random()),
    date: row[1] || '',
    type: row[2] || '',
    articleId: row[3] ? String(row[3]) : '',
    quantite: parseFloat(row[4]) || 0,
    clientId: row[5] ? String(row[5]) : undefined,
    fournisseurId: row[6] ? String(row[6]) : undefined,
    reference: row[7] || '',
    modePaiement: row[8] || '',
    nomArticle: row[9] || '',
    prixUnitaire: parseFloat(row[10]) || 0,
    emplacement: row[11] || '',     // ✅ Nouveau (colonne L)
    nomClient: row[12] || ''         // ✅ Nouveau (colonne M)
  }));
}

  // Factures
const dataFacturation = await fetchJSONP(`${GOOGLE_SCRIPT_URL}?action=read&table=Facturation`);
let facturesData: FactureResume[] = [];
if (dataFacturation.success && dataFacturation.data?.length > 1) {
  facturesData = dataFacturation.data.slice(1).map((row: any[]) => ({
    id: row[0] || String(Date.now() + Math.random()),
    reference: row[1] || '',
    date: row[2] || '',
    client: row[3] || '',
    modePaiement: row[4] || '',
    montant: parseFloat(row[5]) || 0,
    emplacement: row[6] || ''  // ✅ Nouveau
  }));
}

  // Paramètres
  const dataParametres = await fetchJSONP(`${GOOGLE_SCRIPT_URL}?action=read&table=Parametres`);
  let params: Parametres = {
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
  if (dataParametres.success && dataParametres.data?.length > 1) {
    dataParametres.data.slice(1).forEach((row: any[]) => {
      const cle = row[0];
      const valeur = row[1];
      if (cle && params.hasOwnProperty(cle)) {
        (params as any)[cle] = valeur || '';
      }
    });
  }

  return {
    articles: articlesData,
    clients: clientsData,
    fournisseurs: fournisseursData,
    mouvements: mouvementsData,
    factures: facturesData,
    achats: achatsData,
    parametres: params
  };
};

// =============== FONCTIONS DE SAUVEGARDE ===============

export const sauvegarderArticle = async (article: Article, action: 'create' | 'update') => {
  const prixVenteHT = article.prixAchat * (1 + article.margePercent / 100);
  const prixVenteTTC = prixVenteHT * (1 + article.tauxTVA / 100);
  const row = [
    article.id,
    article.numero,
    article.categorie,
    article.nom,
    article.description,
    article.image,
    article.prixAchat,
    article.margePercent,
    article.tauxTVA,
    article.stock,
    article.emplacement,
    prixVenteTTC.toFixed(2),
    article.unite || 'Pièce',
    article.conditionnement || ''
  ];
  const url = `${GOOGLE_SCRIPT_URL}?action=${action}&table=Articles&row=${encodeURIComponent(JSON.stringify(row))}`;
  return await fetchJSONP(url);
};

export const supprimerArticle = async (id: string) => {
  const url = `${GOOGLE_SCRIPT_URL}?action=delete&table=Articles&id=${id}`;
  return await fetchJSONP(url);
};

export const sauvegarderContact = async (contact: Contact, action: 'create' | 'update') => {
  const row = [
    contact.id,
    contact.type,
    contact.societe,
    contact.nom,
    contact.prenom,
    contact.adresse,
    contact.codePostal,
    contact.ville,
    contact.pays,
    contact.mobile,
    contact.numeroTVA,
    contact.numeroCompte,
    contact.email
  ];
  const url = `${GOOGLE_SCRIPT_URL}?action=${action}&table=Client_Fournisseurs&row=${encodeURIComponent(JSON.stringify(row))}`;
  return await fetchJSONP(url);
};

export const supprimerContact = async (id: string) => {
  const url = `${GOOGLE_SCRIPT_URL}?action=delete&table=Client_Fournisseurs&id=${id}`;
  return await fetchJSONP(url);
};

export const enregistrerMouvement = async (mouvement: Omit<Mouvement, 'id'> & { nomArticle?: string; prixUnitaire?: number; emplacement?: string; nomClient?: string }) => {
  const newMouvement = { ...mouvement, id: String(Date.now() + Math.floor(Math.random() * 10000)) };
  const row = [
    newMouvement.id,
    newMouvement.date,
    newMouvement.type,
    newMouvement.articleId,
    newMouvement.quantite,
    newMouvement.clientId || '',
    newMouvement.fournisseurId || '',
    newMouvement.reference,
    newMouvement.modePaiement || '',
    newMouvement.nomArticle || '',
    newMouvement.prixUnitaire || 0,
    newMouvement.emplacement || '',  // ✅ Colonne L
    newMouvement.nomClient || ''     // ✅ Colonne M
  ];
  const url = `${GOOGLE_SCRIPT_URL}?action=create&table=Mouvements&row=${encodeURIComponent(JSON.stringify(row))}`;
  return await fetchJSONP(url);
};

export const sauvegarderFacture = async (facture: FactureResume) => {
  const row = [
    facture.id,
    facture.reference,
    facture.date,
    facture.client,
    facture.modePaiement,
    facture.montant.toFixed(2),
    facture.emplacement || ''  // ✅ Nouveau (colonne G)
  ];
  const url = `${GOOGLE_SCRIPT_URL}?action=create&table=Facturation&row=${encodeURIComponent(JSON.stringify(row))}`;
  return await fetchJSONP(url);
};

export const sauvegarderAchat = async (achat: any, fournisseurs: Contact[]) => {
  const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
  const nomFournisseur = fournisseur?.societe || '';
  const row = [
    achat.id,
    achat.reference,
    achat.date_achat,
    achat.date_echeance || '',
    achat.date_paiement || '',
    achat.fournisseurId,
    achat.modePaiement,
    achat.montantHTVA.toFixed(2),
    achat.montantTTC.toFixed(2),
    achat.description || '',
    achat.categorie,
    nomFournisseur
  ];
  const url = `${GOOGLE_SCRIPT_URL}?action=create&table=Achats&row=${encodeURIComponent(JSON.stringify(row))}`;
  return await fetchJSONP(url);
};

export const modifierAchat = async (achat: any, fournisseurs: Contact[]) => {
  const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
  const nomFournisseur = fournisseur?.societe || '';
  const row = [
    achat.id,
    achat.reference,
    achat.date_achat,
    achat.date_echeance || '',
    achat.date_paiement || '',
    achat.fournisseurId,
    achat.modePaiement,
    achat.montantHTVA.toFixed(2),
    achat.montantTTC.toFixed(2),
    achat.description || '',
    achat.categorie,
    nomFournisseur
  ];
  const url = `${GOOGLE_SCRIPT_URL}?action=update&table=Achats&row=${encodeURIComponent(JSON.stringify(row))}`;
  return await fetchJSONP(url);
};

export const supprimerAchat = async (id: string) => {
  const url = `${GOOGLE_SCRIPT_URL}?action=delete&table=Achats&id=${id}`;
  return await fetchJSONP(url);
};

export const sauvegarderParametres = async (params: Parametres) => {
  const rows = Object.entries(params).map(([cle, valeur]) => [cle, valeur || '']);
  const url = `${GOOGLE_SCRIPT_URL}?action=saveAll&table=Parametres&rows=${encodeURIComponent(JSON.stringify(rows))}`;
  return await fetchJSONP(url);
};

// Charger les catégories
export async function chargerCategories(): Promise<Categorie[]> {
  const data = await fetchJSONP(`${GOOGLE_SCRIPT_URL}?action=read&table=Categories`);
  let categoriesData: Categorie[] = [];
  if (data.success && data.data?.length > 1) {
    categoriesData = data.data.slice(1).map((row: any[]) => ({
      id: row[0] ? String(row[0]) : String(Date.now() + Math.random()),
      denomination: row[1] || ''
    }));
  }
  return categoriesData;
}

// Sauvegarder une catégorie
export async function sauvegarderCategorie(categorie: Categorie, isUpdate: boolean = false): Promise<void> {
  const row = [categorie.id, categorie.denomination];
  const action = isUpdate ? 'update' : 'create';
  const url = `${GOOGLE_SCRIPT_URL}?action=${action}&table=Categories&row=${encodeURIComponent(JSON.stringify(row))}`;
  return await fetchJSONP(url);
}
// Supprimer une catégorie
export async function supprimerCategorie(id: string): Promise<void> {
  const url = `${GOOGLE_SCRIPT_URL}?action=delete&table=Categories&id=${id}`;
  return await fetchJSONP(url);
}
export const supprimerFacture = async (factureId: string) => {
  const url = `${GOOGLE_SCRIPT_URL}?action=delete&table=Facturation&id=${factureId}`;
  return await fetchJSONP(url);
};

export const supprimerMouvement = async (mouvementId: string) => {
  const url = `${GOOGLE_SCRIPT_URL}?action=delete&table=Mouvements&id=${mouvementId}`;
  return await fetchJSONP(url);
};