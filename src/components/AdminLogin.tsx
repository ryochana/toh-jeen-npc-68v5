'use client'

import { useState } from 'react'

interface AdminLoginProps {
  onLogin: (isAdmin: boolean) => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // รหัสผ่านแอดมิน (ในการใช้งานจริงควรเก็บในฐานข้อมูลและเข้ารหัส)
    const ADMIN_PASSWORD = 'admin2024'
    
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('isAdmin', 'true')
      onLogin(true)
      setError('')
    } else {
      setError('รหัสผ่านไม่ถูกต้อง')
    }
  }

  const handleGuestView = () => {
    localStorage.setItem('isAdmin', 'false')
    onLogin(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
    }}>
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ระบบจองโต๊ะงานแต่งงาน
          </h2>
          <p className="text-gray-600">เข้าสู่ระบบเพื่อจัดการ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              รหัสผ่านแอดมิน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="กรอกรหัสผ่าน"
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-bold"
          >
            🔐 เข้าสู่ระบบแอดมิน
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleGuestView}
            className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            👁️ เข้าดูแบบผู้เยี่ยมชม
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 แอดมิน: จัดการการจอง, เคลื่อนย้ายโต๊ะ</p>
          <p>👁️ ผู้เยี่ยมชม: ดูข้อมูลการจองเท่านั้น</p>
        </div>
      </div>
    </div>
  )
}
