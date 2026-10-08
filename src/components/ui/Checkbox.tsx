interface CheckboxProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label?: string
}

export function Checkbox({ checked, onChange, disabled, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-500 disabled:opacity-40 ${
        checked
          ? 'border-moss-600 bg-moss-600 text-paper'
          : 'border-ink-faint bg-paper hover:border-moss-500'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
          <path
            d="M3 8.5L6.2 12L13 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
