import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Billing() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
    }
    load()
  }, [])

  async function handleCheckout(plan: 'monthly' | 'lifetime') {
    setLoadingPlan(plan)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="page" style={{ background: '#0F172A', minHeight: '100vh' }}>
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>Billing</h1><p>Manage your subscription</p></div>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>← Dashboard</Link>
        </div>
      </div>
      <div className="content" style={{ maxWidth: 920, margin: '0 auto', paddingTop: 40, display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Monthly Plan */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center', width: 400 }}>
          <div style={{ width: 56, height: 56, background: '#FAECE7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>⚡</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 }}>FieldClose Pro</h2>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#D85A30', margin: '16px 0 4px' }}>$99<span style={{ fontSize: 18, color: '#888', fontWeight: 400 }}>/month</span></div>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Everything you need to close more jobs</p>
          <div style={{ textAlign: 'left', marginBottom: 28 }}>
            {['Unlimited proposals', 'Good/better/best pricing', 'Customer signature capture', 'Owner dashboard', 'Admin panel — edit pricing anytime', 'Cancel anytime'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14, color: '#333' }}>
                <span style={{ color: '#D85A30', fontWeight: 700 }}>✓</span> {f}
              </div>
            ))}
          </div>
          <button className="btn-primary" disabled={loadingPlan !== null} onClick={() => handleCheckout('monthly')}>
            {loadingPlan === 'monthly' ? 'Loading...' : 'Start subscription — $99/mo'}
          </button>
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>Secure payment via Stripe · Cancel anytime</p>
        </div>

        {/* Lifetime Plan */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center', width: 400, border: '2px solid #D85A30', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#D85A30', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, letterSpacing: 0.5 }}>BEST VALUE</div>
          <div style={{ width: 56, height: 56, background: '#FAECE7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>🏆</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 }}>FieldClose Lifetime</h2>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#D85A30', margin: '16px 0 4px' }}>$2,497<span style={{ fontSize: 18, color: '#888', fontWeight: 400 }}> one-time</span></div>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>No recurring fees, ever</p>
          <div style={{ textAlign: 'left', marginBottom: 28 }}>
            {['Unlimited proposals', 'Good/better/best pricing', 'Customer signature capture', 'Owner dashboard', 'Admin panel — edit pricing anytime', 'Lifetime access, no monthly bill'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14, color: '#333' }}>
                <span style={{ color: '#D85A30', fontWeight: 700 }}>✓</span> {f}
              </div>
            ))}
          </div>
          <button className="btn-primary" disabled={loadingPlan !== null} onClick={() => handleCheckout('lifetime')}>
            {loadingPlan === 'lifetime' ? 'Loading...' : 'Get lifetime access — $2,497'}
          </button>
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>Secure payment via Stripe · One-time payment</p>
        </div>

      </div>
    </div>
  )
}
