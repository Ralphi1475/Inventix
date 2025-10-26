'use client';
import { useState, useEffect } from 'react';
import { Settings, ExternalLink } from 'lucide-react';

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
    setTimeout(() => {
      setSaved(false);
      window.location.href = '/';
    }, 2000);
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
                <a href={templateLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">
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
                <button onClick={() => { navigator.clipboard.writeText(googleScriptCode); alert('Code copié !'); }} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold">
                  Copier le code
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
                  <li className="font-bold text-green-700">Exécuter en tant que : Moi</li>
                  <li className="font-bold text-green-700">Qui a accès : Tout le monde</li>
                  <li>Déployer et autoriser</li>
                  <li>Copiez URL du déploiement</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-orange-500 rounded-lg shadow p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl">4</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-orange-900">Configurer application</h2>
                <label className="block text-sm font-bold mb-2 text-gray-700">URL de votre Google Apps Script :</label>
                <input type="text" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..." className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg mb-4 focus:outline-none focus:border-orange-500" />
                <button onClick={handleSave} disabled={!scriptUrl.trim()} className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg ${scriptUrl.trim() ? 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                  {scriptUrl.trim() ? 'Enregistrer et démarrer' : 'Entrez URL du script'}
                </button>
                {saved && (
                  <div className="mt-4 bg-green-100 border-2 border-green-500 text-green-800 p-4 rounded-lg">
                    <p className="font-bold text-lg">Configuration enregistrée !</p>
                    <p className="text-sm">Redirection en cours...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-6">
            <h3 className="font-bold text-red-900 text-xl mb-3">Sécurité</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Ne partagez JAMAIS URL du Google Apps Script</li>
              <li>Gardez votre Google Sheet privé</li>
              <li>Noms des onglets doivent être exacts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}