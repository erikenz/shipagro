import { cn } from '@/lib/utils'
import { alertKindLabel, stageLabel, triggerStatusLabel } from '@/panel/labels'

type Tone = 'neutral' | 'primary' | 'warning' | 'danger' | 'muted'

const tones: Record<Tone, string> = {
  neutral: 'border-border bg-background text-foreground',
  primary: 'border-transparent bg-accent text-accent-foreground',
  warning: 'border-transparent bg-warning-soft text-foreground',
  danger: 'border-transparent bg-destructive/10 text-destructive',
  muted: 'border-transparent bg-muted text-muted-foreground',
}

export function Pill({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const triggerTones: Record<string, Tone> = {
  activo: 'primary',
  alcanzado: 'warning',
  confirmado: 'neutral',
  cancelado: 'muted',
  vencido: 'muted',
}

export const TriggerStatus = ({ status }: { status: string }) => (
  <Pill tone={triggerTones[status] ?? 'neutral'}>{triggerStatusLabel(status)}</Pill>
)

export const AlertKind = ({ kind }: { kind: string }) => (
  <Pill tone={kind === 'alcanzado' ? 'warning' : 'neutral'}>{alertKindLabel(kind)}</Pill>
)

export const StageBadge = ({ stage }: { stage: string }) => (
  <Pill tone={stage === 'cobrada' ? 'muted' : 'neutral'}>{stageLabel(stage)}</Pill>
)
