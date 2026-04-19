import { useEffect, useRef, useState } from 'react'
import { FaClipboardList, FaFileAlt, FaHome } from 'react-icons/fa'
import { FiLock, FiMoreVertical, FiPower, FiUser, FiUsers, FiX } from 'react-icons/fi'
import { HiOutlineClipboardDocumentCheck } from 'react-icons/hi2'
import { PiAddressBookBold, PiExam } from 'react-icons/pi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clearAuth, getStoredUser, getToken } from '../utils/auth'
import StudentAttendance from '../components/StudentAttendance'
import StudentFeeChallan from '../components/StudentFeeChallan'
import StudentFeeDetails from '../components/StudentFeeDetails'
import StudentMarks from '../components/StudentMarks'
import StudentTranscript from '../components/StudentTranscript'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

function StudentDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [familyInfoRows, setFamilyInfoRows] = useState([])
  const [familySaving, setFamilySaving] = useState(false)
  const [familyError, setFamilyError] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false)
  const [activePage, setActivePage] = useState('Home')
  const profileMenuRef = useRef(null)
  const mobileProfileMenuRef = useRef(null)

  useEffect(() => {
    const token = getToken()
    const user = getStoredUser()

    if (!token || !user || user.role !== 'student') {
      clearAuth()
      navigate('/', { replace: true })
      return
    }

    const loadDashboard = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || 'Failed to load student dashboard')
        setData(payload)
      } catch (err) {
        setError(err.message || 'Failed to load student dashboard')
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

  useEffect(() => {
    const closeMobileMenuOnOutsideClick = (event) => {
      if (mobileProfileMenuRef.current && !mobileProfileMenuRef.current.contains(event.target)) {
        setIsMobileProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeMobileMenuOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeMobileMenuOnOutsideClick)
  }, [])

  const user = data?.user || {}
  const calendar = user.academicCalendar || {}
  const permanent = user.permanentAddress || {}
  const current = user.currentAddress || {}
  const familyInformation = Array.isArray(user.familyInformation) ? user.familyInformation : []
  const profileImage =
    user.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Student')}&background=2f5f89&color=fff`

  const sideMenu = [
    { icon: FaHome, label: 'Home' },
    { icon: FaClipboardList, label: 'Course Registration' },
    { icon: HiOutlineClipboardDocumentCheck, label: 'Attendance' },
    { icon: PiExam, label: 'Marks' },
    { icon: FaFileAlt, label: 'Print Admit Card' },
    { icon: FaClipboardList, label: 'Marks PLO Report' },
    { icon: FaFileAlt, label: 'Transcript' },
    { icon: FaClipboardList, label: 'Fee Challan' },
    { icon: FaClipboardList, label: 'Fee Details' },
    { icon: FaFileAlt, label: 'Course Feedback' },
    { icon: FaFileAlt, label: 'Retake Exam Request' },
    { icon: FaFileAlt, label: 'Course Withdraw' },
    { icon: FaFileAlt, label: 'Grade Change Request' },
    { icon: FaClipboardList, label: 'Tentative Study Plan' },
  ]

  const sectionTitle =
    'mb-0 bg-[#3f51b5] px-5 py-3 text-[15px] font-semibold text-white'

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (!tabFromUrl) return
    const exists = sideMenu.some((item) => item.label === tabFromUrl)
    if (exists && tabFromUrl !== activePage) {
      setActivePage(tabFromUrl)
    }
  }, [searchParams, activePage, sideMenu])

  const handlePageChange = (label, closeMobile = false) => {
    setActivePage(label)
    const next = new URLSearchParams(searchParams)
    if (label === 'Home') next.delete('tab')
    else next.set('tab', label)
    setSearchParams(next)
    if (closeMobile) setIsMobileSidebarOpen(false)
  }

  useEffect(() => {
    if (familyInformation.length) {
      setFamilyInfoRows(familyInformation)
    } else {
      setFamilyInfoRows([
        {
          relation: '',
          name: '',
          cnic: '',
          forWithHoldingTax: false,
        },
      ])
    }
  }, [data?.user?.familyInformation])

  const saveFamilyInformation = async (nextRows) => {
    try {
      const token = getToken()
      if (!token) return
      setFamilySaving(true)
      setFamilyError('')

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ familyInformation: nextRows }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'Failed to save family information')

      setData((prev) => ({
        ...prev,
        user: {
          ...(prev?.user || {}),
          familyInformation: payload.user?.familyInformation || nextRows,
        },
      }))
    } catch (err) {
      setFamilyError(err.message || 'Failed to save family information')
    } finally {
      setFamilySaving(false)
    }
  }

  const handleFamilyTaxToggle = (index) => async (event) => {
    const checked = event.target.checked
    const nextRows = familyInfoRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, forWithHoldingTax: checked } : row
    )
    setFamilyInfoRows(nextRows)
    await saveFamilyInformation(nextRows)
  }

  if (loading) return <main className="p-6">Loading student dashboard...</main>

  return (
    <main className="min-h-screen bg-[#edf0f5] pt-[104px] text-[#1f2937] md:pt-[72px]">
      <header className="fixed inset-x-0 top-0 z-30 bg-[#2f5f89] text-white md:hidden">
        <div className="flex min-h-[64px] items-center justify-between px-5">
          <img src="/src/assets/favicon.ico" alt="Portal icon" className="h-6 w-6 object-contain" />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-10 w-12 flex-col items-center justify-center gap-1 bg-[#3f6b91]"
              aria-label="Open menu"
            >
              <span className="h-[2px] w-6 bg-[#d5dbe2]"></span>
              <span className="h-[2px] w-6 bg-[#d5dbe2]"></span>
              <span className="h-[2px] w-6 bg-[#d5dbe2]"></span>
            </button>
            <button type="button" className="text-[24px] text-white" aria-label="More options">
              <FiMoreVertical />
            </button>
          </div>
        </div>
        <div className="relative flex min-h-[40px] items-center justify-center bg-[#f3f4f7] px-4 text-[#5b6473]">
          <p className="text-[13px] font-medium">{activePage}</p>
          <div className="absolute right-4" ref={mobileProfileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileProfileMenuOpen((prev) => !prev)}
              className="h-10 w-10 overflow-hidden rounded-full border border-slate-300"
              aria-label="Open profile menu"
            >
              <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
            </button>

            {isMobileProfileMenuOpen && (
              <div className="absolute top-12 right-0 w-[220px] rounded-sm bg-[#f5f5f5] p-4 text-[#7b7e86] shadow-lg">
                <button type="button" className="mb-4 flex w-full items-center gap-3 text-left text-[15px]">
                  <FiUser className="text-[22px] text-[#b5b8c0]" />
                  <span>My Profile</span>
                </button>
                <button type="button" className="mb-6 flex w-full items-center gap-3 text-left text-[15px]">
                  <FiLock className="text-[22px] text-[#b5b8c0]" />
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mx-auto flex w-[150px] items-center justify-center gap-2 rounded-full bg-[#4f5fd2] px-4 py-3 text-[16px] text-white"
                >
                  <FiPower className="text-[18px]" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <header className="fixed inset-x-0 top-0 z-30 hidden min-h-[72px] items-center justify-between bg-[#2f5f89] px-4 py-2 text-white md:flex md:px-6">
        <div className="flex items-start gap-5 lg:gap-[400px]">
          <img src="/src/assets/favicon.ico" alt="Portal icon" className="h-6 w-6 object-contain" />
          <div className="leading-tight">
            <p className="mt-2 text-[18px] font-medium leading-none">Student Profile</p>
            <p className="mt-1.5 text-center text-[12px] text-[#d4d8df]">{activePage}</p>
          </div>
        </div>
        <div className="relative flex items-center gap-3 text-xs" ref={profileMenuRef}>
          <span>
            <span className="text-[14px] font-semibold text-[#ffd166]">Hello Mr, </span>
            <span className="text-[14px] font-semibold text-white">{user.name || 'Student'}</span>
          </span>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="h-10 w-10 overflow-hidden rounded-full border border-white/50 bg-white/20"
          >
            <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute top-12 right-0 w-[240px] rounded-sm bg-[#f5f5f5] p-4 text-[#7b7e86] shadow-lg">
              <button type="button" className="mb-4 flex w-full items-center gap-3 text-left text-[15px]">
                <FiUser className="text-[22px] text-[#b5b8c0]" />
                <span>My Profile</span>
              </button>
              <button type="button" className="mb-6 flex w-full items-center gap-3 text-left text-[15px]">
                <FiLock className="text-[22px] text-[#b5b8c0]" />
                <span>Change Password</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="mx-auto flex w-[160px] items-center justify-center gap-2 rounded-full bg-[#4f5fd2] px-4 py-3 text-[18px] text-white"
              >
                <FiPower className="text-[20px]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1f2c37] text-white transition-transform duration-300 md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-semibold">Menu</span>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="text-[22px]"
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>
        <nav className="desktop-sidebar-scroll h-[calc(100vh-54px)] space-y-2 overflow-y-auto p-3">
          {sideMenu.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                handlePageChange(item.label, true)
              }}
              className={`flex w-full items-center gap-3 rounded px-3 py-3 text-left text-[14px] ${
                activePage === item.label
                  ? item.label === 'Marks'
                    ? 'bg-[#2d3d4b] text-amber-400'
                    : 'bg-[#2d3d4b]'
                  : 'hover:bg-[#2d3d4b]'
              }`}
            >
              <item.icon className="text-xl" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}

      {error ? (
        <div className="p-4 text-red-600">{error}</div>
      ) : (
        <div className="flex md:h-[calc(100vh-78px)] md:overflow-hidden">
          <aside className="hidden min-h-[calc(100vh-78px)] w-48 bg-[#1f2c37] text-white md:block">
            <nav className="desktop-sidebar-scroll h-[calc(100vh-78px)] space-y-2 overflow-y-auto p-3">
              {sideMenu.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => handlePageChange(item.label)}
                  className={`flex w-full flex-col items-center gap-2 rounded px-2 py-4 text-[14px] leading-tight transition-colors ${
                    activePage === item.label
                      ? item.label === 'Marks'
                        ? 'bg-[#2d3d4b] text-amber-400'
                        : 'bg-[#2d3d4b]'
                      : 'hover:bg-[#2d3d4b]'
                  }`}
                >
                  <item.icon className="text-3xl" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <section className="w-full p-3 md:h-[calc(100vh-78px)] md:overflow-y-auto md:p-5">
            {activePage === 'Attendance' ? (
              <StudentAttendance token={getToken()} />
            ) : activePage === 'Marks' ? (
              <StudentMarks token={getToken()} />
            ) : activePage === 'Transcript' ? (
              <StudentTranscript token={getToken()} user={user} />
            ) : activePage === 'Fee Challan' ? (
              <StudentFeeChallan token={getToken()} />
            ) : activePage === 'Fee Details' ? (
              <StudentFeeDetails token={getToken()} />
            ) : (
              <div className="space-y-4 rounded border border-[#d3d9e4] bg-white p-3 md:p-5">
              <section className="border border-[#cfd6e4]">
                <h3 className={sectionTitle}>University Information</h3>
                <div className="grid gap-2 p-4 text-sm md:grid-cols-3">
                  <p>
                    <strong>Roll No:</strong> {user.rollNumber || ''}
                  </p>
                  <p>
                    <strong>Degree:</strong> {user.degree || ''}
                  </p>
                  <p>
                    <strong>Batch:</strong> {user.batch || ''}
                  </p>
                  <p>
                    <strong>Section:</strong> {user.section || ''}
                  </p>
                  <p>
                    <strong>Campus:</strong> {user.campus || ''}
                  </p>
                  <p>
                    <strong>Status:</strong> {user.status || 'Current'}
                  </p>
                </div>
              </section>

              <section className="border border-[#cfd6e4]">
                <h3 className={sectionTitle}>Academic Calendar</h3>
                <div className="grid gap-2 p-4 text-sm md:grid-cols-3">
                  <p>
                    <strong>Registration:</strong> {calendar.registration || ''}
                  </p>
                  <p>
                    <strong>Classes:</strong> {calendar.classes || ''}
                  </p>
                  <p>
                    <strong>Online Withdraw request:</strong> {calendar.onlineWithdrawRequest || ''}
                  </p>
                  <p>
                    <strong>Online Feedback #1:</strong> {calendar.onlineFeedback1 || ''}
                  </p>
                  <p>
                    <strong>Online Feedback #2:</strong> {calendar.onlineFeedback2 || ''}
                  </p>
                  <p>
                    <strong>Online Retake request:</strong> {calendar.onlineRetakeRequest || ''}
                  </p>
                </div>
              </section>

              <section className="border border-[#cfd6e4]">
                <h3 className={sectionTitle}>Personal Information</h3>
                <div className="grid gap-2 p-4 text-sm md:grid-cols-3">
                  <p>
                    <strong>Name:</strong> {user.name || ''}
                  </p>
                  <p>
                    <strong>DOB:</strong> {user.dob || ''}
                  </p>
                  <p>
                    <strong>Blood Group:</strong> {user.bloodGroup || ''}
                  </p>
                  <p>
                    <strong>Gender:</strong> {user.gender || ''}
                  </p>
                  <p>
                    <strong>CNIC:</strong> {user.cnic || ''}
                  </p>
                  <p>
                    <strong>Nationality:</strong> {user.nationality || ''}
                  </p>
                  <p className="md:col-span-3">
                    <strong>Email:</strong> {user.email || ''}
                  </p>
                  <p className="md:col-span-3">
                    <strong>Mobile No:</strong> {user.mobileNo || ''}
                  </p>
                </div>
              </section>

              <section className="border border-[#cfd6e4]">
                <h3 className={sectionTitle}>
                  <span className="inline-flex items-center gap-2">
                    <PiAddressBookBold /> Contact Information
                  </span>
                </h3>
                <div className="grid gap-4 p-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[15px] font-semibold">Permanent:</p>
                    <p>
                      <strong>Address:</strong> {permanent.address || ''}
                    </p>
                    <p>
                      <strong>Home Phone:</strong> {permanent.homePhone || ''}
                    </p>
                    <p>
                      <strong>Postal Code:</strong> {permanent.postalCode || ''}
                    </p>
                    <p>
                      <strong>City:</strong> {permanent.city || ''}
                    </p>
                    <p>
                      <strong>Country:</strong> {permanent.country || ''}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-[15px] font-semibold">Current:</p>
                    <p>
                      <strong>Address:</strong> {current.address || ''}
                    </p>
                    <p>
                      <strong>Home Phone:</strong> {current.homePhone || ''}
                    </p>
                    <p>
                      <strong>Postal Code:</strong> {current.postalCode || ''}
                    </p>
                    <p>
                      <strong>City:</strong> {current.city || ''}
                    </p>
                    <p>
                      <strong>Country:</strong> {current.country || ''}
                    </p>
                  </div>
                </div>
              </section>

              <section className="border border-[#cfd6e4]">
                <h3 className={sectionTitle}>
                  <span className="inline-flex items-center gap-2">
                    <FiUsers /> Family Information
                  </span>
                </h3>
                <div className="p-4">
                  {familyError && <p className="mb-2 text-sm text-red-600">{familyError}</p>}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="bg-[#d7d9e6]">
                          <th className="px-3 py-2 font-semibold">Relation</th>
                          <th className="px-3 py-2 font-semibold">Name</th>
                          <th className="px-3 py-2 font-semibold">CNIC</th>
                          <th className="px-3 py-2 font-semibold">For WithHolding Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {familyInfoRows.map((member, index) => (
                          <tr key={`${member.relation || 'member'}-${index}`} className="border-b border-[#ececf3]">
                            <td className="px-3 py-2">{member.relation || ''}</td>
                            <td className="px-3 py-2">{member.name || ''}</td>
                            <td className="px-3 py-2">{member.cnic || ''}</td>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={Boolean(member.forWithHoldingTax)}
                                disabled={familySaving}
                                onChange={handleFamilyTaxToggle(index)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default StudentDashboard

