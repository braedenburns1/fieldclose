import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Clients() {
  const router = useRouter()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: props } = await supabase.from('proposals').select('*').eq('profile_id', user.id).order('created_at', { ascending: false })
      setProposals(props || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = proposals.filter(p => {
    const matchesSearch = search === '' ||
      p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalClosedValue = proposals.filter(p => p.status === 'closed' || p.status === 'signed').reduce((sum, p) => sum + (p.total_price || 0), 0)

  if (loading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><p style={{ color: '#888' }}>Loading...</p></div>

  return (
    <div className="page">
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>Clients</h1><p>{proposals.length} total job{proposals.length !== 1 ? 's' : ''}</p></div>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>← Dashboard</Link>
        </div>
      </div>
      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: '#f5f5f0', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>total clients</div>
            <div style={{ fontSize: 26, fontWeight: 600 }}>{proposals.length}</div>
          </div>
          <div style={{ background: '#f5f5f0', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>closed revenue</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--orange)' }}>${totalClosedValue.toLocaleString()}</div>
          </div>
        </div>

        <input
          className="input"
          placeholder="Search by name, address, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {['all', 'pending', 'sent', 'signed', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: statusFilter === s ? 'none' : '1px solid #ddd',
                background: statusFilter === s ? 'var(--orange)' : 'white',
                color: statusFilter === s ? 'white' : '#666',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ color: '#888', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            {proposals.length === 0 ? 'No clients yet. Start your first call from the dashboard.' : 'No clients match your search.'}
          </p>
        )}

        {filtered.map(p => (
          <Link key={p.id} href={`/proposal/${p.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{p.customer_name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.address}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>${(p.total_price || 0).toLocaleString()} · {new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`badge badge-${p.status}`}>{p.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
