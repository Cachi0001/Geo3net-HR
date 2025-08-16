import { clsx, type ClassValue } from 'clsx'

/**
 * Utility function to merge CSS classes
 * Combines clsx for conditional classes with CSS Modules support
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Utility function to merge CSS Module classes with Tailwind classes
 * @param moduleClasses - CSS Module classes object
 * @param className - Additional class names (Tailwind or global)
 * @returns Combined class string
 */
export function cnModule(moduleClasses: Record<string, string>, className?: string) {
  return cn(Object.values(moduleClasses), className)
}