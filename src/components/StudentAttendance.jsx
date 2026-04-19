import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

const DEFAULT_TERMS = ['Spring 2026', 'Fall 2025', 'Summer 2025']

const percentToWidth = (n) => `${Math.max(0, Math.min(100, Number(n) || 0))}%`

function mergeTermLists(apiTerms) {
  const merged = [...DEFAULT_TERMS]
  for (const t of apiTerms || []) {
    if (t && !merged.includes(t)) merged.push(t)
  }
  return merged
}

export default function StudentAttendance({ token }) {
  const [term, setTerm] = useState(DEFAULT_TERMS[0])
  /** Empty string = let API pick first course for this term */
  const [courseCode, setCourseCode] = useState('')

  const [apiTerms, setApiTerms] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)

  const [loading, setLoading] = useState(true)
  const [initialDone, setInitialDone] = useState(false)
  const [error, setError] = useState('')
  const [noteVisible, setNoteVisible] = useState(true)

  const requestIdRef = useRef(0)

  const termOptions = useMemo(() => mergeTermLists(apiTerms), [apiTerms])

  const fetchAttendance = useCallback(async () => {
    if (!token) return

    const myId = ++requestIdRef.current

    try {
      setError('')
      setLoading(true)

      const params = new URLSearchParams()
      params.set('term', term)
      if (courseCode) params.set('courseCode', courseCode)

      const res = await fetch(`${API_BASE}/api/attendance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load attendance')

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
      setError(err.message || 'Failed to load attendance')
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
    fetchAttendance()
  }, [fetchAttendance])

  const handleTermChange = (nextTerm) => {
    setTerm(nextTerm)
    setCourseCode('')
  }

  const handleCourseTab = (code) => {
    if (code === (selectedCourse?.code || courseCode)) return
    setCourseCode(code)
  }

  const effectiveTerm = termOptions.includes(term) ? term : termOptions[0]

  if (!initialDone && loading) {
    return (
      <div className="space-y-3">
        <div className="rounded border border-[#d3d9e4] bg-white p-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#3f51b5] border-t-transparent" />
          <p className="text-[13px] font-medium text-slate-600">Loading attendance…</p>
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
          aria-live="polite"
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

      {noteVisible && (
        <div className="flex items-center justify-between gap-3 rounded border border-[#cfd6e4] bg-[#f2f3f6] p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[#2f91d5] text-sm font-bold text-white">
              i
            </div>
            <p className="text-[12px] text-[#2f5f89]">
              <span className="font-semibold">Note!</span> Attendance Update after 24 hours.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNoteVisible(false)}
            className="shrink-0 text-xl leading-none text-[#64748b] hover:text-slate-900"
            aria-label="Close note"
          >
            ×
          </button>
        </div>
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
          <div className="text-[13px] font-semibold">Registered Courses</div>
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
              {loading ? 'Loading…' : 'No attendance data for this term.'}
            </p>
          ) : (
            <>
              {(() => {
                const pct = Number(selectedCourse.attendancePercentage) || 0
                const barClass = pct < 80 ? 'bg-red-500' : 'bg-[#37b26c]'
                return (
                  <div className="mx-auto mb-3 flex max-w-[640px] flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="text-[13px] font-semibold text-slate-800">
                      {selectedCourse.code}
                      {selectedCourse.title ? `-${selectedCourse.title}` : ''}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[12px] text-slate-600">Attendance Percentage:</span>
                      <div className="h-4 w-[220px] overflow-hidden rounded bg-[#e5e7eb]">
                        <div
                          className={`h-full rounded ${barClass}`}
                          style={{ width: percentToWidth(selectedCourse.attendancePercentage) }}
                        />
                      </div>
                      <span className="text-[12px] font-semibold text-slate-700">
                        {(selectedCourse.attendancePercentage ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )
              })()}

              <div className="flex justify-center overflow-x-auto">
                <table className="w-full max-w-[640px] border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#2f91d5] text-white">
                      <th className="border border-[#8fb8d4] px-3 py-2 text-center font-semibold">Lecture No</th>
                      <th className="border border-[#8fb8d4] px-3 py-2 text-center font-semibold">Date</th>
                      <th className="border border-[#8fb8d4] px-3 py-2 text-center font-semibold">
                        Duration (in Hours)
                      </th>
                      <th className="border border-[#8fb8d4] px-3 py-2 text-center font-semibold">Presence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCourse.lectures || []).map((l, idx) => {
                      const isAbsent = l.presence === 'A'
                      const date = l.date || l.lectureDate || ''
                      const hours =
                        typeof l.durationHours === 'number'
                          ? l.durationHours
                          : typeof l.duration === 'number'
                            ? l.duration
                            : typeof l.hours === 'number'
                              ? l.hours
                              : l.durationHours ?? l.duration ?? l.hours ?? ''
                      return (
                        <tr key={`${l.lectureNo || idx}`} className="bg-white">
                          <td className="border border-[#d5e3ef] px-3 py-2 text-center">{l.lectureNo ?? idx + 1}</td>
                          <td className="border border-[#d5e3ef] px-3 py-2 text-center">{date}</td>
                          <td className="border border-[#d5e3ef] px-3 py-2 text-center">{hours}</td>
                          <td
                            className={[
                              'border border-[#d5e3ef] px-3 py-2 text-center font-semibold',
                              isAbsent ? 'text-red-500' : 'text-slate-700',
                            ].join(' ')}
                          >
                            {l.presence || ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

