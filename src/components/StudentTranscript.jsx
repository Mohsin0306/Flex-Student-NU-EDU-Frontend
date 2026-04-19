import { useCallback, useEffect, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

export default function StudentTranscript({ token, user }) {
  const [loading, setLoading] = useState(true)
  const [initialDone, setInitialDone] = useState(false)
  const [error, setError] = useState('')
  const [noteOpen, setNoteOpen] = useState(true)

  const [arn, setArn] = useState('')
  const [batch, setBatch] = useState('')
  const [terms, setTerms] = useState([])
  const [gradeModal, setGradeModal] = useState(null)

  const requestIdRef = useRef(0)

  const fetchTranscript = useCallback(async () => {
    if (!token) return
    const myId = ++requestIdRef.current

    try {
      setError('')
      setLoading(true)

      const res = await fetch(`${API_BASE}/api/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load transcript')

      if (myId !== requestIdRef.current) return

      const tr = payload.transcript || {}
      setArn(tr.arn || '')
      setBatch(tr.batch || '')
      setTerms(Array.isArray(tr.terms) ? tr.terms : [])
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setError(err.message || 'Failed to load transcript')
      setTerms([])
    } finally {
      if (myId !== requestIdRef.current) return
      setLoading(false)
      setInitialDone(true)
    }
  }, [token])

  useEffect(() => {
    fetchTranscript()
  }, [fetchTranscript])

  const headerCell =
    'border border-[#8dc8ec] bg-[#37a7e8] px-2 py-2 text-[12px] font-semibold text-white whitespace-nowrap'
  const bodyCell =
    'border border-[#e1e6ef] px-2 py-2 text-[13px] leading-[1.35] text-slate-700 whitespace-normal break-words align-top'

  return (
    <div className="px-4 pb-8 pt-3 lg:px-6">
      <div className="border-b-2 border-[#4a5cc7] pb-5 pt-1">
        <div className="space-y-1 text-[13px] leading-[1.35] text-slate-900">
          <p>
            <span className="font-semibold">Roll No:</span> {user?.rollNumber || '-'}
          </p>
          <p>
            <span className="font-semibold">Name:</span> {user?.name || '-'}
          </p>
          <p>
            <span className="font-semibold">Batch:</span> {batch || user?.batch || '-'}
          </p>
          {arn ? (
            <p className="text-[13px] text-slate-700">
              <span className="font-semibold">ARN:</span> {arn}
            </p>
          ) : null}
        </div>
      </div>

      {noteOpen && (
        <div className="mt-3 flex items-start justify-between gap-3 border border-slate-200 bg-[#f3f9ff] px-4 py-3">
          <div className="flex gap-3">
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded bg-[#1e88e5] text-white">
              <div className="flex h-full w-full items-center justify-center text-[16px] font-bold">i</div>
            </div>
            <div className="text-[12px] leading-5 text-slate-700">
              <span className="text-slate-600">To Check </span>
              <span className="font-semibold text-slate-700">Modified Class Average (MCA)</span>
              <span className="text-slate-600">
                {' '}
                click on course code link. Course code whose grades are generated through the Interquartile Range Method is showing
                as a link.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="mt-1 rounded p-1 text-slate-500 hover:bg-slate-100"
            onClick={() => setNoteOpen(false)}
            aria-label="Close note"
          >
            <FiX />
          </button>
        </div>
      )}

      <div className="mt-4 border border-slate-200">
        <div className="bg-[#3f51b5] px-5 py-3 text-[15px] font-semibold text-white">Student Transcript</div>

        <div className="bg-white px-4 pb-6 pt-4">
          {!initialDone && loading ? (
            <div className="py-10 text-center text-[13px] text-slate-600">Loading transcript…</div>
          ) : error ? (
            <div className="py-10 text-center text-[13px] text-red-600">{error}</div>
          ) : terms.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-slate-600">No transcript data yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {terms.map((t, idx) => (
                <div key={`${t.term}-${idx}`} className="w-full">
                  <div className="mb-2 flex items-center justify-between text-[13px] text-slate-700">
                    <div className="font-semibold">{t.term}</div>
                    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      <span>
                        Cr. Att:
                        <span className="ml-1 font-semibold text-slate-700">{fmtNum(t?.summary?.crAtt)}</span>
                      </span>
                      <span>
                        Cr. Ernd:
                        <span className="ml-1 font-semibold text-slate-700">{fmtNum(t?.summary?.crEarned)}</span>
                      </span>
                      <span>
                        CGPA:
                        <span className="ml-1 font-semibold text-slate-700">{fmtNum(t?.summary?.cgpa)}</span>
                      </span>
                      <span>
                        SGPA:
                        <span className="ml-1 font-semibold text-slate-700">{fmtNum(t?.summary?.sgpa)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] table-fixed border-collapse lg:min-w-0">
                      <thead>
                        <tr>
                          <th className={`${headerCell} w-[11%]`}>Code</th>
                          <th className={`${headerCell} w-[24%]`}>Course Name</th>
                          <th className={`${headerCell} w-[13%]`}>Section</th>
                          <th className={`${headerCell} w-[10%]`}>CrdHrs</th>
                          <th className={`${headerCell} w-[9%]`}>Grade</th>
                          <th className={`${headerCell} w-[9%]`}>Points</th>
                          <th className={`${headerCell} w-[10%]`}>Type</th>
                          <th className={`${headerCell} w-[14%]`}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(t.rows || []).map((r, rIdx) => {
                          const highlighted = !!r?.isHighlighted
                          return (
                            <tr
                              key={`${r.code || r.courseName}-${rIdx}`}
                              className={highlighted ? 'bg-[#edf7ff]' : rIdx % 2 === 0 ? 'bg-[#f6f8fc]' : 'bg-white'}
                            >
                              <td className={bodyCell}>
                                {highlighted ? (
                                  <button
                                    type="button"
                                    className="text-[#2b7bb9] underline"
                                    onClick={() =>
                                      setGradeModal({
                                        gradingScheme: r?.linkDetails?.gradingScheme || 'Relative Grading',
                                        modifiedClassAverage:
                                          r?.linkDetails?.modifiedClassAverage === null ||
                                          r?.linkDetails?.modifiedClassAverage === undefined
                                            ? ''
                                            : r.linkDetails.modifiedClassAverage,
                                      })
                                    }
                                  >
                                    {r.code || ''}
                                  </button>
                                ) : (
                                  <span>{r.code || ''}</span>
                                )}
                              </td>
                              <td className={bodyCell}>{r.courseName || ''}</td>
                              <td className={bodyCell}>{r.section || ''}</td>
                              <td className={bodyCell}>{fmtNum(r.crHrs)}</td>
                              <td className={bodyCell}>{r.grade || ''}</td>
                              <td className={bodyCell}>{fmtNum(r.points)}</td>
                              <td className={bodyCell}>{r.type || ''}</td>
                              <td className={bodyCell}>{r.remarks || ''}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {gradeModal ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 py-14">
          <div className="w-full max-w-[700px] rounded bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-[22px] font-medium text-slate-700">Grade Scheme Detail</h4>
              <button
                type="button"
                className="rounded p-1 text-[22px] leading-none text-slate-500 hover:bg-slate-100"
                onClick={() => setGradeModal(null)}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="text-[14px] font-semibold text-slate-700">Grading Scheme</div>
                  <div className="mt-2 text-[15px] text-slate-600">{gradeModal.gradingScheme || '-'}</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-700">Modified Class Average (MCA)</div>
                  <div className="mt-2 text-[15px] text-slate-600">
                    {gradeModal.modifiedClassAverage === '' ? '-' : String(gradeModal.modifiedClassAverage)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                className="rounded border border-slate-200 px-5 py-2 text-[14px] text-slate-700 hover:bg-slate-50"
                onClick={() => setGradeModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


