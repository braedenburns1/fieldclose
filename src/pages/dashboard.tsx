import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: props } = await supabase.from('proposals').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(10)
      setProposals(props || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const today = proposals.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString())
  const totalValue = proposals.filter(p => p.status === 'closed' || p.status === 'signed').reduce((sum, p) => sum + (p.total_price || 0), 0)

  if (loading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><p style={{ color: '#888' }}>Loading...</p></div>

  return (
    <div className="page">
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>FieldClose</h1>
            <p>{profile?.company_name || 'Your Company'}</p>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: '#f5f5f0', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>today's calls</div>
            <div style={{ fontSize: 26, fontWeight: 600 }}>{today.length}</div>
          </div>
          <div style={{ background: '#f5f5f0', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>closed revenue</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--orange)' }}>${totalValue.toLocaleString()}</div>
          </div>
        </div>
        <div className="section-title">start a new call</div>
        <div className="option-grid" style={{ marginBottom: 24 }}>
          <Link href="/call/new" style={{ textDecoration: 'none' }}>
            <div className="option-card">
              <div style={{ fontSize: 24, marginBottom: 6 }}>❄️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>System call</div>
              <div style={{ fontSize: 11, color: '#888' }}>Repair or replace</div>
            </div>
          </Link>
          <Link href="/call/new" style={{ textDecoration: 'none' }}>
            <div className="option-card">
              <div style={{ fontSize: 24, marginBottom: 6 }}>🔧</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Maintenance</div>
              <div style={{ fontSize: 11, color: '#888' }}>Tune-up or plan</div>
            </div>
          </Link>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div className="option-card">
              <div style={{ fontSize: 24, marginBottom: 6 }}>⚙️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Admin</div>
              <div style={{ fontSize: 11, color: '#888' }}>Pricing setup</div>
            </div>
          </Link>
          <Link href="/billing" style={{ textDecoration: 'none' }}>
            <div className="option-card">
              <div style={{ fontSize: 24, marginBottom: 6 }}>💳</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Billing</div>
              <div style={{ fontSize: 11, color: '#888' }}>Manage subscription</div>
            </div>
          </Link>
        </div>
        <div className="section-title">recent proposals</div>
        <Link href="/clients" style={{ fontSize: 13, color: 'var(--orange)', textDecoration: 'none', display: 'block', marginBottom: 12 }}>View all clients →</Link>
        {proposals.length === 0 && <p style={{ color: '#888', fontSize: 14 }}>No proposals yet. Start your first call above.</p>}
        {proposals.map(p => (
          <Link key={p.id} href={`/proposal/${p.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{p.customer_name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.address} · ${(p.total_price || 0).toLocaleString()}</div>
              </div>
              <span className={`badge badge-${p.status}`}>{p.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
