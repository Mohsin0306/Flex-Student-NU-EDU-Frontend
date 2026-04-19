import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

const DEFAULT_TERMS = ['Spring 2026', 'Fall 2025', 'Summer 2025']

function mergeTermLists(apiTerms) {
  const merged = [...DEFAULT_TERMS]
  for (const t of apiTerms || []) {
    if (t && !merged.includes(t)) merged.push(t)
  }
  return merged
}

function fmtCell(v) {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'number' && Number.isFinite(v)) {
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '') === '' ? String(v) : v.toFixed(2)
  }
  return String(v)
}

export default function StudentMarks({ token }) {
  const [term, setTerm] = useState(DEFAULT_TERMS[0])
  const [courseCode, setCourseCode] = useState('')

  const [apiTerms, setApiTerms] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)

  const [loading, setLoading] = useState(true)
  const [initialDone, setInitialDone] = useState(false)
  const [error, setError] = useState('')

  const [expanded, setExpanded] = useState(() => ({
    assignment: true,
    quiz: false,
    sessional1: false,
    grandTotal: false,
  }))

  const requestIdRef = useRef(0)

  const termOptions = useMemo(() => mergeTermLists(apiTerms), [apiTerms])

  const fetchMarks = useCallback(async () => {
    if (!token) return

    const myId = ++requestIdRef.current

    try {
      setError('')
      setLoading(true)

      const params = new URLSearchParams()
      params.set('term', term)
      if (courseCode) params.set('courseCode', courseCode)

      const res = await fetch(`${API_BASE}/api/marks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load marks')

      if (myId !== requestIdRef.current) return

      setApiTerms(Array.isArray(payload.terms) ? payload.terms : [])
      setCourses(Array.isArray(payload.courses) ? payload.courses : [])
      setSelectedCourse(payload.selectedCourse || null)

      const serverCourse = payload.selectedCourse?.code || ''
      if (courseCode && serverCourse && serverCourse !== courseCode) {
        setCourseCode(serverCourse)
      }
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setError(err.message || 'Failed to load marks')
      setCourses([])
      setSelectedCourse(null)
    } finally {
      if (myId === requestIdRef.current) {
        setLoading(false)
        setInitialDone(true)
      }
    }
  }, [token, term, courseCode])

  useEffect(() => {
    fetchMarks()
  }, [fetchMarks])

  useEffect(() => {
    if (!selectedCourse?.sections?.length) return
    const next = {}
    selectedCourse.sections.forEach((s) => {
      const k = s.key || s.label
      next[k] = k === 'assignment'
    })
    setExpanded(next)
  }, [selectedCourse?.code])

  const handleTermChange = (nextTerm) => {
    setTerm(nextTerm)
    setCourseCode('')
  }

  const handleCourseTab = (code) => {
    if (code === (selectedCourse?.code || courseCode)) return
    setCourseCode(code)
  }

  const toggleSection = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const effectiveTerm = termOptions.includes(term) ? term : termOptions[0]

  if (!initialDone && loading) {
    return (
      <div className="space-y-3">
        <div className="rounded border border-[#d3d9e4] bg-white p-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#3f51b5] border-t-transparent" />
          <p className="text-[13px] font-medium text-slate-600">Loading marks…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-3">
      {initialDone && loading && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded border border-[#cfd6e4] bg-white/60 pt-24"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3f51b5] border-t-transparent" />
            <span className="text-[13px] text-slate-700">Updating…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
      )}

      <div className="flex justify-center">
        <div className="relative inline-block">
          <select
            value={effectiveTerm}
            onChange={(e) => handleTermChange(e.target.value)}
            disabled={loading}
            className="h-9 w-[160px] cursor-pointer appearance-none rounded-md bg-[#3f51b5] py-1.5 pr-8 pl-3 text-[12px] font-semibold text-white outline-none disabled:opacity-60"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
            }}
          >
            {termOptions.map((t) => (
              <option key={t} value={t} className="bg-white text-slate-900">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded border border-[#cfd6e4] bg-white">
        <div className="flex flex-col gap-2 bg-[#3f51b5] px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
          <div className="text-[13px] font-semibold">Student Marks</div>
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            {courses.map((c) => (
              <button
                key={c.code}
                type="button"
                disabled={loading}
                onClick={() => handleCourseTab(c.code)}
                className={[
                  'rounded px-2 py-1 font-semibold disabled:opacity-60',
                  (selectedCourse?.code || '') === c.code ? 'bg-white/15' : 'hover:bg-white/10',
                ].join(' ')}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {!selectedCourse ? (
            <p className="text-[13px] text-slate-600">
              {loading ? 'Loading…' : 'No marks data for this term.'}
            </p>
          ) : (
            <>
              <p className="mb-4 text-[13px] font-semibold text-slate-800">
                {selectedCourse.code}
                {selectedCourse.title ? `-${selectedCourse.title}` : ''}
              </p>

              <div className="space-y-2">
                {(selectedCourse.sections || []).map((section) => {
                  const key = section.key || section.label
                  const isOpen = expanded[key] ?? false
                  const col1Label =
                    key === 'quiz'
                      ? 'Quiz #'
                      : key === 'sessional1'
                        ? 'Sessional-I #'
                        : key === 'grandTotal'
                          ? 'Item'
                          : 'Assignment #'
                  return (
                    <div key={key} className="overflow-hidden rounded border border-[#cfd6e4]">
                      <button
                        type="button"
                        onClick={() => toggleSection(key)}
                        className="flex w-full items-center justify-between bg-[#f0f2f7] px-4 py-3 text-left text-[13px] font-semibold text-slate-800 hover:bg-[#e8ebf2]"
                      >
                        <span>{section.label || key}</span>
                        {isOpen ? <FiChevronUp className="text-lg" /> : <FiChevronDown className="text-lg" />}
                      </button>
                      {isOpen && (
                        <div className="flex justify-center overflow-x-auto bg-white p-3">
                          <table className="w-full max-w-[900px] border-collapse text-[12px]">
                            <thead>
                              <tr className="bg-[#2f91d5] text-white">
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  {col1Label}
                                </th>
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  Weightage
                                </th>
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  Obtained Marks
                                </th>
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  Total Marks
                                </th>
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  Average
                                </th>
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  Standard Deviation
                                </th>
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  Minimum
                                </th>
                                <th className="border border-[#8fb8d4] px-2 py-2 text-center font-semibold">
                                  Maximum
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(section.rows || []).map((row, idx) => (
                                <tr
                                  key={`${key}-${idx}`}
                                  className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}
                                >
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {row.rowLabel ?? ''}
                                  </td>
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {fmtCell(row.weightage)}
                                  </td>
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {fmtCell(row.obtainedMarks)}
                                  </td>
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {fmtCell(row.totalMarks)}
                                  </td>
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {fmtCell(row.average)}
                                  </td>
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {row.stdDev === null || row.stdDev === undefined || row.stdDev === ''
                                      ? ''
                                      : fmtCell(row.stdDev)}
                                  </td>
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {fmtCell(row.min)}
                                  </td>
                                  <td className="border border-[#d5e3ef] px-2 py-2 text-center">
                                    {fmtCell(row.max)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

