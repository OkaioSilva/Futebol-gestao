import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand',
          size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
          variant === 'primary' && 'bg-brand text-brand-fg hover:opacity-90',
          variant === 'secondary' && 'bg-surface-2 text-fg border border-border hover:bg-surface',
          variant === 'ghost' && 'hover:bg-surface-2 text-fg',
          variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
