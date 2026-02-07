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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête sticky */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 md:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-brand-50">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">
            {mode === 'edit' ? 'Modifier' : 'Créer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Zone scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
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
