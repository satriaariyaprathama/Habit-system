import { ButtonHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-sm px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<string, string> = {
    primary: 'bg-moss-600 text-paper hover:bg-moss-700 focus-visible:outline-moss-600',
    ghost:
      'bg-transparent text-ink-soft border border-line hover:bg-paper-dim focus-visible:outline-moss-500',
    danger: 'bg-clay-500 text-paper hover:bg-clay-500/90 focus-visible:outline-clay-500',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="mb-4 block text-sm">
      <span className="mb-1.5 block font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  )
}

export function inputClass() {
  return 'w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-moss-500'
}

export function Legend(props: LabelHTMLAttributes<HTMLSpanElement>) {
  return <span className="text-xs text-ink-faint" {...props} />
}
