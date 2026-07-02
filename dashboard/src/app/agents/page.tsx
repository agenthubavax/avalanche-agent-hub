import { agents, type AgentStatus } from '@/lib/mock-data'

const statusColor: Record<AgentStatus, string> = {
  Active: 'bg-green-500/15 text-green-400',
  Paused: 'bg-yellow-500/15 text-yellow-400',
  Stopped: 'bg-red-500/15 text-red-400',
}

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button className="bg-accent text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity">
          + Deploy Agent
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted text-left">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Wallet</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Txns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium">{a.name}</td>
                  <td className="px-5 py-3 text-muted">{a.type}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">{a.wallet.slice(0, 6)}...{a.wallet.slice(-4)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{a.transactions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
