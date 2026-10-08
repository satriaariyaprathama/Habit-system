interface ProgressBarProps {
  percent: number
  tone?: 'moss' | 'amber' | 'clay'
}

export function ProgressBar({ percent, tone = 'moss' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const fillColor =
    tone === 'amber' ? 'bg-amber-500' : tone === 'clay' ? 'bg-clay-500' : 'bg-moss-600'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-paper-dim border border-line">
      <div
        className={`h-full ${fillColor} transition-[width] duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
