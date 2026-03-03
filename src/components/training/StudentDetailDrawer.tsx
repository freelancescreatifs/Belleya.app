import { useState, useEffect } from 'react';
import { X, Edit, Trash2, Upload, Mail, FileText, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';
import type { StudentWithDetails, StudentDocument, DocumentStage, DocumentType } from '../../types/training';
import { calculateStudentStatus, getStatusLabel, getStatusColor } from '../../lib/studentHelpers';
import StudentForm from './StudentForm';

interface StudentDetailDrawerProps {
  studentId: string;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

const REQUIRED_DOCUMENTS_BY_STAGE: Record<DocumentStage, { type: DocumentType; label: string; required?: boolean }[]> = {
  before: [
    { type: 'contract', label: 'Contrat signé', required: true },
    { type: 'signed_quote', label: 'Devis signé', required: true },
    { type: 'signed_rules', label: 'Règlement intérieur signé', required: true },
    { type: 'other', label: 'Autre document', required: false },
  ],
  during: [
    { type: 'skills_assessment', label: 'Évaluation des acquis', required: true },
    { type: 'satisfaction_survey', label: 'Questionnaire de satisfaction', required: true },
    { type: 'other', label: 'Autre document', required: false },
  ],
  after: [
    { type: 'other', label: 'Autre document', required: false },
  ],
};

export default function StudentDetailDrawer({ studentId, onClose, onDeleted, onUpdated }: StudentDetailDrawerProps) {
  const { profile, user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [student, setStudent] = useState<StudentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('company_profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.company_name) setCompanyName(data.company_name);
        });
    }
  }, [user?.id]);

  async function loadStudent() {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          documents:student_documents(*)
        `)
        .eq('id', studentId)
        .eq('company_id', profile.company_id)
        .single();

      if (error) throw error;

      const calculatedStatus = calculateStudentStatus(data.training_start_date, data.training_end_date);

      setStudent({
        ...data,
        status: calculatedStatus,
      } as StudentWithDetails);
    } catch (error) {
      console.error('Error loading student:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!student) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${student.first_name} ${student.last_name} ? Cette action est irréversible.`)) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleFileUpload(docType: DocumentType, stage: DocumentStage, file: File) {
    if (!student || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/students/${student.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('student_documents')
        .insert({
          student_id: student.id,
          document_type: docType,
          document_stage: stage,
          file_path: urlData.publicUrl,
          custom_name: file.name,
          uploaded_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      loadStudent();
      onUpdated();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: StudentDocument) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const filePath = doc.file_path.split('/student-documents/')[1];
      if (filePath) {
        await supabase.storage.from('student-documents').remove([filePath]);
      }

      const { error } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      loadStudent();
      onUpdated();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleRenameDocument(doc: StudentDocument) {
    const newName = prompt('Nouveau nom du document:', doc.custom_name || doc.file_path.split('/').pop() || '');
    if (!newName || newName === (doc.custom_name || doc.file_path.split('/').pop())) return;

    try {
      const { error } = await supabase
        .from('student_documents')
        .update({ custom_name: newName })
        .eq('id', doc.id);

      if (error) throw error;

      loadStudent();
      onUpdated();
    } catch (error) {
      console.error('Error renaming document:', error);
      alert('Erreur lors du renommage');
    }
  }

  function getDocumentsByType(type: DocumentType, stage: DocumentStage): StudentDocument[] {
    return student?.documents?.filter(d => d.document_type === type && d.document_stage === stage) || [];
  }

  function isDocumentRequired(stage: DocumentStage): boolean {
    if (!student) return false;

    const status = student.status;

    if (stage === 'before') return true;
    if (stage === 'during') return status === 'in_progress' || status === 'completed';
    if (stage === 'after') return status === 'completed';

    return false;
  }

  function handleOpenEmailModal() {
    if (!student?.email) {
      alert('Aucun email configuré pour cet élève');
      return;
    }
    setSelectedDocuments(new Set());
    setShowEmailModal(true);
  }

  async function handleSendEmail(subject: string, message: string) {
    if (!student?.email) return;
    setSendingEmail(true);
    try {
      const attachments = Array.from(selectedDocuments)
        .map(id => {
          const doc = student?.documents?.find(d => d.id === id);
          if (!doc) return null;
          return {
            name: doc.file_path.split('/').pop() || 'document',
            url: doc.file_path,
          };
        })
        .filter(Boolean);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-student-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: student.email,
          subject,
          message,
          studentName: `${student.first_name} ${student.last_name}`,
          providerName: companyName || 'Votre formatrice',
          attachments,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Échec de l\'envoi');
      }

      showToast('success', 'Email envoyé avec succès');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('error', 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-red-600">Élève introuvable</div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)} mt-2`}>
              {getStatusLabel(student.status)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditStudent(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {student.photo_url && (
            <div className="flex justify-center">
              <img
                src={student.photo_url}
                alt={`${student.first_name} ${student.last_name}`}
                className="w-32 h-32 object-cover rounded-full border-4 border-gray-200"
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Informations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{student.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium">{student.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instagram</p>
                <p className="font-medium">{student.instagram_username || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de début</p>
                <p className="font-medium">{new Date(student.training_start_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de fin</p>
                <p className="font-medium">{new Date(student.training_end_date).toLocaleDateString('fr-FR')}</p>
              </div>
              {student.training_level && (
                <div>
                  <p className="text-sm text-gray-600">Niveau</p>
                  <p className="font-medium">{student.training_level}</p>
                </div>
              )}
              {student.internal_notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Notes internes</p>
                  <p className="font-medium whitespace-pre-wrap">{student.internal_notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Documents</h3>
              <button
                onClick={handleOpenEmailModal}
                disabled={!student.email}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  student.email
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={!student.email ? 'Email manquant' : 'Envoyer un email à l\'élève'}
              >
                <Mail className="w-4 h-4" />
                Envoyer un email
              </button>
            </div>

            {(['before', 'during', 'after'] as DocumentStage[]).map((stage) => {
              const required = isDocumentRequired(stage);
              const docs = REQUIRED_DOCUMENTS_BY_STAGE[stage];

              return (
                <div key={stage} className="mb-6 last:mb-0">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {stage === 'before' && 'Avant la formation'}
                    {stage === 'during' && 'Pendant la formation'}
                    {stage === 'after' && 'Après la formation'}
                    {!required && <span className="ml-2 text-sm font-normal text-gray-500">(Non requis pour le moment)</span>}
                  </h4>

                  <div className="space-y-2">
                    {docs.map(({ type, label, required: isRequired }) => {
                      const matchingDocs = getDocumentsByType(type, stage);
                      const isOtherType = type === 'other';

                      if (isOtherType && matchingDocs.length === 0) {
                        return (
                          <div key={`${type}-add`} className="border border-dashed border-gray-300 rounded-lg p-3">
                            <label className="cursor-pointer flex items-center justify-center gap-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(type, stage, file);
                                }}
                                disabled={uploading}
                              />
                              <Plus className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{label}</span>
                            </label>
                          </div>
                        );
                      }

                      if (isOtherType && matchingDocs.length > 0) {
                        return (
                          <div key={type} className="space-y-2">
                            {matchingDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">
                                      {doc.custom_name || doc.file_path.split('/').pop()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleRenameDocument(doc)}
                                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Renommer"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={doc.file_path}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Télécharger"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={() => handleDeleteDocument(doc)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <div className="border border-dashed border-gray-300 rounded-lg p-2">
                              <label className="cursor-pointer flex items-center justify-center gap-2">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(type, stage, file);
                                  }}
                                  disabled={uploading}
                                />
                                <Plus className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Ajouter un autre document</span>
                              </label>
                            </div>
                          </div>
                        );
                      }

                      const doc = matchingDocs[0];

                      return (
                        <div
                          key={type}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            required && isRequired && !doc ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className={`w-5 h-5 flex-shrink-0 ${doc ? 'text-green-600' : 'text-gray-400'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm">{label}</p>
                              {doc && (
                                <>
                                  <p className="text-xs text-gray-500 truncate">
                                    {doc.custom_name || doc.file_path.split('/').pop()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                                  </p>
                                </>
                              )}
                              {required && isRequired && !doc && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                  Manquant
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {doc ? (
                              <>
                                <button
                                  onClick={() => handleRenameDocument(doc)}
                                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                  title="Renommer"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <a
                                  href={doc.file_path}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Télécharger"
                                >
                                  <FileText className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(type, stage, file);
                                  }}
                                  disabled={uploading}
                                />
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                  <Upload className="w-4 h-4" />
                                  <span className="text-sm">Ajouter</span>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showEditStudent && (
          <StudentForm
            student={student}
            onClose={() => setShowEditStudent(false)}
            onSuccess={() => {
              loadStudent();
              onUpdated();
            }}
          />
        )}

        {showEmailModal && (
          <EmailModal
            student={student}
            documents={student.documents || []}
            selectedDocuments={selectedDocuments}
            onToggleDocument={(id) => {
              const newSelection = new Set(selectedDocuments);
              if (newSelection.has(id)) {
                newSelection.delete(id);
              } else {
                newSelection.add(id);
              }
              setSelectedDocuments(newSelection);
            }}
            onSend={handleSendEmail}
            onClose={() => setShowEmailModal(false)}
            sending={sendingEmail}
          />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </div>
  );
}

interface EmailModalProps {
  student: StudentWithDetails;
  documents: StudentDocument[];
  selectedDocuments: Set<string>;
  onToggleDocument: (id: string) => void;
  onSend: (subject: string, message: string) => void;
  onClose: () => void;
  sending: boolean;
}

function EmailModal({ student, documents, selectedDocuments, onToggleDocument, onSend, onClose, sending }: EmailModalProps) {
  const [subject, setSubject] = useState(`Formation - ${student.first_name} ${student.last_name}`);
  const [message, setMessage] = useState(`Bonjour ${student.first_name},\n\nVeuillez trouver ci-joint les documents relatifs à votre formation.\n\nCordialement`);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Envoyer un email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinataire
            </label>
            <input
              type="email"
              value={student.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sujet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {documents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents à joindre ({selectedDocuments.size} sélectionné{selectedDocuments.size > 1 ? 's' : ''})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(doc.id)}
                      onChange={() => onToggleDocument(doc.id)}
                      className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 flex-1">
                      {doc.file_path.split('/').pop()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {doc.document_stage === 'before' && 'Avant'}
                      {doc.document_stage === 'during' && 'Pendant'}
                      {doc.document_stage === 'after' && 'Après'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onSend(subject, message)}
              disabled={sending || !subject || !message}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
