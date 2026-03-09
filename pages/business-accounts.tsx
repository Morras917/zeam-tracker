import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase, BusinessAccount } from '../lib/supabaseClient'

const SEGMENTS = ['SME Payroll', 'Corporate', 'UK-Africa Cross-Border', 'Retail', 'Logistics', 'Agriculture', 'Other']
const STATUSES = ['Active', 'Pipeline', 'Onboarding', 'Inactive']

function NavBar({ onLogout }: { onLogout: () => void }) {
  return (
    <nav style={{ background: '#16162a', borderBottom: '1px solid #2a2a45', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c5cfc, #00d4a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800' }}>Z</div>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Zeam<span style={{ color: '#f5c542' }}>.</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[{ href: '/dashboard', l: 'Dashboard' }, { href: '/partnerships', l: 'Partnerships' }, { href: '/merchants', l: 'Merchants' }, { href: '/business-accounts', l: 'Business Accounts' }].map(link => (
            <Link key={link.href} href={link.href} style={{ color: link.href === '/business-accounts' ? 'white' : '#a0a0c0', textDecoration: 'none', fontSize: '0.875rem' }}>{link.l}</Link>
          ))}
        </div>
      </div>
      <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #2a2a45', color: '#a0a0c0', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Sign out</button>
    </nav>
  )
}

const emptyForm = { name: '', segment: 'SME Payroll', contact_name: '', contact_email: '', contact_phone: '', status: 'Pipeline' as BusinessAccount['status'], notes: '' }

export default function BusinessAccounts() {
  const router = useRouter()
  const [items, setItems] = useState<BusinessAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<BusinessAccount | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { checkAuth(); fetchData() }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const fetchData = async () => {
    const { data } = await supabase.from('business_accounts').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }

  const openEdit = (item: BusinessAccount) => {
    setEditing(item)
    setForm({ name: item.name, segment: item.segment, contact_name: item.contact_name || '', contact_email: item.contact_email || '', contact_phone: item.contact_phone || '', status: item.status, notes: item.notes || '' })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await supabase.from('business_accounts').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('business_accounts').insert([form])
    }
    await fetchData()
    setShowModal(false)
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this business account?')) return
    await supabase.from('business_accounts').delete().eq('id', id)
    await fetchData()
  }

  const filtered = items.filter(item =>
    (filterStatus === 'All' || item.status === filterStatus) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.segment.toLowerCase().includes(search.toLowerCase()))
  )

  const statusColors: Record<string, string> = { Active: '#00d4a0', Pipeline: '#7c5cfc', Onboarding: '#ff6b35', Inactive: '#a0a0c0' }

  return (
    <>
      <Head><title>Business Accounts — Zeam Tracker</title></Head>
      <NavBar onLogout={handleLogout} />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: '800' }}>Business Accounts</h1>
            <p style={{ margin: 0, color: '#a0a0c0' }}>{items.length} total business accounts</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>+ Add Account</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..." style={{ maxWidth: '280px' }} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['All', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid', borderColor: filterStatus === s ? '#00d4a0' : '#2a2a45', background: filterStatus === s ? '#00d4a022' : 'transparent', color: filterStatus === s ? '#00d4a0' : '#a0a0c0', cursor: 'pointer', fontSize: '0.8rem' }}>{s}</button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a0c0' }}>Loading...</div> : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Segment</th>
                  <th>Contact</th>
                  <th>Email / Phone</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td><span style={{ background: '#00d4a011', color: '#00d4a0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{item.segment}</span></td>
                    <td>{item.contact_name || '—'}</td>
                    <td style={{ color: '#a0a0c0', fontSize: '0.8rem' }}><div>{item.contact_email || '—'}</div><div>{item.contact_phone || ''}</div></td>
                    <td><span style={{ background: statusColors[item.status] + '22', color: statusColors[item.status], padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>{item.status}</span></td>
                    <td style={{ color: '#a0a0c0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(item)} style={{ background: 'transparent', border: '1px solid #2a2a45', color: '#a0a0c0', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                        <button className="btn-danger" onClick={() => handleDelete(item.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#a0a0c0', padding: '2rem' }}>No business accounts found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h2 style={{ margin: '0 0 1.5rem', color: 'white' }}>{editing ? 'Edit Account' : 'Add Business Account'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div><label style={{ display: 'block', color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Company Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label style={{ display: 'block', color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Segment</label><select value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })}>{SEGMENTS.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={{ display: 'block', color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Contact Name</label><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
                <div><label style={{ display: 'block', color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BusinessAccount['status'] })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={{ display: 'block', color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Email</label><input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div><label style={{ display: 'block', color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Phone</label><input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}><label style={{ display: 'block', color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1px solid #2a2a45', color: '#a0a0c0', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
