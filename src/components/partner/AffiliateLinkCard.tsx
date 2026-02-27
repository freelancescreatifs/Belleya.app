import { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { AffiliateData } from '../../lib/affiliateHelpers';

interface AffiliateLinkCardProps {
  affiliate: AffiliateData;
}

export default function AffiliateLinkCard({ affiliate }: AffiliateLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const link = `https://belleya.app/?ref=${affiliate.ref_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Ton lien d'affiliation
      </h3>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 truncate border border-gray-200">
          {link}
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#efaa9a] to-[#d9629b] text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copie !' : 'Copier'}
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>
      {showQR && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`}
            alt="QR Code"
            className="mx-auto rounded-lg"
            width={200}
            height={200}
          />
        </div>
      )}
    </div>
  );
}
