/**
 * Liste des catégories de services disponibles
 * Ces catégories sont utilisées pour classifier les photos et les services
 */
export const SERVICE_CATEGORIES = [
  'Ongles',
  'Cils',
  'Soins',
  'Manucure',
  'Pédicure',
  'Pose',
  'Remplissage',
  'Autre'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
