import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-primary" />
      <path
        d="m9 21.5 5-6 4 3 5.5-7.5"
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <circle cx="23.5" cy="11" r="3" strokeWidth="1.6" className="fill-warning stroke-primary-foreground" />
    </svg>
  )
}

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark className="size-10" />
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight">ShipAgro</span>
        <span className="text-xs text-muted-foreground">Precios gatillo · Mesa comercial</span>
      </div>
    </div>
  )
}
