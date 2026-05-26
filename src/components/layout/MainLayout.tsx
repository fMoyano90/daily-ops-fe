'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main
        className={
          'min-h-screen pb-bottom-nav transition-[margin] duration-300 ease-out ' +
          (collapsed ? 'md:ml-20' : 'md:ml-64')
        }
      >
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
