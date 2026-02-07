import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface OverflowProblem {
  element: HTMLElement;
  type: string;
  diff?: number;
  tagName: string;
  classes: string;
  id: string;
  details: string;
}

export function OverflowDebugger({ enabled = false }: { enabled?: boolean }) {
  const [problems, setProblems] = useState<OverflowProblem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanForOverflow = () => {
    setIsScanning(true);
    const foundProblems: OverflowProblem[] = [];

    const allElements = document.querySelectorAll('*');

    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      const scrollWidth = htmlEl.scrollWidth;
      const clientWidth = htmlEl.clientWidth;

      // Check if element overflows
      if (scrollWidth > clientWidth + 1) {
        foundProblems.push({
          element: htmlEl,
          type: 'scrollWidth',
          diff: scrollWidth - clientWidth,
          tagName: htmlEl.tagName,
          classes: htmlEl.className,
          id: htmlEl.id,
          details: `scrollWidth: ${scrollWidth}px > clientWidth: ${clientWidth}px`
        });
      }

      // Check if element extends beyond viewport
      if (rect.right > window.innerWidth + 1) {
        foundProblems.push({
          element: htmlEl,
          type: 'rightOverflow',
          diff: rect.right - window.innerWidth,
          tagName: htmlEl.tagName,
          classes: htmlEl.className,
          id: htmlEl.id,
          details: `right: ${rect.right.toFixed(2)}px > viewport: ${window.innerWidth}px`
        });
      }

      if (rect.left < -1) {
        foundProblems.push({
          element: htmlEl,
          type: 'leftOverflow',
          diff: Math.abs(rect.left),
          tagName: htmlEl.tagName,
          classes: htmlEl.className,
          id: htmlEl.id,
          details: `left: ${rect.left.toFixed(2)}px < 0`
        });
      }
    });

    // Highlight problems
    foundProblems.forEach(p => {
      if (p.element?.style) {
        p.element.style.outline = '3px solid red';
        p.element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      }
    });

    setProblems(foundProblems);
    setIsScanning(false);
  };

  const clearHighlights = () => {
    problems.forEach(p => {
      if (p.element?.style) {
        p.element.style.outline = '';
        p.element.style.backgroundColor = '';
      }
    });
    setProblems([]);
  };

  useEffect(() => {
    if (enabled) {
      scanForOverflow();
    }
    return () => {
      clearHighlights();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white border-2 border-red-500 rounded-lg shadow-2xl p-4 max-w-sm max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-bold text-red-500">Overflow Debugger</h3>
      </div>

      <div className="space-y-2 mb-3 text-xs">
        <div>Viewport: {window.innerWidth}px</div>
        <div>Document: {document.documentElement.scrollWidth}px</div>
        <div>Device: {navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Other'}</div>
      </div>

      <button
        onClick={scanForOverflow}
        disabled={isScanning}
        className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm mb-2 disabled:opacity-50"
      >
        {isScanning ? 'Scanning...' : 'Re-scan'}
      </button>

      <button
        onClick={clearHighlights}
        className="w-full px-3 py-2 bg-gray-500 text-white rounded text-sm mb-3"
      >
        Clear Highlights
      </button>

      <div className="text-sm">
        <strong>{problems.length} problems found</strong>

        {problems.length > 0 && (
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
            {problems.slice(0, 10).map((p, i) => (
              <div
                key={i}
                className="p-2 bg-red-50 rounded text-xs cursor-pointer hover:bg-red-100"
                onClick={() => {
                  p.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <div className="font-bold text-red-700">{p.type}</div>
                <div>{p.tagName}{p.id ? `#${p.id}` : ''}</div>
                {p.diff && <div>Overflow: {p.diff.toFixed(2)}px</div>}
                <div className="text-gray-600 truncate">{p.details}</div>
              </div>
            ))}
            {problems.length > 10 && (
              <div className="text-center text-gray-500">
                +{problems.length - 10} more...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
