import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiChevronDown, FiChevronUp, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"
const TERM_DELETE_VALUE = '__DELETE_TERM__'

const DEFAULT_TERMS = ['Spring 2026', 'Fall 2025', 'Summer 2025']

export function createDefaultCourse(code, title) {
  return {
    code: String(code).trim(),
    title: String(title || '').trim(),
    sections: [
      {
        key: 'assignment',
        label: 'Assignment',
        rows: [
          {
            rowLabel: '1',
            weightage: 2.5,
            obtainedMarks: 0,
            totalMarks: 10,
            average: 6.83,
            stdDev: null,
            min: 0,
            max: 10,
            isTotalRow: false,
          },
          {
            rowLabel: '2',
            weightage: 2.5,
            obtainedMarks: 0,
            totalMarks: 10,
            average: 6.41,
            stdDev: null,
            min: 0,
            max: 10,
            isTotalRow: false,
          },
          {
            rowLabel: '3',
            weightage: 2.5,
            obtainedMarks: 0,
            totalMarks: 10,
            average: 7.89,
            stdDev: null,
            min: 0,
            max: 10,
            isTotalRow: false,
          },
          {
            rowLabel: 'Total',
            weightage: 7.5,
            obtainedMarks: 0,
            totalMarks: 30,
            average: 0,
            stdDev: null,
            min: 0,
            max: 0,
            isTotalRow: true,
          },
        ],
      },
      { key: 'quiz', label: 'Quiz', rows: [] },
      { key: 'sessional1', label: 'Sessional-I', rows: [] },
      { key: 'grandTotal', label: 'Grand Total Marks', rows: [] },
    ],
  }
}

const emptyRow = () => ({
  rowLabel: '',
  weightage: 0,
  obtainedMarks: 0,
  totalMarks: 10,
  average: 0,
  stdDev: null,
  min: 0,
  max: 10,
  isTotalRow: false,
})

export default function AdminMarksEditor({ token, studentId }) {
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
  const [newSectionLabel, setNewSectionLabel] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingTerm, setDeletingTerm] = useState(false)
  const [expanded, setExpanded] = useState({
    assignment: true,
    quiz: false,
    sessional1: false,
    grandTotal: false,
  })

  const requestIdRef = useRef(0)

  const activeCourse = useMemo(
    () => courses.find((c) => c.code === activeCourseCode) || courses[0] || null,
    [courses, activeCourseCode]
  )

  const termOptions = useMemo(() => {
    const merged = [...DEFAULT_TERMS]
    for (const t of terms) {
      if (t && !merged.includes(t)) merged.push(t)
    }
    return merged
  }, [terms])

  const fetchMarks = useCallback(async () => {
    if (!token || !studentId) return

    const myId = ++requestIdRef.current

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const params = new URLSearchParams()
      if (selectedTerm) params.set('term', selectedTerm)

      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/marks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load marks')

      if (myId !== requestIdRef.current) return

      setTerms(Array.isArray(payload.terms) ? payload.terms : [])

      const nextCourses = Array.isArray(payload.coursesFull) ? payload.coursesFull : []
      setCourses(nextCourses)

      const firstCode = payload.selectedCourse?.code || nextCourses?.[0]?.code || ''
      setActiveCourseCode(firstCode)
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setError(err.message || 'Failed to load marks')
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
    fetchMarks()
  }, [fetchMarks])

  const toggleSection = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const addCourse = () => {
    const code = (newCourse.code || '').trim()
    if (!code) return
    if (courses.some((c) => c.code === code)) return
    const course = createDefaultCourse(code, newCourse.title)
    setCourses((prev) => [course, ...prev])
    setActiveCourseCode(code)
    setNewCourse({ code: '', title: '' })
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
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/marks?${params.toString()}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to delete term')
      setSuccess('Term deleted')
      const nextOptions = termOptions.filter((t) => t !== selectedTerm && t !== TERM_DELETE_VALUE)
      setSelectedTerm(nextOptions[0] || DEFAULT_TERMS[0])
      setDeleteModalOpen(false)
      await fetchMarks()
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

  const updateCell = (sectionKey, rowIdx, field, value) => {
    if (!activeCourse) return
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        return {
          ...c,
          sections: (c.sections || []).map((sec) => {
            if (sec.key !== sectionKey) return sec
            const rows = [...(sec.rows || [])]
            const row = { ...rows[rowIdx] }
            if (field === 'stdDev') {
              row.stdDev = value === '' ? null : Number(value)
            } else if (['weightage', 'obtainedMarks', 'totalMarks', 'average', 'min', 'max'].includes(field)) {
              row[field] = value === '' ? 0 : Number(value)
            } else {
              row[field] = value
            }
            rows[rowIdx] = row
            return { ...sec, rows }
          }),
        }
      })
    )
  }

  const addRow = (sectionKey) => {
    if (!activeCourse) return
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        return {
          ...c,
          sections: (c.sections || []).map((sec) => {
            if (sec.key !== sectionKey) return sec
            return { ...sec, rows: [...(sec.rows || []), emptyRow()] }
          }),
        }
      })
    )
  }

  const removeRow = (sectionKey, rowIdx) => {
    if (!activeCourse) return
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        return {
          ...c,
          sections: (c.sections || []).map((sec) => {
            if (sec.key !== sectionKey) return sec
            const nextRows = (sec.rows || []).filter((_, i) => i !== rowIdx)
            return { ...sec, rows: nextRows }
          }),
        }
      })
    )
  }

  const addSection = () => {
    const label = String(newSectionLabel || '').trim()
    if (!label || !activeCourse) return
    const keyBase = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'section'
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        const current = c.sections || []
        const exists = current.some((s) => String(s.key) === keyBase || String(s.label) === label)
        if (exists) return c
        return {
          ...c,
          sections: [...current, { key: keyBase, label, rows: [] }],
        }
      })
    )
    setExpanded((prev) => ({ ...prev, [keyBase]: true }))
    setNewSectionLabel('')
  }

  const removeSection = (sectionKey) => {
    if (!activeCourse) return
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code !== activeCourse.code) return c
        const nextSections = (c.sections || []).filter((sec) => sec.key !== sectionKey)
        return { ...c, sections: nextSections }
      })
    )
  }

  const save = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/marks`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: selectedTerm,
          courses,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to save marks')
      setSuccess('Marks saved')
      await fetchMarks()
    } catch (err) {
      setError(err.message || 'Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  const col1Label = (key) =>
    key === 'quiz'
      ? 'Quiz #'
      : key === 'sessional1'
        ? 'Sessional-I #'
        : key === 'grandTotal'
          ? 'Item'
          : 'Assignment #'

  if (!initialDone && loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3f51b5] border-t-transparent" />
          <p className="text-[13px] font-medium text-slate-600">Loading marks…</p>
        </div>
      </div>
    )
  }

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
            <div className="text-[16px] font-semibold text-slate-900">Marks (Admin)</div>
            <div className="text-[13px] text-slate-500">Add / edit student marks for this term</div>
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
              disabled={saving || loading}
              className="h-10 rounded-md bg-[#3f51b5] px-5 text-[13px] font-semibold text-white hover:bg-[#3445a8] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <FiSave />
                {saving ? 'Saving…' : 'Save'}
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
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            value={newCourse.code}
            onChange={(e) => setNewCourse((p) => ({ ...p, code: e.target.value }))}
            className="h-10 w-[120px] rounded-md border border-slate-200 bg-white px-3 text-[13px]"
            placeholder="Course code"
          />
          <input
            value={newCourse.title}
            onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))}
            className="h-10 min-w-[200px] flex-1 rounded-md border border-slate-200 bg-white px-3 text-[13px]"
            placeholder="Course title e.g. Business Finance (BAF-4A)"
          />
          <button
            type="button"
            onClick={addCourse}
            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            <span className="inline-flex items-center gap-1">
              <FiPlus />
              Add course
            </span>
          </button>
          <input
            value={newSectionLabel}
            onChange={(e) => setNewSectionLabel(e.target.value)}
            className="h-10 min-w-[180px] rounded-md border border-slate-200 bg-white px-3 text-[13px]"
            placeholder="Custom section name"
          />
          <button
            type="button"
            onClick={addSection}
            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            <span className="inline-flex items-center gap-1">
              <FiPlus />
              Add section
            </span>
          </button>
        </div>

        <div className="rounded-lg border border-slate-200">
          <div className="flex flex-col gap-2 bg-[#3f51b5] px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
            <div className="text-[13px] font-semibold">Student Marks</div>
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
              <p className="text-[13px] text-slate-600">Add a course above or save an empty term to seed data.</p>
            ) : (
              <>
                <p className="mb-3 text-[13px] font-semibold text-slate-800">
                  {activeCourse.code}
                  {activeCourse.title ? `-${activeCourse.title}` : ''}
                </p>

                <div className="space-y-2">
                  {(activeCourse.sections || []).map((section) => {
                    const key = section.key
                    const isOpen = expanded[key] ?? false
                    return (
                      <div key={key} className="overflow-hidden rounded border border-[#cfd6e4]">
                        <div className="flex items-center justify-between bg-[#f0f2f7] px-4 py-3 text-left text-[13px] font-semibold text-slate-800">
                          <button
                            type="button"
                            onClick={() => toggleSection(key)}
                            className="flex flex-1 items-center justify-between text-left hover:text-slate-900"
                          >
                            <span>{section.label || key}</span>
                            {isOpen ? <FiChevronUp className="text-lg" /> : <FiChevronDown className="text-lg" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(key)}
                            className="ml-3 rounded p-1.5 text-red-700 hover:bg-red-100"
                            aria-label="Remove section"
                          >
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                        {isOpen && (
                          <div className="overflow-x-auto bg-white p-3">
                            <div className="mb-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => addRow(key)}
                                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <span className="inline-flex items-center gap-1">
                                  <FiPlus />
                                  Add row
                                </span>
                              </button>
                            </div>
                            <table className="w-full min-w-[800px] border-collapse text-[11px] md:text-[12px]">
                              <thead>
                                <tr className="bg-[#2f91d5] text-white">
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">{col1Label(key)}</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Weightage</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Obtained</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Total</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Average</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Std Dev</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Min</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Max</th>
                                  <th className="border border-[#8fb8d4] px-1 py-2 font-semibold">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(section.rows || []).map((row, rowIdx) => (
                                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.rowLabel ?? ''}
                                        onChange={(e) => updateCell(key, rowIdx, 'rowLabel', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.weightage ?? ''}
                                        onChange={(e) => updateCell(key, rowIdx, 'weightage', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.obtainedMarks ?? ''}
                                        onChange={(e) => updateCell(key, rowIdx, 'obtainedMarks', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.totalMarks ?? ''}
                                        onChange={(e) => updateCell(key, rowIdx, 'totalMarks', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.average ?? ''}
                                        onChange={(e) => updateCell(key, rowIdx, 'average', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.stdDev ?? ''}
                                        placeholder="—"
                                        onChange={(e) => updateCell(key, rowIdx, 'stdDev', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.min ?? ''}
                                        onChange={(e) => updateCell(key, rowIdx, 'min', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1">
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border border-slate-200 px-1 py-1 text-center"
                                        value={row.max ?? ''}
                                        onChange={(e) => updateCell(key, rowIdx, 'max', e.target.value)}
                                      />
                                    </td>
                                    <td className="border border-[#d5e3ef] px-1 py-1 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeRow(key, rowIdx)}
                                        className="rounded p-1.5 text-red-700 hover:bg-red-50"
                                        aria-label="Remove row"
                                      >
                                        <FiTrash2 />
                                      </button>
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
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-[17px] font-semibold text-slate-900">Delete Term</h3>
            <p className="mt-2 text-[13px] text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{selectedTerm}</span> marks
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

