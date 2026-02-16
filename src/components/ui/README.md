# UI Component Library

This directory contains reusable UI primitive components for the Cricket Draft application. All components follow consistent naming conventions, use semantic CSS classes, and leverage design tokens from our CSS variables system.

## Design Philosophy

- **Semantic over Visual**: Class names communicate intent, not implementation
- **Composable**: Components can be combined without conflicts
- **Accessible**: ARIA attributes and keyboard navigation where applicable
- **Consistent**: All components share common patterns and conventions
- **Type-safe**: Full TypeScript support with proper prop types

## Available Components

### Button

Flexible button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Click me</Button>
<Button variant="danger" size="sm" loading>Deleting...</Button>
<Button variant="ghost" disabled>Disabled</Button>
```

**Variants:**
- `primary` (default) - Main action button with emerald background
- `secondary` - Neutral gray button for secondary actions
- `danger` - Red button for destructive actions
- `ghost` - Transparent button with hover effect
- `outline` - Outlined button with no background
- `success` - Green button for positive confirmations

**Sizes:**
- `default` - Standard button size
- `sm` - Smaller button for compact layouts

**Props:**
- `loading?: boolean` - Shows loading state with disabled interaction
- `disabled?: boolean` - Disables the button
- `className?: string` - Additional CSS classes (for layout/spacing only)

---

### Badge

Small status indicator with semantic color variants.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="danger">Failed</Badge>
<Badge variant="warning">Pending</Badge>
```

**Variants:**
- `success` - Green badge for positive status
- `warning` - Yellow/orange badge for warnings
- `danger` - Red badge for errors or critical status
- `info` - Blue badge for informational status
- `neutral` (default) - Gray badge for neutral status

**Props:**
- `className?: string` - Additional CSS classes (for layout/spacing only)

---

### Card

Semantic container component with optional padding.

```tsx
import { Card } from '@/components/ui';

<Card>
  <div>Content without padding</div>
</Card>

<Card padded>
  <div>Content with padding</div>
</Card>

<Card padded className="bg-slate-50">
  <div>Card with custom background</div>
</Card>
```

**Props:**
- `padded?: boolean` - Adds padding to the card (`.card-padded` class)
- `className?: string` - Additional CSS classes

---

### Alert

Alert/banner component for notifications and messages.

```tsx
import { Alert } from '@/components/ui';

<Alert variant="success">Operation successful!</Alert>
<Alert variant="danger">An error occurred</Alert>
<Alert variant="warning">Please review your settings</Alert>
<Alert variant="info">System update available</Alert>
```

**Variants:**
- `success` - Green alert for success messages
- `warning` - Yellow/orange alert for warnings
- `danger` - Red alert for errors
- `info` (default) - Blue alert for informational messages

**Props:**
- `className?: string` - Additional CSS classes

---

### StatDisplay

Displays a label-value pair following the design system's stat patterns.

```tsx
import { StatDisplay } from '@/components/ui';

<StatDisplay label="Total Rounds" value={8} />
<StatDisplay label="Draft Status" value="In Progress" variant="md" />
<StatDisplay label="Picks Made" value={120} highlight />
```

**Props:**
- `label: string` - The label text (uses `.stat-label` class)
- `value: string | number` - The value to display
- `variant?: 'default' | 'md'` - Size variant (`default` uses `.stat-value`, `md` uses `.stat-value-md`)
- `highlight?: boolean` - Applies highlight styling (`.stat-value-highlight`)
- `className?: string` - Additional CSS classes

---

### NavLink

Navigation link component with active state styling.

```tsx
import { NavLink } from '@/components/ui';

<NavLink href="/admin/draft" active={pathname === '/admin/draft'}>
  Draft Management
</NavLink>

<NavLink 
  href="/admin/players" 
  active={pathname === '/admin/players'}
  icon={<UsersIcon />}
>
  Players
</NavLink>
```

**Props:**
- `href: string` - Link destination
- `active: boolean` - Whether this link is currently active
- `icon?: React.ReactNode` - Optional icon to display before the label
- `children: React.ReactNode` - Link text/content
- `className?: string` - Additional CSS classes

---

## Usage Guidelines

### When to Use Raw Tailwind

Raw Tailwind utilities are **only acceptable** for:
- Layout (flex, grid, positioning)
- Spacing (margins, padding, gaps)
- Responsive modifiers (sm:, md:, lg:)

**Good:**
```tsx
<Button variant="primary" className="mt-4 mb-2">Submit</Button>
<div className="flex gap-4 items-center">
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>
```

**Bad:**
```tsx
<button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
  Submit
</button>
```

### Composition Patterns

Components can be composed together:

```tsx
<Card padded>
  <div className="flex items-center justify-between mb-4">
    <h2 className="section-title">Draft Status</h2>
    <Badge variant="success">Active</Badge>
  </div>
  
  <div className="grid grid-cols-3 gap-4">
    <StatDisplay label="Round" value={3} />
    <StatDisplay label="Picks" value={24} />
    <StatDisplay label="Remaining" value={72} />
  </div>
  
  <Alert variant="info" className="mt-4">
    Draft will auto-pause after this round
  </Alert>
  
  <div className="flex gap-2 mt-4">
    <Button variant="primary">Continue</Button>
    <Button variant="secondary">Pause</Button>
  </div>
</Card>
```

### Accessibility

All components include appropriate ARIA attributes:
- Buttons have `disabled` states
- Alerts have implicit `role="alert"`
- NavLinks indicate active state
- Interactive elements are keyboard-accessible

### Naming Conventions

Components follow these naming rules:
- PascalCase for component names
- Semantic variant names (not colors: use `success` not `green`)
- Props match HTML attributes where possible
- Boolean props use `is*` or bare names (`active`, `disabled`, `loading`)

## Design Tokens

Components reference CSS custom properties defined in `src/styles/globals/base.css`:

```css
--primary: #10b981;
--primary-hover: #059669;
--accent-light: #ecfdf5;
--danger: #dc2626;
--warning: #d97706;
--border: #e2e8f0;
--text-primary: #111827;
--text-muted: #64748b;
/* ... and more */
```

Use these tokens in component-specific CSS when needed, but prefer using the existing semantic classes first.

## Testing Components

When using these components:
1. Verify visual appearance in the browser
2. Test all variants and states (hover, disabled, loading)
3. Check responsive behavior across breakpoints
4. Test keyboard navigation and accessibility
5. Validate with linter (no errors should appear)

## Migration Path

When refactoring existing code:
1. Identify repeated inline style patterns
2. Replace with appropriate UI primitive
3. Keep layout utilities (flex, grid, spacing)
4. Test visually to ensure no regressions
5. Update component if styles are almost right but need tweaking

---

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Maintained by:** Cricket Draft Team
