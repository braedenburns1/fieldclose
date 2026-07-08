import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Admin() {
  const router = useRouter()
  const [tab, setTab] = useState('systems')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [systems, setSystems] = useState<any[]>([])
  const [addons, setAddons] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [editingSys, setEditingSys] = useState<any>(null)
  const [editingAddon, setEditingAddon] = useState<any>(null)
  const [newAddon, setNewAddon] = useState({ name: '', description: '', price: '' })
  const [showAddAddon, setShowAddAddon] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: sys } = await supabase.from('systems').select('*').eq('profile_id', user.id).order('price')
      const { data: add } = await supabase.from('addons').select('*').eq('profile_id', user.id)
      setSystems(sys || [])
      setAddons(add || [])
    }
    load()
  }, [])

  async function saveSystem(sys: any) {
    setSaving(true)
    await supabase.from('systems').update({ name: sys.name, price: Number(sys.price), description: sys.description, warranty: sys.warranty }).eq('id', sys.id)
    setSystems(prev => prev.map(s => s.id === sys.id ? { ...s, ...sys } : s))
    setEditingSys(null)
    setSaving(false)
  }

  async function saveAddon(addon: any) {
    setSaving(true)
    await supabase.from('addons').update({ name: addon.name, price: Number(addon.price), description: addon.description }).eq('id', addon.id)
    setAddons(prev => prev.map(a => a.id === addon.id ? { ...a, ...addon } : a))
    setEditingAddon(null)
    setSaving(false)
  }

  async function addNewAddon() {
    if (!newAddon.name || !newAddon.price) return
    setSaving(true)
    const { data } = await supabase.from('addons').insert({ profile_id: user.id, name: newAddon.name, description: newAddon.description, price: Number(newAddon.price) }).select().single()
    if (data) setAddons(prev => [...prev, data])
    setNewAddon({ name: '', description: '', price: '' })
    setShowAddAddon(false)
    setSaving(false)
  }

  async function deleteAddon(id: string) {
    await supabase.from('addons').delete().eq('id', id)
    setAddons(prev => prev.filter(a => a.id !== id))
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update({ company_name: profile.company_name, owner_name: profile.owner_name, phone: profile.phone, brand_color: profile.brand_color }).eq('id', user.id)
    setSaving(false)
    alert('Saved!')
  }

  function handleLogoUpload(e: any) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = async () => {
        const maxDim = 300
        let { width, height } = img
        if (width > height) {
          if (width > maxDim) { height = height * (maxDim / width); width = maxDim }
        } else {
          if (height > maxDim) { width = width * (maxDim / height); height = maxDim }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/png', 0.9)
        await supabase.from('profiles').update({ logo_data: dataUrl }).eq('id', user.id)
        setProfile((p: any) => ({ ...p, logo_data: dataUrl }))
        setUploadingLogo(false)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  async function removeLogo() {
    await supabase.from('profiles').update({ logo_data: null }).eq('id', user.id)
    setProfile((p: any) => ({ ...p, logo_data: null }))
  }

  return (
    <div className="page">
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>Admin</h1><p>Manage your pricing</p></div>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>← Dashboard</Link>
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 20px' }}>
        {['systems', 'addons', 'company'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--orange)' : '#888', borderBottom: tab === t ? '2px solid var(--orange)' : '2px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      <div className="content">
        {tab === 'systems' && <>
          <div className="section-title">replacement systems</div>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>Tap any system to edit its pricing.</p>
          {systems.map(sys => (
            <div key={sys.id}>
              {editingSys?.id === sys.id ? (
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: 'capitalize', color: 'var(--orange)' }}>{sys.tier}</div>
                  <div style={{ marginBottom: 8 }}><label className="label">Name</label><input className="input" value={editingSys.name} onChange={e => setEditingSys((s: any) => ({ ...s, name: e.target.value }))} /></div>
                  <div style={{ marginBottom: 8 }}><label className="label">Description</label><input className="input" value={editingSys.description} onChange={e => setEditingSys((s: any) => ({ ...s, description: e.target.value }))} /></div>
                  <div style={{ marginBottom: 8 }}><label className="label">Price ($)</label><input className="input" type="number" value={editingSys.price} onChange={e => setEditingSys((s: any) => ({ ...s, price: e.target.value }))} /></div>
                  <div style={{ marginBottom: 12 }}><label className="label">Warranty</label><input className="input" value={editingSys.warranty} onChange={e => setEditingSys((s: any) => ({ ...s, warranty: e.target.value }))} /></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" style={{ flex: 1 }} disabled={saving} onClick={() => saveSystem(editingSys)}>{saving ? 'Saving...' : 'Save'}</button>
                    <button style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 14 }} onClick={() => setEditingSys(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setEditingSys({ ...sys })}>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{sys.name}</div><div style={{ fontSize: 12, color: '#888' }}>{sys.warranty} warranty</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontWeight: 700, color: 'var(--orange)' }}>${sys.price.toLocaleString()}</span><span style={{ fontSize: 12, color: '#aaa' }}>Edit</span></div>
                </div>
              )}
            </div>
          ))}
        </>}

        {tab === 'addons' && <>
          <div className="section-title">add-on services</div>
          {addons.map(a => (
            <div key={a.id}>
              {editingAddon?.id === a.id ? (
                <div className="card">
                  <div style={{ marginBottom: 8 }}><label className="label">Name</label><input className="input" value={editingAddon.name} onChange={e => setEditingAddon((x: any) => ({ ...x, name: e.target.value }))} /></div>
                  <div style={{ marginBottom: 8 }}><label className="label">Description</label><input className="input" value={editingAddon.description} onChange={e => setEditingAddon((x: any) => ({ ...x, description: e.target.value }))} /></div>
                  <div style={{ marginBottom: 12 }}><label className="label">Price ($)</label><input className="input" type="number" value={editingAddon.price} onChange={e => setEditingAddon((x: any) => ({ ...x, price: e.target.value }))} /></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" style={{ flex: 1 }} disabled={saving} onClick={() => saveAddon(editingAddon)}>{saving ? 'Saving...' : 'Save'}</button>
                    <button style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 14 }} onClick={() => setEditingAddon(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => setEditingAddon({ ...a })} style={{ flex: 1, cursor: 'pointer' }}><div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 12, color: '#888' }}>{a.description}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontWeight: 700, color: 'var(--orange)' }}>${a.price.toLocaleString()}</span><button onClick={() => deleteAddon(a.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18 }}>×</button></div>
                </div>
              )}
            </div>
          ))}
          {showAddAddon ? (
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>New add-on</div>
              <div style={{ marginBottom: 8 }}><label className="label">Name</label><input className="input" value={newAddon.name} onChange={e => setNewAddon(x => ({ ...x, name: e.target.value }))} placeholder="UV Air Purifier" /></div>
              <div style={{ marginBottom: 8 }}><label className="label">Description</label><input className="input" value={newAddon.description} onChange={e => setNewAddon(x => ({ ...x, description: e.target.value }))} placeholder="Indoor air quality upgrade" /></div>
              <div style={{ marginBottom: 12 }}><label className="label">Price ($)</label><input className="input" type="number" value={newAddon.price} onChange={e => setNewAddon(x => ({ ...x, price: e.target.value }))} placeholder="650" /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ flex: 1 }} disabled={saving} onClick={addNewAddon}>{saving ? 'Saving...' : 'Add'}</button>
                <button style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 14 }} onClick={() => setShowAddAddon(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddAddon(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>+ Add service</button>
          )}
        </>}

        {tab === 'company' && profile && <>
          <div className="section-title">company info</div>
          <div style={{ marginBottom: 12 }}><label className="label">Company name</label><input className="input" value={profile.company_name || ''} onChange={e => setProfile((p: any) => ({ ...p, company_name: e.target.value }))} /></div>
          <div style={{ marginBottom: 12 }}><label className="label">Owner name</label><input className="input" value={profile.owner_name || ''} onChange={e => setProfile((p: any) => ({ ...p, owner_name: e.target.value }))} /></div>
          <div style={{ marginBottom: 20 }}><label className="label">Phone</label><input className="input" value={profile.phone || ''} onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))} placeholder="(214) 555-0000" /></div>

          <div className="section-title">branding</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <label className="label">Logo</label>
            {profile.logo_data ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                <img src={profile.logo_data} alt="Logo" style={{ maxHeight: 60, maxWidth: 140, objectFit: 'contain', borderRadius: 6, border: '1px solid #eee' }} />
                <button onClick={removeLogo} style={{ fontSize: 13, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
            ) : (
              <div style={{ marginTop: 6 }}>
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                {uploadingLogo && <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Uploading...</p>}
              </div>
            )}
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>Shows at the top of proposals sent to customers.</p>
          </div>
          <div className="card" style={{ marginBottom: 20 }}>
            <label className="label">Brand color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <input type="color" value={profile.brand_color || '#D85A30'} onChange={e => setProfile((p: any) => ({ ...p, brand_color: e.target.value }))} style={{ width: 48, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: '#888' }}>{profile.brand_color || '#D85A30'}</span>
            </div>
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>Used for prices and buttons on your proposals.</p>
          </div>

          <button className="btn-primary" disabled={saving} onClick={saveProfile}>{saving ? 'Saving...' : 'Save company info'}</button>
        </>}
      </div>
    </div>
  )
}
