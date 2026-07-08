import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ProposalDetail() {
  const router = useRouter()
  const { id } = router.query
  const [proposal, setProposal] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [system, setSystem] = useState<any>(null)
  const [addons, setAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data: p } = await supabase.from('proposals').select('*').eq('id', id).single()
      if (!p) { router.push('/dashboard'); return }
      setProposal(p)
      if (p.profile_id) {
        const { data: prof } = await supabase.from('profiles').select('company_name, logo_data, brand_color').eq('id', p.profile_id).single()
        setProfile(prof)
      }
      if (p.selected_system_id) {
        const { data: sys } = await supabase.from('systems').select('*').eq('id', p.selected_system_id).single()
        setSystem(sys)
      }
      if (p.selected_addons?.length > 0) {
        const { data: adds } = await supabase.from('addons').select('*').in('id', p.selected_addons)
        setAddons(adds || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function saveEmail() {
    if (!emailInput) return
    setSavingEmail(true)
    await supabase.from('proposals').update({ customer_email: emailInput }).eq('id', proposal.id)
    setProposal((p: any) => ({ ...p, customer_email: emailInput }))
    setEmailInput('')
    setSavingEmail(false)
  }

  async function sendEmail() {
    setSending(true)
    try {
      const response = await fetch('https://vspiibgyvydsqxvnlxyj.supabase.co/functions/v1/hyper-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlpYmd5dnlkc3F4dm5seHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDg2NTUsImV4cCI6MjA5NjUyNDY1NX0.uYTB4HWN6GZV9bqH_gXEUFDlU8-2BoZMbdp-Q7uH2fI`
        },
        body: JSON.stringify({ proposalId: proposal.id })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setProposal((p: any) => ({ ...p, status: 'sent' }))
        setSent(true)
      } else {
        alert('Error sending email: ' + JSON.stringify(data))
      }
    } catch (err) {
      alert('Failed to send email. Please try again.')
    }
    setSending(false)
  }

  async function markClosed() {
    await supabase.from('proposals').update({ status: 'closed' }).eq('id', proposal.id)
    setProposal((p: any) => ({ ...p, status: 'closed' }))
  }

  if (loading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><p style={{ color: '#888' }}>Loading...</p></div>
  if (!proposal) return null

  const brandColor = profile?.brand_color || '#D85A30'

  return (
    <div className="page" style={{ '--orange': brandColor } as any}>
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>{proposal.customer_name}</h1><p>{proposal.address}</p></div>
          <span className={`badge badge-${proposal.status}`} style={{ fontSize: 12 }}>{proposal.status}</span>
        </div>
      </div>
      <div className="content">
        {profile?.logo_data && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src={profile.logo_data} alt={profile.company_name || 'Company logo'} style={{ maxHeight: 70, maxWidth: 220, objectFit: 'contain' }} />
          </div>
        )}

        {proposal.photo_data && <>
          <div className="section-title">what we found</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={proposal.photo_data} alt="Unit photo" style={{ width: '100%', display: 'block' }} />
          </div>
        </>}

        <div className="section-title">job details</div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}><span style={{ fontSize: 13, color: '#888' }}>System age</span><span style={{ fontSize: 13 }}>{proposal.system_age}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}><span style={{ fontSize: 13, color: '#888' }}>Diagnosis</span><span style={{ fontSize: 13 }}>{proposal.diagnosis}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span style={{ fontSize: 13, color: '#888' }}>Recommendation</span><span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{proposal.recommendation}</span></div>
          {proposal.notes && <div style={{ padding: '8px 0 0', borderTop: '1px solid #f5f5f5', marginTop: 4 }}><span style={{ fontSize: 12, color: '#888' }}>Notes: </span><span style={{ fontSize: 13 }}>{proposal.notes}</span></div>}
        </div>

        <div className="section-title">selected option</div>
        <div className="card">
          {system && <>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{system.name}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--orange)', margin: '4px 0' }}>${system.price.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{system.description}</div>
          </>}
          {addons.map(a => <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f5f5f5', marginTop: 8 }}><span style={{ fontSize: 13 }}>{a.name}</span><span style={{ fontSize: 13, fontWeight: 600 }}>+${a.price.toLocaleString()}</span></div>)}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '2px solid #f0f0f0', marginTop: 8 }}><span style={{ fontSize: 15, fontWeight: 700 }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, color: 'var(--orange)' }}>${proposal.total_price?.toLocaleString()}</span></div>
        </div>

        {proposal.signature_data && <>
          <div className="section-title">signature</div>
          <div className="card" style={{ textAlign: 'center' }}>
            <img src={proposal.signature_data} alt="Customer signature" style={{ maxWidth: '100%', height: 80, objectFit: 'contain' }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Signed by {proposal.customer_name}</div>
          </div>
        </>}

        <div className="section-title">actions</div>

        {!proposal.customer_email && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Add customer email to send proposal</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="email" placeholder="customer@email.com" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
              <button disabled={savingEmail} onClick={saveEmail} style={{ padding: '9px 14px', background: 'var(--orange)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>{savingEmail ? '...' : 'Save'}</button>
            </div>
          </div>
        )}

        {proposal.customer_email && proposal.status !== 'closed' && (
          <button className="btn-primary" style={{ marginBottom: 8 }} disabled={sending || sent} onClick={sendEmail}>
            {sent ? '✓ Proposal sent!' : sending ? 'Sending...' : `Email proposal to ${proposal.customer_email}`}
          </button>
        )}

        {proposal.status !== 'closed' && (
          <button className="btn-secondary" onClick={markClosed}>Mark as closed / won</button>
        )}

        {proposal.status === 'closed' && (
          <div style={{ background: '#d1e7dd', borderRadius: 10, padding: 14, textAlign: 'center', color: '#0a3622', fontWeight: 600, fontSize: 15 }}>✓ Job closed</div>
        )}
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        <Link href="/dashboard" style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>← back to dashboard</Link>
      </div>
    </div>
  )
}
