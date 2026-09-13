import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useResizableDraftLayout } from '@/hooks/useResizableDraftLayout';

function pointerEvent(clientX: number, clientY = 0) {
  return {
    clientX,
    clientY,
    pointerId: 1,
    preventDefault: vi.fn(),
    target: { setPointerCapture: vi.fn() },
  } as unknown as React.PointerEvent;
}

describe('useResizableDraftLayout', () => {
  const storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    storage.getItem.mockReturnValue(null);
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    });
  });

  it('restores a stored sidebar width and history height', () => {
    storage.getItem.mockReturnValue(JSON.stringify({ sidebarWidth: 400, historyHeight: 200 }));
    const { result } = renderHook(() => useResizableDraftLayout());
    expect(result.current.sidebarWidth).toBe(400);
    expect(result.current.historyHeight).toBe(200);
  });

  it('persists sidebar width on pointerup, not on every move', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const { result } = renderHook(() => useResizableDraftLayout());

    act(() => {
      result.current.handleSidebarResizeStart(pointerEvent(500));
    });

    const move = addSpy.mock.calls.find((call) => call[0] === 'pointermove')?.[1] as EventListener;
    const up = addSpy.mock.calls.find((call) => call[0] === 'pointerup')?.[1] as EventListener;
    expect(move).toBeTypeOf('function');
    expect(up).toBeTypeOf('function');

    act(() => {
      move(new PointerEvent('pointermove', { clientX: 460 }));
    });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(result.current.sidebarWidth).toBe(360);

    act(() => {
      up(new PointerEvent('pointerup', { clientX: 460 }));
    });
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toMatchObject({ sidebarWidth: 360 });
  });

  it('removes document listeners on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { result, unmount } = renderHook(() => useResizableDraftLayout());

    act(() => {
      result.current.handleSidebarResizeStart(pointerEvent(400));
    });

    const move = addSpy.mock.calls.find((call) => call[0] === 'pointermove')?.[1];
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('pointermove', move);
  });

  it('ends a resize on pointercancel without leaving listeners behind', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { result } = renderHook(() => useResizableDraftLayout());

    act(() => {
      result.current.handleHistoryResizeStart(pointerEvent(0, 300));
    });

    const cancel = addSpy.mock.calls.find((call) => call[0] === 'pointercancel')?.[1] as EventListener;
    expect(cancel).toBeTypeOf('function');

    act(() => {
      cancel(new PointerEvent('pointercancel'));
    });

    expect(removeSpy).toHaveBeenCalledWith('pointercancel', cancel);
    expect(storage.setItem).toHaveBeenCalled();
  });
});
