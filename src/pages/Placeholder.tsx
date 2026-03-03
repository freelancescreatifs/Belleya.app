import { LucideIcon } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function Placeholder({ title, description, icon: Icon }: PlaceholderProps) {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-10 h-10 text-belaya-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 max-w-md">{description}</p>
        <div className="mt-6 inline-block px-4 py-2 bg-belaya-50 text-belaya-primary rounded-lg text-sm">
          Module en cours de développement
        </div>
      </div>
    </div>
  );
}
