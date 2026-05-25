'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <motion.main
        className="min-h-screen"
        animate={{ marginLeft: collapsed ? '5rem' : '16rem' }}
        transition={{ type: 'spring', stiffness: 300, damping: 35, mass: 0.8 }}
      >
        {children}
      </motion.main>
    </div>
  )
}
