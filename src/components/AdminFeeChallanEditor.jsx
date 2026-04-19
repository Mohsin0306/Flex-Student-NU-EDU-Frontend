import { useCallback, useEffect, useRef, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

const emptyRow = () => ({
  amount: 0,
  generatedOn: '',
  dueDate: '',
  status: 'Valid',
  challanNo: '',
  bankName: 'Faysal bank',
  quickPayPaymentDetail: 'View',
  paymentDetail: {
    studentActivitiesFund: 0,
    onlinePaymentCharges1: 0,
    tuitionFee: 0,
    onlinePaymentCharges2: 0,
  },
})

const input = 'w-full rounded border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none focus:border-slate-400'

export default function AdminFeeChallanEditor({ token, studentId }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState('')
  const [rows, setRows] = useState([emptyRow()])
  const reqIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!token || !studentId) return
    const myId = ++reqIdRef.current
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/fee-challan`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load fee challan')
      if (myId !== reqIdRef.current) return
      setRows(Array.isArray(payload.challans) && payload.challans.length ? payload.challans : [emptyRow()])
    } catch (err) {
      if (myId !== reqIdRef.current) return
      setError(err.message || 'Failed to load fee challan')
      setRows([emptyRow()])
    } finally {
      if (myId !== reqIdRef.current) return
      setLoading(false)
    }
  }, [token, studentId])

  useEffect(() => {
    load()
  }, [load])

  const setField = (idx, key, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }
  const setDetail = (idx, key, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, paymentDetail: { ...(r.paymentDetail || {}), [key]: value } } : r))
    )
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])
  const removeRow = (idx) =>
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.length ? next : [emptyRow()]
    })

  const save = async () => {
    if (!token || !studentId) return
    setSaveError('')
    setSaveOk('')
    try {
      setSaving(true)
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/fee-challan`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ challans: rows }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to save fee challan')
      setRows(Array.isArray(payload.challans) && payload.challans.length ? payload.challans : [emptyRow()])
      setSaveOk('Saved')
      window.setTimeout(() => setSaveOk(''), 1400)
    } catch (err) {
      setSaveError(err.message || 'Failed to save fee challan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="rounded-xl bg-white p-5 shadow">Loading fee challan...</div>
  if (error) return <div className="rounded-xl bg-white p-5 text-red-600 shadow">{error}</div>

  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <div className="sticky top-[72px] z-10 mb-3 flex items-center justify-between gap-3 border-b border-slate-200 bg-white pb-3">
        <div className="text-[15px] font-semibold text-slate-900">Fee Challan Editor</div>
        <div className="flex items-center gap-2">
          {saveError ? <span className="text-[12px] text-red-600">{saveError}</span> : null}
          {saveOk ? <span className="text-[12px] text-emerald-700">{saveOk}</span> : null}
          <button type="button" onClick={save} disabled={saving} className="rounded bg-[#2f5f89] px-4 py-2 text-[12px] font-semibold text-white">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1250px] w-full border-collapse">
          <thead>
            <tr className="bg-[#ecf2ff] text-left text-[12px] text-slate-700">
              <th className="border border-slate-200 px-2 py-2">Amount</th>
              <th className="border border-slate-200 px-2 py-2">Generated On</th>
              <th className="border border-slate-200 px-2 py-2">Due Date</th>
              <th className="border border-slate-200 px-2 py-2">Status</th>
              <th className="border border-slate-200 px-2 py-2">Challan No</th>
              <th className="border border-slate-200 px-2 py-2">Bank</th>
              <th className="border border-slate-200 px-2 py-2">Student Activities Fund</th>
              <th className="border border-slate-200 px-2 py-2">Online Charges 1</th>
              <th className="border border-slate-200 px-2 py-2">Tuition Fee</th>
              <th className="border border-slate-200 px-2 py-2">Online Charges 2</th>
              <th className="border border-slate-200 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r._id || idx} className="text-[12px] text-slate-700">
                <td className="border border-slate-100 p-1"><input className={input} value={r.amount ?? ''} onChange={(e) => setField(idx, 'amount', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r.generatedOn || ''} onChange={(e) => setField(idx, 'generatedOn', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r.dueDate || ''} onChange={(e) => setField(idx, 'dueDate', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r.status || ''} onChange={(e) => setField(idx, 'status', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r.challanNo || ''} onChange={(e) => setField(idx, 'challanNo', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r.bankName || ''} onChange={(e) => setField(idx, 'bankName', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r?.paymentDetail?.studentActivitiesFund ?? ''} onChange={(e) => setDetail(idx, 'studentActivitiesFund', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r?.paymentDetail?.onlinePaymentCharges1 ?? ''} onChange={(e) => setDetail(idx, 'onlinePaymentCharges1', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r?.paymentDetail?.tuitionFee ?? ''} onChange={(e) => setDetail(idx, 'tuitionFee', e.target.value)} /></td>
                <td className="border border-slate-100 p-1"><input className={input} value={r?.paymentDetail?.onlinePaymentCharges2 ?? ''} onChange={(e) => setDetail(idx, 'onlinePaymentCharges2', e.target.value)} /></td>
                <td className="border border-slate-100 p-1">
                  <button type="button" className="rounded p-2 text-red-700 hover:bg-red-50" onClick={() => removeRow(idx)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addRow} className="mt-3 inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700">
        <FiPlus /> Add Challan
      </button>
    </div>
  )
}


