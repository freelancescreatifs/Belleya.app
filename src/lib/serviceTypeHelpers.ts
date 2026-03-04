export type ServiceType = 'prestation' | 'formation' | 'vente_digitale' | 'commission' | 'autre';

export interface ServiceTypeTag {
  label: string;
  className: string;
}

export function getServiceTypeTag(serviceType: ServiceType): ServiceTypeTag {
  switch (serviceType) {
    case 'prestation':
      return {
        label: 'Prestation',
        className: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      };
    case 'formation':
      return {
        label: 'Formation',
        className: 'bg-blue-100 text-blue-800 border border-blue-200'
      };
    case 'vente_digitale':
      return {
        label: 'Vente digitale',
        className: 'bg-rose-100 text-rose-800 border border-rose-200'
      };
    case 'commission':
      return {
        label: 'Commission',
        className: 'bg-amber-100 text-amber-800 border border-amber-200'
      };
    case 'autre':
      return {
        label: 'Autre',
        className: 'bg-teal-100 text-teal-800 border border-teal-200'
      };
    default:
      return {
        label: 'Prestation',
        className: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      };
  }
}

export function getServiceTypeLabel(serviceType: ServiceType): string {
  switch (serviceType) {
    case 'prestation':
      return 'Prestation';
    case 'formation':
      return 'Formation';
    case 'vente_digitale':
      return 'Vente digitale';
    case 'commission':
      return 'Commission';
    case 'autre':
      return 'Autre';
    default:
      return 'Prestation';
  }
}

export const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'prestation', label: 'Prestation' },
  { value: 'formation', label: 'Formation' },
  { value: 'vente_digitale', label: 'Vente digitale' },
  { value: 'commission', label: 'Commission' },
  { value: 'autre', label: 'Autre' }
];
