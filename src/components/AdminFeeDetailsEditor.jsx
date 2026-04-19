import { useCallback, useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

const emptyTerm = () => ({
  term: 'Spring 2026',
  arrears: 0, due: 0, discount: 0, sponsored: 0, collection: 0, balance: 0, studentActivitiesFund: 0, tuitionFee: 0, sgpa: 0, cgpa: 0,
  registrationLog: [],
  installments: [],
  paymentRows: [],
})
const input = 'w-full rounded border border-slate-200 px-2 py-1 text-[12px]'

export default function AdminFeeDetailsEditor({ token, studentId }) {
  const [terms, setTerms] = useState([emptyTerm()])
  const [paymentRows, setPaymentRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [active, setActive] = useState(0)

  const load = useCallback(async () => {
    if (!token || !studentId) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/fee-details`, { headers: { Authorization: `Bearer ${token}` } })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load')
      setTerms(Array.isArray(payload.terms) && payload.terms.length ? payload.terms : [emptyTerm()])
      setPaymentRows(Array.isArray(payload.paymentRows) ? payload.paymentRows : [])
    } catch (e) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, studentId])

  useEffect(() => { load() }, [load])

  const save = async () => {
    try {
      setSaving(true); setError(''); setOk('')
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/fee-details`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms, paymentRows }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to save')
      setTerms(Array.isArray(payload.terms) && payload.terms.length ? payload.terms : [emptyTerm()])
      setPaymentRows(Array.isArray(payload.paymentRows) ? payload.paymentRows : [])
      setOk('Saved')
    } catch (e) { setError(e.message || 'Failed to save') } finally { setSaving(false); setTimeout(() => setOk(''), 1300) }
  }

  const setTerm = (i, key, val) => setTerms((p) => p.map((t, idx) => idx === i ? { ...t, [key]: val } : t))
  const setReg = (ri, key, val) => setTerms((p) => p.map((t, ti) => ti === active ? { ...t, registrationLog: (t.registrationLog || []).map((r, i) => i === ri ? { ...r, [key]: val } : r) } : t))
  const setIns = (ri, key, val) => setTerms((p) => p.map((t, ti) => ti === active ? { ...t, installments: (t.installments || []).map((r, i) => i === ri ? { ...r, [key]: val } : r) } : t))
  const addReg = () => setTerms((p) => p.map((t, ti) => ti === active ? { ...t, registrationLog: [...(t.registrationLog || []), { srNo: (t.registrationLog || []).length + 1, title: '', requestType: 'Registration', status: 'Approved', actionDate: '' }] } : t))
  const addIns = () => setTerms((p) => p.map((t, ti) => ti === active ? { ...t, installments: [...(t.installments || []), { srNo: (t.installments || []).length + 1, amount: 0, challanNo: '', dueDate: '', status: 'Paid' }] } : t))
  const removeReg = (ri) => setTerms((p) => p.map((t, ti) => ti === active ? { ...t, registrationLog: (t.registrationLog || []).filter((_, i) => i !== ri) } : t))
  const removeIns = (ri) => setTerms((p) => p.map((t, ti) => ti === active ? { ...t, installments: (t.installments || []).filter((_, i) => i !== ri) } : t))
  const setPay = (ri, key, val) => setPaymentRows((p) => p.map((r, i) => i === ri ? { ...r, [key]: val } : r))
  const addPay = () => setPaymentRows((p) => [...p, { srNo: p.length + 1, semester: terms[active]?.term || '', challanNo: '', instrumentType: 'Paid Bank Challan', instrumentNo: '', amount: 0, dueDate: '', paymentDate: '', enteredBy: 'Kuickpay', status: 'Posted', operation: 'Remarks' }])
  const removePay = (ri) => setPaymentRows((p) => p.filter((_, i) => i !== ri))
  const removeTerm = (idx) => {
    setTerms((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.length ? next : [emptyTerm()]
    })
    setActive((prev) => {
      if (idx === prev) return 0
      return prev > idx ? prev - 1 : prev
    })
  }

  if (loading) return <div className="rounded-xl bg-white p-5 shadow">Loading fee details...</div>
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[15px] font-semibold">Fee Details Editor</div>
        <div className="flex items-center gap-2">{error ? <span className="text-[12px] text-red-600">{error}</span> : null}{ok ? <span className="text-[12px] text-emerald-600">{ok}</span> : null}<button className="rounded bg-[#2f5f89] px-4 py-2 text-[12px] font-semibold text-white" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
      </div>
      <div className="mb-3 flex gap-2">{terms.map((t, i) => <button key={i} className={`rounded px-3 py-2 text-[12px] ${i===active?'bg-[#2f5f89] text-white':'border'}`} onClick={() => setActive(i)}>{t.term || `Term ${i+1}`}</button>)}
        <button className="rounded border px-3 py-2 text-[12px]" onClick={() => { setTerms((p)=>[...p, emptyTerm()]); setActive(terms.length) }}>Add Term</button>
        {terms.length > 1 ? <button className="rounded border border-red-200 px-3 py-2 text-[12px] text-red-700" onClick={() => removeTerm(active)}>Delete Term</button> : null}
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
        {['term','arrears','due','discount','sponsored','collection','balance','studentActivitiesFund','tuitionFee','sgpa','cgpa'].map((k)=>(
          <label key={k} className="block"><div className="mb-1 text-[12px] font-semibold">{k}</div><input className={input} value={terms[active]?.[k] ?? ''} onChange={(e)=>setTerm(active,k,e.target.value)} /></label>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between"><div className="text-[13px] font-semibold">Registration Log</div><button className="rounded border px-2 py-1 text-[12px]" onClick={addReg}>Add</button></div>
          <div className="space-y-2">
            {(terms[active]?.registrationLog || []).map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input className={`${input} col-span-1`} value={r.srNo ?? ''} onChange={(e)=>setReg(i,'srNo',e.target.value)} />
                <input className={`${input} col-span-4`} value={r.title || ''} onChange={(e)=>setReg(i,'title',e.target.value)} placeholder="Title" />
                <input className={`${input} col-span-3`} value={r.requestType || ''} onChange={(e)=>setReg(i,'requestType',e.target.value)} placeholder="Request Type" />
                <input className={`${input} col-span-2`} value={r.status || ''} onChange={(e)=>setReg(i,'status',e.target.value)} placeholder="Status" />
                <input className={`${input} col-span-2`} value={r.actionDate || ''} onChange={(e)=>setReg(i,'actionDate',e.target.value)} placeholder="Action Date" />
                <button className="col-span-12 rounded border border-red-200 px-2 py-1 text-[12px] text-red-700" onClick={() => removeReg(i)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between"><div className="text-[13px] font-semibold">Installment(s) (Optional)</div><button className="rounded border px-2 py-1 text-[12px]" onClick={addIns}>Add</button></div>
          <div className="space-y-2">
            {(terms[active]?.installments || []).map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input className={`${input} col-span-2`} value={r.srNo ?? ''} onChange={(e)=>setIns(i,'srNo',e.target.value)} placeholder="Sr#" />
                <input className={`${input} col-span-3`} value={r.amount ?? ''} onChange={(e)=>setIns(i,'amount',e.target.value)} placeholder="Amount" />
                <input className={`${input} col-span-3`} value={r.challanNo || ''} onChange={(e)=>setIns(i,'challanNo',e.target.value)} placeholder="Challan No" />
                <input className={`${input} col-span-2`} value={r.dueDate || ''} onChange={(e)=>setIns(i,'dueDate',e.target.value)} placeholder="Due Date" />
                <input className={`${input} col-span-2`} value={r.status || ''} onChange={(e)=>setIns(i,'status',e.target.value)} placeholder="Status" />
                <button className="col-span-12 rounded border border-red-200 px-2 py-1 text-[12px] text-red-700" onClick={() => removeIns(i)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[13px] font-semibold">Payment Rows (Shared for all terms)</div>
          <button className="rounded border px-2 py-1 text-[12px]" onClick={addPay}>Add Row</button>
        </div>
        <div className="space-y-2">
          {paymentRows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input className={`${input} col-span-1`} value={r.srNo ?? ''} onChange={(e)=>setPay(i,'srNo',e.target.value)} placeholder="Sr#" />
              <input className={`${input} col-span-2`} value={r.semester || ''} onChange={(e)=>setPay(i,'semester',e.target.value)} placeholder="Semester" />
              <input className={`${input} col-span-2`} value={r.challanNo || ''} onChange={(e)=>setPay(i,'challanNo',e.target.value)} placeholder="Challan No" />
              <input className={`${input} col-span-2`} value={r.instrumentType || ''} onChange={(e)=>setPay(i,'instrumentType',e.target.value)} placeholder="Instrument Type" />
              <input className={`${input} col-span-2`} value={r.instrumentNo || ''} onChange={(e)=>setPay(i,'instrumentNo',e.target.value)} placeholder="Instrument No" />
              <input className={`${input} col-span-1`} value={r.amount ?? ''} onChange={(e)=>setPay(i,'amount',e.target.value)} placeholder="Amount" />
              <input className={`${input} col-span-1`} value={r.dueDate || ''} onChange={(e)=>setPay(i,'dueDate',e.target.value)} placeholder="Due Date" />
              <input className={`${input} col-span-1`} value={r.paymentDate || ''} onChange={(e)=>setPay(i,'paymentDate',e.target.value)} placeholder="Payment Date" />
              <input className={`${input} col-span-2`} value={r.enteredBy || ''} onChange={(e)=>setPay(i,'enteredBy',e.target.value)} placeholder="Entered By" />
              <input className={`${input} col-span-1`} value={r.status || ''} onChange={(e)=>setPay(i,'status',e.target.value)} placeholder="Status" />
              <input className={`${input} col-span-1`} value={r.operation || ''} onChange={(e)=>setPay(i,'operation',e.target.value)} placeholder="Operation" />
              <button className="col-span-12 rounded border border-red-200 px-2 py-1 text-[12px] text-red-700" onClick={() => removePay(i)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


