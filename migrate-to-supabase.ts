// scripts/migrate-to-supabase.ts
// Script pour migrer les données de Google Sheets vers Supabase

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = https://virwsoisjscscmyfijsu.supabase.co
const SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcndzb2lzanNjc2NteWZpanN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NzI5OTcsImV4cCI6MjA3NzA0ODk5N30.rPbWHsgyqGIiV6tCuByT3lCQ123zBMYvNsaFRlalhZk;
const GOOGLE_SCRIPT_URL = https://script.google.com/macros/s/AKfycbz-296xp8zvKe5vvP7HopeCGRVurBaWqt7n63HgRHhiY1dYhfEnsIXEvYpibXCPTc43/exec;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Fonction pour récupérer les données de Google Sheets
async function fetchFromGoogleSheets(table: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonpCallback' + Date.now();
    const script = document.createElement('script');
    
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      if (data.success && data.data) {
        resolve(data.data.slice(1)); // Skip header row
      } else {
        reject(new Error('Erreur récupération données'));
      }
    };
    
    script.src = `${GOOGLE_SCRIPT_URL}?action=read&table=${table}&callback=${callbackName}`;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(new Error('Erreur JSONP'));
    };
    
    document.body.appendChild(script);
  });
}

// Migration des articles
async function migrateArticles() {
  console.log('📦 Migration des articles...');
  const rows = await fetchFromGoogleSheets('Articles');
  
  const articles = rows.map((row: any[]) => ({
    id: row[0] || String(Date.now() + Math.random()),
    numero: row[1] || '',
    categorie: row[2] || '',
    nom: row[3] || '',
    description: row[4] || '',
    image: row[5] || '',
    prix_achat: parseFloat(row[6]) || 0,
    marge_percent: parseFloat(row[7]) || 0,
    taux_tva: parseFloat(row[8]) || 0,
    stock: parseInt(row[9]) || 0,
    emplacement: row[10] || '',
    prix_vente_ttc: parseFloat(row[11]) || 0,
    unite: row[12] || 'Pièce',
    conditionnement: row[13] || ''
  }));

  const { error } = await supabase.from('articles').insert(articles);
  if (error) throw error;
  console.log(`✅ ${articles.length} articles migrés`);
}

// Migration des contacts
async function migrateContacts() {
  console.log('👥 Migration des contacts...');
  const rows = await fetchFromGoogleSheets('Client_Fournisseurs');
  
  const contacts = rows.map((row: any[]) => ({
    id: row[0] || String(Date.now() + Math.random()),
    type: row[1] || '',
    societe: row[2] || '',
    nom: row[3] || '',
    prenom: row[4] || '',
    adresse: row[5] || '',
    code_postal: row[6] || '',
    ville: row[7] || '',
    pays: row[8] || '',
    mobile: row[9] || '',
    numero_tva: row[10] || '',
    numero_compte: row[11] || '',
    email: row[12] || ''
  }));

  const { error } = await supabase.from('contacts').insert(contacts);
  if (error) throw error;
  console.log(`✅ ${contacts.length} contacts migrés`);
}

// Migration des mouvements
async function migrateMouvements() {
  console.log('📊 Migration des mouvements...');
  const rows = await fetchFromGoogleSheets('Mouvements');
  
  const mouvements = rows.map((row: any[]) => ({
    id: row[0] || String(Date.now() + Math.random()),
    date: row[1] || '',
    type: row[2] || '',
    article_id: row[3] || '',
    quantite: parseFloat(row[4]) || 0,
    client_id: row[5] || null,
    fournisseur_id: row[6] || null,
    reference: row[7] || '',
    mode_paiement: row[8] || '',
    nom_article: row[9] || '',
    prix_unitaire: parseFloat(row[10]) || 0,
    emplacement: row[11] || '',
    nom_client: row[12] || '',
    rect_date: row[13] || '',
    colonne6: row[14] || '',
    commentaire: row[15] || ''
  }));

  const { error } = await supabase.from('mouvements').insert(mouvements);
  if (error) throw error;
  console.log(`✅ ${mouvements.length} mouvements migrés`);
}

// Migration des factures
async function migrateFactures() {
  console.log('📄 Migration des factures...');
  const rows = await fetchFromGoogleSheets('Facturation');
  
  const factures = rows.map((row: any[]) => ({
    id: row[0] || String(Date.now() + Math.random()),
    reference: row[1] || '',
    date: row[2] || '',
    client: row[3] || '',
    mode_paiement: row[4] || '',
    montant: parseFloat(row[5]) || 0,
    emplacement: row[6] || '',
    commentaire: row[7] || ''
  }));

  const { error } = await supabase.from('factures').insert(factures);
  if (error) throw error;
  console.log(`✅ ${factures.length} factures migrées`);
}

// Migration des achats
async function migrateAchats() {
  console.log('💰 Migration des achats...');
  const rows = await fetchFromGoogleSheets('Achats');
  
  const achats = rows.map((row: any[]) => ({
    id: row[0] || String(Date.now() + Math.random()),
    reference: row[1] || '',
    date_achat: row[2] || '',
    date_echeance: row[3] || '',
    date_paiement: row[4] || '',
    fournisseur_id: row[5] || '',
    mode_paiement: row[6] || '',
    montant_htva: parseFloat(row[7]) || 0,
    montant_ttc: parseFloat(row[8]) || 0,
    description: row[9] || '',
    categorie: row[10] || '',
    nom_fournisseur: row[11] || ''
  }));

  const { error } = await supabase.from('achats').insert(achats);
  if (error) throw error;
  console.log(`✅ ${achats.length} achats migrés`);
}

// Migration des catégories
async function migrateCategories() {
  console.log('🏷️ Migration des catégories...');
  const rows = await fetchFromGoogleSheets('Categories');
  
  const categories = rows.map((row: any[]) => ({
    id: row[0] || String(Date.now() + Math.random()),
    denomination: row[1] || ''
  }));

  const { error } = await supabase.from('categories').insert(categories);
  if (error) throw error;
  console.log(`✅ ${categories.length} catégories migrées`);
}

// Migration des paramètres
async function migrateParametres() {
  console.log('⚙️ Migration des paramètres...');
  const rows = await fetchFromGoogleSheets('Parametres');
  
  const parametres = rows.map((row: any[]) => ({
    cle: row[0],
    valeur: row[1] || ''
  }));

  const { error } = await supabase.from('parametres').upsert(parametres);
  if (error) throw error;
  console.log(`✅ ${parametres.length} paramètres migrés`);
}

// Fonction principale
export async function runMigration() {
  try {
    console.log('🚀 Début de la migration...');
    
    await migrateArticles();
    await migrateContacts();
    await migrateMouvements();
    await migrateFactures();
    await migrateAchats();
    await migrateCategories();
    await migrateParametres();
    
    console.log('✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    throw error;
  }
}

// Si exécuté directement
if (typeof window !== 'undefined') {
  (window as any).runMigration = runMigration;
  console.log('💡 Pour lancer la migration, exécutez: runMigration()');
}
