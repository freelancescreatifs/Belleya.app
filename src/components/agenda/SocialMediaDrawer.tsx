import { useState } from 'react';
import { X, Calendar, Image as ImageIcon, Instagram, Linkedin, Facebook, Youtube, Twitter, Hash, Target, Lightbulb } from 'lucide-react';
import { SocialMediaContent } from '../../types/agenda';
import ProductionStepsCheckboxes from '../content/ProductionStepsCheckboxes';

interface SocialMediaDrawerProps {
  content: SocialMediaContent;
  onClose: () => void;
  onEdit: (contentId: string) => void;
  onRefresh?: () => void;
}

export default function SocialMediaDrawer({ content, onClose, onEdit, onRefresh }: SocialMediaDrawerProps) {
  function getPlatformIcon(platform: string) {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  }

  function getPlatformColor(platform: string) {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-belleya-100 text-belleya-deep border-belleya-100';
      case 'linkedin':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'facebook':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'youtube':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'twitter':
        return 'bg-sky-100 text-sky-700 border-sky-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'published':
        return 'Posté';
      case 'scheduled':
        return 'Programmé';
      case 'script':
        return 'Script';
      case 'shooting':
        return 'Tournage';
      case 'editing':
        return 'Montage';
      default:
        return 'Idée';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-belleya-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'script':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'shooting':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'editing':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  function getObjectiveLabel(objective?: string) {
    switch (objective) {
      case 'attirer':
        return 'Attirer';
      case 'éduquer':
        return 'Éduquer';
      case 'convertir':
        return 'Convertir';
      case 'fidéliser':
        return 'Fidéliser';
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {content.status === 'published' ? 'Publication postee' : content.status === 'scheduled' ? 'Publication programmee' : 'Contenu en production'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {content.image_url && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img
                src={content.image_url}
                alt={content.enriched_title || content.title}
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {content.enriched_title || content.title}
            </h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(content.status)}`}>
              {getStatusLabel(content.status)}
            </span>

            {/* Gérer platform comme tableau ou string */}
            {(() => {
              const platforms = Array.isArray(content.platform)
                ? content.platform
                : typeof content.platform === 'string'
                  ? [content.platform]
                  : [];

              return platforms.map((platform, idx) => (
                <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getPlatformColor(platform)}`}>
                  {getPlatformIcon(platform)}
                  {platform}
                </span>
              ));
            })()}

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-300">
              {content.content_type}
            </span>
            {content.objective && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium border border-teal-300">
                <Target className="w-3.5 h-3.5" />
                {getObjectiveLabel(content.objective)}
              </span>
            )}
            {content.editorial_pillar && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium border border-amber-300">
                <Lightbulb className="w-3.5 h-3.5" />
                {content.editorial_pillar}
              </span>
            )}
          </div>

          {(content.date_script || content.date_shooting || content.date_editing || content.date_scheduling) && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Production</h4>
              <ProductionStepsCheckboxes
                contentId={content.id}
                contentType={content.content_type}
                scriptChecked={content.script_checked || false}
                tournageChecked={content.tournage_checked || false}
                montageChecked={content.montage_checked || false}
                planifieChecked={content.planifie_checked || false}
                dateScript={content.date_script}
                dateScriptTime={content.date_script_time}
                dateShooting={content.date_shooting}
                dateShootingTime={content.date_shooting_time}
                dateEditing={content.date_editing}
                dateEditingTime={content.date_editing_time}
                dateScheduling={content.date_scheduling}
                dateSchedulingTime={content.date_scheduling_time}
                onUpdate={onRefresh}
                compact={true}
                showDates={false}
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-700 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Date de publication</span>
            </div>
            <p className="text-lg text-gray-900">
              {new Date(content.publication_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {content.publication_time && (
                <span className="ml-2 text-gray-600">à {content.publication_time}</span>
              )}
            </p>
          </div>

          {content.caption && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Légende</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{content.caption}</p>
            </div>
          )}

          <button
            onClick={() => onEdit(content.id)}
            className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-belleya-100 text-white rounded-xl hover:from-orange-600 hover:to-belleya-primary transition-all font-medium"
          >
            Modifier la publication
          </button>
        </div>
      </div>
    </div>
  );
}
