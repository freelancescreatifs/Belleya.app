import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ImportStockModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface MappedItem {
  name: string;
  category: string;
  quantity: string;
  minimum_quantity: string;
  unit_price: string;
  supplier_link: string;
}

const FIELD_MAPPINGS = {
  name: ['nom', 'name', 'article', 'produit', 'product'],
  category: ['catégorie', 'categorie', 'category', 'type'],
  quantity: ['quantité', 'quantite', 'quantity', 'qty', 'stock'],
  minimum_quantity: ['quantité minimum', 'quantite minimum', 'minimum quantity', 'min qty', 'seuil', 'minimum'],
  unit_price: ['prix unitaire', 'prix', 'price', 'unit price', 'cost', 'coût'],
  supplier_link: ['lien fournisseur', 'fournisseur', 'supplier link', 'supplier', 'url']
};

export default function ImportStockModal({ onClose, onImportComplete }: ImportStockModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [importResults, setImportResults] = useState({ imported: 0, skipped: 0, errors: 0 });
  const [error, setError] = useState<string | null>(null);

  const detectColumnMapping = (headers: string[]): { [key: string]: string } => {
    const mapping: { [key: string]: string } = {};

    Object.entries(FIELD_MAPPINGS).forEach(([field, variations]) => {
      const matchedHeader = headers.find(header =>
        variations.some(variation =>
          header.toLowerCase().trim() === variation.toLowerCase()
        )
      );

      if (matchedHeader) {
        mapping[field] = matchedHeader;
      }
    });

    return mapping;
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
    setHeaders(headers);

    const detectedMapping = detectColumnMapping(headers);
    setColumnMapping(detectedMapping);

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: ParsedRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);

        if (data.length === 0) {
          setError('Le fichier est vide ou mal formaté');
          return;
        }

        setParsedData(data);
        setStep('mapping');
      } catch (err) {
        setError('Erreur lors de la lecture du fichier');
        console.error(err);
      }
    };

    reader.readAsText(selectedFile);
  };

  const getMappedItems = (): MappedItem[] => {
    return parsedData.map(row => ({
      name: columnMapping.name ? row[columnMapping.name] || '' : '',
      category: columnMapping.category ? row[columnMapping.category] || '' : '',
      quantity: columnMapping.quantity ? row[columnMapping.quantity] || '0' : '0',
      minimum_quantity: columnMapping.minimum_quantity ? row[columnMapping.minimum_quantity] || '0' : '0',
      unit_price: columnMapping.unit_price ? row[columnMapping.unit_price] || '0' : '0',
      supplier_link: columnMapping.supplier_link ? row[columnMapping.supplier_link] || '' : ''
    })).filter(item => item.name && item.category);
  };

  const handleImport = async () => {
    if (!user) return;

    setStep('importing');
    const items = getMappedItems();
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      if (!item.name || !item.category) {
        skipped++;
        continue;
      }

      try {
        const quantity = parseFloat(item.quantity) || 0;
        const minQuantity = parseFloat(item.minimum_quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;

        let status = 'sufficient';
        if (quantity === 0) {
          status = 'out';
        } else if (quantity <= minQuantity) {
          status = 'low';
        }

        const { error: insertError } = await supabase
          .from('stock_items')
          .insert({
            user_id: user.id,
            name: item.name,
            category: item.category,
            quantity,
            minimum_quantity: minQuantity,
            unit_price: unitPrice,
            supplier_link: item.supplier_link || null,
            status
          });

        if (insertError) {
          errors++;
          console.error('Error inserting stock item:', insertError);
        } else {
          imported++;
        }
      } catch (err) {
        errors++;
        console.error('Error processing stock item:', err);
      }
    }

    setImportResults({ imported, skipped, errors });
    setStep('complete');
  };

  const handleComplete = () => {
    onImportComplete();
    onClose();
  };

  const downloadTemplate = () => {
    const template = 'Nom,Catégorie,Quantité,Quantité minimum,Prix unitaire,Lien fournisseur\nGel UV,Gels,10,5,25.50,https://example.com\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_stock.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Importer des articles</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Importez vos articles de stock depuis un fichier CSV ou Excel
                </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-belleya-primary hover:bg-belleya-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger un modèle CSV
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-belleya-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <Upload className="w-16 h-16 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      Cliquez pour sélectionner un fichier
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV, XLS ou XLSX (max 5 Mo)
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Vérifiez la correspondance automatique des colonnes. Vous pouvez ajuster si nécessaire.
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(FIELD_MAPPINGS).map(([field, _]) => {
                  const labels: { [key: string]: string } = {
                    name: 'Nom',
                    category: 'Catégorie',
                    quantity: 'Quantité',
                    minimum_quantity: 'Quantité minimum',
                    unit_price: 'Prix unitaire',
                    supplier_link: 'Lien fournisseur'
                  };

                  return (
                    <div key={field} className="flex items-center gap-4">
                      <label className="w-40 text-sm font-medium text-gray-700">
                        {labels[field]} {field !== 'supplier_link' && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={columnMapping[field] || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                      >
                        <option value="">-- Non mappé --</option>
                        {headers.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Aperçu ({parsedData.length} lignes détectées)
                </p>
                <p className="text-sm text-gray-600">
                  {getMappedItems().length} articles seront importés
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="flex-1 px-4 py-2 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors"
                >
                  Aperçu
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Aperçu des {getMappedItems().slice(0, 10).length} premiers articles à importer
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nom</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Catégorie</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Qté</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Prix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getMappedItems().slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit_price} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {getMappedItems().length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ... et {getMappedItems().length - 10} autres articles
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('mapping')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-2 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors"
                >
                  Importer
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-belleya-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">Import en cours...</p>
              <p className="text-sm text-gray-600">Ceci peut prendre quelques minutes</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Import terminé !</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Articles importés</span>
                  <span className="text-lg font-bold text-green-900">{importResults.imported}</span>
                </div>

                {importResults.skipped > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Ignorés (incomplets)</span>
                    <span className="text-lg font-bold text-yellow-900">{importResults.skipped}</span>
                  </div>
                )}

                {importResults.errors > 0 && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-800">Erreurs</span>
                    <span className="text-lg font-bold text-red-900">{importResults.errors}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-2 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors"
              >
                Terminer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
