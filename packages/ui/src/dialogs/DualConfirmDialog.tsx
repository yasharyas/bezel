import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

const EXIT_MS = 160

// @starting-style drives the entrance (paint-driven, not a mount effect +
// requestAnimationFrame, so it isn't silently skipped if the tab was
// backgrounded when the dialog opened). Exit still needs JS: the dialog has
// to stay mounted for one transition after `open` goes false, which
// [data-closing] below drives, kept in sync with the delayed unmount.
const dialogStyle = `
  .yui-dialog-backdrop {
    opacity: 1;
    transition: opacity 200ms cubic-bezier(0.23,1,0.32,1);
  }
  @starting-style { .yui-dialog-backdrop { opacity: 0; } }
  .yui-dialog-backdrop[data-closing="true"] { opacity: 0; }

  .yui-dialog {
    opacity: 1;
    transform: scale(1);
    transition: transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1);
  }
  @starting-style { .yui-dialog { opacity: 0; transform: scale(0.96); } }
  .yui-dialog[data-closing="true"] { opacity: 0; transform: scale(0.96); }
`;

export interface DeleteProgress {
  current: number
  total: number
  strategy?: "frontend" | "backend"
}

export interface DualConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  itemCount: number
  itemType: string
  confirmationPhrase?: string
  isLoading?: boolean
  progress?: DeleteProgress | null
}

export function DualConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemCount,
  itemType,
  confirmationPhrase = "DELETE",
  isLoading = false,
  progress = null,
}: DualConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [inputValue, setInputValue] = useState("")

  // Keep the dialog mounted for one exit transition after `open` flips to
  // false — interruptible if `open` flips back true before the timer fires.
  const [rendered, setRendered] = useState(open)

  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    const timer = setTimeout(() => setRendered(false), EXIT_MS)
    return () => clearTimeout(timer)
  }, [open])

  const handleFirstConfirm = () => setStep(2)
  const handleFinalConfirm = () => { if (inputValue === confirmationPhrase) onConfirm() }
  const handleClose = () => {
    if (isLoading) return
    setStep(1)
    setInputValue("")
    onOpenChange(false)
  }

  const progressPercentage = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{dialogStyle}</style>

      {/* Backdrop */}
      <div
        className="yui-dialog-backdrop absolute inset-0 bg-black/50"
        data-closing={!open ? "true" : undefined}
        onClick={handleClose}
      />

      {/* Dialog — transform-origin stays centered; it isn't anchored to a trigger */}
      <div
        className="yui-dialog relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-lg shadow-xl"
        data-closing={!open ? "true" : undefined}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading && progress ? (
            /* Progress view */
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Deleting items...</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {progress.current} of {progress.total}
                {progress.strategy === "frontend" && " (sequential mode)"}
                {progress.strategy === "backend" && " (batch mode)"}
              </p>
            </div>
          ) : step === 1 ? (
            /* Step 1: warning */
            <div className="space-y-4">
              <p className="text-muted-foreground">{description}</p>
              <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="font-semibold text-destructive">
                  You are about to delete {itemCount} {itemType}{itemCount > 1 ? "s" : ""}.
                </p>
                <p className="text-sm text-muted-foreground mt-1">This action cannot be undone.</p>
              </div>
            </div>
          ) : (
            /* Step 2: type to confirm */
            <div className="space-y-4">
              <p className="font-medium text-destructive">⚠️ Final Confirmation Required</p>
              <p className="text-sm text-muted-foreground">
                Type{" "}
                <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
                  {confirmationPhrase}
                </code>{" "}
                to confirm deletion of {itemCount} {itemType}{itemCount > 1 ? "s" : ""}.
              </p>
              <input
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Type ${confirmationPhrase} to confirm`}
                autoFocus
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue === confirmationPhrase) handleFinalConfirm()
                }}
              />
              <p className="text-xs text-muted-foreground">Note: Type in UPPERCASE letters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!(isLoading && progress) && (
          <div className="flex justify-end gap-2 px-6 pb-6">
            {step === 1 ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm rounded-md border border-border bg-background hover:bg-muted transition-[background-color,transform] active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFirstConfirm}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-[background-color,transform] active:scale-[0.97]"
                >
                  Continue to Final Confirmation
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm rounded-md border border-border bg-background hover:bg-muted transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleFinalConfirm}
                  disabled={inputValue !== confirmationPhrase || isLoading}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Permanently
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
