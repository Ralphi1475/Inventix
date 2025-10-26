'use client';
import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';

export default function ConfigPage() {
  const [scriptUrl, setScriptUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('googleScriptUrl');
    if (savedUrl) {
      setScriptUrl(savedUrl);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('googleScriptUrl', scriptUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    window.location.href = '/';
  };

  // ✅ Code Google Apps Script en tant que STRING
  const googleScriptCode = `// Code.gs - À copier dans votre Google Apps Script

function doGet(e) {
  const action = e.parameter.action;
  const table = e.parameter.table;
  const callback = e.parameter.callback;

  try {
    let response;

    if (action === 'read') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(\`Feuille "\${table}" non trouvée\`);
      const data = sheet.getDataRange().getValues();
      
      // Convertir toutes les dates en strings
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
        } else {
          throw new Error(\`Ligne avec ID \${idToFind} non trouvée\`);
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
      } else {
        throw new Error(\`Ligne avec ID \${idToDelete} non trouvée\`);
      }
    }
    else if (action === 'saveAll') {
      const rowsJson = e.parameter.rows;
      if (!rowsJson) throw new Error("Paramètre 'rows' manquant");
      const rows = JSON.parse(rowsJson);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(\`Feuille "\${table}" non trouvée\`);
      sheet.clear();
      if (rows.length > 0) {
        sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      }
      response = { success: true };
    }
    else {
      throw new Error(\`Action "\${action}" non supportée\`);
    }

    const output = JSON.stringify(response);
    if (callback) {
      return ContentService
        .createTextOutput(\`\${callback}(\${output})\`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(output)
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    const response = { success: false, error: error.toString() };
    const output = JSON.stringify(response);
    if (callback) {
      return ContentService
        .createTextOutput(\`\${callback}(\${output})\`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(output)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Settings size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold">Configuration de l'application</h1>
        </div>

        <div className="space-y-6">
          {/* Étape 1 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-blue-900">📋 Étape 1 : Créer votre Google Sheet</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Créez un nouveau <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">Google Sheet</a></li>
              <li>Créez les feuilles suivantes (onglets) :
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li><strong>Articles</strong></li>
                  <li><strong>Client_Fournisseurs</strong></li>
                  <li><strong>Mouvements</strong></li>
                  <li><strong>Facturation</strong></li>
                  <li><strong>Achats</strong></li>
                  <li><strong>Categories</strong></li>
                  <li><strong>Parametres</strong></li>
                </ul>
              </li>
              <li className="mt-2">Dans chaque feuille, créez une première ligne d'en-têtes (vous pouvez les personnaliser)</li>
            </ol>
          </div>

          {/* Étape 2 */}
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-green-900">⚙️ Étape 2 : Installer le Google Apps Script</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Dans votre Google Sheet, allez dans <strong>Extensions → Apps Script</strong></li>
              <li>Supprimez tout le code présent</li>
              <li>Copiez-collez le code ci-dessous :</li>
            </ol>
            
            <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs whitespace-pre-wrap">{googleScriptCode}</pre>
            </div>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(googleScriptCode);
                alert('Code copié dans le presse-papier !');
              }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              📋 Copier le code
            </button>
          </div>

          {/* Étape 3 */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-purple-900">🚀 Étape 3 : Déployer le script</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Dans l'éditeur Apps Script, cliquez sur <strong>Déployer → Nouveau déploiement</strong></li>
              <li>Type : <strong>Application Web</strong></li>
              <li>Description : "API Gestion Stock" (ou autre)</li>
              <li><strong>Exécuter en tant que : Moi</strong> ⚠️ IMPORTANT</li>
              <li><strong>Qui a accès : Tout le monde</strong> ⚠️ IMPORTANT</li>
              <li>Cliquez sur <strong>Déployer</strong></li>
              <li>Autorisez l'accès (cliquez sur "Paramètres avancés" si nécessaire)</li>
              <li><strong>Copiez l'URL du déploiement</strong> (elle se termine par <code>/exec</code>)</li>
            </ol>
          </div>

          {/* Étape 4 */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-orange-900">🔗 Étape 4 : Configurer l'application</h2>
            <label className="block text-sm font-medium mb-2">
              Collez l'URL de votre Google Apps Script ici :
            </label>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycby.../exec"
              className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg mb-4 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={handleSave}
              disabled={!scriptUrl.trim()}
              className={`w-full py-3 rounded-lg font-bold ${
                scriptUrl.trim()
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              💾 Enregistrer et démarrer l'application
            </button>
            {saved && (
              <div className="mt-4 bg-green-100 border border-green-500 text-green-800 p-3 rounded">
                ✅ Configuration enregistrée ! Redirection en cours...
              </div>
            )}
          </div>

          {/* Notes importantes */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Important</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Ne partagez JAMAIS l'URL de votre Google Apps Script</li>
              <li>Gardez votre Google Sheet privé</li>
              <li>Vous pouvez modifier cette configuration à tout moment en revenant sur cette page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}