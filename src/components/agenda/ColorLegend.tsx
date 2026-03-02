export default function ColorLegend() {
  return (
    <div className="flex items-center gap-5 text-sm bg-white rounded-lg px-4 py-2 border border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
        <span className="text-gray-600 font-medium">RDV Pro</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm"></div>
        <span className="text-gray-600 font-medium">RDV Perso</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-sky-400 shadow-sm"></div>
        <span className="text-gray-600 font-medium">Formation</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
        <span className="text-gray-600 font-medium">RDV Annulé</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
        <span className="text-gray-600 font-medium">Tâches</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-belleya-500 shadow-sm"></div>
        <span className="text-gray-600 font-medium">Réseaux sociaux</span>
      </div>
    </div>
  );
}
