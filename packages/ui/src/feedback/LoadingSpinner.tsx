const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-4",
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export const LoadingSpinner = ({ size = "md", className }: LoadingSpinnerProps) => (
  <div className={`flex items-center justify-center${className ? ` ${className}` : ""}`}>
    <div className={`animate-spin rounded-full border-primary border-t-transparent ${sizes[size]}`} />
  </div>
)
