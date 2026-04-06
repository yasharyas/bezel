import { Plus } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel = "Create",
  onAction,
  showAction = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground/40">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
