'use client'

import { use } from 'react'
import { Header } from '@/components/layout/Header'
import { GoalDetail } from '@/components/goals/GoalDetail'

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <>
      <Header title="Detalle de meta" />
      <GoalDetail goalId={id} />
    </>
  )
}
