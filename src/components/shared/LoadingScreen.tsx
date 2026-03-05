import { Loader as Loader2 } from 'lucide-react';

export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
      <p className="text-gray-500 text-sm">{message || 'Chargement...'}</p>
    </div>
  );
}
