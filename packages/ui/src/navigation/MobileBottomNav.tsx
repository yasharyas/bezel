"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { ElementType } from "react";

export interface NavTab {
  id: string;
  icon: ElementType;
  label: string;
  badge?: number;
  /** Override onTabChange with a custom action */
  action?: () => void;
  /** CSS color string for special accent tabs (e.g. WhatsApp green) */
  accentColor?: string;
}

type Props = {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function MobileBottomNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="grid px-1"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasAccent = !!tab.accentColor;

          return (
            <button
              key={tab.id}
              onClick={() => (tab.action ? tab.action() : onTabChange(tab.id))}
              style={hasAccent ? { color: tab.accentColor } : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-1 relative transition-colors ${
                hasAccent
                  ? ""
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && !hasAccent && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", damping: 20, stiffness: 400 }}
                />
              )}

              <div className="relative">
                <Icon className="w-5 h-5" />
                <AnimatePresence>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <motion.span
                      key={tab.badge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold px-0.5 leading-none"
                    >
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
