import { useState, useEffect, useRef } from 'react';
import { FileText, Download, Upload, CheckCircle, Clock, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ClientDocument {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_type: string;
  notes: string | null;
  status: 'pending' | 'viewed' | 'returned';
  returned_file_url: string | null;
  returned_file_name: string | null;
  returned_at: string | null;
  created_at: string;
  company_id: string;
  provider_name?: string;
}

export default function ClientDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (user) loadDocuments();
  }, [user]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function loadDocuments() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select(`
          id,
          title,
          file_url,
          file_name,
          file_type,
          notes,
          status,
          returned_file_url,
          returned_file_name,
          returned_at,
          created_at,
          company_id
        `)
        .eq('client_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const docs = data || [];

      const companyIds = [...new Set(docs.map((d) => d.company_id).filter(Boolean))];
      let providerMap: Record<string, string> = {};
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('company_profiles')
          .select('id, company_name')
          .in('id', companyIds);
        if (companies) {
          companies.forEach((c) => {
            providerMap[c.id] = c.company_name || 'Votre professionnel(le)';
          });
        }
      }

      setDocuments(
        docs.map((d) => ({
          ...d,
          provider_name: providerMap[d.company_id] || 'Votre professionnel(le)',
        }))
      );
    } catch (err) {
      console.error('[ClientDocuments] Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsViewed(doc: ClientDocument) {
    if (doc.status !== 'pending') return;
    try {
      await supabase
        .from('client_documents')
        .update({ status: 'viewed' })
        .eq('id', doc.id)
        .eq('client_user_id', user!.id);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: 'viewed' } : d))
      );
    } catch (err) {
      console.error('[ClientDocuments] Error marking as viewed:', err);
    }
  }

  async function handleDownload(doc: ClientDocument) {
    await markAsViewed(doc);
    window.open(doc.file_url, '_blank');
  }

  async function handleReturnUpload(doc: ClientDocument, file: File) {
    if (!user) return;

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({ type: 'error', message: 'Le fichier est trop grand. Taille maximum: 20 MB' });
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToast({ type: 'error', message: 'Format non supporte. Utilisez PDF, JPG, PNG ou WEBP' });
      return;
    }

    setUploadingId(doc.id);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${doc.company_id}/${doc.id}/returned/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('client_documents')
        .update({
          status: 'returned',
          returned_file_url: urlData.publicUrl,
          returned_file_name: file.name,
          returned_at: new Date().toISOString(),
        })
        .eq('id', doc.id)
        .eq('client_user_id', user.id);

      if (updateError) throw updateError;

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: 'returned',
                returned_file_url: urlData.publicUrl,
                returned_file_name: file.name,
                returned_at: new Date().toISOString(),
              }
            : d
        )
      );

      setToast({ type: 'success', message: 'Document envoye avec succes !' });
    } catch (err: any) {
      console.error('[ClientDocuments] Error uploading return:', err);
      setToast({ type: 'error', message: `Erreur lors de l'envoi: ${err.message || 'Erreur inconnue'}` });
    } finally {
      setUploadingId(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Renvoye
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Eye className="w-3 h-3" />
            Consulte
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
    }
  }

  function getFileIcon(fileType: string) {
    if (fileType === 'application/pdf') return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    return '📎';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Documents partages par votre professionnel(le)
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun document</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Votre professionnel(le) n'a pas encore partage de documents avec vous.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                doc.status === 'returned'
                  ? 'border-green-200'
                  : doc.status === 'viewed'
                  ? 'border-blue-200'
                  : 'border-brand-200'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                      doc.status === 'returned'
                        ? 'bg-green-50'
                        : doc.status === 'viewed'
                        ? 'bg-blue-50'
                        : 'bg-brand-50'
                    }`}
                  >
                    {getFileIcon(doc.file_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          De {doc.provider_name} &bull; {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {doc.notes && (
                      <p className="text-sm text-gray-600 mt-2 p-2.5 bg-gray-50 rounded-lg">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Telecharger
                  </button>

                  {doc.status !== 'returned' && (
                    <>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[doc.id] = el;
                        }}
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReturnUpload(doc, file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => fileInputRefs.current[doc.id]?.click()}
                        disabled={uploadingId === doc.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                      >
                        {uploadingId === doc.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Envoyer ma version
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {doc.status === 'returned' && doc.returned_file_name && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-green-800 truncate">
                        Version envoyee : {doc.returned_file_name}
                      </p>
                      {doc.returned_at && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Le {new Date(doc.returned_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    {doc.returned_file_url && (
                      <button
                        onClick={() => window.open(doc.returned_file_url!, '_blank')}
                        className="text-xs text-green-700 underline flex-shrink-0"
                      >
                        Voir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
