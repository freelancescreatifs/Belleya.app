import { useState, useEffect, useRef } from 'react';
import { CalendarView as ViewType, CalendarItem } from '../../types/agenda';
import { getMonthDays, getWeekDays, isSameDay, getItemsForDay, formatTime, getEventColor, calculateOverlappingPositions } from '../../lib/calendarHelpers';
import { getStepEmoji, stepBgColorMap, stepLabelMap } from '../../lib/productionStepsHelpers';
import { ExternalLink, CheckCircle } from 'lucide-react';

interface CalendarViewProps {
  view: ViewType;
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onDayClick: (date: Date) => void;
  onTimeSlotDoubleClick?: (date: Date) => void;
  onEventDrop?: (itemId: string, newStart: Date, newEnd: Date) => void;
  onEventResize?: (itemId: string, newStart: Date, newEnd: Date) => void;
  onDragComplete?: (item: CalendarItem, newStart: Date, newEnd: Date, mode: 'move' | 'resize') => void;
}

export default function CalendarView({ view, currentDate, items, onItemClick, onDayClick, onTimeSlotDoubleClick, onEventDrop, onEventResize, onDragComplete }: CalendarViewProps) {
  if (view === 'month') {
    return <MonthView currentDate={currentDate} items={items} onItemClick={onItemClick} onDayClick={onDayClick} />;
  }

  if (view === 'week') {
    return <WeekView currentDate={currentDate} items={items} onItemClick={onItemClick} onDayClick={onDayClick} onTimeSlotDoubleClick={onTimeSlotDoubleClick} onEventDrop={onEventDrop} onEventResize={onEventResize} onDragComplete={onDragComplete} />;
  }

  return <DayView currentDate={currentDate} items={items} onItemClick={onItemClick} onTimeSlotDoubleClick={onTimeSlotDoubleClick} onEventDrop={onEventDrop} onEventResize={onEventResize} onDragComplete={onDragComplete} />;
}

function getSocialMediaStatus(item: CalendarItem): string | null {
  if (item.type !== 'social_media') return null;
  return (item.data as any).status || null;
}

function isSocialMediaPublished(item: CalendarItem): boolean {
  return getSocialMediaStatus(item) === 'published';
}

function SocialStatusDot({ item, size = 'sm' }: { item: CalendarItem; size?: 'sm' | 'md' }) {
  const status = getSocialMediaStatus(item);
  if (!status) return null;

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const bgColor = stepBgColorMap[status] || 'bg-gray-400';

  if (status === 'published') {
    return <CheckCircle className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-green-300 flex-shrink-0`} />;
  }

  return (
    <span className={`${dotSize} ${bgColor} rounded-full flex-shrink-0 inline-block`} title={stepLabelMap[status] || status} />
  );
}

function SocialProgressDots({ item }: { item: CalendarItem }) {
  if (item.type !== 'social_media') return null;
  const data = item.data as any;
  const checks = [
    data.script_checked,
    data.tournage_checked,
    data.montage_checked,
    data.planifie_checked,
  ];

  return (
    <div className="flex items-center gap-0.5 ml-1">
      {checks.map((checked: boolean, i: number) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${checked ? 'bg-green-300' : 'bg-white/30'}`}
        />
      ))}
    </div>
  );
}

function MonthView({ currentDate, items, onItemClick, onDayClick }: Omit<CalendarViewProps, 'view' | 'onEventDrop' | 'onEventResize' | 'onTimeSlotDoubleClick' | 'onDragComplete'>) {
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
            <div key={idx} className="py-2 text-center text-[10px] font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayItems = getItemsForDay(items, day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, today);
            const hasEvents = dayItems.length > 0;
            const uniqueColors = [...new Set(dayItems.map(item => {
              const colorClass = getEventColor(item);
              return colorClass.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-400';
            }))];

            return (
              <div
                key={index}
                onClick={() => onDayClick(day)}
                className={`min-h-[52px] py-1.5 px-0.5 border-r border-b border-gray-100 last:border-r-0 cursor-pointer active:bg-gray-100 transition-colors flex flex-col items-center ${
                  !isCurrentMonth ? 'bg-gray-50/50' : ''
                }`}
              >
                <span
                  className={`text-sm font-medium flex items-center justify-center ${
                    isToday
                      ? 'bg-belaya-500 text-white w-7 h-7 rounded-full'
                      : isCurrentMonth
                      ? 'text-gray-900 w-7 h-7'
                      : 'text-gray-400 w-7 h-7'
                  }`}
                >
                  {day.getDate()}
                </span>
                {hasEvents && (
                  <div className="flex items-center justify-center gap-[3px] mt-1 min-h-[6px] flex-wrap max-w-[40px]">
                    {uniqueColors.slice(0, 3).map((colorClass, idx) => (
                      <span
                        key={idx}
                        className={`w-[5px] h-[5px] rounded-full ${colorClass}`}
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <span className="text-[8px] text-gray-500 font-medium ml-0.5">
                        +{dayItems.length - 3}
                      </span>
                    )}
                  </div>
                )}
                {!hasEvents && <div className="min-h-[6px] mt-1" />}
              </div>
            );
          })}
        </div>
        <div className="p-2 text-center text-[11px] text-gray-500 bg-gray-50 border-t border-gray-100">
          Appuyez sur un jour pour voir les details
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
          <div key={idx} className="p-3 text-center text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayItems = getItemsForDay(items, day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);

          return (
            <div
              key={index}
              onClick={() => onDayClick(day)}
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50/50' : ''
              }`}
            >
              <div className="flex justify-start items-start mb-1">
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-belaya-500 text-white w-6 h-6 flex items-center justify-center rounded-full'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => {
                  const isCancelled = item.type === 'event' && (item.data as any).status === 'cancelled';
                  const productionStep = item.type === 'task' ? (item.data as any).production_step : null;
                  const isPublished = isSocialMediaPublished(item);

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      className={`${getEventColor(item)} text-white rounded cursor-pointer hover:opacity-80 transition-all ${isCancelled ? 'line-through opacity-60' : ''} ${isPublished ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-1 px-2 py-1 text-xs">
                        <SocialStatusDot item={item} size="sm" />
                        <span className="flex-shrink-0">{formatTime(item.start)}</span>
                        <span className="line-clamp-2 flex-1">
                          {productionStep && <span className="mr-1">{getStepEmoji(productionStep)}</span>}
                          {item.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium px-2 pt-0.5">
                    +{dayItems.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, items, onItemClick, onDayClick, onTimeSlotDoubleClick, onEventDrop, onEventResize, onDragComplete }: Omit<CalendarViewProps, 'view'>) {
  const days = getWeekDays(currentDate);
  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [lastClickTime, setLastClickTime] = useState<{ time: number; dayIndex: number; hour: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [dragState, setDragState] = useState<{
    item: CalendarItem | null;
    mode: 'move' | 'resize-start' | 'resize-end' | null;
    originalStart: Date | null;
    originalEnd: Date | null;
    currentStart: Date | null;
    currentEnd: Date | null;
    mouseStartX: number | null;
    mouseStartY: number | null;
    dragStarted: boolean;
    hoveredDayIndex: number | null;
  }>({
    item: null,
    mode: null,
    originalStart: null,
    originalEnd: null,
    currentStart: null,
    currentEnd: null,
    mouseStartX: null,
    mouseStartY: null,
    dragStarted: false,
    hoveredDayIndex: null,
  });

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7 * 64;
    }
  }, []);

  const getDateTimeFromPosition = (e: React.MouseEvent, dayElement: HTMLElement) => {
    const rect = dayElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hourHeight = 64;
    const totalHours = y / hourHeight;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60 / 15) * 15;

    const dayIndex = parseInt(dayElement.dataset.dayIndex || '0');
    const targetDay = days[dayIndex];
    const newDate = new Date(targetDay);
    newDate.setHours(Math.max(0, Math.min(23, hours)));
    newDate.setMinutes(Math.max(0, Math.min(59, minutes)));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    return newDate;
  };

  const handleMouseDown = (e: React.MouseEvent, item: CalendarItem, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.preventDefault();

    setDragState({
      item,
      mode,
      originalStart: new Date(item.start),
      originalEnd: new Date(item.end),
      currentStart: new Date(item.start),
      currentEnd: new Date(item.end),
      mouseStartX: e.clientX,
      mouseStartY: e.clientY,
      dragStarted: false,
      hoveredDayIndex: null,
    });
  };

  const handleMouseMove = (e: React.MouseEvent, dayElement: HTMLElement) => {
    if (!dragState.item || !dragState.mode) return;

    const dayIndex = parseInt(dayElement.dataset.dayIndex || '0');

    if (!dragState.dragStarted && dragState.mouseStartX !== null && dragState.mouseStartY !== null) {
      const dx = e.clientX - dragState.mouseStartX;
      const dy = e.clientY - dragState.mouseStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 10) {
        return;
      }

      setDragState({
        ...dragState,
        dragStarted: true,
        hoveredDayIndex: dayIndex,
      });
    }

    if (!dragState.dragStarted) return;

    const newDateTime = getDateTimeFromPosition(e, dayElement);

    if (dragState.mode === 'move') {
      const duration = dragState.originalEnd!.getTime() - dragState.originalStart!.getTime();
      setDragState({
        ...dragState,
        dragStarted: true,
        currentStart: newDateTime,
        currentEnd: new Date(newDateTime.getTime() + duration),
        hoveredDayIndex: dayIndex,
      });
    } else if (dragState.mode === 'resize-end') {
      if (newDateTime > dragState.currentStart!) {
        setDragState({
          ...dragState,
          dragStarted: true,
          currentEnd: newDateTime,
          hoveredDayIndex: dayIndex,
        });
      }
    } else if (dragState.mode === 'resize-start') {
      if (newDateTime < dragState.currentEnd!) {
        setDragState({
          ...dragState,
          dragStarted: true,
          currentStart: newDateTime,
          hoveredDayIndex: dayIndex,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (!dragState.item || !dragState.mode || !dragState.currentStart || !dragState.currentEnd) {
      setDragState({
        item: null,
        mode: null,
        originalStart: null,
        originalEnd: null,
        currentStart: null,
        currentEnd: null,
        mouseStartX: null,
        mouseStartY: null,
        dragStarted: false,
        hoveredDayIndex: null,
      });
      return;
    }

    if (!dragState.dragStarted) {
      setDragState({
        item: null,
        mode: null,
        originalStart: null,
        originalEnd: null,
        currentStart: null,
        currentEnd: null,
        mouseStartX: null,
        mouseStartY: null,
        dragStarted: false,
        hoveredDayIndex: null,
      });
      return;
    }

    const hasChanged =
      dragState.currentStart.getTime() !== dragState.originalStart!.getTime() ||
      dragState.currentEnd.getTime() !== dragState.originalEnd!.getTime();

    if (hasChanged) {
      if (onDragComplete) {
        const mode = dragState.mode === 'move' ? 'move' : 'resize';
        onDragComplete(dragState.item, dragState.currentStart, dragState.currentEnd, mode);
      } else {
        if (dragState.mode === 'move' && onEventDrop) {
          onEventDrop(dragState.item.id, dragState.currentStart, dragState.currentEnd);
        } else if ((dragState.mode === 'resize-start' || dragState.mode === 'resize-end') && onEventResize) {
          onEventResize(dragState.item.id, dragState.currentStart, dragState.currentEnd);
        }
      }
    }

    setDragState({
      item: null,
      mode: null,
      originalStart: null,
      originalEnd: null,
      currentStart: null,
      currentEnd: null,
      mouseStartX: null,
      mouseStartY: null,
      dragStarted: false,
      hoveredDayIndex: null,
    });
  };

  const getDateTimeFromTouchPosition = (touch: React.Touch, hourHeight: number = 48) => {
    const allDayElements = scrollContainerRef.current?.querySelectorAll('[data-day-index]');
    if (!allDayElements) return null;

    for (let i = 0; i < allDayElements.length; i++) {
      const dayElement = allDayElements[i] as HTMLElement;
      const rect = dayElement.getBoundingClientRect();

      if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
        const y = touch.clientY - rect.top;
        const totalHours = y / hourHeight;
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60 / 15) * 15;

        const dayIndex = parseInt(dayElement.dataset.dayIndex || '0');
        const targetDay = days[dayIndex];
        const newDate = new Date(targetDay);
        newDate.setHours(Math.max(0, Math.min(23, hours)));
        newDate.setMinutes(Math.max(0, Math.min(59, minutes)));
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);

        return { date: newDate, dayIndex };
      }
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent, item: CalendarItem) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = window.setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setDragState({
        item,
        mode: 'move',
        originalStart: new Date(item.start),
        originalEnd: new Date(item.end),
        currentStart: new Date(item.start),
        currentEnd: new Date(item.end),
        mouseStartX: touch.clientX,
        mouseStartY: touch.clientY,
        dragStarted: true,
        hoveredDayIndex: null,
      });
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.item || !dragState.dragStarted) {
      if (longPressTimerRef.current && touchStartPosRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    const hourHeight = isMobile ? 48 : 64;
    const result = getDateTimeFromTouchPosition(touch, hourHeight);

    if (result && dragState.mode === 'move') {
      const duration = dragState.originalEnd!.getTime() - dragState.originalStart!.getTime();
      setDragState({
        ...dragState,
        currentStart: result.date,
        currentEnd: new Date(result.date.getTime() + duration),
        hoveredDayIndex: result.dayIndex,
      });
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;

    if (!dragState.item || !dragState.dragStarted) {
      return;
    }

    if (dragState.currentStart && dragState.currentEnd) {
      const hasChanged =
        dragState.currentStart.getTime() !== dragState.originalStart!.getTime() ||
        dragState.currentEnd.getTime() !== dragState.originalEnd!.getTime();

      if (hasChanged) {
        if (onDragComplete) {
          onDragComplete(dragState.item, dragState.currentStart, dragState.currentEnd, 'move');
        } else if (onEventDrop) {
          onEventDrop(dragState.item.id, dragState.currentStart, dragState.currentEnd);
        }
      }
    }

    setDragState({
      item: null,
      mode: null,
      originalStart: null,
      originalEnd: null,
      currentStart: null,
      currentEnd: null,
      mouseStartX: null,
      mouseStartY: null,
      dragStarted: false,
      hoveredDayIndex: null,
    });
  };

  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="py-2 text-center text-xs font-semibold text-gray-500 w-12"></div>
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            const dayItems = getItemsForDay(items, day);
            const uniqueColors = [...new Set(dayItems.map(item => getEventColor(item)))];
            const hasEvents = dayItems.length > 0;

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={`py-2 px-0.5 text-center cursor-pointer active:bg-gray-100 transition-colors ${
                  isToday ? 'bg-belaya-50' : ''
                }`}
              >
                <div className="text-[9px] text-gray-500 font-medium uppercase">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 1)}
                </div>
                <div
                  className={`text-sm font-semibold mt-0.5 ${
                    isToday
                      ? 'bg-belaya-500 text-white w-6 h-6 flex items-center justify-center rounded-full mx-auto'
                      : 'text-gray-900'
                  }`}
                >
                  {day.getDate()}
                </div>
                {hasEvents && (
                  <div className="flex items-center justify-center gap-0.5 mt-1 min-h-[6px]">
                    {uniqueColors.slice(0, 2).map((colorClass, idx) => {
                      return (
                        <span
                          key={idx}
                          className={`w-[4px] h-[4px] rounded-full ${colorClass.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-400'}`}
                        />
                      );
                    })}
                  </div>
                )}
                {!hasEvents && <div className="min-h-[6px] mt-1" />}
              </div>
            );
          })}
        </div>
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[500px]"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-8">
            <div className="border-r border-gray-100 w-12">
              {hours.map((hour) => (
                <div key={hour} className="h-12 py-0.5 px-1 text-[9px] text-gray-400 border-b border-gray-50 leading-tight">
                  {hour.toString().padStart(2, '0')}h
                </div>
              ))}
            </div>
            {days.map((day, dayIndex) => {
              const dayItems = getItemsForDay(items, day);
              const positionedItems = calculateOverlappingPositions(dayItems);
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-gray-100 last:border-r-0 relative transition-colors ${
                    isToday ? 'bg-belaya-50/20' : ''
                  } ${
                    dragState.dragStarted && dragState.hoveredDayIndex === dayIndex
                      ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-300'
                      : ''
                  }`}
                  data-day-index={dayIndex}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b border-gray-50"
                      onClick={() => {
                        const targetDate = new Date(days[dayIndex]);
                        targetDate.setHours(hour, 0, 0, 0);
                        onDayClick(targetDate);
                      }}
                    ></div>
                  ))}
                  <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
                    {dragState.dragStarted && dragState.currentStart && isSameDay(dragState.currentStart, days[dayIndex]) && dragState.item && (
                      (() => {
                        const start = dragState.currentStart;
                        const end = dragState.currentEnd!;
                        const startHour = start.getHours() + start.getMinutes() / 60;
                        const endHour = end.getHours() + end.getMinutes() / 60;
                        const top = startHour * 48;
                        const height = (endHour - startHour) * 48;

                        return (
                          <div
                            key={`dragging-${dragState.item.id}`}
                            className={`${getEventColor(dragState.item)} text-white rounded overflow-hidden select-none relative opacity-75 shadow-2xl ring-2 ring-white scale-105 pointer-events-none z-50`}
                            style={{
                              position: 'absolute',
                              top: `${top}px`,
                              height: `${Math.max(height - 3, 20)}px`,
                              left: '2px',
                              right: '2px',
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                              <span className="text-white font-semibold text-[9px] px-1.5 py-0.5 bg-black/60 rounded shadow">
                                Déplacement...
                              </span>
                            </div>
                            <div className="px-1 py-0.5 text-[9px] font-medium line-clamp-2 leading-tight">
                              {dragState.item.type === 'task' && (dragState.item.data as any).production_step && (
                                <span className="mr-0.5">{getStepEmoji((dragState.item.data as any).production_step)}</span>
                              )}
                              {dragState.item.title}
                            </div>
                          </div>
                        );
                      })()
                    )}
                    {positionedItems.map((item) => {
                      const isDragging = dragState.item?.id === item.id && dragState.dragStarted;
                      const isCancelled = item.type === 'event' && (item.data as any).status === 'cancelled';
                      const productionStep = item.type === 'task' ? (item.data as any).production_step : null;

                      const startHour = item.start.getHours() + item.start.getMinutes() / 60;
                      const endHour = item.end.getHours() + item.end.getMinutes() / 60;
                      const top = startHour * 48;
                      const height = (endHour - startHour) * 48;

                      const widthPercent = 100 / item.totalColumns;
                      const leftPercent = (item.column * widthPercent);

                      return (
                        <div
                          key={item.id}
                          className={`${getEventColor(item)} text-white overflow-hidden select-none rounded pointer-events-auto active:scale-95 transition-transform ${
                            isCancelled ? 'opacity-60 line-through' : ''
                          } ${isDragging ? 'opacity-20' : ''} ${isSocialMediaPublished(item) ? 'opacity-50' : ''}`}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${Math.max(height - 3, 20)}px`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                            touchAction: 'none',
                          }}
                          onTouchStart={(e) => {
                            if (!isDragging) {
                              handleTouchStart(e, item);
                            }
                          }}
                          onClick={(e) => {
                            if (!dragState.dragStarted) {
                              e.stopPropagation();
                              onItemClick(item);
                            }
                          }}
                        >
                          <div className="px-1 py-0.5 text-[9px] font-medium line-clamp-2 leading-tight">
                            {productionStep && <span className="mr-0.5">{getStepEmoji(productionStep)}</span>}
                            {height > 35 ? item.title : item.title.slice(0, 12)}
                          </div>
                          {height > 24 && (
                            <div className="px-1 text-[8px] opacity-90 truncate">
                              {formatTime(item.start)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="py-3 px-3 text-center text-xs font-semibold text-gray-500 border-r border-gray-200"></div>
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`py-3 px-2 text-center border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-belaya-50/40' : ''
              }`}
            >
              <div className="text-xs text-gray-500 font-medium uppercase">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div
                className={`text-lg font-semibold mt-1 ${
                  isToday ? 'text-belaya-600' : 'text-gray-900'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div ref={scrollContainerRef} className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-8 gap-x-0">
          <div className="border-r border-gray-200">
            {hours.map((hour) => (
              <div key={hour} className="h-16 py-2 px-3 text-xs text-gray-400 border-b border-gray-100">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => {
            const dayItems = getItemsForDay(items, day);
            const positionedItems = calculateOverlappingPositions(dayItems);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`border-r border-gray-200 last:border-r-0 relative transition-all duration-200 ${
                  isToday ? 'bg-belaya-50/10' : ''
                } ${
                  dragState.dragStarted && dragState.hoveredDayIndex === dayIndex
                    ? 'bg-blue-50/70 ring-2 ring-inset ring-blue-400'
                    : ''
                }`}
                data-day-index={dayIndex}
                onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (dragState.dragStarted) return;
                      const now = Date.now();
                      const isDoubleClick = lastClickTime &&
                        now - lastClickTime.time < 300 &&
                        lastClickTime.dayIndex === dayIndex &&
                        lastClickTime.hour === hour;

                      if (isDoubleClick && onTimeSlotDoubleClick) {
                        const targetDate = new Date(days[dayIndex]);
                        targetDate.setHours(hour, 0, 0, 0);
                        onTimeSlotDoubleClick(targetDate);
                        setLastClickTime(null);
                      } else {
                        setLastClickTime({ time: now, dayIndex, hour });
                      }
                    }}
                  ></div>
                ))}
                <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none" style={{ right: dayIndex === days.length - 1 ? '0' : '-1px' }}>
                  {dragState.dragStarted && dragState.currentStart && isSameDay(dragState.currentStart, days[dayIndex]) && dragState.item && (
                    (() => {
                      const start = dragState.currentStart;
                      const end = dragState.currentEnd!;
                      const startHour = start.getHours() + start.getMinutes() / 60;
                      const endHour = end.getHours() + end.getMinutes() / 60;
                      const top = startHour * 64;
                      const height = (endHour - startHour) * 64;

                      return (
                        <div
                          key={`dragging-${dragState.item.id}`}
                          className={`${getEventColor(dragState.item)} text-white rounded-md overflow-hidden select-none relative opacity-65 cursor-grabbing shadow-2xl ring-2 md:ring-4 ring-white scale-105 pointer-events-auto`}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${Math.max(height - 4, 28)}px`,
                            left: '4px',
                            right: '4px',
                            zIndex: 100,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
                            <span className="text-white font-semibold text-xs px-2 py-1 bg-black/60 rounded shadow-lg">
                              {dragState.mode === 'move' ? 'Déplacement...' : 'Redimensionnement...'}
                            </span>
                          </div>
                          <div className="px-2 py-1 font-medium line-clamp-2 text-xs leading-snug">
                            {(() => {
                              const productionStep = dragState.item.type === 'task' ? (dragState.item.data as any).production_step : null;
                              return (
                                <>
                                  {productionStep && <span className="mr-1">{getStepEmoji(productionStep)}</span>}
                                  {dragState.item.title}
                                </>
                              );
                            })()}
                          </div>
                          <div className="px-2 text-xs opacity-90 truncate">
                            {formatTime(start)} - {formatTime(end)}
                          </div>
                        </div>
                      );
                    })()
                  )}
                  {positionedItems.map((item) => {
                    const isDragging = dragState.item?.id === item.id;
                    const isBeingDragged = isDragging && dragState.dragStarted;
                    const isGrabbed = isDragging && !dragState.dragStarted;

                    const isCancelled = item.type === 'event' && (item.data as any).status === 'cancelled';
                    const dragLabel = dragState.mode === 'move' ? 'Déplacement...' : 'Redimensionnement...';

                    const widthPercent = 100 / item.totalColumns;
                    const leftPercent = (item.column * widthPercent);

                    const renderEvent = (start: Date, end: Date, isGhost: boolean) => {
                      const startHour = start.getHours() + start.getMinutes() / 60;
                      const endHour = end.getHours() + end.getMinutes() / 60;
                      const top = startHour * 64;
                      const height = (endHour - startHour) * 64;

                      return (
                        <div
                          key={isGhost ? `${item.id}-ghost` : item.id}
                          className={`${getEventColor(item)} text-white rounded-md overflow-hidden select-none group relative ${
                            isGhost
                              ? 'opacity-20 pointer-events-none'
                              : isBeingDragged
                              ? 'opacity-65 cursor-grabbing shadow-2xl ring-4 ring-white scale-105 z-50 pointer-events-auto'
                              : isGrabbed
                              ? 'scale-105 cursor-grabbing shadow-lg ring-2 ring-white/50 transition-transform duration-150 pointer-events-auto'
                              : 'cursor-grab hover:opacity-90 hover:shadow-md transition-all duration-200 pointer-events-auto'
                          } ${isSocialMediaPublished(item) && !isGhost ? 'opacity-50' : ''}`}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${Math.max(height - 4, 28)}px`,
                            left: `calc(${leftPercent}% + 4px)`,
                            width: `calc(${widthPercent}% - 8px)`,
                            transform: isBeingDragged && !isGhost ? 'scale(1.05)' : undefined,
                            transition: isBeingDragged ? 'none' : undefined,
                          }}
                          onMouseDown={!isGhost ? (e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const isTopHandle = y < 8;
                            const isBottomHandle = y > rect.height - 8;

                            if (isTopHandle) {
                              handleMouseDown(e, item, 'resize-start');
                            } else if (isBottomHandle) {
                              handleMouseDown(e, item, 'resize-end');
                            } else {
                              handleMouseDown(e, item, 'move');
                            }
                          } : undefined}
                          onClick={!isGhost ? (e) => {
                            if (!isBeingDragged) {
                              e.stopPropagation();
                              onItemClick(item);
                            }
                          } : undefined}
                        >
                          {(isBeingDragged || isGrabbed) && !isGhost && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
                              <span className="text-white font-semibold text-xs px-2 py-1 bg-black/60 rounded shadow-lg">
                                {isBeingDragged ? dragLabel : 'Prêt...'}
                              </span>
                            </div>
                          )}
                          {!isGhost && (
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'rgba(255,255,255,0.3)' }}
                            />
                          )}
                          <div className="flex items-start justify-between gap-1">
                            <div className={`px-2 py-1 font-medium line-clamp-2 text-xs leading-snug flex-1 ${isCancelled ? 'line-through' : ''}`}>
                              {(() => {
                                const productionStep = item.type === 'task' ? (item.data as any).production_step : null;
                                return (
                                  <span className="flex items-center gap-1">
                                    <SocialStatusDot item={item} size="sm" />
                                    {productionStep && <span className="mr-1">{getStepEmoji(productionStep)}</span>}
                                    {item.title}
                                    <SocialProgressDots item={item} />
                                  </span>
                                );
                              })()}
                            </div>
                            {item.data && (item.data as any).link && (
                              <a
                                href={(item.data as any).link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-1 py-1 hover:bg-white/20 rounded transition-colors"
                                title="Ouvrir le lien"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className={`px-2 text-xs opacity-90 truncate ${isCancelled ? 'line-through' : ''}`}>
                            {formatTime(start)} - {formatTime(end)}
                          </div>
                          {!isGhost && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'rgba(255,255,255,0.3)' }}
                            />
                          )}
                        </div>
                      );
                    };

                    const isInThisDay = isSameDay(item.start, days[dayIndex]);

                    if (!isInThisDay) {
                      return null;
                    }

                    if (isBeingDragged) {
                      return renderEvent(item.start, item.end, true);
                    }

                    return renderEvent(item.start, item.end, false);
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayView({ currentDate, items, onItemClick, onTimeSlotDoubleClick, onEventDrop, onEventResize, onDragComplete }: Omit<CalendarViewProps, 'view' | 'onDayClick'>) {
  const dayItems = getItemsForDay(items, currentDate).sort((a, b) => a.start.getTime() - b.start.getTime());
  const positionedItems = calculateOverlappingPositions(dayItems);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [lastClickTime, setLastClickTime] = useState<{ time: number; hour: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [dragState, setDragState] = useState<{
    item: CalendarItem | null;
    mode: 'move' | 'resize-start' | 'resize-end' | null;
    originalStart: Date | null;
    originalEnd: Date | null;
    currentStart: Date | null;
    currentEnd: Date | null;
    mouseStartX: number | null;
    mouseStartY: number | null;
    dragStarted: boolean;
    hoveredDayIndex: number | null;
  }>({
    item: null,
    mode: null,
    originalStart: null,
    originalEnd: null,
    currentStart: null,
    currentEnd: null,
    mouseStartX: null,
    mouseStartY: null,
    dragStarted: false,
    hoveredDayIndex: null,
  });

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7 * 80;
    }
  }, [currentDate]);

  const getDateTimeFromPosition = (e: React.MouseEvent, dayElement: HTMLElement) => {
    const rect = dayElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hourHeight = 80;
    const totalHours = y / hourHeight;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60 / 15) * 15;

    const newDate = new Date(currentDate);
    newDate.setHours(Math.max(0, Math.min(23, hours)));
    newDate.setMinutes(Math.max(0, Math.min(59, minutes)));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    return newDate;
  };

  const handleMouseDown = (e: React.MouseEvent, item: CalendarItem, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.preventDefault();

    setDragState({
      item,
      mode,
      originalStart: new Date(item.start),
      originalEnd: new Date(item.end),
      currentStart: new Date(item.start),
      currentEnd: new Date(item.end),
      mouseStartX: e.clientX,
      mouseStartY: e.clientY,
      dragStarted: false,
      hoveredDayIndex: null,
    });
  };

  const handleMouseMove = (e: React.MouseEvent, dayElement: HTMLElement) => {
    if (!dragState.item || !dragState.mode) return;

    const dayIndex = parseInt(dayElement.dataset.dayIndex || '0');

    if (!dragState.dragStarted && dragState.mouseStartX !== null && dragState.mouseStartY !== null) {
      const dx = e.clientX - dragState.mouseStartX;
      const dy = e.clientY - dragState.mouseStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 10) {
        return;
      }

      setDragState({
        ...dragState,
        dragStarted: true,
        hoveredDayIndex: dayIndex,
      });
    }

    if (!dragState.dragStarted) return;

    const newDateTime = getDateTimeFromPosition(e, dayElement);

    if (dragState.mode === 'move') {
      const duration = dragState.originalEnd!.getTime() - dragState.originalStart!.getTime();
      setDragState({
        ...dragState,
        dragStarted: true,
        currentStart: newDateTime,
        currentEnd: new Date(newDateTime.getTime() + duration),
        hoveredDayIndex: dayIndex,
      });
    } else if (dragState.mode === 'resize-end') {
      if (newDateTime > dragState.currentStart!) {
        setDragState({
          ...dragState,
          dragStarted: true,
          currentEnd: newDateTime,
          hoveredDayIndex: dayIndex,
        });
      }
    } else if (dragState.mode === 'resize-start') {
      if (newDateTime < dragState.currentEnd!) {
        setDragState({
          ...dragState,
          dragStarted: true,
          currentStart: newDateTime,
          hoveredDayIndex: dayIndex,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (!dragState.item || !dragState.mode || !dragState.currentStart || !dragState.currentEnd) {
      setDragState({
        item: null,
        mode: null,
        originalStart: null,
        originalEnd: null,
        currentStart: null,
        currentEnd: null,
        mouseStartX: null,
        mouseStartY: null,
        dragStarted: false,
        hoveredDayIndex: null,
      });
      return;
    }

    if (!dragState.dragStarted) {
      setDragState({
        item: null,
        mode: null,
        originalStart: null,
        originalEnd: null,
        currentStart: null,
        currentEnd: null,
        mouseStartX: null,
        mouseStartY: null,
        dragStarted: false,
        hoveredDayIndex: null,
      });
      return;
    }

    const hasChanged =
      dragState.currentStart.getTime() !== dragState.originalStart!.getTime() ||
      dragState.currentEnd.getTime() !== dragState.originalEnd!.getTime();

    if (hasChanged) {
      if (onDragComplete) {
        const mode = dragState.mode === 'move' ? 'move' : 'resize';
        onDragComplete(dragState.item, dragState.currentStart, dragState.currentEnd, mode);
      } else {
        if (dragState.mode === 'move' && onEventDrop) {
          onEventDrop(dragState.item.id, dragState.currentStart, dragState.currentEnd);
        } else if ((dragState.mode === 'resize-start' || dragState.mode === 'resize-end') && onEventResize) {
          onEventResize(dragState.item.id, dragState.currentStart, dragState.currentEnd);
        }
      }
    }

    setDragState({
      item: null,
      mode: null,
      originalStart: null,
      originalEnd: null,
      currentStart: null,
      currentEnd: null,
      mouseStartX: null,
      mouseStartY: null,
      dragStarted: false,
      hoveredDayIndex: null,
    });
  };

  const getDateTimeFromTouchPosition = (touch: React.Touch, hourHeight: number = 80) => {
    const dayElement = scrollContainerRef.current?.querySelector('[data-day-index]') as HTMLElement;
    if (!dayElement) return null;

    const rect = dayElement.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    const totalHours = y / hourHeight;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60 / 15) * 15;

    const newDate = new Date(currentDate);
    newDate.setHours(Math.max(0, Math.min(23, hours)));
    newDate.setMinutes(Math.max(0, Math.min(59, minutes)));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    return { date: newDate, dayIndex: 0 };
  };

  const handleTouchStart = (e: React.TouchEvent, item: CalendarItem) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = window.setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setDragState({
        item,
        mode: 'move',
        originalStart: new Date(item.start),
        originalEnd: new Date(item.end),
        currentStart: new Date(item.start),
        currentEnd: new Date(item.end),
        mouseStartX: touch.clientX,
        mouseStartY: touch.clientY,
        dragStarted: true,
        hoveredDayIndex: 0,
      });
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.item || !dragState.dragStarted) {
      if (longPressTimerRef.current && touchStartPosRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    const hourHeight = 80;
    const result = getDateTimeFromTouchPosition(touch, hourHeight);

    if (result && dragState.mode === 'move') {
      const duration = dragState.originalEnd!.getTime() - dragState.originalStart!.getTime();
      setDragState({
        ...dragState,
        currentStart: result.date,
        currentEnd: new Date(result.date.getTime() + duration),
        hoveredDayIndex: 0,
      });
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;

    if (!dragState.item || !dragState.dragStarted) {
      return;
    }

    if (dragState.currentStart && dragState.currentEnd) {
      const hasChanged =
        dragState.currentStart.getTime() !== dragState.originalStart!.getTime() ||
        dragState.currentEnd.getTime() !== dragState.originalEnd!.getTime();

      if (hasChanged) {
        if (onDragComplete) {
          onDragComplete(dragState.item, dragState.currentStart, dragState.currentEnd, 'move');
        } else if (onEventDrop) {
          onEventDrop(dragState.item.id, dragState.currentStart, dragState.currentEnd);
        }
      }
    }

    setDragState({
      item: null,
      mode: null,
      originalStart: null,
      originalEnd: null,
      currentStart: null,
      currentEnd: null,
      mouseStartX: null,
      mouseStartY: null,
      dragStarted: false,
      hoveredDayIndex: null,
    });
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h3>
      </div>
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto max-h-[600px]"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-[80px_1fr]">
          <div className="border-r border-gray-200">
            {hours.map((hour) => (
              <div key={hour} className="h-20 p-2 text-sm text-gray-500 border-b border-gray-100">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div
            className={`relative transition-all duration-200 ${
              dragState.dragStarted ? 'bg-blue-50/30 ring-2 ring-inset ring-blue-400' : ''
            }`}
            data-day-index="0"
            onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-20 border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                onClick={() => {
                  if (dragState.dragStarted) return;
                  const now = Date.now();
                  const isDoubleClick = lastClickTime &&
                    now - lastClickTime.time < 300 &&
                    lastClickTime.hour === hour;

                  if (isDoubleClick && onTimeSlotDoubleClick) {
                    const targetDate = new Date(currentDate);
                    targetDate.setHours(hour, 0, 0, 0);
                    onTimeSlotDoubleClick(targetDate);
                    setLastClickTime(null);
                  } else {
                    setLastClickTime({ time: now, hour });
                  }
                }}
              ></div>
            ))}
            <div className="absolute inset-0 pointer-events-none">
              {positionedItems.map((item) => {
                const isDragging = dragState.item?.id === item.id;
                const isBeingDragged = isDragging && dragState.dragStarted;
                const isGrabbed = isDragging && !dragState.dragStarted;
                const dragLabel = dragState.mode === 'move' ? 'Déplacement...' : 'Redimensionnement...';

                const isCancelled = item.type === 'event' && (item.data as any).status === 'cancelled';
                const widthPercent = 100 / item.totalColumns;
                const leftPercent = (item.column * widthPercent);

                const renderEvent = (start: Date, end: Date, isGhost: boolean) => {
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;
                  const top = startHour * 80;
                  const height = (endHour - startHour) * 80;

                  return (
                    <div
                      key={isGhost ? `${item.id}-ghost` : item.id}
                      className={`${getEventColor(item)} text-white rounded-lg select-none group relative ${
                        isGhost
                          ? 'opacity-20 pointer-events-none'
                          : isBeingDragged
                          ? 'opacity-65 cursor-grabbing shadow-2xl ring-4 ring-white scale-105 z-50 pointer-events-auto'
                          : isGrabbed
                          ? 'scale-105 cursor-grabbing shadow-lg ring-2 ring-white/50 transition-transform duration-150 pointer-events-auto'
                          : 'cursor-grab hover:opacity-90 transition-all duration-200 hover:scale-102 pointer-events-auto'
                      } ${isSocialMediaPublished(item) && !isGhost ? 'opacity-50' : ''}`}
                      style={{
                        position: 'absolute',
                        top: `${top}px`,
                        height: `${Math.max(height - 8, 40)}px`,
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        transform: isBeingDragged && !isGhost ? 'scale(1.05)' : undefined,
                        transition: isBeingDragged ? 'none' : undefined,
                        touchAction: isMobile ? 'none' : undefined,
                      }}
                      onMouseDown={!isGhost ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const isTopHandle = y < 8;
                        const isBottomHandle = y > rect.height - 8;

                        if (isTopHandle) {
                          handleMouseDown(e, item, 'resize-start');
                        } else if (isBottomHandle) {
                          handleMouseDown(e, item, 'resize-end');
                        } else {
                          handleMouseDown(e, item, 'move');
                        }
                      } : undefined}
                      onTouchStart={!isGhost && isMobile ? (e) => {
                        if (!isDragging) {
                          handleTouchStart(e, item);
                        }
                      } : undefined}
                      onClick={!isGhost ? (e) => {
                        if (!isBeingDragged && !dragState.dragStarted) {
                          e.stopPropagation();
                          onItemClick(item);
                        }
                      } : undefined}
                    >
                      {(isBeingDragged || isGrabbed) && !isGhost && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
                          <span className="text-white font-semibold text-sm px-2 py-1 bg-black/60 rounded shadow-lg">
                            {isBeingDragged ? dragLabel : 'Prêt...'}
                          </span>
                        </div>
                      )}
                      {!isGhost && (
                        <div
                          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(255,255,255,0.3)' }}
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className={`px-3 md:px-4 pt-2 font-semibold text-base line-clamp-2 flex-1 ${isCancelled ? 'line-through' : ''}`}>
                          {(() => {
                            const productionStep = item.type === 'task' ? (item.data as any).production_step : null;
                            return (
                              <span className="flex items-center gap-1.5">
                                <SocialStatusDot item={item} size="md" />
                                {productionStep && <span className="mr-1">{getStepEmoji(productionStep)}</span>}
                                {item.title}
                              </span>
                            );
                          })()}
                        </div>
                        {item.data && (item.data as any).link && (
                          <a
                            href={(item.data as any).link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-2 hover:bg-white/20 rounded transition-colors"
                            title="Ouvrir le lien"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className={`px-3 md:px-4 pb-2 text-sm opacity-90 mt-1 flex items-center gap-2 ${isCancelled ? 'line-through' : ''}`}>
                        <span className="truncate">{formatTime(start)} - {formatTime(end)}</span>
                        <SocialProgressDots item={item} />
                      </div>
                      {!isGhost && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(255,255,255,0.3)' }}
                        />
                      )}
                    </div>
                  );
                };

                if (isBeingDragged && dragState.originalStart && dragState.currentStart) {
                  const hasPositionChanged =
                    dragState.originalStart.getTime() !== dragState.currentStart.getTime() ||
                    dragState.originalEnd!.getTime() !== dragState.currentEnd!.getTime();

                  if (hasPositionChanged) {
                    return (
                      <>
                        {renderEvent(item.start, item.end, true)}
                        {renderEvent(dragState.currentStart, dragState.currentEnd!, false)}
                      </>
                    );
                  }
                }

                return renderEvent(item.start, item.end, false);
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
