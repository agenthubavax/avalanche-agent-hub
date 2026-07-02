'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/quests', label: 'Quests' },
  { href: '/agents', label: 'Agents' },
  { href: '/settings', label: 'Settings' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="bg-surface border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg tracking-tight">
          <span className="text-accent">Avalanche</span> Agent Hub
        </Link>
        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname === href
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
