import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X } from "lucide-react"

// ── Spring easing ──────────────────────────────────────────────────
const SWITCH_THEME = {
  "--ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as React.CSSProperties

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "peer-checked:bg-primary peer-checked:border-primary",
        destructive: "peer-checked:bg-destructive peer-checked:border-destructive",
      },
      size: {
        default: "h-8 w-[52px]",
        sm: "h-6 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

// ── Web Audio haptic feedback ──────────────────────────────────────
const playHapticFeedback = (type: "heavy" | "light" | "none") => {
  if (type === "none" || typeof window === "undefined") return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    const now = ctx.currentTime
    if (type === "heavy") {
      oscillator.type = "triangle"
      oscillator.frequency.setValueAtTime(180, now)
      oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.15)
      gainNode.gain.setValueAtTime(0.4, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
      oscillator.start(now)
      oscillator.stop(now + 0.15)
    } else {
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(800, now)
      gainNode.gain.setValueAtTime(0.15, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
      oscillator.start(now)
      oscillator.stop(now + 0.08)
    }
  } catch { /* silent fail */ }
}

export interface MD3SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof switchVariants> {
  onCheckedChange?: (checked: boolean) => void
  showIcons?: boolean
  checkedIcon?: React.ReactNode
  uncheckedIcon?: React.ReactNode
  haptic?: "heavy" | "light" | "none"
}

export const MD3Switch = React.forwardRef<HTMLInputElement, MD3SwitchProps>(
  ({
    className,
    size,
    variant,
    checked,
    defaultChecked,
    onCheckedChange,
    showIcons = false,
    checkedIcon,
    uncheckedIcon,
    haptic = "none",
    style,
    disabled,
    ...props
  }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    React.useEffect(() => {
      if (checked !== undefined) setIsChecked(checked)
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const newValue = e.target.checked
      playHapticFeedback(haptic ?? "none")
      if (checked === undefined) setIsChecked(newValue)
      onCheckedChange?.(newValue)
    }

    const isSmall = size === "sm"
    const translateDist = isSmall ? "translate-x-[16px]" : "translate-x-[20px]"
    const handleSizeUnchecked = isSmall ? "w-3 h-3 ml-[2px]" : "w-4 h-4 ml-[2px]"
    const handleSizeChecked = isSmall ? "w-4 h-4" : "w-6 h-6"
    const handleSizePressed = isSmall ? "w-5 h-5 -ml-[2px]" : "w-7 h-7 -ml-[2px]"
    const iconClasses = isSmall ? "w-2.5 h-2.5" : "w-3.5 h-3.5"
    const shouldRenderIcons = showIcons || checkedIcon || uncheckedIcon

    const haloLeft = isChecked
      ? (isSmall ? "left-[10px]" : "left-[14px]")
      : shouldRenderIcons && !isSmall
        ? "left-[14px]"
        : isSmall
          ? "left-[8px]"
          : "left-[10px]"

    return (
      <label
        className={[
          "group relative inline-flex items-center justify-center",
          disabled ? "cursor-not-allowed opacity-50" : "",
          "min-w-[48px] min-h-[48px]",
        ].join(" ")}
        style={{ ...SWITCH_THEME, ...style }}
        onPointerDown={() => !disabled && setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => { setIsPressed(false); setIsHovered(false) }}
        onPointerEnter={() => !disabled && setIsHovered(true)}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />

        {/* Track */}
        <div
          className={[
            switchVariants({ variant, size }),
            "bg-muted border-border",
            "peer-checked:bg-primary peer-checked:border-primary",
            className ?? "",
          ].join(" ")}
        >
          {/* Handle container */}
          <div
            className={[
              "pointer-events-none block h-full w-full transition-all duration-300 ease-[var(--ease-spring)]",
              isChecked ? translateDist : "translate-x-0",
            ].join(" ")}
          >
            {/* Handle */}
            <div
              className={[
                "absolute top-1/2 -translate-y-1/2 shadow-sm transition-all duration-300 flex items-center justify-center rounded-full left-[2px]",
                isChecked ? "bg-primary-foreground" : "bg-foreground text-muted",
                isChecked && variant === "primary" ? "text-primary" : "",
                isChecked && variant === "destructive" ? "text-destructive" : "",
                isPressed
                  ? handleSizePressed
                  : isChecked || (shouldRenderIcons && !isSmall)
                    ? handleSizeChecked
                    : handleSizeUnchecked,
              ].join(" ")}
            >
              {shouldRenderIcons && (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  {/* Checked icon */}
                  <div
                    className={[
                      "absolute inset-0 flex items-center justify-center transition-all duration-300",
                      isChecked ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-45",
                    ].join(" ")}
                  >
                    {checkedIcon ?? <Check className={iconClasses} strokeWidth={4} />}
                  </div>
                  {/* Unchecked icon */}
                  <div
                    className={[
                      "absolute inset-0 flex items-center justify-center transition-all duration-300 text-muted-foreground",
                      !isChecked ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-45",
                    ].join(" ")}
                  >
                    {uncheckedIcon ?? <X className={iconClasses} strokeWidth={4} />}
                  </div>
                </div>
              )}
            </div>

            {/* Halo */}
            <div
              className={[
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none transition-all duration-200",
                isSmall ? "w-8 h-8" : "w-10 h-10",
                isChecked
                  ? variant === "destructive" ? "bg-destructive" : "bg-primary"
                  : "bg-foreground",
                isPressed ? "opacity-10 scale-100" : isHovered ? "opacity-5 scale-100" : "opacity-0 scale-50",
                haloLeft,
              ].join(" ")}
            />
          </div>
        </div>
      </label>
    )
  }
)
MD3Switch.displayName = "MD3Switch"
