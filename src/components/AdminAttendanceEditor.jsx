import { FiPlus, FiSave, FiTrash2 } from 'react-icons/fi'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"
const TERM_DELETE_VALUE = '__DELETE_TERM__'

const DEFAULT_TERMS = ['Spring 2026', 'Fall 2025', 'Summer 2025']

const percentToWidth = (n) => `${Math.max(0, Math.min(100, Number(n) || 0))}%`

const normalizeCourse = (c) => ({
  code: c?.code || '',
  title: c?.title || '',
  lectures: Array.isArray(c?.lectures)
    ? c.lectures.map((l, idx) => ({
        lectureNo: typeof l?.lectureNo === 'number' ? l.lectureNo : idx + 1,
        date: l?.date || l?.lectureDate || '',
        durationHours:
          typeof l?.durationHours === 'number'
            ? l.durationHours
            : typeof l?.duration === 'number'
              ? l.duration
              : typeof l?.hours === 'number'
                ? l.hours
                : l?.durationHours || l?.duration || l?.hours || '',
        presence: l?.presence === 'A' ? 'A' : 'P',
      }))
    : [],
})

export default function AdminAttendanceEditor({ token, studentId }) {
  const [loading, setLoading] = useState(true)
  const [initialDone, setInitialDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [terms, setTerms] = useState([])
  const [selectedTerm, setSelectedTerm] = useState(DEFAULT_TERMS[0])
  const [courses, setCourses] = useState([])
  const [activeCourseCode, setActiveCourseCode] = useState('')

  const [newCourse, setNewCourse] = useState({ code: '', title: '' })
  const [customTerm, setCustomTerm] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingTerm, setDeletingTerm] = useState(false)

  const requestIdRef = useRef(0)

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.code === activeCourseCode) || courses[0] || null
  }, [courses, activeCourseCode])

  const fetchAttendance = useCallback(async () => {
    if (!token || !studentId) return

    const myId = ++requestIdRef.current

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const params = new URLSearchParams()
      if (selectedTerm) params.set('term', selectedTerm)

      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/attendance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load attendance')

      if (myId !== requestIdRef.current) return

      setTerms(Array.isArray(payload.terms) ? payload.terms : [])

      const nextCourses = Array.isArray(payload.coursesFull)
        ? payload.coursesFull.map(normalizeCourse)
        : []
      setCourses(nextCourses)

      const firstCode = payload.selectedCourse?.code || nextCourses?.[0]?.code || ''
      setActiveCourseCode(firstCode)
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setError(err.message || 'Failed to load attendance')
      setCourses([])
      setActiveCourseCode('')
    } finally {
      if (myId === requestIdRef.current) {
        setLoading(false)
        setInitialDone(true)
      }
    }
  }, [token, studentId, selectedTerm])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const termOptions = useMemo(() => {
    const merged = [...DEFAULT_TERMS]
    for (const t of terms) {
      if (t && !merged.includes(t)) merged.push(t)
    }
    return merged
  }, [terms])

  const computePercentage = (lectures = []) => {
    const total = lectures.length
    if (!total) return 0
    const present = lectures.filter((l) => l.presence === 'P').length
    return Math.round((present / total) * 10000) / 100
  }

  const addCourse = () => {
    const code = (newCourse.code || '').trim()
    if (!code) return
    if (courses.some((c) => c.code === code)) return
    const next = [{ code, title: (newCourse.title || '').trim(), lectures: [] }, ...courses]
    setCourses(next)
    setActiveCourseCode(code)
    setNewCourse({ code: '', title: '' })
  }

  const removeCourse = (code) => {
    setCourses((prev) => {
      const next = prev.filter((c) => c.code !== code)
      if (!next.length) {
        setActiveCourseCode('')
      } else if (activeCourseCode === code) {
        setActiveCourseCode(next[0].code || '')
      }
      return next
    })
  }

  const addLecture = () => {
    if (!activeCourse) return
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        const nextLectures = [...(c.lectures || [])]
        nextLectures.push({
          lectureNo: nextLectures.length + 1,
          date: '',
          durationHours: '',
          presence: 'P',
        })
        return { ...c, lectures: nextLectures }
      })
    )
  }

  const removeLecture = (idx) => {
    if (!activeCourse) return
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        const nextLectures = (c.lectures || [])
          .filter((_, i) => i !== idx)
          .map((item, i) => ({ ...item, lectureNo: i + 1 }))
        return { ...c, lectures: nextLectures }
      })
    )
  }

  const addCustomTerm = () => {
    const value = String(customTerm || '').trim()
    if (!value) return
    setSelectedTerm(value)
    setCustomTerm('')
  }

  const removeSelectedTerm = async () => {
    if (!selectedTerm) return
    try {
      setDeletingTerm(true)
      setError('')
      setSuccess('')
      const params = new URLSearchParams({ term: selectedTerm })
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/attendance?${params.toString()}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to delete term')
      setSuccess('Term deleted')
      const nextOptions = termOptions.filter((t) => t !== selectedTerm && t !== TERM_DELETE_VALUE)
      setSelectedTerm(nextOptions[0] || DEFAULT_TERMS[0])
      setDeleteModalOpen(false)
      await fetchAttendance()
    } catch (err) {
      setError(err.message || 'Failed to delete term')
    } finally {
      setDeletingTerm(false)
    }
  }

  const handleTermChange = (value) => {
    if (value === TERM_DELETE_VALUE) {
      setDeleteModalOpen(true)
      return
    }
    setSelectedTerm(value)
  }

  const updateLecture = (idx, key) => (e) => {
    const value = key === 'presence' ? e.target.value : e.target.value
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        const next = [...(c.lectures || [])]
        next[idx] = { ...next[idx], [key]: value }
        return { ...c, lectures: next }
      })
    )
  }

  const save = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/attendance`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: selectedTerm,
          courses: courses.map((c) => ({
            code: c.code,
            title: c.title,
            lectures: (c.lectures || []).map((l, i) => ({
              lectureNo: Number(l.lectureNo) || i + 1,
              date: l.date,
              durationHours: l.durationHours === '' ? undefined : Number(l.durationHours),
              presence: l.presence === 'A' ? 'A' : 'P',
            })),
          })),
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to save attendance')
      setSuccess('Attendance saved')
      await fetchAttendance()
    } catch (err) {
      setError(err.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  if (!initialDone && loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3f51b5] border-t-transparent" />
          <p className="text-[13px] font-medium text-slate-600">Loading attendance…</p>
        </div>
      </div>
    )
  }

  const percentage = computePercentage(activeCourse?.lectures || [])
  const percentBarClass = percentage < 80 ? 'bg-red-500' : 'bg-[#37b26c]'

  return (
    <div className="relative rounded-xl bg-white shadow">
      {initialDone && loading && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-white/60 pt-28"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3f51b5] border-t-transparent" />
            <span className="text-[13px] text-slate-700">Updating…</span>
          </div>
        </div>
      )}
      <div className="sticky top-[72px] z-20 border-b border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[16px] font-semibold text-slate-900">Attendance (Admin)</div>
            <div className="text-[13px] text-slate-500">Edit and save student attendance</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={termOptions.includes(selectedTerm) ? selectedTerm : termOptions[0]}
              onChange={(e) => handleTermChange(e.target.value)}
              disabled={loading}
              className="h-10 w-[160px] cursor-pointer appearance-none rounded-md bg-[#3f51b5] py-2 pr-8 pl-3 text-[12px] font-semibold text-white outline-none disabled:opacity-60"
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
              {!!selectedTerm && <option value={TERM_DELETE_VALUE}>🗑 Delete current term...</option>}
            </select>
            <input
              value={customTerm}
              onChange={(e) => setCustomTerm(e.target.value)}
              className="h-10 w-[180px] rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-700"
              placeholder="Custom term"
            />
            <button
              type="button"
              onClick={addCustomTerm}
              className="h-10 rounded-md border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-1">
                <FiPlus />
                Add term
              </span>
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-10 rounded-md bg-[#3f51b5] px-5 text-[13px] font-semibold text-white hover:bg-[#3445a8] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <FiSave />
                {saving ? 'Saving...' : 'Save'}
              </span>
            </button>
          </div>
        </div>

        {(error || success) && (
          <div
            className={[
              'mt-4 rounded-lg border px-4 py-3 text-[13px]',
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700',
            ].join(' ')}
          >
            {error || success}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              value={newCourse.code}
              onChange={(e) => setNewCourse((p) => ({ ...p, code: e.target.value }))}
              className="h-10 w-[140px] rounded-md border border-slate-200 bg-white px-3 text-[13px]"
              placeholder="Course code"
            />
            <input
              value={newCourse.title}
              onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))}
              className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-[13px]"
              placeholder="Course title"
            />
            <button
              type="button"
              onClick={addCourse}
              className="h-10 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              <span className="inline-flex items-center gap-1">
                <FiPlus />
                Add Course
              </span>
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[12px] font-semibold text-slate-500">Active course percentage</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-3 w-full overflow-hidden rounded bg-slate-200">
              <div className={`h-full rounded ${percentBarClass}`} style={{ width: percentToWidth(percentage) }} />
            </div>
            <div className="text-[12px] font-semibold text-slate-700">{percentage.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200">
        <div className="flex flex-col gap-2 bg-[#3f51b5] px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
          <div className="text-[13px] font-semibold">Registered Courses</div>
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            {courses.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setActiveCourseCode(c.code)}
                className={[
                  'rounded px-2 py-1 font-semibold',
                  (activeCourse?.code || '') === c.code ? 'bg-white/15' : 'hover:bg-white/10',
                ].join(' ')}
              >
                {c.code}
              </button>
            ))}
            {!!activeCourse?.code && (
              <button
                type="button"
                onClick={() => removeCourse(activeCourse.code)}
                className="rounded bg-white/10 px-2 py-1 font-semibold text-red-100 hover:bg-red-500/70 hover:text-white"
              >
                <span className="inline-flex items-center gap-1">
                  <FiTrash2 />
                  Remove course
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {!activeCourse ? (
            <p className="text-[13px] text-slate-600">No courses yet. Add a course above.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-[13px] font-semibold text-slate-800">
                  {activeCourse.code}
                  {activeCourse.title ? `-${activeCourse.title}` : ''}
                </div>
                <button
                  type="button"
                  onClick={addLecture}
                  className="h-9 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <FiPlus />
                    Add Lecture
                  </span>
                </button>
              </div>

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
                      <th className="border border-[#8fb8d4] px-3 py-2 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeCourse.lectures || []).map((l, idx) => (
                      <tr key={`${l.lectureNo || idx}`} className="bg-white">
                        <td className="border border-[#d5e3ef] px-3 py-2 text-center">
                          <input
                            value={l.lectureNo}
                            onChange={updateLecture(idx, 'lectureNo')}
                            className="h-9 w-20 rounded border border-slate-200 px-2 text-center text-[12px]"
                          />
                        </td>
                        <td className="border border-[#d5e3ef] px-3 py-2 text-center">
                          <input
                            value={l.date}
                            onChange={updateLecture(idx, 'date')}
                            className="h-9 w-[160px] rounded border border-slate-200 px-2 text-center text-[12px]"
                            placeholder="19-Jan-2026"
                          />
                        </td>
                        <td className="border border-[#d5e3ef] px-3 py-2 text-center">
                          <input
                            value={l.durationHours}
                            onChange={updateLecture(idx, 'durationHours')}
                            className="h-9 w-[160px] rounded border border-slate-200 px-2 text-center text-[12px]"
                            placeholder="1.5"
                          />
                        </td>
                        <td className="border border-[#d5e3ef] px-3 py-2 text-center">
                          <select
                            value={l.presence}
                            onChange={updateLecture(idx, 'presence')}
                            className="h-9 w-24 rounded border border-slate-200 px-2 text-center text-[12px] font-semibold"
                          >
                            <option value="P">P</option>
                            <option value="A">A</option>
                          </select>
                        </td>
                        <td className="border border-[#d5e3ef] px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLecture(idx)}
                            className="rounded p-2 text-red-700 hover:bg-red-50"
                            aria-label="Remove lecture"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-[17px] font-semibold text-slate-900">Delete Term</h3>
            <p className="mt-2 text-[13px] text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{selectedTerm}</span> attendance
              data? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="h-10 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeSelectedTerm}
                disabled={deletingTerm}
                className="h-10 rounded-md bg-red-600 px-4 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingTerm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


