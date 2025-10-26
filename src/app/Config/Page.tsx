'use client';
import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';

export default function ConfigPage() {
  const [scriptUrl, setScriptUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Charger l'URL sauvegardée
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Settings size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold">Configuration</h1>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Étape 1 : Créer votre Google Sheet</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Ouvrez le <a href="https://docs.google.com/spreadsheets/d/VOTRE_SHEET_TEMPLATE_ID/copy" target="_blank" className="text-blue-600 underline">modèle Google Sheet</a></li>
              <li>Cliquez sur "Créer une copie"</li>
              <li>Dans votre copie, allez dans <strong>Extensions → Apps Script</strong></li>
              <li>Copiez le code du script (fourni ci-dessous)</li>
              <li>Cliquez sur <strong>Déployer → Nouveau déploiement</strong></li>
              <li>Type : <strong>Application Web</strong></li>
              <li>Exécuter en tant que : <strong>Moi</strong></li>
              <li>Qui a accès : <strong>Tout le monde</strong></li>
              <li>Déployez et copiez l'URL</li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Étape 2 : Configurez l'application</h2>
            <label className="block text-sm font-medium mb-2">
              URL de votre Google Apps Script
            </label>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold"
            >
              Enregistrer et démarrer
            </button>
            {saved && (
              <div className="mt-4 bg-green-100 border border-green-500 text-green-800 p-3 rounded">
                ✅ Configuration enregistrée avec succès !
              </div>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">📋 Code Google Apps Script à copier :</h3>
            <pre className="bg-white p-4 rounded text-xs overflow-x-auto">
{`// Copiez tout ce code dans votre Google Apps Script
function doGet(e) {
 // Code.gs

function doGet(e) {
  const action = e.parameter.action;
  const table = e.parameter.table;
  const callback = e.parameter.callback; // Pour JSONP

  try {
    let response;

    if (action === 'read') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(`Feuille "${table}" non trouvée`);
      const data = sheet.getDataRange().getValues();
      
      // ✅ Convertir toutes les dates en strings pour éviter les problèmes de timezone
      const formattedData = data.map(row => {
        return row.map(cell => {
          if (cell instanceof Date) {
            // Formater en DD/MM/YYYY HH:MM:SS
            const day = String(cell.getDate()).padStart(2, '0');
            const month = String(cell.getMonth() + 1).padStart(2, '0');
            const year = cell.getFullYear();
            const hours = String(cell.getHours()).padStart(2, '0');
            const minutes = String(cell.getMinutes()).padStart(2, '0');
            const seconds = String(cell.getSeconds()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
          }
          return cell;
        });
      });
      
      response = { success: true, data: formattedData };
    }
    else if (action === 'create' || action === 'update') {
      const row = JSON.parse(e.parameter.row);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(`Feuille "${table}" non trouvée`);
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
          throw new Error(`Ligne avec ID ${idToFind} non trouvée`);
        }
      }
      response = { success: true };
    }
    else if (action === 'delete') {
      const idToDelete = e.parameter.id;
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(`Feuille "${table}" non trouvée`);
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
        throw new Error(`Ligne avec ID ${idToDelete} non trouvée`);
      }
    }
    else if (action === 'saveAll') {
      // ✅ NOUVELLE ACTION : sauvegarde tous les paramètres d'un coup
      const rowsJson = e.parameter.rows;
      if (!rowsJson) throw new Error("Paramètre 'rows' manquant");
      const rows = JSON.parse(rowsJson);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (!sheet) throw new Error(`Feuille "${table}" non trouvée`);
      sheet.clear();
      if (rows.length > 0) {
        sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      }
      response = { success: true };
    }
    else {
      throw new Error(`Action "${action}" non supportée`);
    }

    // Réponse JSONP ou JSON
    const output = JSON.stringify(response);
    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${output})`)
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
        .createTextOutput(`${callback}(${output})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(output)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

// doPost n'est pas utilisé ici car tout passe par JSONP (doGet)
function doPost(e) {
  return doGet(e);
}
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}