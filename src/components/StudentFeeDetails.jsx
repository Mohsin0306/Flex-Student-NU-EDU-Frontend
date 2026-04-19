import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"
const fmt = (n) => Number(n || 0).toLocaleString()

export default function StudentFeeDetails({ token }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [terms, setTerms] = useState([])
  const [paymentRows, setPaymentRows] = useState([])
  const [openTerm, setOpenTerm] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/fee-details`, { headers: { Authorization: `Bearer ${token}` } })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load fee details')
      setTerms(Array.isArray(payload.terms) ? payload.terms : [])
      setPaymentRows(Array.isArray(payload.paymentRows) ? payload.paymentRows : [])
    } catch (err) {
      setError(err.message || 'Failed to load fee details')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const active = useMemo(() => terms[openTerm] || null, [terms, openTerm])

  if (loading) return <div className="rounded border border-[#cfd6e4] bg-white p-5">Loading fee details...</div>
  if (error) return <div className="rounded border border-[#cfd6e4] bg-white p-5 text-red-600">{error}</div>

  return (
    <div className="rounded border border-[#cfd6e4] bg-white">
      <div className="bg-[#3f51b5] px-5 py-3 text-[15px] font-semibold text-white">Collection Detail</div>
      <div className="p-4">
        {terms.map((t, i) => (
          <div key={`${t.term}-${i}`} className="mb-3 border-b border-slate-200 pb-3">
            <div className="grid grid-cols-1 items-center gap-2 text-[13px] lg:grid-cols-[170px_repeat(6,1fr)]">
              <button type="button" className="inline-flex w-fit items-center rounded-full bg-[#4f5fd2] px-4 py-2 text-white" onClick={() => setOpenTerm(i)}>
                {openTerm === i ? <FiChevronDown /> : <FiChevronRight />}
                <span className="ml-2">{t.term}</span>
              </button>
              <div className="text-center"><div className="font-semibold">Arrears</div><div>{fmt(t.arrears)}</div></div>
              <div className="text-center"><div className="font-semibold">Due</div><div>{fmt(t.due)}</div></div>
              <div className="text-center"><div className="font-semibold">Discount</div><div>{fmt(t.discount)}</div></div>
              <div className="text-center"><div className="font-semibold">Sponsored</div><div>{fmt(t.sponsored)}</div></div>
              <div className="text-center"><div className="font-semibold">Collection</div><div>{fmt(t.collection)}</div></div>
              <div className="text-center"><div className="font-semibold">Balance</div><div>{fmt(t.balance)}</div></div>
            </div>

            {openTerm === i ? (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded border border-slate-200 p-3">
                  <h4 className="text-[15px] font-semibold leading-tight">Fee In Semester</h4>
                  <div className="mt-2 text-[13px] leading-[1.6]">
                    <p><b>A)</b> Arrears: <b>{fmt(t.arrears)}</b></p>
                    <p><b>B)</b> Due In Semester:</p>
                    <ul className="ml-5 list-disc">
                      <li>Student Activities Fund:<br /><b>{fmt(t.studentActivitiesFund)}</b></li>
                      <li>Tuition Fee: <b>{fmt(t.tuitionFee)}</b></li>
                    </ul>
                    <p><b>C)</b> Discount: <b>{fmt(t.discount)}</b></p>
                    <p><b>D)</b> Sponsored: <b>{fmt(t.sponsored)}</b></p>
                    <p><b>E)</b> Net: <b>(A+B)-C-D = {fmt((Number(t.arrears || 0) + Number(t.due || 0) - Number(t.discount || 0) - Number(t.sponsored || 0)) || 0)}</b></p>
                    <p><b>F)</b> Collection: <b>{fmt(t.collection)}</b></p>
                    <p><b>G)</b> Balance: <b>(E-F) = {fmt(t.balance)}</b></p>
                  </div>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <h4 className="text-[15px] font-semibold leading-tight">Registration Log</h4>
                  <div className="mb-2 mt-1 text-[13px]">SGPA: {t.sgpa || 0} &nbsp;&nbsp; CGPA: {t.cgpa || 0}</div>
                  <div className="overflow-x-auto lg:overflow-x-visible">
                    <table className="w-full border-collapse text-[13px] lg:table-fixed">
                      <colgroup>
                        <col className="w-[48px]" />
                        <col className="w-[47%]" />
                        <col className="w-[18%]" />
                        <col className="w-[15%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-[#37a7e8] text-white">
                          <th className="px-2 py-2 text-left">Sr#</th><th className="px-2 py-2 text-left">Title</th><th className="px-2 py-2 text-left">Request Type</th><th className="px-2 py-2 text-left">Status</th><th className="px-2 py-2 text-left">Action Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(t.registrationLog || []).length === 0 ? (
                          <tr><td className="px-2 py-2 text-slate-500" colSpan={5}>No registration log yet.</td></tr>
                        ) : (t.registrationLog || []).map((r, idx2) => (
                          <tr key={idx2} className="border-b border-slate-100">
                            <td className="px-2 py-2">{r.srNo || idx2 + 1}</td><td className="px-2 py-2">{r.title || ''}</td><td className="px-2 py-2">{r.requestType || ''}</td><td className="px-2 py-2">{r.status || ''}</td><td className="px-2 py-2">{r.actionDate || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(t.installments || []).length > 0 ? (
                    <div className="mt-4">
                      <h5 className="mb-2 text-[14px] font-semibold">Installment(s)</h5>
                      <div className="overflow-x-auto lg:overflow-x-visible">
                        <table className="w-full border-collapse text-[13px] lg:table-fixed">
                          <colgroup>
                            <col className="w-[52px]" />
                            <col className="w-[18%]" />
                            <col className="w-[28%]" />
                            <col className="w-[24%]" />
                            <col className="w-[20%]" />
                          </colgroup>
                          <thead>
                            <tr className="bg-[#37a7e8] text-white">
                              <th className="px-2 py-2 text-left">Sr#</th>
                              <th className="px-2 py-2 text-left">Amount</th>
                              <th className="px-2 py-2 text-left">Challan No</th>
                              <th className="px-2 py-2 text-left">Due Date</th>
                              <th className="px-2 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(t.installments || []).map((ins, ii) => (
                              <tr key={ii} className="border-b border-slate-100">
                                <td className="px-2 py-2">{ins.srNo || ii + 1}</td>
                                <td className="px-2 py-2">{fmt(ins.amount)}</td>
                                <td className="px-2 py-2">{ins.challanNo || ''}</td>
                                <td className="px-2 py-2">{ins.dueDate || ''}</td>
                                <td className="px-2 py-2">{ins.status || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ))}
        <div className="overflow-x-auto border border-slate-200 lg:overflow-x-visible">
          <table className="w-full min-w-[980px] border-collapse text-[13px] lg:min-w-0 lg:table-fixed">
            <colgroup>
              <col className="w-[52px]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#37a7e8] text-left text-white">
                <th className="px-2 py-2">S.No</th><th className="px-2 py-2">Semester</th><th className="px-2 py-2">Challan No</th><th className="px-2 py-2">Instrument Type</th><th className="px-2 py-2">Instrument No</th><th className="px-2 py-2">Amount</th><th className="px-2 py-2">Due Date</th><th className="px-2 py-2">Payment Date</th><th className="px-2 py-2">Entered By</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Operation</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.length === 0 ? (
                <tr><td className="px-2 py-2 text-slate-500" colSpan={11}>No payment rows yet.</td></tr>
              ) : paymentRows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-2 py-2">{r.srNo || i + 1}</td><td className="px-2 py-2">{r.semester || ''}</td><td className="px-2 py-2">{r.challanNo || ''}</td><td className="px-2 py-2">{r.instrumentType || ''}</td><td className="px-2 py-2">{r.instrumentNo || ''}</td><td className="px-2 py-2">{fmt(r.amount)}</td><td className="px-2 py-2">{r.dueDate || ''}</td><td className="px-2 py-2">{r.paymentDate || ''}</td><td className="px-2 py-2">{r.enteredBy || ''}</td><td className="px-2 py-2">{r.status || ''}</td><td className="px-2 py-2 text-[#2b7bb9] underline">{r.operation || 'Remarks'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


