import { stats, recentActivity } from '@/lib/mock-data'

const quickActions = [
  { label: 'Create Quest', icon: '🎯' },
  { label: 'Deploy Agent', icon: '🤖' },
  { label: 'Import Wallets', icon: '👛' },
]

export default function Home() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-5 border border-white/5">
            <p className="text-muted text-sm">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-green-400 text-sm mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              className="bg-surface border border-white/5 rounded-lg px-5 py-3 hover:border-accent/40 transition-colors text-sm"
            >
              <span className="mr-2">{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="bg-surface rounded-xl border border-white/5 divide-y divide-white/5">
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <span className="font-medium text-sm">{a.action}</span>
                <span className="text-muted text-sm ml-2">— {a.detail}</span>
              </div>
              <div className="text-muted text-xs shrink-0 ml-4">{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
