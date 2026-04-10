import React from 'react'

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    textColor: 'text-blue-600' },
  green:   { bg: 'bg-green-50',   iconBg: 'bg-green-100',   iconColor: 'text-green-600',   textColor: 'text-green-600' },
  red:     { bg: 'bg-red-50',     iconBg: 'bg-red-100',     iconColor: 'text-red-500',     textColor: 'text-red-500' },
  purple:  { bg: 'bg-purple-50',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  textColor: 'text-purple-600' },
  orange:  { bg: 'bg-orange-50',  iconBg: 'bg-orange-100',  iconColor: 'text-orange-500',  textColor: 'text-orange-500' },
  yellow:  { bg: 'bg-yellow-50',  iconBg: 'bg-yellow-100',  iconColor: 'text-yellow-600',  textColor: 'text-yellow-600' },
  amber:   { bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   textColor: 'text-amber-600' },
  indigo:  { bg: 'bg-indigo-50',  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  textColor: 'text-indigo-600' },
  teal:    { bg: 'bg-teal-50',    iconBg: 'bg-teal-100',    iconColor: 'text-teal-600',    textColor: 'text-teal-600' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-blue-100',    iconColor: 'text-emerald-600', textColor: 'text-emerald-600' },
}

const StatsCard = ({ title, value, icon: Icon, color = 'blue', change = null, onClick }) => {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue
  const isPositive = change !== null && change >= 0

  return (
    <div
      className={`card ${colors.bg} ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} transition-shadow duration-200`}
      onClick={onClick}
      style={{ borderColor: 'transparent' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-2 truncate">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change !== null && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500">from last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className={`w-6 h-6 ${colors.iconColor}`} />}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
