'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, LayoutGroup } from 'motion/react'
import {
  CalendarDays,
  ListTodo,
  PlusCircle,
  Clock,
  Settings,
  Sun,
  SmilePlus,
  Repeat2,
  PanelLeftClose,
  PanelLeftOpen,
  Target,
} from 'lucide-react'

const navItems = [
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/backlog', label: 'Backlog', icon: ListTodo },
  { href: '/add-task', label: 'Add Task', icon: PlusCircle },
  { href: '/recurring', label: 'Recurring', icon: Repeat2 },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/emotions', label: 'Emotions', icon: SmilePlus },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <motion.aside
      className="hidden md:flex fixed inset-y-0 left-0 z-50 flex-col bg-sidebar backdrop-blur-xl border-r border-border"
      animate={{ width: collapsed ? '5rem' : '16rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35, mass: 0.8 }}
    >
      {/* Logo */}
      <div className={cn('p-4 border-b border-border flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
        <Link href="/today" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-[var(--shadow-glow)] flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <h1 className="font-bold text-base leading-tight text-text">DailyOps</h1>
              <p className="text-xs text-text-subtle">Organiza tu día</p>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <LayoutGroup>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text hover:bg-bg-muted'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-accent-soft rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0 relative z-10" />
                {!collapsed && (
                  <span className="relative z-10 truncate">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </LayoutGroup>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-bg-muted transition-colors',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
