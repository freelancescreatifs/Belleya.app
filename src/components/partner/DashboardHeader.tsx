import { ArrowLeft, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  onSignOut: () => void;
}

export default function DashboardHeader({ onSignOut }: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Belleya" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-[rgb(113,19,65)] hidden sm:inline">
            Espace Partenaire
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/partenaire"
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Programme</span>
          </a>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Deconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
