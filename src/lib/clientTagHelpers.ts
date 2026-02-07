export interface ClientTagData {
  appointmentCount: number;
  createdAt: string | Date;
}

export interface ClientTag {
  class: string;
  label: string;
  icon: string;
}

export function getClientTag(data: ClientTagData): ClientTag {
  const completedRDV = data.appointmentCount;
  const createdDate = typeof data.createdAt === 'string'
    ? new Date(data.createdAt)
    : data.createdAt;

  const daysSinceCreation = Math.floor(
    (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (completedRDV >= 10) {
    return {
      class: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200',
      label: '💎 Cliente VIP',
      icon: '💎'
    };
  }

  if (completedRDV >= 2) {
    return {
      class: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      label: '⭐ Cliente fidèle',
      icon: '⭐'
    };
  }

  if (completedRDV === 1 && daysSinceCreation >= 30) {
    return {
      class: 'bg-blue-100 text-blue-800 border border-blue-200',
      label: '🔁 Cliente occasionnelle',
      icon: '🔁'
    };
  }

  return {
    class: 'bg-green-100 text-green-800 border border-green-200',
    label: '🆕 Nouvelle cliente',
    icon: '🆕'
  };
}
