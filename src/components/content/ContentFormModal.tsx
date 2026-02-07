import { X } from 'lucide-react';
import ContentForm from './ContentForm';

interface ContentFormModalProps {
  mode: 'create' | 'edit';
  contentId?: string;
  prefillData?: any;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ContentFormModal({
  mode,
  contentId,
  prefillData,
  onSuccess,
  onClose
}: ContentFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-brand-50">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'edit' ? 'Modifier le contenu' : 'Créer un contenu'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <ContentForm
            mode={mode}
            contentId={contentId}
            prefillData={prefillData}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
