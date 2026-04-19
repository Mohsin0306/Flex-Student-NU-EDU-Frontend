import { useState } from 'react'
import { LuLogIn } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import loginBg from '../assets/bg-5.jpg'
import logo from '../assets/flex-logo-blue.png'
import { saveAuth } from '../utils/auth'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ rollNumber: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

  const normalizeRollNumber = (value) => {
    const cleaned = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!cleaned) return ''
    if (cleaned.length <= 3) return cleaned
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: name === 'rollNumber' ? normalizeRollNumber(value) : value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!formData.rollNumber.trim()) nextErrors.rollNumber = 'Field is required'
    if (!formData.password.trim()) nextErrors.password = 'Field is required'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    try {
      setIsSubmitting(true)
      setServerError('')

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.rollNumber,
          password: formData.password,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.message || 'Login failed')
      }

      saveAuth({ token: payload.token, user: payload.user })
      navigate(payload.dashboardRoute || '/', { replace: true })
    } catch (error) {
      setServerError(error.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-white font-['Inter','Segoe_UI',Roboto,Arial,sans-serif]">
      <section
        className="fixed inset-0 bg-cover bg-left-top lg:bg-right-center"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.34)]"></div>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[34vh] flex-col items-center justify-center px-4 text-center text-white lg:hidden">
          <h3 className="mb-2 text-[26px] font-semibold sm:text-[30px]">
            Welcome to Flex-Student
          </h3>
          <p className="m-0 text-[15px] leading-[1.35]">
            For Password related queries contact
          </p>
          <p className="m-0 text-[15px] leading-[1.35]">
            concerned Academic Officer on
          </p>
          <a
            href="https://nu.edu.pk"
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto mt-1 text-[15px] font-semibold text-purple-300 underline"
          >
            nu.edu.pk
          </a>
        </div>
      </section>

      <section className="pointer-events-none absolute inset-y-0 left-[calc(50%-35px)] right-0 z-20 hidden flex-col items-center justify-center px-6 text-center text-white lg:flex">
        <h3 className="mb-2 text-[58px] font-semibold">Welcome to Flex-Student</h3>
        <p className="m-0 text-[17px] leading-[1.35]">
          For Password related queries contact concerned Academic Officer on{' '}
          <a
            href="https://nu.edu.pk"
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto font-semibold text-purple-300 underline"
          >
            nu.edu.pk
          </a>
        </p>
      </section>

      <section className="pointer-events-none fixed inset-x-0 bottom-0 z-[25] h-[28vh] bg-white lg:hidden"></section>

      <section className="relative z-30 mt-[34vh] flex min-h-[calc(100vh-34vh+100px)] items-start justify-center bg-white px-0 pb-[100px] lg:mt-0 lg:min-h-screen lg:w-[calc(50%-35px)] lg:items-center lg:bg-transparent lg:pb-0">
        <div className="w-full max-w-none bg-white px-5 py-8 lg:max-w-none lg:min-h-screen lg:px-12 lg:py-10">
        <img
          src={logo}
          alt="Flex Academic Portal"
          className="mx-auto mt-8 mb-5 w-[260px] max-w-full lg:mt-0 lg:mb-6 lg:w-[300px]"
        />

        <form className="mx-auto max-w-[380px] px-3 lg:px-0" onSubmit={handleSubmit} noValidate>
          <h2 className="mt-1 mb-3 text-center text-[34px] font-semibold lg:mb-4 lg:text-[34px]">
            Sign In
          </h2>

          <label htmlFor="roll-number" className="mb-2 block text-[18px] lg:text-[17px]">
            Roll No.
          </label>
          <div className="relative mb-2">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9ba6ba]">
              <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] fill-current">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
              </svg>
            </span>
            <input
              id="roll-number"
              name="rollNumber"
              type="text"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="Roll Number i.e (17I-1234)"
              className="h-[44px] w-full rounded-[2px] border border-[#d6dce8] bg-[#f0f3fb] pr-3 pl-10 text-[15px] outline-none placeholder:text-[15px] lg:h-[42px] lg:text-[14px] lg:placeholder:text-[14px]"
            />
          </div>
          {errors.rollNumber && <p className="mb-[6px] text-[12px] text-red-600">{errors.rollNumber}</p>}
          <small className="mb-3 block text-[13px] text-[#7f7f7f] lg:mb-4 lg:text-[12px]">
            Roll Number i.e (17I-1254)
          </small>

          <label htmlFor="password" className="mb-2 block text-[18px] lg:text-[17px]">
            Password
          </label>
          <div className="relative mb-2">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9ba6ba]">
              <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] fill-current">
                <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4z" />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="password"
              className="h-[44px] w-full rounded-[2px] border border-[#d6dce8] bg-[#f0f3fb] pr-3 pl-10 text-[15px] outline-none placeholder:text-[15px] lg:h-[42px] lg:text-[14px] lg:placeholder:text-[14px]"
            />
          </div>
          {errors.password && <p className="mb-[6px] text-[12px] text-red-600">{errors.password}</p>}
          {serverError && <p className="mb-[6px] text-[12px] text-red-600">{serverError}</p>}

          <div className="mt-3 flex items-center justify-between">
            <label className="m-0 flex items-center gap-[7px] text-[15px] leading-none lg:text-[14px]">
              <input type="checkbox" className="m-0 h-4 w-4" />
              Remember me
            </label>
            <a href="/" className="text-[15px] leading-none text-[#263f79] no-underline lg:text-[14px]">
              Forget Password ?
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-7 flex h-[46px] w-[150px] cursor-pointer items-center justify-center gap-2 rounded-[24px] border-0 bg-[#5e6fdd] text-[18px] text-white lg:mt-5 lg:h-[42px] lg:w-[145px] lg:text-[16px]"
          >
            <LuLogIn className="h-[16px] w-[16px]" />
            <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>
        </div>
      </section>
    </main>
  )
}

export default LoginPage

