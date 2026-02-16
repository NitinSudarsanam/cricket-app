/**
 * Class Name Utilities
 * 
 * DEPRECATED: This file is deprecated in favor of @/lib/utils.ts
 * Please use the `cn()` function from @/lib/utils instead.
 * 
 * These utilities are kept for backward compatibility but will be removed in a future version.
 */

export { cn } from '@/lib/utils';

/**
 * @deprecated Use `cn()` from '@/lib/utils' instead
 * 
 * Combines multiple class names into a single string, filtering out falsy values.
 * 
 * @param classes - Array of class names or conditional class names
 * @returns Combined class name string
 * 
 * @example
 * classNames('base-class', isActive && 'active', 'another-class')
 * // Returns: 'base-class active another-class' (if isActive is true)
 */
export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * @deprecated Use `cn()` with inline conditionals instead
 * 
 * Conditionally applies classes based on a condition.
 * 
 * @param condition - Boolean condition
 * @param trueClass - Class to apply when condition is true
 * @param falseClass - Class to apply when condition is false (optional)
 * @returns The appropriate class name
 * 
 * @example
 * conditionalClass(isError, 'text-red-500', 'text-gray-500')
 * // Better: cn(isError ? 'text-red-500' : 'text-gray-500')
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string {
  return condition ? trueClass : (falseClass || '');
}

/**
 * @deprecated Use `cn()` instead
 * 
 * Merges CSS module classes with additional classes.
 * 
 * @param moduleClasses - Classes from CSS module
 * @param additionalClasses - Additional classes to merge
 * @returns Combined class name string
 * 
 * @example
 * mergeClasses(styles.button, 'mt-4 hover:bg-blue-600')
 * // Better: cn(styles.button, 'mt-4 hover:bg-blue-600')
 */
export function mergeClasses(
  moduleClasses: string,
  additionalClasses?: string
): string {
  return classNames(moduleClasses, additionalClasses);
}

/**
 * @deprecated Use CVA (class-variance-authority) instead
 * 
 * Creates a class name from a CSS module with variants.
 * 
 * @param baseClass - Base class from CSS module
 * @param variants - Object of variant conditions
 * @returns Combined class name string
 * 
 * @example
 * variantClasses(styles.button, {
 *   [styles.primary]: isPrimary,
 *   [styles.disabled]: isDisabled
 * })
 * // Better: Use CVA for variant management
 */
export function variantClasses(
  baseClass: string,
  variants: Record<string, boolean>
): string {
  const variantClassNames = Object.entries(variants)
    .filter(([, condition]) => condition)
    .map(([className]) => className);

  return classNames(baseClass, ...variantClassNames);
}

/**
 * @deprecated Use CVA (class-variance-authority) instead
 * 
 * Type-safe class name builder for components with multiple states.
 * 
 * @param classes - Object mapping state keys to class names
 * @param activeStates - Object of active state flags
 * @returns Combined class name string
 * 
 * @example
 * stateClasses(
 *   { base: 'btn', primary: 'btn-primary', disabled: 'btn-disabled' },
 *   { base: true, primary: isPrimary, disabled: isDisabled }
 * )
 * // Better: Use CVA for state management
 */
export function stateClasses<T extends Record<string, string>>(
  classes: T,
  activeStates: Partial<Record<keyof T, boolean>>
): string {
  return Object.entries(activeStates)
    .filter(([, isActive]) => isActive)
    .map(([key]) => classes[key as keyof T])
    .filter(Boolean)
    .join(' ');
}
