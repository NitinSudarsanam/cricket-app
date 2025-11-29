/**
 * Class Name Utilities
 * 
 * Utility functions for managing CSS class names following SOLID principles.
 * Single Responsibility: Each function has one clear purpose.
 */

/**
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
 * Conditionally applies classes based on a condition.
 * 
 * @param condition - Boolean condition
 * @param trueClass - Class to apply when condition is true
 * @param falseClass - Class to apply when condition is false (optional)
 * @returns The appropriate class name
 * 
 * @example
 * conditionalClass(isError, 'text-red-500', 'text-gray-500')
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string {
  return condition ? trueClass : (falseClass || '');
}

/**
 * Merges CSS module classes with additional classes.
 * 
 * @param moduleClasses - Classes from CSS module
 * @param additionalClasses - Additional classes to merge
 * @returns Combined class name string
 * 
 * @example
 * mergeClasses(styles.button, 'mt-4 hover:bg-blue-600')
 */
export function mergeClasses(
  moduleClasses: string,
  additionalClasses?: string
): string {
  return classNames(moduleClasses, additionalClasses);
}

/**
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
