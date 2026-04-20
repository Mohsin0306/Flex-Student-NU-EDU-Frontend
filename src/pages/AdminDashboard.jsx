import { useEffect, useMemo, useRef, useState } from 'react'
import { FaHistory, FaUserPlus, FaUsers } from 'react-icons/fa'
import { FiMenu, FiPower, FiUser, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getStoredUser, getToken } from '../utils/auth'
import favicon from '../assets/favicon.ico'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-[#3f51b5] focus:ring-2 focus:ring-[#3f51b533]'

function safeJsonParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function normalizeRollNumber(value) {
  const cleaned = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!cleaned) return ''
  if (cleaned.length <= 3) return cleaned
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
}

function AdminRegisterStudent({ token }) {
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    password: '',
    section: '',
    degree: '',
    campus: '',
    batch: '',
    status: 'Current',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: key === 'rollNumber' ? normalizeRollNumber(e.target.value) : e.target.value }))
  }

  const uploadProfileImage = async () => {
    if (!imageFile) return ''
    const fd = new FormData()
    fd.append('image', imageFile)

    const res = await fetch(`${API_BASE}/api/upload/profile-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    const payload = await res.json()
    if (!res.ok) throw new Error(payload.message || 'Image upload failed')
    return payload.url || ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name || !form.rollNumber || !form.password) {
      setError('Name, Roll Number and Password are required')
      return
    }

    try {
      setSubmitting(true)
      const profileImage = await uploadProfileImage()

      const res = await fetch(`${API_BASE}/api/admin/register-student`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form, profileImage }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Student registration failed')

      setSuccess(`Student registered: ${payload?.user?.name || form.name}`)
      setForm({
        name: '',
        rollNumber: '',
        password: '',
        section: '',
        degree: '',
        campus: '',
        batch: '',
        status: 'Current',
      })
      setImageFile(null)
    } catch (err) {
      setError(err.message || 'Student registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#3f51b5] text-white">
          <FaUserPlus />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">Register Student</h2>
          <p className="text-[13px] text-slate-500">Create a new student account</p>
        </div>
      </div>

      {(error || success) && (
        <div
          className={[
            'mb-4 rounded-lg border px-4 py-3 text-[13px]',
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
          ].join(' ')}
        >
          {error || success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Profile Photo (optional)</label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-slate-400">
                  <FiUser />
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block w-full text-[13px] text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-[13px] file:text-white hover:file:bg-slate-700"
            />
          </div>
          <p className="mt-1 text-[12px] text-slate-500">Max 5MB. JPG/PNG recommended.</p>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Name *</label>
          <input value={form.name} onChange={update('name')} className={inputClass} placeholder="Student name" />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Roll Number *</label>
          <input value={form.rollNumber} onChange={update('rollNumber')} className={inputClass} placeholder="24I-0000" />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Password *</label>
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            className={inputClass}
            placeholder="Set a password"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Status</label>
          <input value={form.status} onChange={update('status')} className={inputClass} placeholder="Current" />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Section</label>
          <input value={form.section} onChange={update('section')} className={inputClass} placeholder="BFT-243C" />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Degree</label>
          <input value={form.degree} onChange={update('degree')} className={inputClass} placeholder="BS(FT)" />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Campus</label>
          <input value={form.campus} onChange={update('campus')} className={inputClass} placeholder="Islamabad" />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-700">Batch</label>
          <input value={form.batch} onChange={update('batch')} className={inputClass} placeholder="Fall 2024" />
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex h-10 items-center justify-center rounded-md bg-[#3f51b5] px-5 text-[14px] font-semibold text-white hover:bg-[#3445a8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Register Student'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminViewStudents({ token }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [students, setStudents] = useState([])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to load students')
      setStudents(Array.isArray(payload.students) ? payload.students : [])
    } catch (err) {
      setError(err.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (studentId) => {
    if (!studentId) return
    const ok = window.confirm('Delete this student? This action cannot be undone.')
    if (!ok) return
    try {
      setActionError('')
      setDeletingId(studentId)
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to delete student')
      setStudents((prev) => prev.filter((s) => (s._id || s.id) !== studentId))
    } catch (err) {
      setActionError(err.message || 'Failed to delete student')
    } finally {
      setDeletingId('')
    }
  }

  if (loading) return <div className="rounded-xl bg-white p-5 shadow">Loading students...</div>

  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#3f51b5] text-white">
            <FaUsers />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">View Students</h2>
            <p className="text-[13px] text-slate-500">Total: {students.length}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="h-10 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      ) : students.length === 0 ? (
        <p className="text-[13px] text-slate-600">No students found.</p>
      ) : (
        <>
        {actionError ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{actionError}</div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[12px] text-slate-500">
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Student</th>
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Roll No</th>
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Section</th>
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Degree</th>
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Campus</th>
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Batch</th>
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Status</th>
                <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const avatar =
                  s.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Student')}&background=2f5f89&color=fff`
                return (
                  <tr
                    key={s._id || s.id}
                    className="cursor-pointer text-[13px] text-slate-800 hover:bg-slate-50"
                    onClick={() => navigate(`/admin/students/${s._id || s.id}`)}
                  >
                    <td className="border-b border-slate-100 py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <img src={avatar} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                        <div className="leading-tight">
                          <div className="font-semibold">{s.name || '-'}</div>
                          <div className="text-[12px] text-slate-500">{s.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 py-3 pr-3">{s.rollNumber || '-'}</td>
                    <td className="border-b border-slate-100 py-3 pr-3">{s.section || '-'}</td>
                    <td className="border-b border-slate-100 py-3 pr-3">{s.degree || '-'}</td>
                    <td className="border-b border-slate-100 py-3 pr-3">{s.campus || '-'}</td>
                    <td className="border-b border-slate-100 py-3 pr-3">{s.batch || '-'}</td>
                    <td className="border-b border-slate-100 py-3 pr-3">{s.status || '-'}</td>
                    <td className="border-b border-slate-100 py-3 pr-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(s._id || s.id)
                        }}
                        disabled={deletingId === (s._id || s.id)}
                        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === (s._id || s.id) ? 'Deleting...' : 'Delete'}
                      </button>
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
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePage, setActivePage] = useState('Register Students')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const profileMenuRef = useRef(null)

  const token = getToken()
  const user = getStoredUser()

  const profileImage = useMemo(() => {
    if (!user?.name) return ''
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2f5f89&color=fff`
  }, [user?.name])

  const sideMenu = [
    { icon: FaUserPlus, label: 'Register Students' },
    { icon: FaUsers, label: 'View Students' },
    { icon: FaHistory, label: 'History' },
  ]

  useEffect(() => {
    if (!token || !user || user.role !== 'admin') {
      clearAuth()
      navigate('/', { replace: true })
      return
    }

    const loadDashboard = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || 'Failed to load admin dashboard')
        setData(payload)
      } catch (err) {
        setError(err.message || 'Failed to load admin dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [navigate])

  const handleLogout = () => {
    clearAuth()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  if (loading) return <main className="p-6">Loading admin dashboard...</main>

  const content =
    activePage === 'Register Students' ? (
      <AdminRegisterStudent token={token} />
    ) : activePage === 'View Students' ? (
      <AdminViewStudents token={token} />
    ) : (
      <div className="rounded-xl bg-white p-5 shadow">
        <div className="mb-2 text-[16px] font-semibold text-slate-900">History</div>
        <p className="text-[13px] text-slate-600">Coming soon.</p>
      </div>
    )

  return (
    <main className="min-h-screen bg-[#f3f5f9] pt-[80px]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-[#2f5f89]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-md border border-white/25 text-white lg:hidden"
              aria-label="Open sidebar"
            >
              <FiMenu />
            </button>
            <img src={favicon} alt="Portal" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="mt-1 text-[18px] font-semibold text-white">Admin Portal</div>
              <div className="text-[13px] text-white/80">{activePage}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-[13px] font-semibold text-[#ffd54f]">Hello Mr,</div>
              <div className="text-[14px] font-semibold text-white">{user?.name || 'Admin'}</div>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((s) => !s)}
                className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/30 bg-white/10"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-white">
                    <FiUser />
                  </div>
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-slate-800 hover:bg-slate-50"
                  >
                    <FiPower className="text-slate-600" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close sidebar backdrop"
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-white p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-[14px] font-semibold text-slate-800">Menu</div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-slate-700"
                aria-label="Close sidebar"
              >
                <FiX />
              </button>
            </div>
            <div className="desktop-sidebar-scroll">
              {sideMenu.map((item) => {
                const Icon = item.icon
                const isActive = activePage === item.label
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActivePage(item.label)
                      setIsMobileSidebarOpen(false)
                    }}
                    className={[
                      'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] font-semibold transition',
                      isActive ? 'bg-[#3f51b5] text-white' : 'text-slate-800 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'grid h-9 w-9 place-items-center rounded-md',
                        isActive ? 'bg-white/15' : 'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      <Icon />
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-[1400px] gap-4 px-4 py-5 lg:px-6">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="desktop-sidebar-scroll rounded-xl bg-white p-3 shadow">
            {sideMenu.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.label
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActivePage(item.label)}
                  className={[
                    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] font-semibold transition',
                    isActive ? 'bg-[#3f51b5] text-white' : 'text-slate-800 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'grid h-9 w-9 place-items-center rounded-md',
                      isActive ? 'bg-white/15' : 'bg-slate-100 text-slate-700',
                    ].join(' ')}
                  >
                    <Icon />
                  </span>
                  {item.label}
                </button>
              )
            })}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-white p-4 shadow">
                <div className="text-[12px] font-semibold text-slate-500">Total Students</div>
                <div className="mt-1 text-[22px] font-bold text-slate-900">
                  {data?.stats?.studentCount ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow">
                <div className="text-[12px] font-semibold text-slate-500">Role</div>
                <div className="mt-1 text-[16px] font-semibold text-slate-900">{data?.user?.role || 'admin'}</div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow">
                <div className="text-[12px] font-semibold text-slate-500">Status</div>
                <div className="mt-1 text-[16px] font-semibold text-slate-900">Online</div>
              </div>
            </div>
          )}

          <div className="lg:hidden">
            <div className="mb-4 flex flex-wrap gap-2">
              {sideMenu.map((item) => {
                const isActive = activePage === item.label
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActivePage(item.label)}
                    className={[
                      'h-10 rounded-full px-4 text-[13px] font-semibold',
                      isActive ? 'bg-[#3f51b5] text-white' : 'bg-white text-slate-800 shadow',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {content}
        </section>
      </div>
    </main>
  )
}

export default AdminDashboard

