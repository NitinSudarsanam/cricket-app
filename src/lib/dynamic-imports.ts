/**
 * Dynamic Imports Configuration
 * 
 * This file centralizes all dynamic imports for heavy components
 * to improve initial page load performance through code splitting.
 * 
 * Heavy components are loaded on-demand rather than in the initial bundle.
 */

import dynamic from 'next/dynamic';

// ============================================================================
// Admin Components (Heavy - loaded only when needed)
// ============================================================================

export const DynamicPlayerManagement = dynamic(
  () => import('@/components/admin/PlayerManagement').then(mod => ({ default: mod.PlayerManagement })),
  {
    ssr: false, // Admin components don't need SSR
  }
);

export const DynamicDraftConfigEditor = dynamic(
  () => import('@/components/admin/DraftConfigEditor').then(mod => ({ default: mod.DraftConfigEditor })),
  {
    ssr: false,
  }
);

export const DynamicConsistencyChecker = dynamic(
  () => import('@/components/admin/ConsistencyChecker').then(mod => ({ default: mod.ConsistencyChecker })),
  {
    ssr: false,
  }
);

export const DynamicDraftMonitor = dynamic(
  () => import('@/components/admin/DraftMonitor').then(mod => ({ default: mod.DraftMonitor })),
  {
    ssr: false,
  }
);

export const DynamicDraftResultsView = dynamic(
  () => import('@/components/admin/DraftResultsView').then(mod => ({ default: mod.DraftResultsView })),
  {
    ssr: false,
  }
);

// ============================================================================
// Draft Components (Heavy - loaded only during draft)
// ============================================================================

export const DynamicDraftInterface = dynamic(
  () => import('@/components/draft/DraftInterface').then(mod => ({ default: mod.DraftInterface })),
  {
    ssr: false, // Draft interface needs real-time data
  }
);

export const DynamicDraftBoard = dynamic(
  () => import('@/components/draft/DraftBoard').then(mod => ({ default: mod.DraftBoard })),
  {
    ssr: false,
  }
);

export const DynamicPickHistory = dynamic(
  () => import('@/components/draft/PickHistory').then(mod => ({ default: mod.PickHistory })),
  {
    ssr: false,
  }
);

export const DynamicRosterSidebar = dynamic(
  () => import('@/components/draft/RosterSidebar').then(mod => ({ default: mod.RosterSidebar })),
  {
    ssr: false,
  }
);

export const DynamicDraftCompletion = dynamic(
  () => import('@/components/draft/DraftCompletion').then(mod => ({ default: mod.DraftCompletion })),
  {
    ssr: false,
  }
);

// ============================================================================
// Real-time Provider (Heavy - WebSocket connection)
// ============================================================================

export const DynamicDraftRealtimeProvider = dynamic(
  () => import('@/components/DraftRealtimeProvider').then(mod => ({ default: mod.DraftRealtimeProvider })),
  {
    ssr: false, // Real-time connections are client-side only
  }
);

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example usage in a page:
 * 
 * import { DynamicPlayerManagement } from '@/lib/dynamic-imports';
 * 
 * export default function AdminPlayersPage() {
 *   return (
 *     <AdminLayout>
 *       <DynamicPlayerManagement />
 *     </AdminLayout>
 *   );
 * }
 * 
 * This will:
 * 1. Split the PlayerManagement component into a separate chunk
 * 2. Load it only when the page is accessed
 * 3. Show a loading spinner while loading
 * 4. Reduce initial bundle size significantly
 */
