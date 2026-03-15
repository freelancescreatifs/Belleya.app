export type ProfessionKey =
  | 'nail_artist'
  | 'estheticienne'
  | 'coiffeuse'
  | 'lash_artist'
  | 'brow_artist'
  | 'facialiste'
  | 'prothesiste_ongulaire'
  | 'makeup_artist'
  | 'multi_metiers';

export type ClientSection =
  | 'nails'
  | 'hair'
  | 'scalp'
  | 'skin'
  | 'skin_conditions'
  | 'lashes'
  | 'brows';

export interface Profession {
  key: ProfessionKey;
  label: string;
  sections: ClientSection[];
}

export const PROFESSIONS: Profession[] = [
  {
    key: 'nail_artist',
    label: 'Nail artist',
    sections: ['nails']
  },
  {
    key: 'estheticienne',
    label: 'Esthéticienne',
    sections: ['skin', 'skin_conditions']
  },
  {
    key: 'coiffeuse',
    label: 'Coiffeuse',
    sections: ['hair', 'scalp']
  },
  {
    key: 'lash_artist',
    label: 'Lash artist',
    sections: ['lashes']
  },
  {
    key: 'brow_artist',
    label: 'Brow artist',
    sections: ['brows']
  },
  {
    key: 'facialiste',
    label: 'Facialiste',
    sections: ['skin', 'skin_conditions']
  },
  {
    key: 'prothesiste_ongulaire',
    label: 'Prothésiste ongulaire',
    sections: ['nails']
  },
  {
    key: 'makeup_artist',
    label: 'Makeup Artist',
    sections: ['skin', 'skin_conditions']
  },
  {
    key: 'multi_metiers',
    label: 'Multi-métiers',
    sections: []
  }
];

export interface SectionConfig {
  key: ClientSection;
  label: string;
  description: string;
}

export const CLIENT_SECTIONS: SectionConfig[] = [
  {
    key: 'nails',
    label: 'Ongles',
    description: 'Types et états des ongles'
  },
  {
    key: 'hair',
    label: 'Cheveux',
    description: 'Informations sur les cheveux'
  },
  {
    key: 'scalp',
    label: 'Cuir chevelu',
    description: 'État du cuir chevelu'
  },
  {
    key: 'skin',
    label: 'Peau',
    description: 'Type et caractéristiques de la peau'
  },
  {
    key: 'skin_conditions',
    label: 'États de peau',
    description: 'Conditions spécifiques de la peau'
  },
  {
    key: 'lashes',
    label: 'Cils',
    description: 'Informations sur les cils'
  },
  {
    key: 'brows',
    label: 'Sourcils',
    description: 'Informations sur les sourcils'
  }
];

export function getProfessionByKey(key: ProfessionKey | null | undefined): Profession | undefined {
  if (!key) return undefined;
  return PROFESSIONS.find(p => p.key === key);
}

export function getProfessionLabel(key: ProfessionKey | null | undefined): string {
  const profession = getProfessionByKey(key);
  return profession?.label || '';
}

export function getSectionsForProfessions(
  primaryProfession: ProfessionKey | null | undefined,
  additionalProfessions: ProfessionKey[] = []
): ClientSection[] {
  if (!primaryProfession) return [];

  if (primaryProfession === 'multi_metiers') {
    const sections = new Set<ClientSection>();
    additionalProfessions.forEach(profKey => {
      const profession = getProfessionByKey(profKey);
      if (profession) {
        profession.sections.forEach(section => sections.add(section));
      }
    });
    return Array.from(sections);
  }

  const profession = getProfessionByKey(primaryProfession);
  return profession?.sections || [];
}

export function getSectionConfig(sectionKey: ClientSection): SectionConfig | undefined {
  return CLIENT_SECTIONS.find(s => s.key === sectionKey);
}
