import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clearAuth, getStoredUser, getToken } from '../utils/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://flex-student-nu-edu-backend-production.up.railway.app"

export default function StudentChallanPrintPage() {
  const navigate = useNavigate()
  const { challanId } = useParams()
  const token = getToken()
  const me = useMemo(() => getStoredUser(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const didAutoDownloadRef = useRef(false)

  const endpoint = useMemo(() => `${API_BASE}/api/fee-challan/${challanId}/pdf`, [challanId])

  useEffect(() => {
    if (!challanId || challanId === 'undefined') {
      setError('Invalid challan id')
      setLoading(false)
      return
    }
    if (!token || !me || me.role !== 'student') {
      clearAuth()
      navigate('/', { replace: true })
      return
    }
    let currentUrl = ''
    const loadPdf = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.message || 'Failed to load challan PDF')
        }
        const blob = await res.blob()
        currentUrl = URL.createObjectURL(blob)
        setPdfUrl(currentUrl)

        if (!didAutoDownloadRef.current) {
          const link = document.createElement('a')
          link.href = currentUrl
          link.download = `challan-${challanId}.pdf`
          document.body.appendChild(link)
          link.click()
          link.remove()
          didAutoDownloadRef.current = true
        }
      } catch (err) {
        setError(err.message || 'Failed to load challan PDF')
      } finally {
        setLoading(false)
      }
    }
    loadPdf()
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [token, navigate, endpoint, challanId, me])

  if (loading) return <main className="p-6">Opening PDF...</main>
  if (error) return <main className="p-6 text-red-600">{error}</main>

  return (
    <main className="min-h-screen bg-[#121212] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/student/dashboard?tab=Fee%20Challan')}
          className="rounded border border-slate-500 px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          Back
        </button>
        <a href={pdfUrl} download={`challan-${challanId}.pdf`} className="rounded bg-[#3f51b5] px-3 py-1.5 text-[12px] font-semibold text-white">
          Download PDF
        </a>
      </div>
      <div className="h-[calc(100vh-56px)] w-full overflow-hidden rounded border border-slate-700 bg-white">
        <iframe title="Challan PDF" src={pdfUrl} className="h-full w-full" />
      </div>
    </main>
  )
}


