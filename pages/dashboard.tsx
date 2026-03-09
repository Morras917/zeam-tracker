import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase, Partnership, Merchant, BusinessAccount } from '../lib/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = ['#7c5cfc', '#f5c542', '#00d4a0', '#ff6b35', '#a0a0c0']

function StatusBadge({ status }: { status: string }) {
  const cls = 'badge badge-' + status.toLowerCase()
  return <span className={cls}>{status}</span>
}

function NavBar({ onLogout }: { onLogout: () => void }) {
  return (
    <nav style={{
      background: '#16162a',
      borderBottom: '1px solid #2a2a45',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c5cfc, #00d4a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '1rem'
          }}>Z</div>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>
            Zeam<span style={{ color: '#f5c542' }}>.</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/partnerships', label: 'Partnerships' },
            { href: '/merchants', label: 'Merchants' },
            { href: '/business-accounts', label: 'Business Accounts' }
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              color: '#a0a0c0', textDecoration: 'none', fontSize: '0.875rem',
              padding: '0.25rem 0.5rem', borderRadius: '6px', transition: 'color 0.2s'
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#a0a0c0'}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <button onClick={onLogout} style={{
        background: 'transparent', border: '1px solid #2a2a45',
        color: '#a0a0c0', padding: '0.375rem 0.75rem', borderRadius: '6px',
        cursor: 'pointer', fontSize: '0.875rem'
      }}>Sign out</button>
    </nav>
  )
}

function StatCard({ label, value, sub, color }: { label: string, value: number, sub: string, color: string }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <p style={{ color: '#a0a0c0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem' }}>{label}</p>
      <p style={{ color, fontSize: '3rem', fontWeight: '800', margin: '0', lineHeight: 1 }}>{value}</p>
      <p style={{ color: '#a0a0c0', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [bizAccounts, setBizAccounts] = useState<BusinessAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [hour] = useState(new Date().getHours())

  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const fetchData = async () => {
    const [p, m, b] = await Promise.all([
      supabase.from('partnerships').select('*').order('created_at', { ascending: false }),
      supabase.from('merchants').select('*').order('created_at', { ascending: false }),
      supabase.from('business_accounts').select('*').order('created_at', { ascending: false })
    ])
    setPartnerships(p.data || [])
    setMerchants(m.data || [])
    setBizAccounts(b.data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const activePartnerships = partnerships.filter(p => p.status === 'Active').length
  const activeMerchants = merchants.filter(m => m.status === 'Active').length
  const activeBiz = bizAccounts.filter(b => b.status === 'Active').length
  const inPipeline = [
    ...partnerships.filter(p => p.status === 'Pipeline'),
    ...merchants.filter(m => m.status === 'Pipeline'),
    ...bizAccounts.filter(b => b.status === 'Pipeline')
  ].length

  // Status distribution data for pie chart
  const allItems = [
    ...partnerships.map(p => ({ status: p.status })),
    ...merchants.map(m => ({ status: m.status })),
    ...bizAccounts.map(b => ({ status: b.status }))
  ]
  const statusCounts = allItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Bar chart data
  const barData = [
    { name: 'Partnerships', Active: partnerships.filter(p => p.status === 'Active').length, Pipeline: partnerships.filter(p => p.status === 'Pipeline').length, Other: partnerships.filter(p => !['Active','Pipeline'].includes(p.status)).length },
    { name: 'Merchants', Active: merchants.filter(m => m.status === 'Active').length, Pipeline: merchants.filter(m => m.status === 'Pipeline').length, Other: merchants.filter(m => !['Active','Pipeline'].includes(m.status)).length },
    { name: 'Biz Accounts', Active: bizAccounts.filter(b => b.status === 'Active').length, Pipeline: bizAccounts.filter(b => b.status === 'Pipeline').length, Other: bizAccounts.filter(b => !['Active','Pipeline'].includes(b.status)).length },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: '#7c5cfc', fontSize: '1.5rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Head><title>Dashboard — Zeam Tracker</title></Head>
      <NavBar onLogout={handleLogout} />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem' }}>
            {greeting}, <span style={{ color: '#f5c542' }}>Morne</span>
          </h1>
          <p style={{ color: '#a0a0c0', margin: 0 }}>Here&apos;s what&apos;s happening across your Zeam pipeline today.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Total Partnerships" value={partnerships.length} sub={`${activePartnerships} active`} color="#7c5cfc" />
          <StatCard label="Merchants" value={merchants.length} sub={`${activeMerchants} live`} color="#f5c542" />
          <StatCard label="Business Accounts" value={bizAccounts.length} sub={`${activeBiz} active`} color="#00d4a0" />
          <StatCard label="In Pipeline" value={inPipeline} sub="across all categories" color="#ff6b35" />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 1rem', color: 'white' }}>Status by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#a0a0c0" fontSize={12} />
                <YAxis stroke="#a0a0c0" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1e1e35', border: '1px solid #2a2a45', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="Active" fill="#00d4a0" radius={[4,4,0,0]} />
                <Bar dataKey="Pipeline" fill="#7c5cfc" radius={[4,4,0,0]} />
                <Bar dataKey="Other" fill="#ff6b35" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 1rem', color: 'white' }}>Pipeline Status Mix</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1e35', border: '1px solid #2a2a45', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {/* Recent Partnerships */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Recent Partnerships</h3>
              <span style={{ background: '#7c5cfc', borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', color: 'white' }}>{partnerships.length}</span>
            </div>
            {partnerships.slice(0, 5).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #2a2a45' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#7c5cfc22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c5cfc', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>
                  {p.name.split(' ').map((w:string) => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                  <p style={{ margin: 0, color: '#a0a0c0', fontSize: '0.75rem' }}>{p.contact_name || p.type} · {p.status}</p>
                </div>
              </div>
            ))}
            <Link href="/partnerships" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', color: '#7c5cfc', fontSize: '0.875rem', textDecoration: 'none' }}>View all →</Link>
          </div>

          {/* Recent Merchants */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Recent Merchants</h3>
              <span style={{ background: '#f5c54233', borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', color: '#f5c542' }}>{merchants.length}</span>
            </div>
            {merchants.slice(0, 5).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #2a2a45' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f5c54222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c542', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>
                  {m.name.split(' ').map((w:string) => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                  <p style={{ margin: 0, color: '#a0a0c0', fontSize: '0.75rem' }}>{m.contact_name || m.location} · {m.status}</p>
                </div>
              </div>
            ))}
            <Link href="/merchants" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', color: '#f5c542', fontSize: '0.875rem', textDecoration: 'none' }}>View all →</Link>
          </div>

          {/* Recent Business Accounts */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Business Accounts</h3>
              <span style={{ background: '#00d4a022', borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', color: '#00d4a0' }}>{bizAccounts.length}</span>
            </div>
            {bizAccounts.slice(0, 5).map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #2a2a45' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#00d4a022', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4a0', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>
                  {b.name.split(' ').map((w:string) => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</p>
                  <p style={{ margin: 0, color: '#a0a0c0', fontSize: '0.75rem' }}>{b.contact_name || b.segment} · {b.status}</p>
                </div>
              </div>
            ))}
            <Link href="/business-accounts" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', color: '#00d4a0', fontSize: '0.875rem', textDecoration: 'none' }}>View all →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
