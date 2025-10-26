'use client';
import { useState, useEffect } from 'react';
import { Settings, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfigPage() {
  const [scriptUrl, setScriptUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        alert('⚠️ Session invalide. Veuillez vous reconnecter.');
        window.location.href = '/';
      }
    };
    getUserEmail();

    const savedUrl = localStorage.getItem('googleScriptUrl');
    if (savedUrl) {
      setScriptUrl(savedUrl);
    }
  }, []);

  const handleSave = async () => {
    if (!scriptUrl.includes('script.google.com') || !scriptUrl.includes('/exec')) {
      alert('⚠️ URL invalide. Elle doit ressembler à : https://script.google.com/macros/s/.../exec');
      return;
    }

    if (!userEmail) {
      alert('⚠️ Email utilisateur non trouvé. Veuillez vous reconnecter.');
      return;
    }

    setSaved(true);

    try {
      // Tester la connexion au script
      const testUrl = scriptUrl + '?action=read&table=Parametres&callback=testCallback' + Date.now();
      await new Promise((resolve, reject) => {
        const callbackName = 'testCallback' + Date.now();
        const script = document.createElement('script');
        const timeout = setTimeout(() => {
          delete (window as any)[callbackName];
          if (document.body.contains(script)) document.body.removeChild(script);
          reject(new Error('Timeout'));
        }, 10000);

        (window as any)[callbackName] = (data: any) => {
          clearTimeout(timeout);
          delete (window as any)[callbackName];
          if (document.body.contains(script)) document.body.removeChild(script);
          resolve(data);
        };

        script.src = testUrl;
        script.onerror = () => {
          clearTimeout(timeout);
          delete (window as any)[callbackName];
          if (document.body.contains(script)) document.body.removeChild(script);
          reject(new Error('Erreur de chargement'));
        };
        document.body.appendChild(script);
      });

      // ✅ SAUVEGARDE CORRECTE : UPSERT avec onConflict
      const { error } = await supabase
        .from('user_configs')
        .upsert(
          { email: userEmail, script_url: scriptUrl },
          { onConflict: 'email' } // ⬅️ Met à jour si l'email existe déjà
        );

      if (error) {
        throw new Error(`Erreur Supabase : ${error.message}`);
      }

      localStorage.setItem('googleScriptUrl', scriptUrl);
      alert('✅ Configuration sauvegardée ! Redirection...');
      setTimeout(() => {
        window.location.href = '/gestion';
      }, 1000);
    } catch (error: any) {
      setSaved(false);
      console.error('Erreur complète:', error);
      if (error.message?.includes('duplicate key')) {
        // Ce cas ne devrait plus arriver grâce à upsert, mais au cas où
        alert('❌ Erreur inattendue : impossible de sauvegarder la configuration.');
      } else if (error.message?.includes('Supabase')) {
        alert('❌ Erreur de sauvegarde : ' + error.message);
      } else {
        alert('❌ Impossible de se connecter au Google Script. Vérifiez :\n\n1. L\'URL est correcte\n2. Le script est bien déployé\n3. Les permissions sont : "Exécuter en tant que: Moi" et "Accès: Tout le monde"');
      }
    }
  };

  const testConnection = async () => {
    if (!scriptUrl.trim()) {
      alert('⚠️ Veuillez entrer une URL d\'abord');
      return;
    }

    if (!scriptUrl.includes('script.google.com') || !scriptUrl.includes('/exec')) {
      alert('⚠️ URL invalide. Elle doit ressembler à : https://script.google.com/macros/s/.../exec');
      return;
    }

    try {
      const testUrl = scriptUrl + '?action=read&table=Parametres&callback=testCallback' + Date.now();
      await new Promise((resolve, reject) => {
        const callbackName = 'testCallback' + Date.now();
        const script = document.createElement('script');
        const timeout = setTimeout(() => {
          delete (window as any)[callbackName];
          if (document.body.contains(script)) document.body.removeChild(script);
          reject(new Error('Timeout'));
        }, 10000);

        (window as any)[callbackName] = (data: any) => {
          clearTimeout(timeout);
          delete (window as any)[callbackName];
          if (document.body.contains(script)) document.body.removeChild(script);
          resolve(data);
        };

        script.src = testUrl;
        script.onerror = () => {
          clearTimeout(timeout);
          delete (window as any)[callbackName];
          if (document.body.contains(script)) document.body.removeChild(script);
          reject(new Error('Erreur de chargement'));
        };
        document.body.appendChild(script);
      });

      alert('✅ Connexion réussie ! Vous pouvez maintenant enregistrer la configuration.');
    } catch (error) {
      alert('❌ Échec de la connexion. Vérifiez :\n\n1. L\'URL est correcte et se termine par /exec\n2. Le script est bien déployé\n3. Permissions : "Exécuter en tant que: Moi" et "Accès: Tout le monde"\n4. Votre connexion Internet');
      console.error('Erreur de test:', error);
    }
  };

  const TEMPLATE_SHEET_ID = '1hybDHrIclQYeVHAGmrxIv26fP7b1TVsGuJgq172ClRw';
  const templateLink = `https://docs.google.com/spreadsheets/d/${TEMPLATE_SHEET_ID}/copy`;

  const googleScriptCode = `function doGet(e) {
  const action = e.parameter.action;
  const table = e.parameter.table;
  const callback = e.parameter.callback;

  try {
    let response;

    if (action === 'read') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(\`Feuille "\${table}" non trouvée\`);
      const data = sheet.getDataRange().getValues();
      
      const formattedData = data.map(row => {
        return row.map(cell => {
          if (cell instanceof Date) {
            const day = String(cell.getDate()).padStart(2, '0');
            const month = String(cell.getMonth() + 1).padStart(2, '0');
            const year = cell.getFullYear();
            const hours = String(cell.getHours()).padStart(2, '0');
            const minutes = String(cell.getMinutes()).padStart(2, '0');
            const seconds = String(cell.getSeconds()).padStart(2, '0');
            return \`\${day}/\${month}/\${year} \${hours}:\${minutes}:\${seconds}\`;
          }
          return cell;
        });
      });
      
      response = { success: true, data: formattedData };
    }
    else if (action === 'create' || action === 'update') {
      const row = JSON.parse(e.parameter.row);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(\`Feuille "\${table}" non trouvée\`);
      if (action === 'create') {
        sheet.appendRow(row);
      } else if (action === 'update') {
        const idToFind = row[0];
        const data = sheet.getDataRange().getValues();
        let rowIndex = -1;
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] == idToFind) {
            rowIndex = i + 1;
            break;
          }
        }
        if (rowIndex !== -1) {
          sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
        }
      }
      response = { success: true };
    }
    else if (action === 'delete') {
      const idToDelete = e.parameter.id;
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(\`Feuille "\${table}" non trouvée\`);
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] == idToDelete) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex !== -1) {
        sheet.deleteRow(rowIndex);
        response = { success: true };
      }
    }
    else if (action === 'saveAll') {
      const rows = JSON.parse(e.parameter.rows);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(\`Feuille "\${table}" non trouvée\`);
      sheet.clear();
      if (rows.length > 0) {
        sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      }
      response = { success: true };
    }

    const output = JSON.stringify(response);
    if (callback) {
      return ContentService.createTextOutput(\`\${callback}(\${output})\`).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    const response = { success: false, error: error.toString() };
    const output = JSON.stringify(response);
    if (callback) {
      return ContentService.createTextOutput(\`\${callback}(\${output})\`).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);
    }
  }
}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Settings size={40} />
            <h1 className="text-4xl font-bold">Configuration Inventix</h1>
          </div>
          <p className="text-blue-100">Configurez votre instance en 4 étapes simples</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-blue-900">Créer votre Google Sheet</h2>
                <p className="text-gray-700 mb-4">Cliquez sur le bouton pour créer une copie du Google Sheet template.</p>
                <a href={templateLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all">
                  <ExternalLink size={20} />
                  <span>Créer ma copie du Google Sheet</span>
                </a>
                <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="font-bold text-blue-900 mb-2">Ce qui sera créé :</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                    <li>7 onglets avec les en-têtes corrects</li>
                    <li>Client VENTE COMPTOIR déjà configuré</li>
                    <li>Structure prête à utiliser</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-purple-500 rounded-lg shadow p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-purple-900">Installer le Google Apps Script</h2>
                <p className="text-gray-700 mb-3">Dans votre copie du Google Sheet, allez dans Extensions - Apps Script</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Supprimez tout le code présent</li>
                  <li>Copiez le code ci-dessous</li>
                  <li>Enregistrez</li>
                </ol>
                <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96">
                  <pre className="text-xs whitespace-pre-wrap font-mono">{googleScriptCode}</pre>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(googleScriptCode); alert('✅ Code copié dans le presse-papier !'); }} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition-all">
                  📋 Copier le code
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-green-500 rounded-lg shadow p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-green-900">Déployer le script</h2>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>Cliquez sur Déployer - Nouveau déploiement</li>
                  <li>Type : Application Web</li>
                  <li className="font-bold text-green-700">⚠️ Exécuter en tant que : Moi</li>
                  <li className="font-bold text-green-700">⚠️ Qui a accès : Tout le monde</li>
                  <li>Déployer et autoriser toutes les permissions</li>
                  <li className="font-bold">📋 Copiez l&apos;URL du déploiement (elle se termine par /exec)</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-orange-500 rounded-lg shadow p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl">4</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-orange-900">Configurer l&apos;application</h2>
                <label className="block text-sm font-bold mb-2 text-gray-700">Collez l&apos;URL de votre Google Apps Script ici :</label>
                <input type="text" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} placeholder="https://script.google.com/macros/s/AKfycby.../exec" className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg mb-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={testConnection} disabled={!scriptUrl.trim()} className={`flex-1 py-3 rounded-lg font-bold transition-all ${scriptUrl.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                    🔍 Tester la connexion
                  </button>
                  <button onClick={handleSave} disabled={!scriptUrl.trim()} className={`flex-1 py-3 rounded-lg font-bold transition-all ${scriptUrl.trim() ? 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                    💾 Enregistrer et démarrer
                  </button>
                </div>
                
                {saved && (
                  <div className="mt-4 bg-green-100 border-2 border-green-500 text-green-800 p-4 rounded-lg animate-pulse">
                    <p className="font-bold text-lg">✅ Configuration enregistrée avec succès !</p>
                    <p className="text-sm">Redirection vers le dashboard en cours...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-6">
            <h3 className="font-bold text-red-900 text-xl mb-3">⚠️ Sécurité et bonnes pratiques</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Ne partagez JAMAIS</strong> l&apos;URL de votre Google Apps Script</li>
              <li>Gardez votre Google Sheet <strong>privé</strong></li>
              <li>Les noms des onglets doivent être <strong>exactement</strong> : Articles, Client_Fournisseurs, Mouvements, Facturation, Achats, Categories, Parametres</li>
              <li>Vous pouvez revenir sur cette page à tout moment pour modifier la configuration</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-300 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 text-lg mb-2">💡 Besoin d&apos;aide ?</h3>
            <p className="text-gray-700 text-sm mb-2">Si vous rencontrez des problèmes, vérifiez que :</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>L&apos;URL se termine bien par <code className="bg-gray-200 px-1 rounded">/exec</code></li>
              <li>Les permissions du script sont correctes (Exécuter : Moi / Accès : Tout le monde)</li>
              <li>Tous les 7 onglets existent dans votre Google Sheet</li>
              <li>Les noms des onglets correspondent exactement (majuscules, underscores, etc.)</li>
              <li>Vous avez autorisé toutes les permissions lors du déploiement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}