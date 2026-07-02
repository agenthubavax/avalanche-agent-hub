'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [network, setNetwork] = useState('testnet')
  const [theme, setTheme] = useState('dark')

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Network */}
      <section className="bg-card rounded-xl p-5 border border-white/5 space-y-3">
        <h2 className="font-semibold text-sm">Network</h2>
        <div className="flex gap-2">
          {['mainnet', 'testnet'].map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                network === n
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-white/5 text-muted hover:text-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-muted text-xs">
          {network === 'mainnet' ? 'Production Avalanche C-Chain' : 'Fuji Testnet (Avalanche)'}
        </p>
      </section>

      {/* Wallet */}
      <section className="bg-card rounded-xl p-5 border border-white/5 space-y-3">
        <h2 className="font-semibold text-sm">Wallet</h2>
        <button className="bg-surface border border-white/5 rounded-lg px-4 py-2 text-sm text-muted hover:text-text transition-colors w-full text-left">
          🔗 Connect Wallet
        </button>
        <p className="text-muted text-xs">Connect your Avalanche wallet to interact with the hub.</p>
      </section>

      {/* Theme */}
      <section className="bg-card rounded-xl p-5 border border-white/5 space-y-3">
        <h2 className="font-semibold text-sm">Theme</h2>
        <div className="flex gap-2">
          {['dark', 'light'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                theme === t
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-white/5 text-muted hover:text-text'
              }`}
            >
              {t === 'dark' ? '🌙' : '☀️'} {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
