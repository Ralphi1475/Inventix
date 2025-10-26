// /src/lib/api.ts
import { Article, Contact, Mouvement, Parametres, FactureResume, Categorie } from '@/types';

// ✅ Fonction pour obtenir l'URL depuis le localStorage
const getGoogleScriptUrl = (): string => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('googleScriptUrl');
    if (!url) {
      console.warn('⚠️ URL Google Script non configurée');
      return '';
    }
    return url;
  }
  return '';
};

/**
 * Fonction utilitaire pour effectuer des requêtes JSONP vers Google Apps Script
 */
export const fetchJSONP = (endpoint: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const baseUrl = getGoogleScriptUrl();
    
    if (!baseUrl) {
      const error = new Error('⚠️ Application non configurée.\n\nVeuillez aller dans Configuration pour entrer l\'URL de votre Google Script.');
      console.error(error.message);
      alert(error.message + '\n\nRedirection vers la configuration...');
      setTimeout(() => {
        window.location.href = '/config';
      }, 2000);
      reject(error);
      return;
    }

    const callbackName = 'jsonpCallback' + Date.now();
    const script = document.createElement('script');
    
    // ✅ Timeout de 15 secondes
    const timeoutId = setTimeout(() => {
      delete (window as any)[callbackName];
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      const error = new Error('⏱️ Délai d\'attente dépassé (15s)');
      console.error('Timeout JSONP:', error);
      alert('⏱️ La requête a pris trop de temps.\n\nVérifiez :\n1. Votre connexion Internet\n2. Que le script Google est bien déployé\n3. Les permissions du script');
      reject(error);
    }, 15000);
    
    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timeoutId);
      delete (window as any)[callbackName];
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      
      // ✅ Vérifier si la réponse indique une erreur
      if (data && data.success === false) {
        const errorMsg = data.error || 'Erreur inconnue';
        console.error('Erreur serveur:', errorMsg);
        alert(`❌ Erreur du serveur Google Script :\n\n${errorMsg}\n\nVérifiez la configuration de votre script.`);
        reject(new Error(errorMsg));
      } else {
        resolve(data);
      }
    };
    
    const separator = endpoint.includes('?') ? '&' : '?';
    const fullUrl = baseUrl + endpoint + separator + 'callback=' + callbackName;
    script.src = fullUrl;
    
    script.onerror = () => {
      clearTimeout(timeoutId);
      delete (window as any)[callbackName];
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      const error = new Error('❌ Impossible de contacter le Google Script');
      console.error('Erreur JSONP:', error);
      console.error('URL tentée:', fullUrl);
      alert('❌ Impossible de contacter le Google Script.\n\nVérifiez que :\n1. L\'URL est correcte et se termine par /exec\n2. Le script est bien déployé\n3. Les permissions sont : "Exécuter en tant que: Moi" et "Accès: Tout le monde"\n4. Votre connexion Internet fonctionne');
      reject(error);
    };
    
    document.body.appendChild(script);
  });
};

/**
 * Charge toutes les données depuis Google Sheets
 */
export const chargerDonnees = async () => {
  try {
    // Articles
    const dataArticles = await fetchJSONP(`?action=read&table=Articles`);
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
    const dataContacts = await fetchJSONP(`?action=read&table=Client_Fournisseurs`);
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
    const dataAchats = await fetchJSONP(`?action=read&table=Achats`);
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
    const dataMouvements = await fetchJSONP(`?action=read&table=Mouvements`);
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
        emplacement: row[11] || '',
        nomClient: row[12] || ''
      }));
    }

    // Factures
    const dataFacturation = await fetchJSONP(`?action=read&table=Facturation`);
    let facturesData: FactureResume[] = [];
    if (dataFacturation.success && dataFacturation.data?.length > 1) {
      facturesData = dataFacturation.data.slice(1).map((row: any[]) => ({
        id: row[0] || String(Date.now() + Math.random()),
        reference: row[1] || '',
        date: row[2] || '',
        client: row[3] || '',
        modePaiement: row[4] || '',
        montant: parseFloat(row[5]) || 0,
        emplacement: row[6] || ''
      }));
    }

    // Paramètres
    const dataParametres = await fetchJSONP(`?action=read&table=Parametres`);
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
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    throw error;
  }
};

// =============== FONCTIONS DE SAUVEGARDE ===============

export const sauvegarderArticle = async (article: Article, action: 'create' | 'update') => {
  try {
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
    const result = await fetchJSONP(`?action=${action}&table=Articles&row=${encodeURIComponent(JSON.stringify(row))}`);
    console.log('✅ Article sauvegardé:', article.nom);
    return result;
  } catch (error) {
    console.error('❌ Erreur sauvegarde article:', error);
    throw error;
  }
};

export const supprimerArticle = async (id: string) => {
  try {
    const result = await fetchJSONP(`?action=delete&table=Articles&id=${id}`);
    console.log('✅ Article supprimé:', id);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression article:', error);
    throw error;
  }
};

export const sauvegarderContact = async (contact: Contact, action: 'create' | 'update') => {
  try {
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
    const result = await fetchJSONP(`?action=${action}&table=Client_Fournisseurs&row=${encodeURIComponent(JSON.stringify(row))}`);
    console.log('✅ Contact sauvegardé:', contact.societe || contact.nom);
    return result;
  } catch (error) {
    console.error('❌ Erreur sauvegarde contact:', error);
    throw error;
  }
};

export const supprimerContact = async (id: string) => {
  try {
    const result = await fetchJSONP(`?action=delete&table=Client_Fournisseurs&id=${id}`);
    console.log('✅ Contact supprimé:', id);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression contact:', error);
    throw error;
  }
};

export const enregistrerMouvement = async (mouvement: Omit<Mouvement, 'id'> & { nomArticle?: string; prixUnitaire?: number; emplacement?: string; nomClient?: string }) => {
  try {
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
      newMouvement.emplacement || '',
      newMouvement.nomClient || ''
    ];
    const result = await fetchJSONP(`?action=create&table=Mouvements&row=${encodeURIComponent(JSON.stringify(row))}`);
    console.log('✅ Mouvement enregistré:', newMouvement.type);
    return result;
  } catch (error) {
    console.error('❌ Erreur enregistrement mouvement:', error);
    throw error;
  }
};

export const sauvegarderFacture = async (facture: FactureResume) => {
  try {
    const row = [
      facture.id,
      facture.reference,
      facture.date,
      facture.client,
      facture.modePaiement,
      facture.montant.toFixed(2),
      facture.emplacement || ''
    ];
    const result = await fetchJSONP(`?action=create&table=Facturation&row=${encodeURIComponent(JSON.stringify(row))}`);
    console.log('✅ Facture sauvegardée:', facture.reference);
    return result;
  } catch (error) {
    console.error('❌ Erreur sauvegarde facture:', error);
    throw error;
  }
};

export const sauvegarderAchat = async (achat: any, fournisseurs: Contact[]) => {
  try {
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
    const result = await fetchJSONP(`?action=create&table=Achats&row=${encodeURIComponent(JSON.stringify(row))}`);
    console.log('✅ Achat sauvegardé:', achat.reference);
    return result;
  } catch (error) {
    console.error('❌ Erreur sauvegarde achat:', error);
    throw error;
  }
};

export const modifierAchat = async (achat: any, fournisseurs: Contact[]) => {
  try {
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
    const result = await fetchJSONP(`?action=update&table=Achats&row=${encodeURIComponent(JSON.stringify(row))}`);
    console.log('✅ Achat modifié:', achat.reference);
    return result;
  } catch (error) {
    console.error('❌ Erreur modification achat:', error);
    throw error;
  }
};

export const supprimerAchat = async (id: string) => {
  try {
    const result = await fetchJSONP(`?action=delete&table=Achats&id=${id}`);
    console.log('✅ Achat supprimé:', id);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression achat:', error);
    throw error;
  }
};

export const sauvegarderParametres = async (params: Parametres) => {
  try {
    const rows = Object.entries(params).map(([cle, valeur]) => [cle, valeur || '']);
    const result = await fetchJSONP(`?action=saveAll&table=Parametres&rows=${encodeURIComponent(JSON.stringify(rows))}`);
    console.log('✅ Paramètres sauvegardés');
    return result;
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    throw error;
  }
};

export async function chargerCategories(): Promise<Categorie[]> {
  try {
    const data = await fetchJSONP(`?action=read&table=Categories`);
    let categoriesData: Categorie[] = [];
    if (data.success && data.data?.length > 1) {
      categoriesData = data.data.slice(1).map((row: any[]) => ({
        id: row[0] ? String(row[0]) : String(Date.now() + Math.random()),
        denomination: row[1] || ''
      }));
    }
    return categoriesData;
  } catch (error) {
    console.error('❌ Erreur chargement catégories:', error);
    throw error;
  }
}

export async function sauvegarderCategorie(categorie: Categorie, isUpdate: boolean = false): Promise<void> {
  try {
    const row = [categorie.id, categorie.denomination];
    const action = isUpdate ? 'update' : 'create';
    const result = await fetchJSONP(`?action=${action}&table=Categories&row=${encodeURIComponent(JSON.stringify(row))}`);
    console.log('✅ Catégorie sauvegardée:', categorie.denomination);
    return result;
  } catch (error) {
    console.error('❌ Erreur sauvegarde catégorie:', error);
    throw error;
  }
}

export async function supprimerCategorie(id: string): Promise<void> {
  try {
    const result = await fetchJSONP(`?action=delete&table=Categories&id=${id}`);
    console.log('✅ Catégorie supprimée:', id);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression catégorie:', error);
    throw error;
  }
}

export const supprimerFacture = async (factureId: string) => {
  try {
    const result = await fetchJSONP(`?action=delete&table=Facturation&id=${factureId}`);
    console.log('✅ Facture supprimée:', factureId);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression facture:', error);
    throw error;
  }
};

export const supprimerMouvement = async (mouvementId: string) => {
  try {
    const result = await fetchJSONP(`?action=delete&table=Mouvements&id=${mouvementId}`);
    console.log('✅ Mouvement supprimé:', mouvementId);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression mouvement:', error);
    throw error;
  }
};