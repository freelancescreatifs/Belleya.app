export default function ColorLegend() {
  return (
    <div className="flex items-center gap-5 text-sm bg-white rounded-lg px-4 py-2 border border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
        <span className="text-gray-600 font-medium">RDV Pro</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: 'rgb(6,182,212)' }}></div>
        <span className="text-gray-600 font-medium">RDV Perso</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: 'rgb(174,56,248)' }}></div>
        <span className="text-gray-600 font-medium">RDV Formation</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: 'rgb(247,0,0)' }}></div>
        <span className="text-gray-600 font-medium">RDV Annulé</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
        <span className="text-gray-600 font-medium">Tâches</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: 'rgb(240,62,151)' }}></div>
        <span className="text-gray-600 font-medium">Réseaux sociaux</span>
      </div>
    </div>
  );
}
