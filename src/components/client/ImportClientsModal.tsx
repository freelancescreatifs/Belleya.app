import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { useAuth } from '../../contexts/AuthContext';

interface ImportClientsModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface MappedClient {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  instagram: string;
  notes: string;
}

const FIELD_MAPPINGS = {
  first_name: ['prénom', 'prenom', 'first name', 'firstname', 'fname'],
  last_name: ['nom', 'nom de famille', 'last name', 'lastname', 'surname', 'lname'],
  email: ['email', 'e-mail', 'adresse email', 'mail', 'courriel'],
  phone: ['téléphone', 'telephone', 'tel', 'phone', 'mobile', 'portable'],
  instagram: ['instagram', 'insta', 'pseudo instagram', '@', 'ig'],
  notes: ['notes', 'commentaire', 'remarques', 'note', 'comment']
};

export default function ImportClientsModal({ onClose, onImportComplete }: ImportClientsModalProps) {
  const { user, profile } = useAuth();
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

  const getMappedClients = (): MappedClient[] => {
    return parsedData.map(row => ({
      first_name: columnMapping.first_name ? row[columnMapping.first_name] || '' : '',
      last_name: columnMapping.last_name ? row[columnMapping.last_name] || '' : '',
      email: columnMapping.email ? row[columnMapping.email] || '' : '',
      phone: columnMapping.phone ? row[columnMapping.phone] || '' : '',
      instagram: columnMapping.instagram ? row[columnMapping.instagram] || '' : '',
      notes: columnMapping.notes ? row[columnMapping.notes] || '' : ''
    })).filter(client => client.first_name || client.last_name || client.email || client.phone);
  };

  const [emailsSent, setEmailsSent] = useState(0);
  const [emailsFailed, setEmailsFailed] = useState(false);

  const handleImport = async () => {
    if (!user || !profile?.company_id) return;

    setStep('importing');
    const clients = getMappedClients();
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const importedWithEmail: { email: string; firstName: string }[] = [];

    for (const client of clients) {
      if (!client.first_name && !client.last_name) {
        skipped++;
        continue;
      }

      try {
        if (client.email || client.phone) {
          const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .or(`email.eq.${client.email},phone.eq.${client.phone}`)
            .maybeSingle();

          if (existing) {
            skipped++;
            continue;
          }
        }

        const { error: insertError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            company_id: profile.company_id,
            first_name: client.first_name || 'N/A',
            last_name: client.last_name || 'N/A',
            email: client.email || null,
            phone: client.phone || null,
            instagram_handle: client.instagram || null,
            notes: client.notes || null
          });

        if (insertError) {
          errors++;
          console.error('Error inserting client:', insertError);
        } else {
          imported++;
          if (client.email) {
            importedWithEmail.push({ email: client.email, firstName: client.first_name || 'Client(e)' });
          }
        }
      } catch (err) {
        errors++;
        console.error('Error processing client:', err);
      }
    }

    if (importedWithEmail.length > 0) {
      try {
        const { data: company } = await supabase
          .from('company_profiles')
          .select('company_name, booking_slug')
          .eq('user_id', user.id)
          .maybeSingle();

        if (company) {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: {
              clients: importedWithEmail,
              providerName: company.company_name || 'Votre professionnel(le)',
              bookingSlug: company.booking_slug || null,
            },
          });

          if (emailError || emailResult?.failed > 0) {
            console.error('Welcome emails error:', emailError || emailResult);
            setEmailsFailed(true);
          } else {
            setEmailsSent(emailResult?.sent || importedWithEmail.length);
          }
        }
      } catch (e) {
        console.error('Welcome emails failed:', e);
        setEmailsFailed(true);
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
    const template = 'Prénom,Nom,Email,Téléphone,Instagram,Notes\nMarie,Dupont,marie@example.com,0612345678,@marie.insta,Cliente fidèle\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_clients.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Importer des clientes</h2>
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
                  Importez vos clientes depuis un fichier CSV ou Excel
                </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger un modèle CSV
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-brand-400 transition-colors">
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
                    first_name: 'Prénom',
                    last_name: 'Nom',
                    email: 'Email',
                    phone: 'Téléphone',
                    instagram: 'Instagram',
                    notes: 'Notes'
                  };

                  return (
                    <div key={field} className="flex items-center gap-4">
                      <label className="w-32 text-sm font-medium text-gray-700">
                        {labels[field]}
                      </label>
                      <select
                        value={columnMapping[field] || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
                  {getMappedClients().length} clientes seront importées
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
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
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
                  Aperçu des {getMappedClients().length} premières clientes à importer
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Prénom</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nom</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getMappedClients().slice(0, 10).map((client, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{client.first_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{client.last_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {getMappedClients().length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ... et {getMappedClients().length - 10} autres clientes
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
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Importer
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Import en cours...</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-belaya-vivid mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Import terminé !</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Clientes importées</span>
                  <span className="text-lg font-bold text-green-900">{importResults.imported}</span>
                </div>

                {importResults.skipped > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Ignorées (doublons)</span>
                    <span className="text-lg font-bold text-yellow-900">{importResults.skipped}</span>
                  </div>
                )}

                {importResults.errors > 0 && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-800">Erreurs</span>
                    <span className="text-lg font-bold text-red-900">{importResults.errors}</span>
                  </div>
                )}

                {emailsSent > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Emails de bienvenue envoyés</span>
                    <span className="text-lg font-bold text-blue-900">{emailsSent}</span>
                  </div>
                )}

                {emailsFailed && (
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Emails de bienvenue non envoyés (erreur)</span>
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                )}
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
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
