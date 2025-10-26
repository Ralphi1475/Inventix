export interface Article {
  id: string;
  numero: string;
  categorie: string;
  nom: string;
  description: string;
  image: string;
  prixAchat: number;
  margePercent: number;
  tauxTVA: number;
  stock: number;
  emplacement: string;
  prixVenteTTC?: number;
  prixVenteHT?: number;
  unite: string;
  conditionnement: string;
}

export interface Contact {
  id: string;
  type: string;
  societe: string;
  nom: string;
  prenom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  mobile: string;
  numeroTVA: string;
  numeroCompte: string;
  email: string;
}

export interface Mouvement {
  id: string;
  date: string;
  type: 'entree' | 'vente' | 'venteComptoir'; // ✅ Ajout venteComptoir
  articleId: string;
  quantite: number;
  clientId?: string;
  fournisseurId?: string;
  reference: string;
  modePaiement?: string;
  nomArticle?: string;
  prixUnitaire?: number;
  emplacement?: string;  // ✅ Nouveau
  nomClient?: string;    // ✅ Nouveau
}

export interface Parametres {
  societe_nom: string;
  societe_adresse: string;
  societe_code_postal: string;
  societe_ville: string;
  societe_pays: string;
  societe_telephone: string;
  societe_email: string;
  societe_tva: string;
  societe_iban: string;
}

export interface LignePanier {
  article: Article;
  quantite: number;
  prixUnitairePersonnalise?: number; // ✅ Nouveau champ optionnel
}

export interface FactureResume {
  id: string;
  reference: string;
  date: string;
  client: string;
  modePaiement: string;
  montant: number;
  emplacement?: string; // ✅ Nouveau
}

export interface Categorie {
  id: string;
  denomination: string;
}