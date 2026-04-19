import { useCallback, useEffect, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

function fmtAmount(v) {
  const n = Number(v || 0)
  return Number.isFinite(n) ? `${n.toLocaleString()} Rs.` : '0 Rs.'
}

export default function StudentFeeChallan({ token }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [challans, setChallans] = useState([])
  const [selected, setSelected] = useState(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!token) return
    const myId = ++requestIdRef.current
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/fee-challan`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load fee challan')
      if (myId !== requestIdRef.current) return
      setChallans(Array.isArray(payload.challans) ? payload.challans : [])
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setError(err.message || 'Failed to load fee challan')
    } finally {
      if (myId !== requestIdRef.current) return
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="rounded border border-[#cfd6e4] bg-white">
      <div className="bg-[#3f51b5] px-5 py-3 text-[15px] font-semibold text-white">Student Challan</div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.38fr_1fr]">
        <div className="overflow-x-auto border border-slate-200 lg:overflow-x-visible">
          {loading ? (
            <div className="p-4 text-[13px] text-slate-600">Loading challans...</div>
          ) : error ? (
            <div className="p-4 text-[13px] text-red-600">{error}</div>
          ) : challans.length === 0 ? (
            <div className="p-4 text-[13px] text-slate-600">No fee challan available.</div>
          ) : (
            <table className="w-full min-w-[860px] border-collapse lg:min-w-0 lg:table-fixed">
              <thead>
                <tr className="bg-[#ecf2ff] text-left text-[12px] text-slate-700">
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">S. No</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Amount</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Generated On</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Due Date</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Status</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Print Challan for Faysal bank</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">KuickPay Payment Detail</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((row, idx) => {
                  const challanId = row?._id || row?.id || ''
                  return (
                    <tr key={challanId || idx} className="text-[13px] text-slate-700 odd:bg-white even:bg-[#fafbfd]">
                      <td className="border-b border-slate-100 px-3 py-2">{idx + 1}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{Number(row.amount || row.computedTotal || 0)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{row.generatedOn || '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{row.dueDate || '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{row.status || 'Valid'}</td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <button
                          type="button"
                          className="rounded bg-[#4f5fd2] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4453c0] disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            if (!challanId) return
                            navigate(`/student/challan/print/${challanId}`)
                          }}
                          disabled={!challanId}
                        >
                          Print
                        </button>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <button
                          type="button"
                          className="rounded bg-[#4f5fd2] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4453c0]"
                          onClick={() => setSelected(row)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-l border-slate-300 pl-3 text-[13px] leading-6 text-slate-700">
          <p className="font-semibold text-slate-800">Fee can be paid using any one of the following methods:</p>
          <p className="mt-1 font-semibold">1. Via bank account using kuickpay payment gateway.</p>
          <p><span className="font-semibold italic">Step 1:</span> Sign in to your Internet Banking, Mobile Banking or visit an ATM machine</p>
          <p><span className="font-semibold italic">Step 2:</span> Select Bill Payment / Payments and then select 'kuickpay' from given categories</p>
          <p><span className="font-semibold italic">Step 3:</span> Enter the voucher or invoice number and continue. Make sure to enter Institution ID as prefix (mentioned on challan)</p>
          <p><span className="font-semibold italic">Step 4:</span> Confirm your voucher details and proceed to payment. Payment alerts will be received accordingly.</p>
          <p className="mt-2 font-semibold italic">*Customers of following Banks can avail Kuickpay service</p>
          <p>Allied Bank, Askari Bank, Bank Al Habib, Bank Alfalah, Bank Islami, Bank of Punjab, Dubai Islamic Bank, Faysal Bank, First Women Bank, Habib Metro Bank, Habib Bank Limited, JS Bank, MCB Bank, MCB Islamic Bank, Meezan Bank, National Bank, NRSP Bank, SAMBA Bank, Soneri bank, Summit Bank, UBL and Keenu App.</p>
          <p className="mt-2 font-semibold">*Easy paisa and JazzCash can also be used for payment via kuickpay. (Transaction Limit apply)</p>
          <p className="mt-2 font-semibold">For further clarification, please visit:</p>
          <a href="https://app.kuickpay.com/PaymentsBillPayment" target="_blank" rel="noreferrer" className="text-[#3f51b5] underline">
            https://app.kuickpay.com/PaymentsBillPayment
          </a>
          <p className="mt-2 font-semibold">2. Print the challan form and then visit any nearest Faysal bank branch for cash deposit.</p>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 px-4 py-12">
          <div className="w-full max-w-[700px] rounded bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-[22px] font-medium text-slate-700">Payment Detail</h4>
              <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100" onClick={() => setSelected(null)}>
                <FiX />
              </button>
            </div>
            <div className="px-5 py-5 text-[14px] text-slate-700">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <p><span className="font-semibold">Challan No:</span> {selected.challanNo || '-'}</p>
                <p><span className="font-semibold">Amount:</span> {fmtAmount(selected.amount || selected.computedTotal)}</p>
              </div>
              <div className="mt-5 border-t border-slate-200 pt-3">
                <p className="mb-2 font-semibold">Segregation:</p>
                <div className="space-y-1 text-[13px]">
                  <p className="flex justify-between"><span>Student Activities Fund</span><span>{fmtAmount(selected?.paymentDetail?.studentActivitiesFund)}</span></p>
                  <p className="flex justify-between"><span>Online Payment Charges</span><span>{fmtAmount(selected?.paymentDetail?.onlinePaymentCharges1)}</span></p>
                  <p className="flex justify-between"><span>Tuition Fee</span><span>{fmtAmount(selected?.paymentDetail?.tuitionFee)}</span></p>
                  <p className="flex justify-between"><span>Online Payment Charges</span><span>{fmtAmount(selected?.paymentDetail?.onlinePaymentCharges2)}</span></p>
                  <p className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold"><span>Total</span><span>{fmtAmount(selected.amount || selected.computedTotal)}</span></p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button type="button" className="rounded border border-slate-200 px-5 py-2 text-[14px] text-slate-700 hover:bg-slate-50" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


