import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Upload, Mail, FileText, Plus, Settings, ToggleLeft, ToggleRight, GripVertical, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';
import type { StudentWithDetails, StudentDocument, DocumentStage, DocumentTemplate } from '../../types/training';
import { calculateStudentStatus, getStatusLabel, getStatusColor } from '../../lib/studentHelpers';
import StudentForm from './StudentForm';

interface StudentDetailDrawerProps {
  studentId: string;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

const STAGE_LABELS: Record<DocumentStage, string> = {
  before: 'Avant la formation',
  during: 'Pendant la formation',
  after: 'Apres la formation',
};

export default function StudentDetailDrawer({ studentId, onClose, onDeleted, onUpdated }: StudentDetailDrawerProps) {
  const { profile, user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [student, setStudent] = useState<StudentWithDetails | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [showTemplateSettings, setShowTemplateSettings] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [newTemplateStage, setNewTemplateStage] = useState<DocumentStage>('before');

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  useEffect(() => {
    if (profile?.company_id) {
      loadTemplates();
    }
  }, [profile?.company_id]);

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

  async function loadTemplates() {
    if (!profile?.company_id) return;

    await supabase.rpc('seed_default_training_templates', { p_company_id: profile.company_id });

    const { data } = await supabase
      .from('training_document_templates')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('stage')
      .order('position');

    if (data) {
      setTemplates(data as DocumentTemplate[]);
    }
  }

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
    if (!confirm(`Etes-vous sur de vouloir supprimer ${student.first_name} ${student.last_name} ? Cette action est irreversible.`)) return;

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

  async function handleFileUpload(templateId: string, stage: DocumentStage, file: File) {
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
          document_type: 'custom',
          document_stage: stage,
          file_path: urlData.publicUrl,
          custom_name: file.name,
          template_id: templateId,
          uploaded_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      loadStudent();
      onUpdated();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUploadOther(stage: DocumentStage, file: File) {
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
          document_type: 'other',
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
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: StudentDocument) {
    if (!confirm('Etes-vous sur de vouloir supprimer ce document ?')) return;

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

  function getDocsByTemplate(templateId: string): StudentDocument[] {
    return student?.documents?.filter(d => d.template_id === templateId) || [];
  }

  function getOtherDocs(stage: DocumentStage): StudentDocument[] {
    const templateIds = new Set(templates.map(t => t.id));
    return student?.documents?.filter(d =>
      d.document_stage === stage && (!d.template_id || !templateIds.has(d.template_id))
    ) || [];
  }

  async function handleToggleRequired(template: DocumentTemplate) {
    try {
      const { error } = await supabase
        .from('training_document_templates')
        .update({ is_required: !template.is_required, updated_at: new Date().toISOString() })
        .eq('id', template.id);

      if (error) throw error;
      loadTemplates();
      onUpdated();
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  }

  async function handleAddTemplate() {
    if (!newTemplateLabel.trim() || !profile?.company_id) return;

    const maxPos = templates
      .filter(t => t.stage === newTemplateStage)
      .reduce((max, t) => Math.max(max, t.position), 0);

    try {
      const { error } = await supabase
        .from('training_document_templates')
        .insert({
          company_id: profile.company_id,
          label: newTemplateLabel.trim(),
          stage: newTemplateStage,
          is_required: false,
          position: maxPos + 1,
        });

      if (error) throw error;
      setNewTemplateLabel('');
      loadTemplates();
      onUpdated();
      showToast('success', 'Document ajoute');
    } catch (error) {
      console.error('Error adding template:', error);
      showToast('error', "Erreur lors de l'ajout");
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!confirm('Supprimer cet intitule de document ? Les fichiers deja telecharges seront conserves.')) return;

    try {
      const { error } = await supabase
        .from('training_document_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      loadTemplates();
      onUpdated();
      showToast('success', 'Document supprime');
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }

  function handleOpenEmailModal() {
    if (!student?.email) {
      alert("Aucun email configure pour cet eleve");
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
        throw new Error(errData.error || "Echec de l'envoi");
      }

      showToast('success', 'Email envoye avec succes');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('error', "Erreur lors de l'envoi de l'email");
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
          <div className="text-red-600">Eleve introuvable</div>
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

  const requiredTemplates = templates.filter(t => t.is_required);
  const missingRequired = requiredTemplates.filter(t => getDocsByTemplate(t.id).length === 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                {getStatusLabel(student.status)}
              </span>
              {missingRequired.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3" />
                  {missingRequired.length} doc. obligatoire{missingRequired.length > 1 ? 's' : ''} manquant{missingRequired.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditStudent(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Modifier"
            >
              <Pencil className="w-5 h-5" />
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
                <p className="text-sm text-gray-600">Telephone</p>
                <p className="font-medium">{student.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instagram</p>
                <p className="font-medium">{student.instagram_username || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de debut</p>
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTemplateSettings(!showTemplateSettings)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    showTemplateSettings
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Configurer les documents"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Configurer</span>
                </button>
                <button
                  onClick={handleOpenEmailModal}
                  disabled={!student.email}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    student.email
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={!student.email ? 'Email manquant' : "Envoyer un email"}
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </button>
              </div>
            </div>

            {showTemplateSettings && (
              <TemplateSettingsPanel
                templates={templates}
                onToggleRequired={handleToggleRequired}
                onDelete={handleDeleteTemplate}
                newLabel={newTemplateLabel}
                onNewLabelChange={setNewTemplateLabel}
                newStage={newTemplateStage}
                onNewStageChange={setNewTemplateStage}
                onAdd={handleAddTemplate}
              />
            )}

            {(['before', 'during', 'after'] as DocumentStage[]).map((stage) => {
              const stageTemplates = templates.filter(t => t.stage === stage);
              const otherDocs = getOtherDocs(stage);

              return (
                <div key={stage} className="mb-6 last:mb-0">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {STAGE_LABELS[stage]}
                  </h4>

                  <div className="space-y-2">
                    {stageTemplates.map((template) => {
                      const docs = getDocsByTemplate(template.id);
                      const doc = docs[0];
                      const isMissing = template.is_required && docs.length === 0;

                      return (
                        <div
                          key={template.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            isMissing ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className={`w-5 h-5 flex-shrink-0 ${doc ? 'text-green-600' : 'text-gray-400'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{template.label}</p>
                                {template.is_required && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                                    Obligatoire
                                  </span>
                                )}
                              </div>
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
                              {isMissing && (
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
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <a
                                  href={doc.file_path}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Telecharger"
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
                                    if (file) handleFileUpload(template.id, stage, file);
                                  }}
                                  disabled={uploading}
                                />
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
                                  <Upload className="w-4 h-4" />
                                  <span className="text-sm">Ajouter</span>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {otherDocs.map((doc) => (
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
                            <Pencil className="w-4 h-4" />
                          </button>
                          <a
                            href={doc.file_path}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Telecharger"
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

                    <div className="border border-dashed border-gray-300 rounded-lg p-3">
                      <label className="cursor-pointer flex items-center justify-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUploadOther(stage, file);
                          }}
                          disabled={uploading}
                        />
                        <Plus className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Autre document</span>
                      </label>
                    </div>
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

interface TemplateSettingsPanelProps {
  templates: DocumentTemplate[];
  onToggleRequired: (template: DocumentTemplate) => void;
  onDelete: (templateId: string) => void;
  newLabel: string;
  onNewLabelChange: (v: string) => void;
  newStage: DocumentStage;
  onNewStageChange: (v: DocumentStage) => void;
  onAdd: () => void;
}

function TemplateSettingsPanel({
  templates,
  onToggleRequired,
  onDelete,
  newLabel,
  onNewLabelChange,
  newStage,
  onNewStageChange,
  onAdd,
}: TemplateSettingsPanelProps) {
  return (
    <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-4 h-4 text-gray-600" />
        <h4 className="font-semibold text-gray-900 text-sm">Configuration des documents</h4>
      </div>

      <p className="text-xs text-gray-500">
        Activez le bouton pour rendre un document obligatoire. Les documents obligatoires apparaitront comme "Manquant" sur chaque fiche eleve tant qu'ils ne sont pas telecharges.
      </p>

      {(['before', 'during', 'after'] as DocumentStage[]).map((stage) => {
        const stageTemplates = templates.filter(t => t.stage === stage);
        if (stageTemplates.length === 0) return null;

        return (
          <div key={stage}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {STAGE_LABELS[stage]}
            </p>
            <div className="space-y-1">
              {stageTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{template.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onToggleRequired(template)}
                      className="flex items-center gap-1.5"
                      title={template.is_required ? 'Rendre optionnel' : 'Rendre obligatoire'}
                    >
                      {template.is_required ? (
                        <ToggleRight className="w-6 h-6 text-brand-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-300" />
                      )}
                      <span className={`text-xs font-medium ${template.is_required ? 'text-brand-600' : 'text-gray-400'}`}>
                        {template.is_required ? 'Obligatoire' : 'Optionnel'}
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(template.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Ajouter un nouveau document</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => onNewLabelChange(e.target.value)}
            placeholder="Intitule du document..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <select
            value={newStage}
            onChange={(e) => onNewStageChange(e.target.value as DocumentStage)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="before">Avant</option>
            <option value="during">Pendant</option>
            <option value="after">Apres</option>
          </select>
          <button
            onClick={onAdd}
            disabled={!newLabel.trim()}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
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
  const [message, setMessage] = useState(`Bonjour ${student.first_name},\n\nVeuillez trouver ci-joint les documents relatifs a votre formation.\n\nCordialement`);

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>

          {documents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents a joindre ({selectedDocuments.size} selectionne{selectedDocuments.size > 1 ? 's' : ''})
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
                      className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 flex-1">
                      {doc.custom_name || doc.file_path.split('/').pop()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {doc.document_stage === 'before' && 'Avant'}
                      {doc.document_stage === 'during' && 'Pendant'}
                      {doc.document_stage === 'after' && 'Apres'}
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
