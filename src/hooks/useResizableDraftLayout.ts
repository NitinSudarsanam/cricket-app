'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LAYOUT_STORAGE_KEY = 'draft-layout';
const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_HISTORY_HEIGHT = 256;
const MIN_HISTORY_HEIGHT = 120;
const MAX_HISTORY_HEIGHT = 480;

function persistLayout(partial: { sidebarWidth?: number; historyHeight?: number }) {
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    const prev = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ ...prev, ...partial }));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function useResizableDraftLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [historyHeight, setHistoryHeight] = useState(DEFAULT_HISTORY_HEIGHT);
  const resizeSidebarStart = useRef<{ x: number; w: number } | null>(null);
  const resizeHistoryStart = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { sidebarWidth?: number; historyHeight?: number };
      if (
        typeof parsed.sidebarWidth === 'number' &&
        parsed.sidebarWidth >= MIN_SIDEBAR_WIDTH &&
        parsed.sidebarWidth <= MAX_SIDEBAR_WIDTH
      ) {
        setSidebarWidth(parsed.sidebarWidth);
      }
      if (
        typeof parsed.historyHeight === 'number' &&
        parsed.historyHeight >= MIN_HISTORY_HEIGHT &&
        parsed.historyHeight <= MAX_HISTORY_HEIGHT
      ) {
        setHistoryHeight(parsed.historyHeight);
      }
    } catch {
      // Keep defaults if stored layout is invalid.
    }
  }, []);

  const handleSidebarResizeMove = useCallback((e: PointerEvent) => {
    const start = resizeSidebarStart.current;
    if (!start) return;
    const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, start.w + (start.x - e.clientX)));
    setSidebarWidth(next);
    persistLayout({ sidebarWidth: next });
  }, []);

  const handleSidebarResizeEnd = useCallback(() => {
    resizeSidebarStart.current = null;
    document.removeEventListener('pointermove', handleSidebarResizeMove);
    document.removeEventListener('pointerup', handleSidebarResizeEnd);
  }, [handleSidebarResizeMove]);

  const handleSidebarResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      resizeSidebarStart.current = { x: e.clientX, w: sidebarWidth };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handleSidebarResizeMove);
      document.addEventListener('pointerup', handleSidebarResizeEnd);
    },
    [sidebarWidth, handleSidebarResizeMove, handleSidebarResizeEnd]
  );

  const handleHistoryResizeMove = useCallback((e: PointerEvent) => {
    const start = resizeHistoryStart.current;
    if (!start) return;
    const next = Math.min(MAX_HISTORY_HEIGHT, Math.max(MIN_HISTORY_HEIGHT, start.h + (start.y - e.clientY)));
    setHistoryHeight(next);
    persistLayout({ historyHeight: next });
  }, []);

  const handleHistoryResizeEnd = useCallback(() => {
    resizeHistoryStart.current = null;
    document.removeEventListener('pointermove', handleHistoryResizeMove);
    document.removeEventListener('pointerup', handleHistoryResizeEnd);
  }, [handleHistoryResizeMove]);

  const handleHistoryResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      resizeHistoryStart.current = { y: e.clientY, h: historyHeight };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handleHistoryResizeMove);
      document.addEventListener('pointerup', handleHistoryResizeEnd);
    },
    [historyHeight, handleHistoryResizeMove, handleHistoryResizeEnd]
  );

  return {
    sidebarWidth,
    historyHeight,
    handleSidebarResizeStart,
    handleHistoryResizeStart,
  };
}
