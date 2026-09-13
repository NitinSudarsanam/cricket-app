# Zustand Stores

The live app keeps a single Zustand store: toast notifications. Draft state lives in `useDraftSync` (local React state plus Pusher), not in a global store.

## useToastStore

Manages toast messages for success, error, warning, and info notifications.

**State:**
- `toasts`: Active toast list

**Actions:**
- `addToast(toast)`: Add a toast and return its id
- `success(message, duration?)`
- `error(message, duration?, action?)`
- `warning(message, duration?)`
- `info(message, duration?)`
- `removeToast(id)`
- `clearAll()`

Prefer `useToast()` from `@/hooks/useToast` in components. That wrapper adds optional retry actions on error toasts.

```tsx
'use client';

import { useToast } from '@/hooks/useToast';

function SaveButton() {
  const toast = useToast();

  return (
    <button
      type="button"
      onClick={() => toast.success('Saved')}
    >
      Save
    </button>
  );
}
```

`ToastProvider` in the root layout reads `useToastStore` and renders the stack.
