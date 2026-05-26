'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, LayoutGroup } from 'motion/react'
import { Sun, ListTodo, Plus, Repeat2, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileMoreSheet } from './MobileMoreSheet'

type NavItem = {
  href: string
  label: string
  icon: typeof Sun
  fab?: boolean
}

const items: NavItem[] = [
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/backlog', label: 'Backlog', icon: ListTodo },
  { href: '/add-task', label: 'Add', icon: Plus, fab: true },
  { href: '/recurring', label: 'Recurring', icon: Repeat2 },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-bg-elevated/95 backdrop-blur-xl border-t border-border safe-pb safe-pl safe-pr"
        aria-label="Navegación principal"
      >
        <LayoutGroup>
          <ul className="flex items-stretch justify-around px-1">
            {items.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon

              if (item.fab) {
                return (
                  <li key={item.href} className="flex items-center justify-center">
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className="touch-target w-14 h-14 -mt-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg active:scale-95 transition-transform"
                    >
                      <Icon className="w-6 h-6" />
                    </Link>
                  </li>
                )
              }

              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-0.5 py-2 touch-target text-[10px] font-medium transition-colors',
                      isActive ? 'text-accent' : 'text-text-muted'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="bottom-active"
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-accent"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={cn(
                  'w-full flex flex-col items-center justify-center gap-0.5 py-2 touch-target text-[10px] font-medium transition-colors',
                  moreOpen ? 'text-accent' : 'text-text-muted'
                )}
                aria-label="Más opciones"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span>More</span>
              </button>
            </li>
          </ul>
        </LayoutGroup>
      </nav>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
