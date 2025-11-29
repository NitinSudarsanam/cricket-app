/**
 * Color Configuration
 * 
 * Centralized color definitions following SOLID principles.
 * Single Responsibility: Manages all color-related configurations.
 * Open/Closed: Easy to extend with new color schemes without modifying existing code.
 */

export interface ColorScheme {
  bg: string;
  border: string;
  hover: string;
  text: string;
  textSecondary: string;
}

export interface StatusColors {
  success: ColorScheme;
  error: ColorScheme;
  warning: ColorScheme;
  info: ColorScheme;
  neutral: ColorScheme;
}

/**
 * Status color schemes for different UI states
 */
export const statusColors: StatusColors = {
  success: {
    bg: 'rgb(220, 252, 231)', // green-100
    border: 'rgb(134, 239, 172)', // green-300
    hover: 'rgb(187, 247, 208)', // green-200
    text: 'rgb(21, 128, 61)', // green-700
    textSecondary: 'rgb(22, 163, 74)', // green-600
  },
  error: {
    bg: 'rgb(254, 226, 226)', // red-100
    border: 'rgb(252, 165, 165)', // red-300
    hover: 'rgb(254, 202, 202)', // red-200
    text: 'rgb(185, 28, 28)', // red-700
    textSecondary: 'rgb(220, 38, 38)', // red-600
  },
  warning: {
    bg: 'rgb(254, 243, 199)', // yellow-100
    border: 'rgb(253, 224, 71)', // yellow-300
    hover: 'rgb(254, 240, 138)', // yellow-200
    text: 'rgb(161, 98, 7)', // yellow-700
    textSecondary: 'rgb(202, 138, 4)', // yellow-600
  },
  info: {
    bg: 'rgb(219, 234, 254)', // blue-100
    border: 'rgb(147, 197, 253)', // blue-300
    hover: 'rgb(191, 219, 254)', // blue-200
    text: 'rgb(29, 78, 216)', // blue-700
    textSecondary: 'rgb(37, 99, 235)', // blue-600
  },
  neutral: {
    bg: 'rgb(243, 244, 246)', // gray-100
    border: 'rgb(209, 213, 219)', // gray-300
    hover: 'rgb(229, 231, 235)', // gray-200
    text: 'rgb(55, 65, 81)', // gray-700
    textSecondary: 'rgb(75, 85, 99)', // gray-600
  },
};

/**
 * Get color scheme by status
 */
export function getStatusColors(status: keyof StatusColors): ColorScheme {
  return statusColors[status];
}

/**
 * Common color values used across the application
 */
export const commonColors = {
  // Primary colors
  primary: {
    50: 'rgb(239, 246, 255)',
    100: 'rgb(219, 234, 254)',
    200: 'rgb(191, 219, 254)',
    300: 'rgb(147, 197, 253)',
    400: 'rgb(96, 165, 250)',
    500: 'rgb(59, 130, 246)',
    600: 'rgb(37, 99, 235)',
    700: 'rgb(29, 78, 216)',
    800: 'rgb(30, 64, 175)',
    900: 'rgb(30, 58, 138)',
  },
  
  // Gray scale
  gray: {
    50: 'rgb(249, 250, 251)',
    100: 'rgb(243, 244, 246)',
    200: 'rgb(229, 231, 235)',
    300: 'rgb(209, 213, 219)',
    400: 'rgb(156, 163, 175)',
    500: 'rgb(107, 114, 128)',
    600: 'rgb(75, 85, 99)',
    700: 'rgb(55, 65, 81)',
    800: 'rgb(31, 41, 55)',
    900: 'rgb(17, 24, 39)',
  },
  
  // Semantic colors
  success: 'rgb(34, 197, 94)', // green-500
  error: 'rgb(239, 68, 68)', // red-500
  warning: 'rgb(234, 179, 8)', // yellow-500
  info: 'rgb(59, 130, 246)', // blue-500
  
  // Background colors
  background: {
    primary: 'rgb(255, 255, 255)',
    secondary: 'rgb(249, 250, 251)',
    tertiary: 'rgb(243, 244, 246)',
  },
  
  // Text colors
  text: {
    primary: 'rgb(17, 24, 39)',
    secondary: 'rgb(75, 85, 99)',
    tertiary: 'rgb(107, 114, 128)',
    disabled: 'rgb(156, 163, 175)',
  },
  
  // Border colors
  border: {
    light: 'rgb(229, 231, 235)',
    default: 'rgb(209, 213, 219)',
    dark: 'rgb(156, 163, 175)',
  },
} as const;

/**
 * Get a specific color value
 */
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: any = commonColors;
  
  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      console.warn(`Color path "${path}" not found`);
      return '';
    }
  }
  
  return value;
}
