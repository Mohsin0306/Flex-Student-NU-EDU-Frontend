import { useEffect, useMemo, useRef, useState } from 'react'
import { FaHome } from 'react-icons/fa'
import { FiPower, FiUser } from 'react-icons/fi'
import { HiOutlineClipboardDocumentCheck } from 'react-icons/hi2'
import { PiExam } from 'react-icons/pi'
import { useNavigate, useParams } from 'react-router-dom'
import { clearAuth, getStoredUser, getToken } from '../utils/auth'
import favicon from '../assets/favicon.ico'
import AdminAttendanceEditor from '../components/AdminAttendanceEditor'
import AdminFeeChallanEditor from '../components/AdminFeeChallanEditor'
import AdminFeeDetailsEditor from '../components/AdminFeeDetailsEditor'
import AdminMarksEditor from '../components/AdminMarksEditor'
import AdminTranscriptEditor from '../components/AdminTranscriptEditor'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-[#3f51b5] focus:ring-2 focus:ring-[#3f51b533]'

function normalizeFamilyInformation(list) {
  if (!Array.isArray(list)) return []
  return list.map((row) => ({
    relation: row?.relation || '',
    name: row?.name || '',
    cnic: row?.cnic || '',
    forWithHoldingTax: !!row?.forWithHoldingTax,
  }))
}

function normalizeRollNumber(value) {
  const cleaned = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!cleaned) return ''
  if (cleaned.length <= 3) return cleaned
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
}

function AdminStudentDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const token = getToken()
  const admin = getStoredUser()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [student, setStudent] = useState(null)

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    password: '',
    section: '',
    degree: '',
    campus: '',
    batch: '',
    status: '',
    gender: '',
    email: '',
    dob: '',
    cnic: '',
    mobileNo: '',
    bloodGroup: '',
    nationality: '',
    permanentAddress: { address: '', homePhone: '', postalCode: '', city: '', country: '' },
    currentAddress: { address: '', homePhone: '', postalCode: '', city: '', country: '' },
    academicCalendar: {
      registration: '',
      onlineFeedback1: '',
      classes: '',
      onlineFeedback2: '',
      onlineWithdrawRequest: '',
      onlineRetakeRequest: '',
    },
    familyInformation: [{ relation: '', name: '', cnic: '', forWithHoldingTax: false }],
    profileImage: '',
  })

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  const [activeSection, setActiveSection] = useState('Home')

  const sideMenu = [
    { icon: FaHome, label: 'Home' },
    { icon: HiOutlineClipboardDocumentCheck, label: 'Attendance' },
    { icon: PiExam, label: 'Marks' },
    { icon: PiExam, label: 'Transcript' },
    { icon: PiExam, label: 'Fee Challan' },
    { icon: PiExam, label: 'Fee Details' },
  ]

  const adminAvatar = useMemo(() => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=2f5f89&color=fff`
  }, [admin?.name])

  useEffect(() => {
    if (!token || !admin || admin.role !== 'admin') {
      clearAuth()
      navigate('/', { replace: true })
    }
  }, [navigate, token, admin])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        setSuccess('')

        const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload.message || 'Failed to load student')
        setStudent(payload.student)

        const s = payload.student || {}
        setForm({
          name: s.name || '',
          rollNumber: s.rollNumber || '',
          password: '',
          section: s.section || '',
          degree: s.degree || '',
          campus: s.campus || '',
          batch: s.batch || '',
          status: s.status || '',
          gender: s.gender || '',
          email: s.email || '',
          dob: s.dob || '',
          cnic: s.cnic || '',
          mobileNo: s.mobileNo || '',
          bloodGroup: s.bloodGroup || '',
          nationality: s.nationality || '',
          permanentAddress: {
            address: s.permanentAddress?.address || '',
            homePhone: s.permanentAddress?.homePhone || '',
            postalCode: s.permanentAddress?.postalCode || '',
            city: s.permanentAddress?.city || '',
            country: s.permanentAddress?.country || '',
          },
          currentAddress: {
            address: s.currentAddress?.address || '',
            homePhone: s.currentAddress?.homePhone || '',
            postalCode: s.currentAddress?.postalCode || '',
            city: s.currentAddress?.city || '',
            country: s.currentAddress?.country || '',
          },
          academicCalendar: {
            registration: s.academicCalendar?.registration || '',
            onlineFeedback1: s.academicCalendar?.onlineFeedback1 || '',
            classes: s.academicCalendar?.classes || '',
            onlineFeedback2: s.academicCalendar?.onlineFeedback2 || '',
            onlineWithdrawRequest: s.academicCalendar?.onlineWithdrawRequest || '',
            onlineRetakeRequest: s.academicCalendar?.onlineRetakeRequest || '',
          },
          familyInformation:
            normalizeFamilyInformation(s.familyInformation).length > 0
              ? normalizeFamilyInformation(s.familyInformation)
              : [{ relation: '', name: '', cnic: '', forWithHoldingTax: false }],
          profileImage: s.profileImage || '',
        })
      } catch (err) {
        setError(err.message || 'Failed to load student')
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id, token])

  const handleLogout = () => {
    clearAuth()
    navigate('/', { replace: true })
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

  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: key === 'rollNumber' ? normalizeRollNumber(e.target.value) : e.target.value }))
  const setNested = (parent, key) => (e) =>
    setForm((p) => ({ ...p, [parent]: { ...p[parent], [key]: e.target.value } }))
  const setCalendar = (key) => (e) =>
    setForm((p) => ({ ...p, academicCalendar: { ...p.academicCalendar, [key]: e.target.value } }))

  const updateFamily = (idx, key) => (e) => {
    const value = key === 'forWithHoldingTax' ? e.target.checked : e.target.value
    setForm((p) => {
      const next = [...p.familyInformation]
      next[idx] = { ...next[idx], [key]: value }
      return { ...p, familyInformation: next }
    })
  }

  const addFamilyRow = () => {
    setForm((p) => ({
      ...p,
      familyInformation: [...p.familyInformation, { relation: '', name: '', cnic: '', forWithHoldingTax: false }],
    }))
  }

  const removeFamilyRow = (idx) => () => {
    setForm((p) => {
      const next = p.familyInformation.filter((_, i) => i !== idx)
      return { ...p, familyInformation: next.length ? next : [{ relation: '', name: '', cnic: '', forWithHoldingTax: false }] }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const uploadedUrl = await uploadProfileImage()
      const payload = {
        ...form,
        profileImage: uploadedUrl || form.profileImage,
      }
      if (!payload.password) delete payload.password

      const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to save')

      setStudent(json.student)
      setSuccess('Student updated successfully')
      setForm((p) => ({ ...p, password: '', profileImage: json.student?.profileImage || p.profileImage }))
      setImageFile(null)
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!id) return
    const ok = window.confirm('Delete this student? This action cannot be undone.')
    if (!ok) return
    try {
      setDeleting(true)
      setError('')
      setSuccess('')
      const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || 'Failed to delete student')
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to delete student')
    } finally {
      setDeleting(false)
    }
  }

  const profileImage =
    imagePreview ||
    form.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'Student')}&background=2f5f89&color=fff`

  if (loading) return <main className="p-6">Loading student profile...</main>

  return (
    <main className="min-h-screen bg-[#f3f5f9] pt-[72px]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-[#2f5f89]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <img src={favicon} alt="Portal" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="mt-1 text-[18px] font-semibold text-white">Student Profile</div>
              <div className="text-[13px] text-white/80">Home</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-[13px] font-semibold text-[#ffd54f]">Hello Mr,</div>
              <div className="text-[14px] font-semibold text-white">{admin?.name || 'Admin'}</div>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((s) => !s)}
                className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/30 bg-white/10"
              >
                <img src={adminAvatar} alt="Profile" className="h-full w-full object-cover" />
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

      <div className="mx-auto flex max-w-[1400px] gap-4 px-4 py-5 lg:px-6">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="desktop-sidebar-scroll rounded-xl bg-white p-3 shadow">
            {sideMenu.map((item) => {
              const Icon = item.icon
              const isActive = item.label === activeSection
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveSection(item.label)}
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

        <section className="min-w-0 flex-1 space-y-4">
          <div className="sticky top-[72px] z-20 rounded-xl border border-slate-200 bg-white p-4 shadow">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                  <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                </div>
                <div className="leading-tight">
                  <div className="text-[14px] font-semibold text-slate-900">{form.name || 'Student'}</div>
                  <div className="text-[12px] text-slate-500">{form.rollNumber || '-'}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="block text-[13px] text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-[13px] file:text-white hover:file:bg-slate-700"
                />
                {activeSection === 'Home' && (
                  <>
                    <button
                      type="button"
                      onClick={handleDeleteStudent}
                      disabled={deleting}
                      className="h-10 rounded-md border border-red-200 bg-white px-5 text-[13px] font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleting ? 'Deleting...' : 'Delete Student'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="h-10 rounded-md bg-[#3f51b5] px-5 text-[13px] font-semibold text-white hover:bg-[#3445a8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {(error || success) && (
              <div
                className={[
                  'mt-3 rounded-lg border px-4 py-3 text-[13px]',
                  error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                ].join(' ')}
              >
                {error || success}
              </div>
            )}
          </div>

          {activeSection === 'Attendance' ? (
            <AdminAttendanceEditor token={token} studentId={id} />
          ) : activeSection === 'Marks' ? (
            <AdminMarksEditor token={token} studentId={id} />
          ) : activeSection === 'Transcript' ? (
            <AdminTranscriptEditor token={token} studentId={id} student={form} />
          ) : activeSection === 'Fee Challan' ? (
            <AdminFeeChallanEditor token={token} studentId={id} />
          ) : activeSection === 'Fee Details' ? (
            <AdminFeeDetailsEditor token={token} studentId={id} />
          ) : (
            <>
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                  <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                </div>
                <div className="leading-tight">
                  <div className="text-[16px] font-semibold text-slate-900">{form.name || 'Student'}</div>
                  <div className="text-[13px] text-slate-500">{form.rollNumber || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <div className="mb-3 text-[15px] font-semibold text-slate-900">University Information</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Roll No</label>
                <input value={form.rollNumber} onChange={setField('rollNumber')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Section</label>
                <input value={form.section} onChange={setField('section')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Degree</label>
                <input value={form.degree} onChange={setField('degree')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Campus</label>
                <input value={form.campus} onChange={setField('campus')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Batch</label>
                <input value={form.batch} onChange={setField('batch')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Status</label>
                <input value={form.status} onChange={setField('status')} className={inputClass} />
              </div>
              <div className="lg:col-span-3">
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Reset Password (optional)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={setField('password')}
                  className={inputClass}
                  placeholder="Leave empty to keep current password"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <div className="mb-3 text-[15px] font-semibold text-slate-900">Personal Information</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Name</label>
                <input value={form.name} onChange={setField('name')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Gender</label>
                <input value={form.gender} onChange={setField('gender')} className={inputClass} />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Email</label>
                <input value={form.email} onChange={setField('email')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">DOB</label>
                <input value={form.dob} onChange={setField('dob')} className={inputClass} placeholder="1/3/2006" />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">CNIC</label>
                <input value={form.cnic} onChange={setField('cnic')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Mobile No</label>
                <input value={form.mobileNo} onChange={setField('mobileNo')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Blood Group</label>
                <input value={form.bloodGroup} onChange={setField('bloodGroup')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Nationality</label>
                <input value={form.nationality} onChange={setField('nationality')} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <div className="mb-3 text-[15px] font-semibold text-slate-900">Contact Information</div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-[13px] font-semibold text-slate-700">Permanent</div>
                <div className="grid grid-cols-1 gap-3">
                  <input value={form.permanentAddress.address} onChange={setNested('permanentAddress', 'address')} className={inputClass} placeholder="Address" />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input value={form.permanentAddress.homePhone} onChange={setNested('permanentAddress', 'homePhone')} className={inputClass} placeholder="Home Phone" />
                    <input value={form.permanentAddress.postalCode} onChange={setNested('permanentAddress', 'postalCode')} className={inputClass} placeholder="Postal Code" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input value={form.permanentAddress.city} onChange={setNested('permanentAddress', 'city')} className={inputClass} placeholder="City" />
                    <input value={form.permanentAddress.country} onChange={setNested('permanentAddress', 'country')} className={inputClass} placeholder="Country" />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-[13px] font-semibold text-slate-700">Current</div>
                <div className="grid grid-cols-1 gap-3">
                  <input value={form.currentAddress.address} onChange={setNested('currentAddress', 'address')} className={inputClass} placeholder="Address" />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input value={form.currentAddress.homePhone} onChange={setNested('currentAddress', 'homePhone')} className={inputClass} placeholder="Home Phone" />
                    <input value={form.currentAddress.postalCode} onChange={setNested('currentAddress', 'postalCode')} className={inputClass} placeholder="Postal Code" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input value={form.currentAddress.city} onChange={setNested('currentAddress', 'city')} className={inputClass} placeholder="City" />
                    <input value={form.currentAddress.country} onChange={setNested('currentAddress', 'country')} className={inputClass} placeholder="Country" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <div className="mb-3 text-[15px] font-semibold text-slate-900">Academic Calendar</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Registration</label>
                <input value={form.academicCalendar.registration} onChange={setCalendar('registration')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Online Feedback #1</label>
                <input value={form.academicCalendar.onlineFeedback1} onChange={setCalendar('onlineFeedback1')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Classes</label>
                <input value={form.academicCalendar.classes} onChange={setCalendar('classes')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Online Feedback #2</label>
                <input value={form.academicCalendar.onlineFeedback2} onChange={setCalendar('onlineFeedback2')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Online Withdraw request</label>
                <input value={form.academicCalendar.onlineWithdrawRequest} onChange={setCalendar('onlineWithdrawRequest')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Online Retake request</label>
                <input value={form.academicCalendar.onlineRetakeRequest} onChange={setCalendar('onlineRetakeRequest')} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[15px] font-semibold text-slate-900">Family Information</div>
              <button
                type="button"
                onClick={addFamilyRow}
                className="h-10 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-[12px] text-slate-500">
                    <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Relation</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Name</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-semibold">CNIC</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-semibold">For WithHolding Tax</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.familyInformation.map((row, idx) => (
                    <tr key={idx} className="text-[13px] text-slate-800">
                      <td className="border-b border-slate-100 py-3 pr-3">
                        <input value={row.relation} onChange={updateFamily(idx, 'relation')} className={inputClass} />
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-3">
                        <input value={row.name} onChange={updateFamily(idx, 'name')} className={inputClass} />
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-3">
                        <input value={row.cnic} onChange={updateFamily(idx, 'cnic')} className={inputClass} />
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-3">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!row.forWithHoldingTax}
                            onChange={updateFamily(idx, 'forWithHoldingTax')}
                          />
                          <span className="text-[13px] text-slate-700">Yes</span>
                        </label>
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-3">
                        <button
                          type="button"
                          onClick={removeFamilyRow(idx)}
                          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pb-6" />
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default AdminStudentDetail


