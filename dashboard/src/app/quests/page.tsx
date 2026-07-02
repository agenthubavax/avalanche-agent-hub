import { quests, type QuestStatus } from '@/lib/mock-data'

const statusColor: Record<QuestStatus, string> = {
  Active: 'bg-green-500/15 text-green-400',
  Completed: 'bg-blue-500/15 text-blue-400',
  Expired: 'bg-zinc-500/15 text-zinc-400',
}

export default function QuestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quests</h1>
        <button className="bg-accent text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity">
          + Create Quest
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map((q) => (
          <div key={q.id} className="bg-card rounded-xl p-5 border border-white/5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-sm leading-tight">{q.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor[q.status]}`}>
                {q.status}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-muted">
              <span>{q.tasks} tasks</span>
              <span>{q.reward}</span>
              <span>{q.completions.toLocaleString()} completions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
