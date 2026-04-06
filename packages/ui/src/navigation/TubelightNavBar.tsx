"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  onClick?: () => void
}

interface NavBarProps {
  items: NavItem[]
  activeItem?: string
  className?: string
  onNavigate?: (url: string) => void
}

export function TubelightNavBar({ items, activeItem, className, onNavigate }: NavBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  const currentActive = activeItem ?? items[0]?.name ?? ""

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={`fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-3 sm:mb-0 sm:pt-3 pointer-events-none${className ? ` ${className}` : ""}`}
    >
      <div className="flex items-center gap-1 bg-background/5 border border-border backdrop-blur-lg py-0.5 px-0.5 rounded-full shadow-lg pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = currentActive === item.name
          const baseClasses =
            "relative cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-full transition-colors text-center text-foreground/80 hover:text-primary" +
            (isActive ? " bg-muted text-primary" : "")

          const content = (
            <>
              <span className={isMobile ? "hidden" : "hidden md:inline"}>{item.name}</span>
              <span className={isMobile ? "inline" : "md:hidden"}>
                <Icon size={14} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-t-full">
                    <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -top-1.5 -left-1" />
                    <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -top-0.5" />
                    <div className="absolute w-3 h-3 bg-primary/20 rounded-full blur-sm top-0 left-1.5" />
                  </div>
                </motion.div>
              )}
            </>
          )

          if (item.onClick) {
            return (
              <button key={item.name} onClick={item.onClick} className={baseClasses}>
                {content}
              </button>
            )
          }

          return (
            <a
              key={item.name}
              href={item.url}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault()
                  onNavigate(item.url)
                }
              }}
              className={baseClasses}
            >
              {content}
            </a>
          )
        })}
      </div>
    </div>
  )
}
