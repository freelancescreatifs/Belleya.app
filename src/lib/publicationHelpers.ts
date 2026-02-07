export function isPublished(publicationDate: string, publicationTime?: string): boolean {
  if (!publicationDate) return false;

  const time = publicationTime || '00:00';
  const publishDateTime = new Date(`${publicationDate} ${time}`);
  const now = new Date();

  return publishDateTime <= now;
}

export function formatPublicationStatus(isPublished: boolean): {
  label: string;
  color: string;
  icon: 'check' | 'clock';
} {
  return isPublished
    ? { label: 'Publié', color: 'green', icon: 'check' }
    : { label: 'Non publié', color: 'orange', icon: 'clock' };
}

export function canDragContent(isPublished: boolean): boolean {
  return !isPublished;
}

export function canSwapContent(
  contentA: { publication_date: string; publication_time?: string; is_published?: boolean },
  contentB: { publication_date: string; publication_time?: string; is_published?: boolean }
): { allowed: boolean; reason?: string } {
  if (contentA.is_published) {
    return { allowed: false, reason: 'Impossible de déplacer un contenu déjà publié' };
  }

  if (contentB.is_published) {
    return { allowed: false, reason: 'Impossible de déplacer vers un contenu déjà publié' };
  }

  return { allowed: true };
}
