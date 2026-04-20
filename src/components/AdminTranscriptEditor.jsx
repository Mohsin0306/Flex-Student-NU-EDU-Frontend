import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

const emptyRow = () => ({
  code: '',
  courseName: '',
  section: '',
  crHrs: 0,
  grade: '',
  points: 0,
  type: '',
  remarks: '',
  isHighlighted: false,
  linkDetails: {
    gradingScheme: '',
    modifiedClassAverage: '',
  },
})

const emptyTerm = (termName = '') => ({
  term: termName,
  summary: { crAtt: 0, crEarned: 0, cgpa: 0, sgpa: 0 },
  rows: [emptyRow()],
})

export default function AdminTranscriptEditor({ token, studentId, student }) {
  const [loading, setLoading] = useState(true)
  const [initialDone, setInitialDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState('')

  const [arn, setArn] = useState('')
  const [batch, setBatch] = useState('')
  const [terms, setTerms] = useState([emptyTerm('Fall 2024')])
  const [activeTerm, setActiveTerm] = useState(0)

  const requestIdRef = useRef(0)

  const fetchTranscript = useCallback(async () => {
    if (!token || !studentId) return
    const myId = ++requestIdRef.current

    try {
      setError('')
      setLoading(true)

      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load transcript')
      if (myId !== requestIdRef.current) return

      const tr = payload.transcript || {}
      setArn(tr.arn || '')
      setBatch(tr.batch || '')
      const nextTerms = Array.isArray(tr.terms) && tr.terms.length ? tr.terms : [emptyTerm('Fall 2024')]
      setTerms(nextTerms)
      setActiveTerm(0)
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setError(err.message || 'Failed to load transcript')
      setTerms([emptyTerm('Fall 2024')])
      setActiveTerm(0)
    } finally {
      if (myId !== requestIdRef.current) return
      setLoading(false)
      setInitialDone(true)
    }
  }, [token, studentId])

  useEffect(() => {
    fetchTranscript()
  }, [fetchTranscript])

  const active = terms[activeTerm] || emptyTerm('')

  const termTabs = useMemo(() => {
    return (terms || []).map((t, idx) => ({
      idx,
      term: t?.term || `Term ${idx + 1}`,
    }))
  }, [terms])

  const headerCell = 'border border-slate-200 bg-[#e9f2f8] px-3 py-2 text-[12px] font-semibold text-slate-700'
  const bodyCell = 'border border-slate-200 px-2 py-2 text-[12px] text-slate-700'
  const input = 'w-full rounded border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none focus:border-slate-400'

  const setTermField = (idx, patch) => {
    setTerms((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }

  const setSummaryField = (idx, key, value) => {
    setTerms((prev) =>
      prev.map((t, i) =>
        i === idx ? { ...t, summary: { ...(t.summary || {}), [key]: value } } : t
      )
    )
  }

  const setRowField = (tIdx, rIdx, key, value) => {
    setTerms((prev) =>
      prev.map((t, i) => {
        if (i !== tIdx) return t
        const rows = Array.isArray(t.rows) ? t.rows : []
        const nextRows = rows.map((r, j) => (j === rIdx ? { ...r, [key]: value } : r))
        return { ...t, rows: nextRows }
      })
    )
  }

  const setRowLinkField = (tIdx, rIdx, key, value) => {
    setTerms((prev) =>
      prev.map((t, i) => {
        if (i !== tIdx) return t
        const rows = Array.isArray(t.rows) ? t.rows : []
        const nextRows = rows.map((r, j) =>
          j === rIdx
            ? {
                ...r,
                linkDetails: {
                  ...(r.linkDetails || {}),
                  [key]: value,
                },
              }
            : r
        )
        return { ...t, rows: nextRows }
      })
    )
  }

  const addRow = (tIdx) => {
    setTerms((prev) =>
      prev.map((t, i) => (i === tIdx ? { ...t, rows: [...(t.rows || []), emptyRow()] } : t))
    )
  }

  const removeRow = (tIdx, rIdx) => {
    setTerms((prev) =>
      prev.map((t, i) => {
        if (i !== tIdx) return t
        const rows = Array.isArray(t.rows) ? t.rows : []
        const next = rows.filter((_, j) => j !== rIdx)
        return { ...t, rows: next.length ? next : [emptyRow()] }
      })
    )
  }

  const addTerm = () => {
    setTerms((prev) => [...prev, emptyTerm('')])
    setActiveTerm((prev) => terms.length) // old length == new index
  }

  const removeTerm = (idx) => {
    setTerms((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.length ? next : [emptyTerm('')]
    })
    setActiveTerm((prev) => {
      if (idx === prev) return 0
      return prev > idx ? prev - 1 : prev
    })
  }

  const save = async () => {
    if (!token || !studentId) return
    setSaveError('')
    setSaveOk('')

    try {
      setSaving(true)

      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/transcript`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          arn,
          batch,
          terms,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to save transcript')

      setSaveOk('Saved')
      const tr = payload.transcript || {}
      setArn(tr.arn || arn)
      setBatch(tr.batch || batch)
      setTerms(Array.isArray(tr.terms) && tr.terms.length ? tr.terms : terms)
    } catch (err) {
      setSaveError(err.message || 'Failed to save transcript')
    } finally {
      setSaving(false)
      window.setTimeout(() => setSaveOk(''), 1500)
    }
  }

  return (
    <div className="px-4 pb-10 pt-3 lg:px-6">
      <div className="sticky top-[64px] z-20 -mx-4 mb-3 border-b border-slate-200 bg-[#f7fafc] px-4 py-3 lg:-mx-6 lg:px-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-[13px] font-semibold text-slate-700">
            Transcript
            <span className="ml-2 text-[12px] font-normal text-slate-500">
              ({student?.name || 'Student'} - {student?.rollNumber || ''})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saveError ? <div className="text-[12px] text-red-600">{saveError}</div> : null}
            {saveOk ? <div className="text-[12px] text-emerald-700">{saveOk}</div> : null}
            <button
              type="button"
              className="rounded bg-[#2f5f89] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#284f73] disabled:opacity-60"
              disabled={saving}
              onClick={save}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {!initialDone && loading ? (
        <div className="py-10 text-center text-[13px] text-slate-600">Loading transcript…</div>
      ) : error ? (
        <div className="py-10 text-center text-[13px] text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-[12px] font-semibold text-slate-700">ARN</div>
              <input className={input} value={arn} onChange={(e) => setArn(e.target.value)} placeholder="e.g. 2435998" />
            </label>
            <label className="block">
              <div className="mb-1 text-[12px] font-semibold text-slate-700">Batch</div>
              <input className={input} value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. Fall 2024" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {termTabs.map((t) => (
              <button
                key={`${t.term}-${t.idx}`}
                type="button"
                className={`rounded px-3 py-2 text-[12px] font-semibold ${
                  t.idx === activeTerm ? 'bg-[#2f5f89] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTerm(t.idx)}
              >
                {t.term}
              </button>
            ))}
            <button
              type="button"
              className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              onClick={addTerm}
            >
              <FiPlus /> Add Term
            </button>
            {terms.length > 1 ? (
              <button
                type="button"
                className="flex items-center gap-2 rounded border border-red-200 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-50"
                onClick={() => removeTerm(activeTerm)}
              >
                <FiTrash2 /> Remove Term
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <label className="block lg:col-span-2">
              <div className="mb-1 text-[12px] font-semibold text-slate-700">Term Name</div>
              <input
                className={input}
                value={active.term || ''}
                onChange={(e) => setTermField(activeTerm, { term: e.target.value })}
                placeholder="e.g. Spring 2025"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[12px] font-semibold text-slate-700">Cr. Att</div>
              <input
                className={input}
                value={fmtNum(active?.summary?.crAtt)}
                onChange={(e) => setSummaryField(activeTerm, 'crAtt', Number(e.target.value || 0))}
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[12px] font-semibold text-slate-700">Cr. Ernd</div>
              <input
                className={input}
                value={fmtNum(active?.summary?.crEarned)}
                onChange={(e) => setSummaryField(activeTerm, 'crEarned', Number(e.target.value || 0))}
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[12px] font-semibold text-slate-700">CGPA / SGPA</div>
              <div className="flex gap-2">
                <input
                  className={input}
                  value={fmtNum(active?.summary?.cgpa)}
                  onChange={(e) => setSummaryField(activeTerm, 'cgpa', Number(e.target.value || 0))}
                  inputMode="decimal"
                  placeholder="CGPA"
                />
                <input
                  className={input}
                  value={fmtNum(active?.summary?.sgpa)}
                  onChange={(e) => setSummaryField(activeTerm, 'sgpa', Number(e.target.value || 0))}
                  inputMode="decimal"
                  placeholder="SGPA"
                />
              </div>
            </label>
          </div>

          <div className="overflow-x-auto border border-slate-200 bg-white">
            <table className="min-w-[980px] w-full border-collapse">
              <thead>
                <tr>
                  <th className={headerCell}>Code</th>
                  <th className={headerCell}>Course Name</th>
                  <th className={headerCell}>Section</th>
                  <th className={headerCell}>CrdHrs</th>
                  <th className={headerCell}>Grade</th>
                  <th className={headerCell}>Points</th>
                  <th className={headerCell}>Type</th>
                  <th className={headerCell}>Remarks</th>
                  <th className={headerCell}>Link</th>
                  <th className={headerCell}></th>
                </tr>
              </thead>
              <tbody>
                {(active.rows || []).map((r, rIdx) => (
                  <Fragment key={r._id || r.id || `row-${rIdx}`}>
                    <tr>
                      <td className={bodyCell}>
                        <input className={input} value={r.code || ''} onChange={(e) => setRowField(activeTerm, rIdx, 'code', e.target.value)} />
                      </td>
                      <td className={bodyCell}>
                        <input
                          className={input}
                          value={r.courseName || ''}
                          onChange={(e) => setRowField(activeTerm, rIdx, 'courseName', e.target.value)}
                        />
                      </td>
                      <td className={bodyCell}>
                        <input className={input} value={r.section || ''} onChange={(e) => setRowField(activeTerm, rIdx, 'section', e.target.value)} />
                      </td>
                      <td className={bodyCell}>
                        <input
                          className={input}
                          value={fmtNum(r.crHrs)}
                          onChange={(e) => setRowField(activeTerm, rIdx, 'crHrs', Number(e.target.value || 0))}
                          inputMode="numeric"
                        />
                      </td>
                      <td className={bodyCell}>
                        <input className={input} value={r.grade || ''} onChange={(e) => setRowField(activeTerm, rIdx, 'grade', e.target.value)} />
                      </td>
                      <td className={bodyCell}>
                        <input
                          className={input}
                          value={r.points ?? ''}
                          onChange={(e) => setRowField(activeTerm, rIdx, 'points', e.target.value)}
                          inputMode="decimal"
                        />
                      </td>
                      <td className={bodyCell}>
                        <input className={input} value={r.type || ''} onChange={(e) => setRowField(activeTerm, rIdx, 'type', e.target.value)} />
                      </td>
                      <td className={bodyCell}>
                        <input className={input} value={r.remarks || ''} onChange={(e) => setRowField(activeTerm, rIdx, 'remarks', e.target.value)} />
                      </td>
                      <td className={bodyCell}>
                        <label className="flex items-center justify-center gap-2 text-[12px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!r.isHighlighted}
                            onChange={(e) => setRowField(activeTerm, rIdx, 'isHighlighted', e.target.checked)}
                          />
                          Link
                        </label>
                      </td>
                      <td className={bodyCell}>
                        <button
                          type="button"
                          className="rounded p-2 text-red-700 hover:bg-red-50"
                          onClick={() => removeRow(activeTerm, rIdx)}
                          aria-label="Remove row"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                    {r.isHighlighted ? (
                      <tr>
                        <td className={bodyCell} colSpan={10}>
                          <div className="grid grid-cols-1 gap-3 rounded border border-blue-100 bg-blue-50 p-3 lg:grid-cols-2">
                            <label className="block">
                              <div className="mb-1 text-[12px] font-semibold text-slate-700">Grading Scheme Detail</div>
                              <input
                                className={input}
                                value={r?.linkDetails?.gradingScheme || ''}
                                onChange={(e) => setRowLinkField(activeTerm, rIdx, 'gradingScheme', e.target.value)}
                                placeholder="e.g. Relative Grading"
                              />
                            </label>
                            <label className="block">
                              <div className="mb-1 text-[12px] font-semibold text-slate-700">Modified Class Average (MCA)</div>
                              <input
                                className={input}
                                value={r?.linkDetails?.modifiedClassAverage ?? ''}
                                onChange={(e) => setRowLinkField(activeTerm, rIdx, 'modifiedClassAverage', e.target.value)}
                                inputMode="decimal"
                                placeholder="e.g. 70"
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => addRow(activeTerm)}
          >
            <FiPlus /> Add Row
          </button>
        </div>
      )}
    </div>
  )
}


