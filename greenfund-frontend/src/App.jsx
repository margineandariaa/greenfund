import React, { useState, useEffect } from 'react'

const CONTRACT_ADDRESS = 'erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z6t9vs2p30mqu0h9z3vgsad2rce'
const API_URL = 'https://devnet-api.multiversx.com'

function App() {
  const [address, setAddress] = useState(localStorage.getItem('gf_address') || '')
  const [target, setTarget] = useState(0)
  const [totalFunds, setTotalFunds] = useState(0)
  const [deadline, setDeadline] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(true)
  const [donating, setDonating] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const addr = params.get('address')
    if (addr) {
      setAddress(addr)
      localStorage.setItem('gf_address', addr)
      window.history.replaceState({}, '', window.location.pathname)
      setStatus({ text: 'Conectat cu succes! Bine ai venit. 🌱', type: 'success' })
    }
  }, [])

  useEffect(() => {
    fetchContractData()
    const interval = setInterval(fetchContractData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchContractData = async () => {
    try {
      const query = async (func) => {
        const res = await fetch(`${API_URL}/vm-values/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scAddress: CONTRACT_ADDRESS, funcName: func, args: [] })
        })
        const data = await res.json()
        const hex = atob(data.data?.data?.returnData?.[0] || '')
          .split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
        return hex ? BigInt('0x' + hex) : BigInt(0)
      }
      const EGLD = BigInt('1000000000000000000')
      const [targetVal, totalVal, deadlineVal] = await Promise.all([
        query('getTarget'), query('getTotalFunds'), query('getDeadline')
      ])
      setTarget(Number(targetVal / EGLD))
      setTotalFunds(Number(totalVal * BigInt(100) / EGLD) / 100)
      setDeadline(new Date(Number(deadlineVal) * 1000).toLocaleDateString('ro-RO'))
      setLoading(false)
    } catch (err) {
      console.error('Eroare fetch:', err)
      setLoading(false)
    }
  }

  const handleLogin = () => {
    const callbackUrl = encodeURIComponent(window.location.href)
    window.location.href = `https://devnet-wallet.multiversx.com/hook/login?callbackUrl=${callbackUrl}`
  }

  const handleLogout = () => {
    setAddress('')
    localStorage.removeItem('gf_address')
    setStatus({ text: '', type: '' })
  }

  const handleDonate = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ text: 'Introdu o sumă validă!', type: 'error' })
      return
    }
    setDonating(true)
    const valueHex = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString(16)
    const callbackUrl = encodeURIComponent(window.location.href)
    window.location.href = `https://devnet-wallet.multiversx.com/hook/transaction?receiver=${CONTRACT_ADDRESS}&value=${valueHex}&data=fund&gasLimit=10000000&callbackUrl=${callbackUrl}`
  }

  const handleRefund = () => {
    const callbackUrl = encodeURIComponent(window.location.href)
    window.location.href = `https://devnet-wallet.multiversx.com/hook/transaction?receiver=${CONTRACT_ADDRESS}&value=0&data=refund&gasLimit=10000000&callbackUrl=${callbackUrl}`
  }

  const handleClaim = () => {
    const callbackUrl = encodeURIComponent(window.location.href)
    window.location.href = `https://devnet-wallet.multiversx.com/hook/transaction?receiver=${CONTRACT_ADDRESS}&value=0&data=claim&gasLimit=10000000&callbackUrl=${callbackUrl}`
  }

  const percentage = target > 0 ? Math.min((totalFunds / target) * 100, 100) : 0
  const treeCount = Math.floor((percentage / 100) * 12)
  const daysLeft = deadline ? Math.max(0, Math.ceil((new Date(deadline.split('.').reverse().join('-')) - new Date()) / (1000 * 60 * 60 * 24))) : 0

  return (
    <div className="app">
      <div className="bg-decoration">
        <div className="circle c1" />
        <div className="circle c2" />
        <div className="circle c3" />
      </div>

      <div className="page">
        <header className="header">
          <div className="logo">
            <span className="logo-leaf">🌿</span>
            <span className="logo-text">GreenFund</span>
          </div>
          {address && (
            <div className="wallet-pill">
              <span className="wallet-dot" />
              <span className="wallet-addr">{address.slice(0, 8)}…{address.slice(-4)}</span>
              <button className="logout-btn" onClick={handleLogout}>✕</button>
            </div>
          )}
        </header>

        <section className="hero">
          <div className="hero-badge">🌍 Devnet · MultiversX</div>
          <h1 className="hero-title">Plantăm<br /><em>1000 de copaci</em><br />împreună</h1>
          <p className="hero-sub">Fiecare donație pe blockchain e transparentă, sigură și permanentă. Împreună facem diferența.</p>
        </section>

        <section className="campaign-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Se încarcă datele campaniei...</span>
            </div>
          ) : (
            <>
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-num green">{totalFunds.toFixed(2)}</span>
                  <span className="stat-label">EGLD strânși</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-num">{target}</span>
                  <span className="stat-label">EGLD target</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-num amber">{daysLeft}</span>
                  <span className="stat-label">zile rămase</span>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-info">
                  <span className="progress-label">Progres campanie</span>
                  <span className="progress-pct">{percentage.toFixed(1)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${percentage}%` }} />
                  <div className="progress-glow" style={{ left: `${percentage}%` }} />
                </div>
              </div>

              <div className="forest">
                <div className="forest-label">Copaci plantați simbolic</div>
                <div className="trees-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className={`tree-icon ${i < treeCount ? 'planted' : 'pending'}`}>
                      {i < treeCount ? '🌳' : '🪨'}
                    </span>
                  ))}
                </div>
                <div className="forest-note">{treeCount * 83} / 1000 copaci reprezentați</div>
              </div>

              <div className="deadline-row">
                <span className="deadline-icon">📅</span>
                <span className="deadline-text">Campania se închide pe <strong>{deadline}</strong></span>
              </div>
            </>
          )}
        </section>

        {!address ? (
          <section className="connect-section">
            <p className="connect-text">Conectează-te cu wallet-ul tău MultiversX pentru a dona</p>
            <button className="btn-connect" onClick={handleLogin}>
              <span className="btn-icon">🔗</span>
              Conectează Web Wallet
            </button>
            <p className="connect-hint">Folosim devnet — EGLD-ul de test e gratuit</p>
          </section>
        ) : (
          <section className="donate-section">
            <h2 className="donate-title">Fă o donație</h2>

            {status.text && (
              <div className={`status-msg ${status.type}`}>
                {status.type === 'success' ? '✅' : '⚠️'} {status.text}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Sumă în EGLD</label>
              <div className="input-wrap">
                <input
                  type="number"
                  className="amount-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
                <span className="input-suffix">EGLD</span>
              </div>
              <div className="quick-amounts">
                {['0.1', '0.5', '1', '2'].map(v => (
                  <button key={v} className={`quick-btn ${amount === v ? 'active' : ''}`} onClick={() => setAmount(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-donate" onClick={handleDonate} disabled={donating}>
              <span className="btn-icon">🌱</span>
              {donating ? 'Se procesează...' : 'Donează acum'}
            </button>

            <div className="secondary-actions">
              <button className="btn-secondary" onClick={handleRefund}>
                ↩ Recuperează donația
              </button>
              <button className="btn-secondary" onClick={handleClaim}>
                💰 Claim fonduri (owner)
              </button>
            </div>
          </section>
        )}

        <footer className="footer">
          <p>Contract: <a href={`https://devnet-explorer.multiversx.com/accounts/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" className="contract-link">{CONTRACT_ADDRESS.slice(0, 16)}…</a></p>
          <p className="footer-note">Proiect academic · MultiversX Devnet · 2026</p>
        </footer>
      </div>
    </div>
  )
}

export default App
