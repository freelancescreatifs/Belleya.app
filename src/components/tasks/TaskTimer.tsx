import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Timer } from 'lucide-react';

interface TaskTimerProps {
  taskId: string;
  plannedDuration: number;
  taskTitle: string;
}

interface TimerState {
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
}

const STORAGE_KEY_PREFIX = 'task_timer_';

export default function TaskTimer({ taskId, plannedDuration, taskTitle }: TaskTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + taskId);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isRunning && parsed.startTime) {
        const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
        const remaining = Math.max(0, parsed.remainingSeconds - elapsed);
        return {
          ...parsed,
          remainingSeconds: remaining,
        };
      }
      return parsed;
    }
    return {
      remainingSeconds: plannedDuration * 60,
      isRunning: false,
      isPaused: false,
      startTime: null,
    };
  });

  const [showTimer, setShowTimer] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const saveTimerState = useCallback((state: TimerState) => {
    localStorage.setItem(STORAGE_KEY_PREFIX + taskId, JSON.stringify(state));
  }, [taskId]);

  useEffect(() => {
    if (timerState.isRunning && timerState.startTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());

        const elapsed = Math.floor((Date.now() - timerState.startTime!) / 1000);
        const remaining = Math.max(0, timerState.remainingSeconds - elapsed);

        if (remaining === 0) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe97OamUhELTKXh8bllHgU2jdXzxnkpBSl+zPDdi0IJFF.');
          audio.play().catch(() => {});

          setTimerState(prev => {
            const newState = {
              ...prev,
              isRunning: false,
              isPaused: false,
              remainingSeconds: 0,
            };
            saveTimerState(newState);
            return newState;
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timerState.isRunning, timerState.startTime, timerState.remainingSeconds, saveTimerState]);

  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState, saveTimerState]);

  const handleStart = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
    }));
    setShowTimer(true);
  };

  const handlePause = () => {
    if (timerState.startTime) {
      const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
      const remaining = Math.max(0, timerState.remainingSeconds - elapsed);

      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        isPaused: true,
        remainingSeconds: remaining,
        startTime: null,
      }));
    }
  };

  const handleResume = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
    }));
  };

  const handleStop = () => {
    setTimerState({
      remainingSeconds: plannedDuration * 60,
      isRunning: false,
      isPaused: false,
      startTime: null,
    });
    setShowTimer(false);
  };

  const handleReset = () => {
    setTimerState({
      remainingSeconds: plannedDuration * 60,
      isRunning: false,
      isPaused: false,
      startTime: null,
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentRemaining = () => {
    if (timerState.isRunning && timerState.startTime) {
      const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
      return Math.max(0, timerState.remainingSeconds - elapsed);
    }
    return timerState.remainingSeconds;
  };

  const remainingSeconds = getCurrentRemaining();
  const percentage = ((plannedDuration * 60 - remainingSeconds) / (plannedDuration * 60)) * 100;

  if (!showTimer && !timerState.isRunning && !timerState.isPaused) {
    return (
      <button
        onClick={handleStart}
        className="inline-flex items-center gap-1 px-2 py-1 text-belaya-bright hover:text-emerald-700 hover:bg-emerald-50 rounded transition-all text-xs"
        title={`Démarrer le timer (${plannedDuration} min)`}
      >
        <Timer className="w-3.5 h-3.5" />
        <span className="font-medium">{plannedDuration} min</span>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-gray-700" />
          <span className="text-sm font-medium text-gray-700">
            {timerState.isRunning ? 'En cours' : timerState.isPaused ? 'En pause' : 'Prêt'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Durée prévue: {plannedDuration}min
        </span>
      </div>

      <div className="mb-3">
        <div className="text-3xl font-bold text-gray-900 text-center mb-2">
          {formatTime(remainingSeconds)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${
              timerState.isRunning
                ? 'bg-gradient-to-r from-belaya-bright to-teal-500'
                : 'bg-gray-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {!timerState.isRunning && !timerState.isPaused && (
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-belaya-bright to-teal-500 text-white rounded-lg hover:from-belaya-deep hover:to-teal-600 transition-all text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Démarrer
          </button>
        )}

        {timerState.isRunning && (
          <button
            onClick={handlePause}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-sm font-medium"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}

        {timerState.isPaused && (
          <button
            onClick={handleResume}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-belaya-bright to-teal-500 text-white rounded-lg hover:from-belaya-deep hover:to-teal-600 transition-all text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Reprendre
          </button>
        )}

        <button
          onClick={handleStop}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
        >
          <Square className="w-4 h-4" />
          Stop
        </button>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
