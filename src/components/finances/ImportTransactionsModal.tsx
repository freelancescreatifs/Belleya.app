import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ImportTransactionsModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface MappedTransaction {
  date: string;
  amount: string;
  type: string;
  category: string;
  description: string;
  payment_method: string;
  supplier: string;
  notes: string;
}

const FIELD_MAPPINGS = {
  date: ['date', 'jour', 'day'],
  amount: ['montant', 'amount', 'prix', 'price', 'total'],
  type: ['type', 'transaction type', 'nature'],
  category: ['catégorie', 'categorie', 'category'],
  description: ['description', 'libellé', 'libelle', 'label', 'nom', 'name'],
  payment_method: ['paiement', 'payment method', 'mode de paiement', 'payment'],
  supplier: ['fournisseur', 'supplier'],
  notes: ['notes', 'commentaire', 'remarques', 'note', 'comment']
};

export default function ImportTransactionsModal({ onClose, onImportComplete }: ImportTransactionsModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [importResults, setImportResults] = useState({
    revenues: 0,
    expenses: 0,
    skipped: 0,
    errors: 0
  });
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

  const getMappedTransactions = (): MappedTransaction[] => {
    return parsedData.map(row => ({
      date: columnMapping.date ? row[columnMapping.date] || '' : '',
      amount: columnMapping.amount ? row[columnMapping.amount] || '0' : '0',
      type: columnMapping.type ? row[columnMapping.type] || '' : '',
      category: columnMapping.category ? row[columnMapping.category] || '' : '',
      description: columnMapping.description ? row[columnMapping.description] || '' : '',
      payment_method: columnMapping.payment_method ? row[columnMapping.payment_method] || '' : '',
      supplier: columnMapping.supplier ? row[columnMapping.supplier] || '' : '',
      notes: columnMapping.notes ? row[columnMapping.notes] || '' : ''
    })).filter(tx => tx.date && tx.amount && (parseFloat(tx.amount) > 0));
  };

  const handleImport = async () => {
    if (!user) return;

    setStep('importing');
    const transactions = getMappedTransactions();
    let revenues = 0;
    let expenses = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of transactions) {
      if (!tx.date || !tx.amount) {
        skipped++;
        continue;
      }

      try {
        const amount = parseFloat(tx.amount);
        if (isNaN(amount) || amount <= 0) {
          skipped++;
          continue;
        }

        const txType = tx.type.toLowerCase();
        const isRevenue = txType.includes('recette') ||
                          txType.includes('revenue') ||
                          txType.includes('vente') ||
                          txType.includes('encaissement') ||
                          amount > 0;

        if (isRevenue) {
          const revenueType = txType.includes('formation') ? 'formation' :
                             txType.includes('digital') ? 'digital_sale' :
                             txType.includes('commission') ? 'commission' : 'service';

          let paymentMethod = 'cash';
          const pmLower = tx.payment_method.toLowerCase();
          if (pmLower.includes('carte') || pmLower.includes('card')) paymentMethod = 'card';
          else if (pmLower.includes('virement') || pmLower.includes('transfer')) paymentMethod = 'transfer';
          else if (pmLower.includes('paypal')) paymentMethod = 'paypal';
          else if (pmLower.includes('espèce') || pmLower.includes('cash')) paymentMethod = 'cash';
          else if (tx.payment_method) paymentMethod = 'other';

          const { error: insertError } = await supabase
            .from('revenues')
            .insert({
              user_id: user.id,
              date: tx.date,
              amount: Math.abs(amount),
              revenue_type: revenueType,
              payment_method: paymentMethod,
              service_name: tx.description || null,
              notes: tx.notes || null
            });

          if (insertError) {
            errors++;
            console.error('Error inserting revenue:', insertError);
          } else {
            revenues++;
          }
        } else {
          const expenseCategory = tx.category.toLowerCase();
          let category = 'other';

          if (expenseCategory.includes('consommable') || expenseCategory.includes('consumable')) category = 'consumables';
          else if (expenseCategory.includes('matériel') || expenseCategory.includes('equipment')) category = 'equipment';
          else if (expenseCategory.includes('charge') || expenseCategory.includes('fixed')) category = 'fixed_costs';
          else if (expenseCategory.includes('formation') || expenseCategory.includes('training')) category = 'training';
          else if (expenseCategory.includes('investissement') || expenseCategory.includes('investment')) category = 'investment';

          const { error: insertError } = await supabase
            .from('expenses')
            .insert({
              user_id: user.id,
              date: tx.date,
              amount: Math.abs(amount),
              category,
              description: tx.description || 'Dépense importée',
              supplier: tx.supplier || null,
              notes: tx.notes || null
            });

          if (insertError) {
            errors++;
            console.error('Error inserting expense:', insertError);
          } else {
            expenses++;
          }
        }
      } catch (err) {
        errors++;
        console.error('Error processing transaction:', err);
      }
    }

    setImportResults({ revenues, expenses, skipped, errors });
    setStep('complete');
  };

  const handleComplete = () => {
    onImportComplete();
    onClose();
  };

  const downloadTemplate = () => {
    const template = 'Date,Montant,Type,Catégorie,Description,Paiement,Fournisseur,Notes\n2024-01-15,85.00,recette,service,Manucure complète,carte,,Cliente régulière\n2024-01-16,45.50,dépense,consommables,Gels UV,,Beauty Supply,Stock mensuel\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_transactions.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Importer des transactions</h2>
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
                  Importez vos recettes et dépenses depuis un fichier CSV ou Excel
                </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-belleya-primary hover:bg-belleya-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger un modèle CSV
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2 font-medium">Format attendu :</p>
                <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                  <li>Type : "recette" ou "dépense"</li>
                  <li>Paiement : carte, espèces, virement, paypal</li>
                  <li>Catégorie (dépenses) : consommables, matériel, charges fixes, formation, investissement</li>
                </ul>
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
                    date: 'Date',
                    amount: 'Montant',
                    type: 'Type',
                    category: 'Catégorie',
                    description: 'Description',
                    payment_method: 'Mode de paiement',
                    supplier: 'Fournisseur',
                    notes: 'Notes'
                  };

                  const required = ['date', 'amount'];

                  return (
                    <div key={field} className="flex items-center gap-4">
                      <label className="w-40 text-sm font-medium text-gray-700">
                        {labels[field]} {required.includes(field) && <span className="text-red-500">*</span>}
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
                  {getMappedTransactions().length} transactions seront importées
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
                  Aperçu des {getMappedTransactions().slice(0, 10).length} premières transactions à importer
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getMappedTransactions().slice(0, 10).map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{tx.date}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.type.toLowerCase().includes('recette') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {tx.type || 'Recette'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{tx.description}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.amount} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {getMappedTransactions().length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ... et {getMappedTransactions().length - 10} autres transactions
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
                <CheckCircle className="w-16 h-16 text-belleya-vivid mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Import terminé !</h3>
              </div>

              <div className="space-y-3">
                {importResults.revenues > 0 && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Recettes importées</span>
                    <span className="text-lg font-bold text-green-900">{importResults.revenues}</span>
                  </div>
                )}

                {importResults.expenses > 0 && (
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Dépenses importées</span>
                    <span className="text-lg font-bold text-orange-900">{importResults.expenses}</span>
                  </div>
                )}

                {importResults.skipped > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Ignorées (incomplètes)</span>
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
