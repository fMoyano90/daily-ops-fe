'use client'

interface GoalProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
}

export function GoalProgressRing({ progress, size = 120, strokeWidth = 8 }: GoalProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const color = progress >= 70 ? 'var(--success)' : progress >= 30 ? 'var(--warning, #f59e0b)' : 'var(--danger, #ef4444)'

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-text text-2xl font-bold"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {Math.round(progress)}%
      </text>
    </svg>
  )
}
