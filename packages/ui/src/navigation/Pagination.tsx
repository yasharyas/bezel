import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

function paginationLinkClass(isActive?: boolean, extra?: string) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10"
  const variant = isActive
    ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    : "hover:bg-accent hover:text-accent-foreground"
  return [base, variant, extra ?? ""].filter(Boolean).join(" ")
}

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={`mx-auto flex w-full justify-center${className ? ` ${className}` : ""}`}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={`flex flex-row items-center gap-1${className ? ` ${className}` : ""}`}
      {...props}
    />
  )
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={className} {...props} />
)
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"a">

const PaginationLink = ({ className, isActive, ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={paginationLinkClass(isActive, className)}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={`gap-1 pl-2.5 w-auto px-4${className ? ` ${className}` : ""}`}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    className={`gap-1 pr-2.5 w-auto px-4${className ? ` ${className}` : ""}`}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={`flex h-10 w-10 items-center justify-center${className ? ` ${className}` : ""}`}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
}
