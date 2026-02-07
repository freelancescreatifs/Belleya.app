import { CalendarItem, Event, CalendarTask } from '../types/agenda';

export function getEventColor(item: CalendarItem): string {
  if (item.color) {
    return item.color;
  }

  if (item.type === 'social_media') {
    return 'bg-pink-500';
  }

  if (item.type === 'task') {
    return 'bg-amber-500';
  }

  const event = item.data as Event;

  if (event.status === 'cancelled') {
    return 'bg-red-500';
  }

  if (event.type === 'formation') {
    return 'bg-sky-400';
  }

  if (event.type === 'pro') {
    return 'bg-blue-500';
  }

  return 'bg-purple-500';
}

export function getEventTextColor(item: CalendarItem): string {
  return 'text-white';
}

export function checkConflict(
  start: Date,
  end: Date,
  events: CalendarItem[],
  excludeId?: string
): Array<{ title: string; start: string; end: string }> {
  const conflicts: Array<{ title: string; start: string; end: string }> = [];

  for (const event of events) {
    if (excludeId && event.id === excludeId) continue;

    if (event.type === 'task') continue;

    const eventStart = event.start;
    const eventEnd = event.end;

    if (
      (start >= eventStart && start < eventEnd) ||
      (end > eventStart && end <= eventEnd) ||
      (start <= eventStart && end >= eventEnd)
    ) {
      conflicts.push({
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
      });
    }
  }

  return conflicts;
}

export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: Date[] = [];

  for (let i = startDay === 0 ? -6 : -(startDay - 1); i < daysInMonth + (7 - ((daysInMonth + (startDay === 0 ? 6 : startDay - 1)) % 7)); i++) {
    days.push(new Date(year, month, i + 1));
  }

  return days;
}

export function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(date);
  monday.setDate(diff);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getItemsForDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return items.filter(item => {
    const itemStart = new Date(item.start);
    const itemEnd = new Date(item.end);

    return (
      (itemStart >= dayStart && itemStart <= dayEnd) ||
      (itemEnd >= dayStart && itemEnd <= dayEnd) ||
      (itemStart <= dayStart && itemEnd >= dayEnd)
    );
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long'
  });
}

export interface PositionedItem extends CalendarItem {
  column: number;
  totalColumns: number;
}

export function calculateOverlappingPositions(items: CalendarItem[]): PositionedItem[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const positionedItems: PositionedItem[] = [];
  const groups: CalendarItem[][] = [];

  sorted.forEach(item => {
    let placed = false;

    for (const group of groups) {
      const overlaps = group.some(groupItem =>
        (item.start < groupItem.end && item.end > groupItem.start)
      );

      if (overlaps) {
        group.push(item);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([item]);
    }
  });

  groups.forEach(group => {
    const columns: CalendarItem[][] = [];

    group.forEach(item => {
      let columnIndex = 0;

      while (columnIndex < columns.length) {
        const hasOverlap = columns[columnIndex].some(colItem =>
          item.start < colItem.end && item.end > colItem.start
        );

        if (!hasOverlap) {
          columns[columnIndex].push(item);
          break;
        }
        columnIndex++;
      }

      if (columnIndex === columns.length) {
        columns.push([item]);
      }

      positionedItems.push({
        ...item,
        column: columnIndex,
        totalColumns: Math.max(columns.length, 1)
      });
    });
  });

  return positionedItems;
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getFirstDayOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
