# Styles Directory

This directory contains all CSS files for the application, organized by purpose and scope.

## Directory Structure

```
src/styles/
├── index.css                    # Main entry point - imports all styles
├── globals/                     # Global styles
│   └── base.css                # Tailwind import, CSS custom properties, theme config
├── utilities/                   # Utility classes
│   ├── components.css          # Semantic component utility classes (NEW)
│   ├── animations.css          # Keyframe animations (toasts, slides, pulse)
│   ├── helpers.css             # Scrollbar, touch, mobile optimizations
│   └── team-colors.css         # IPL team color utility classes
└── components/                  # Component-specific CSS
    ├── AdminLayout.css
    ├── DraftBoard.css
    ├── DraftMonitor.css
    ├── Forms.css
    ├── LoadingSpinner.css
    └── PlayerChip.css
```

## File Organization

### Main Entry Point

**`index.css`** - Import this file in your root layout (`src/app/layout.tsx`). It aggregates all CSS files in the correct order.

```typescript
import "@/styles/index.css";
```

### Global Styles

**`globals/base.css`** contains:
- Tailwind CSS import (`@import "tailwindcss"`)
- CSS custom properties (design tokens) in `:root`
- Tailwind v4 theme configuration via `@theme inline`
- Base body styles
- Global focus-visible styles for accessibility

### Semantic Component Utilities (NEW)

**`utilities/components.css`** provides semantic class names that replace common Tailwind patterns:

#### Layout Containers
- `.card` - White background card with border
- `.card-padded` - Card with padding
- `.header-bar` - Header with bottom border
- `.header-bar-sticky` - Sticky header at top
- `.container-page` - Max-width page container with responsive padding
- `.container-content` - Content container with larger padding on desktop

#### Typography
- `.label-xs` - Small uppercase label
- `.section-title` - Section heading with uppercase styling
- `.heading-lg` - Large responsive heading
- `.heading-md` - Medium responsive heading
- `.text-muted` - Muted secondary text
- `.text-primary` - Primary text

#### Buttons
- `.btn` - Base button (use with variants)
- `.btn-primary` - Primary action button (emerald)
- `.btn-secondary` - Secondary button (slate)
- `.btn-danger` - Danger button (red)
- `.btn-ghost` - Ghost/transparent button
- `.btn-sm` - Small button variant

#### Badges & Pills
- `.badge` - Base badge (use with variants)
- `.badge-success` - Success badge (emerald)
- `.badge-warning` - Warning badge (amber)
- `.badge-danger` - Danger badge (red)
- `.badge-info` - Info badge (blue)
- `.badge-neutral` - Neutral badge (slate)

#### Alerts
- `.alert-success` / `.alert-text-success` - Success alert styling
- `.alert-warning` / `.alert-text-warning` - Warning alert styling
- `.alert-danger` / `.alert-text-danger` - Danger alert styling
- `.alert-info` / `.alert-text-info` - Info alert styling

#### Utilities
- `.divider-vertical` - Vertical divider line
- `.divider-horizontal` - Horizontal divider line
- `.flex-center` - Flex with centered items
- `.flex-center-between` - Flex with space-between
- `.flex-stack` - Flex column
- `.stack-sm` / `.stack-md` / `.stack-lg` / `.stack-xl` - Vertical spacing
- `.scrollable` - Overflow-y auto
- `.bg-surface` - Surface background (slate-50)
- `.bg-page` - Page background with min-height

#### Progress & Stats
- `.progress-bar` - Progress bar container
- `.progress-bar-fill` - Progress bar fill
- `.stat-group` - Stat/metric container
- `.stat-label` - Stat label
- `.stat-value` - Large stat value
- `.stat-value-highlight` - Highlighted stat value (emerald)

#### Interactive
- `.list-item-interactive` - Clickable list item
- `.link-subtle` - Subtle link (slate)
- `.link-primary` - Primary link (emerald)

### Other Utility Files

**`utilities/team-colors.css`** - Utility classes for IPL team colors:
- `.team-{code}-bg` - Background colors (e.g., `.team-csk-bg`, `.team-mi-bg`)
- `.team-{code}-border` - Border colors (e.g., `.team-csk-border`)
- Team codes: CSK, MI, GT, RR, RCB, KKR, LSG, SRH, PBKS, DC

**`utilities/animations.css`** - Keyframe animations and animation classes:
- `.animate-slide-in-right` / `.animate-slide-out-right` - Toast notifications
- `.animate-slide-up` - Mobile bottom sheets
- `.animate-pulse-subtle` - Subtle pulsing effect
- `.active:scale-95` / `.active:scale-98` - Touch interaction feedback

**`utilities/helpers.css`** - Miscellaneous utilities:
- `.scrollbar-thin` - Custom thin scrollbar styling
- `.touch-manipulation` - Optimized touch interactions
- Mobile-specific optimizations (viewport, form inputs, safe area insets)

### Component CSS Modules

Component-specific styles using CSS Modules for scoped styling:
- **`PlayerChip.css`** - Player card component styles
- **`LoadingSpinner.css`** - Loading spinner animations
- **`Forms.css`** - Shared form field styles

Import CSS modules in components like this:
```typescript
import styles from '@/styles/components/ComponentName.module.css';
```

## Styling Methodology

This application uses a **hybrid styling approach**:

1. **Semantic Utility Classes** (Primary for structure) - Readable, consistent class names
   - Replace common Tailwind patterns
   - Located in `utilities/components.css`
   - Examples: `.card-padded`, `.btn-primary`, `.section-title`

2. **Tailwind CSS v4** (Primary for one-offs) - Utility-first CSS for unique styling
   - Inline utility classes in JSX for custom layouts
   - Configured via `@theme inline` in `globals/base.css`
   - No separate `tailwind.config.js` file needed

3. **CSS Modules** (Secondary) - For complex, reusable component styles
   - Scoped styles that won't clash
   - Used sparingly for components with intricate styling needs
   - Located in `components/*.module.css`

4. **CSS Custom Properties** - For design tokens
   - Defined in `globals/base.css`
   - Used throughout for consistency (colors, spacing, radius)
   - Enables theme switching if needed

## TypeScript Configuration

Color configuration and team color constants have been moved to:
- **`src/config/colors.ts`** - TypeScript color schemes and utilities
- **`src/config/team-colors.ts`** - IPL team color constants and helpers

These provide type-safe color management for dynamic styles.

## Usage Examples

### Before (verbose Tailwind):
```tsx
<div className="bg-white rounded-md border border-slate-200 p-6">
  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
    Section Title
  </h3>
  <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
    Submit
  </button>
</div>
```

### After (semantic utilities):
```tsx
<div className="card-padded">
  <h3 className="section-title mb-3">
    Section Title
  </h3>
  <button className="btn-primary">
    Submit
  </button>
</div>
```

## Adding New Styles

### For a new semantic utility:
Add it to `utilities/components.css` following the existing patterns. Use explicit CSS (not @apply) for Tailwind v4 compatibility.

### For a new utility class:
Add it to the appropriate file in `utilities/`:
- Team-related → `team-colors.css`
- Animation → `animations.css`
- Helper/misc → `helpers.css`
- Component pattern → `components.css`

### For a new component with CSS Module:
1. Create `ComponentName.module.css` in `components/`
2. Import it: `import styles from '@/styles/components/ComponentName.module.css'`
3. Use scoped classes: `<div className={styles.container}>`

### For a new design token:
Add CSS custom property to `globals/base.css` in the `:root` block.

## Best Practices

1. **Prefer semantic utilities** for common patterns (buttons, cards, alerts, badges)
2. **Use inline Tailwind** for one-off custom layouts and spacing
3. **Use CSS Modules** only when:
   - Component has complex, unique styling
   - Animation timing needs to be coordinated
   - Styles are easier to maintain separate from JSX
4. **Use CSS custom properties** for values that might change or theme
5. **Keep files focused** - each file has a single, clear purpose
6. **Document complex styles** with comments in CSS files
7. **Combine semantic classes with Tailwind** when needed:
   ```tsx
   <div className="card-padded mt-6 lg:col-span-2">
   ```

## Migration Notes

This structure was reorganized from a monolithic `globals.css` to improve:
- **Discoverability** - Easy to find relevant styles
- **Maintainability** - Smaller, focused files
- **Readability** - Semantic names instead of long class lists
- **Consistency** - Reusable patterns across components
- **Separation of concerns** - CSS-only in `styles/`, TypeScript config in `config/`
- **Build performance** - Optimized for Tailwind v4

Previous locations:
- `src/app/globals.css` → Split across `globals/`, `utilities/`
- `src/styles/config/colors.ts` → Moved to `src/config/colors.ts`
- `src/lib/team-colors.ts` → Moved to `src/config/team-colors.ts`
