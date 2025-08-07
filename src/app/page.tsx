'use client'

import { useState, useEffect } from 'react'
import { type TableBooking } from '@/lib/supabase'
import { fetchSheetData, convertToTableBookings, type SheetBooking } from '@/lib/googleSheets'
import AdminLogin from '@/components/AdminLogin'
import DraggableTable from '@/components/DraggableTable'

interface TableInfo {
  table_number: number
  zone: 'inside' | 'outside'
  position: { x: number; y: number }
  is_booked: boolean
  booking?: TableBooking
}

export default function TableBookingPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [bookings, setBookings] = useState<TableBooking[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDragMode, setIsDragMode] = useState(false)
  const [sheetData, setSheetData] = useState<SheetBooking[]>([])
  const [sortBy, setSortBy] = useState<'table_number' | 'booking_date' | 'payment_date' | 'payment_status'>('payment_status')

  const initializeTables = (): TableInfo[] => {
    const tableData: TableInfo[] = []
    
    // กำหนดตำแหน่งเริ่มต้นของโต๊ะแต่ละโต๊ะ
    const getInitialPosition = (tableNum: number) => {
      if (tableNum <= 27) {
        // โซนซ้าย (1-27) - 3 คอลัมน์ 9 แถว
        const row = Math.floor((tableNum - 1) / 3)
        const col = (tableNum - 1) % 3
        return { x: col * 80 + 20, y: row * 70 + 100 }
      } else if (tableNum <= 41) {
        // โซนกลาง (28-41) - 2 คอลัมน์ 7 แถว
        const adjustedNum = tableNum - 28
        const row = Math.floor(adjustedNum / 2)
        const col = adjustedNum % 2
        return { x: col * 80 + 300, y: row * 70 + 150 }
      } else {
        // โซนขวา (42-62) - 3 คอลัมน์ 7 แถว
        const adjustedNum = tableNum - 42
        const row = Math.floor(adjustedNum / 3)
        const col = adjustedNum % 3
        return { x: col * 80 + 500, y: row * 70 + 100 }
      }
    }
    
    for (let i = 1; i <= 41; i++) {
      tableData.push({
        table_number: i,
        zone: 'inside',
        position: getInitialPosition(i),
        is_booked: false
      })
    }
    
    for (let i = 42; i <= 65; i++) {
      tableData.push({
        table_number: i,
        zone: 'outside',
        position: getInitialPosition(i),
        is_booked: false
      })
    }
    
    return tableData
  }

  const loadBookings = async () => {
    try {
      console.log('Loading bookings from Google Sheets...')
      const sheetData = await fetchSheetData()
      
      console.log(`Loaded ${sheetData.length} sheet entries:`, sheetData)
      setSheetData(sheetData) // เก็บข้อมูล Sheet ต้นฉบับไว้แสดงผล
      
      // แปลงข้อมูลจาก Sheet เป็น format ที่ใช้ในแอป
      // เนื่องจาก 1 entry อาจมีหลายโต๊ะ จึงต้อง flatten
      const convertedBookings = sheetData.flatMap(convertToTableBookings)
      setBookings(convertedBookings)
      
      const updatedTables = initializeTables().map(table => {
        const booking = convertedBookings.find(b => b.table_number === table.table_number)
        return {
          ...table,
          is_booked: !!booking,
          booking
        }
      })
      
      setTables(updatedTables)
      console.log('Tables updated successfully')
    } catch (error) {
      console.error('Error loading bookings from Google Sheets:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูลจาก Google Sheets: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleTableClick = (tableNumber: number) => {
    if (!isAdmin) {
      // ผู้เยี่ยมชมดูข้อมูลได้อย่างเดียว
      const table = tables.find(t => t.table_number === tableNumber)
      if (table?.is_booked) {
        alert(`โต๊ะ ${tableNumber}\nผู้จอง: ${table.booking?.guest_name}\nสถานะ: ${table.booking?.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองแล้ว'}`)
      } else {
        alert(`โต๊ะ ${tableNumber} ยังว่างอยู่`)
      }
      return
    }
    
    // แอดมินสามารถแก้ไขได้
    setSelectedTable(tableNumber)
    setShowBookingForm(true)
  }

  const handlePositionChange = (tableNumber: number, newPosition: { x: number; y: number }) => {
    if (!isAdmin) return
    
    setTables(prevTables => 
      prevTables.map(table => 
        table.table_number === tableNumber 
          ? { ...table, position: newPosition }
          : table
      )
    )
  }

  const handleLogin = (adminStatus: boolean) => {
    setIsAdmin(adminStatus)
    setIsLoggedIn(true)
    // บันทึกสถานะแอดมินใน localStorage
    localStorage.setItem('isAdmin', adminStatus.toString())
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    setIsAdmin(false)
    setIsLoggedIn(true) // กลับไปเป็นผู้เยี่ยมชม ไม่ต้องกลับไปหน้า login
  }

  const showAdminLogin = () => {
    setIsLoggedIn(false) // แสดงหน้า login
  }

  const resetTablePositions = () => {
    if (!isAdmin) return
    
    if (confirm('ต้องการรีเซ็ตตำแหน่งโต๊ะทั้งหมดหรือไม่?')) {
      const resetTables = initializeTables().map(initTable => {
        const existingTable = tables.find(t => t.table_number === initTable.table_number)
        return {
          ...initTable,
          is_booked: existingTable?.is_booked || false,
          booking: existingTable?.booking
        }
      })
      setTables(resetTables)
    }
  }
  const handleBooking = async (bookingData: Omit<TableBooking, 'id' | 'created_at'>) => {
    if (!isAdmin) {
      alert('ไม่มีสิทธิ์ในการจองโต๊ะ')
      return
    }
    
    // แสดงข้อความแจ้งเตือนให้ผู้ใช้ไปแก้ไขใน Google Sheets
    const sheetUrl = `https://docs.google.com/spreadsheets/d/1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40/edit`
    
    const confirmMessage = `
กรุณาไปแก้ไขข้อมูลใน Google Sheets โดยตรง:

โต๊ะ: ${bookingData.table_number}
ชื่อ: ${bookingData.guest_name}
เบอร์: ${bookingData.phone_number}
จำนวนคน: ${bookingData.party_size}
สถานะ: ${bookingData.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองแล้ว'}

คลิก OK เพื่อเปิด Google Sheets ในแท็บใหม่
    `.trim()
    
    if (confirm(confirmMessage)) {
      window.open(sheetUrl, '_blank')
      
      // รีเฟรชข้อมูลหลังจาก 3 วินาที
      setTimeout(() => {
        loadBookings()
      }, 3000)
    }
    
    setShowBookingForm(false)
    setSelectedTable(null)
  }

  const handleCancelBooking = async (tableNumber: number) => {
    if (!isAdmin) {
      alert('ไม่มีสิทธิ์ในการยกเลิกการจอง')
      return
    }
    
    const sheetUrl = `https://docs.google.com/spreadsheets/d/1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40/edit`
    
    const confirmMessage = `
กรุณาไปลบข้อมูลโต๊ะ ${tableNumber} ใน Google Sheets โดยตรง

คลิก OK เพื่อเปิด Google Sheets ในแท็บใหม่
    `.trim()
    
    if (confirm(confirmMessage)) {
      window.open(sheetUrl, '_blank')
      
      // รีเฟรชข้อมูลหลังจาก 3 วินาที
      setTimeout(() => {
        loadBookings()
      }, 3000)
    }
  }

  const exportToExcel = async () => {
    try {
      // รีเฟรชข้อมูลก่อน export
      await loadBookings()
      
      // ใช้ข้อมูลจาก state โดยตรง
      const exportData = bookings.map(booking => ({
        'หมายเลขโต๊ะ': booking.table_number,
        'ชื่อผู้จอง': booking.guest_name,
        'เบอร์โทรศัพท์': booking.phone_number,
        'จำนวนคน': booking.party_size,
        'วันที่จอง': booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH') + ' ' + new Date(booking.booking_date).toLocaleTimeString('th-TH') : '-',
        'เวลาจ่ายเงิน': booking.payment_date ? new Date(booking.payment_date).toLocaleDateString('th-TH') + ' ' + new Date(booking.payment_date).toLocaleTimeString('th-TH') : '-',
        'โซน': booking.zone === 'inside' ? 'ด้านในหอประชุม' : 'ด้านนอกหอประชุม',
        'สถานะการชำระ': booking.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองเฉยๆ',
        'หมายเหตุ': booking.notes || '-'
      }))
      
      // สร้างไฟล์ CSV
      const csvContent = "data:text/csv;charset=utf-8," 
        + Object.keys(exportData[0] || {}).join(',') + '\n'
        + exportData.map(row => Object.values(row).join(',')).join('\n')
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      
      const now = new Date()
      const timeString = `${now.toLocaleDateString('th-TH').replace(/\//g, '-')}_${now.toLocaleTimeString('th-TH').replace(/:/g, '-')}`
      link.setAttribute("download", `รายการจองโต๊ะ_${timeString}.csv`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert(`Export สำเร็จ! ข้อมูล ${bookings.length} รายการ`)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('เกิดข้อผิดพลาดในการ export ข้อมูล')
    }
  }

  useEffect(() => {
    // เริ่มต้นให้แสดงแบบผู้เยี่ยมชมเสมอ
    setIsLoggedIn(true)
    setIsAdmin(false)
    
    // ตรวจสอบสถานะแอดมินจาก localStorage หลังจาก component โหลดเสร็จ
    const checkAdminStatus = () => {
      const savedAdminStatus = localStorage.getItem('isAdmin')
      if (savedAdminStatus === 'true') {
        setIsAdmin(true)
      }
    }
    
    // ใช้ setTimeout เพื่อให้ UI แสดงแบบผู้เยี่ยมชมก่อน
    setTimeout(checkAdminStatus, 100)
    
    loadBookings()
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing data...')
      loadBookings()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-900">
        <div className="text-xl text-white text-center">
          <div>กำลังโหลดข้อมูลจาก Google Sheets...</div>
          <div className="text-sm mt-2 text-gray-300">
            ✅ ใช้วิธี CSV Export ไม่ต้อง API Key
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
        {/* Extra sparkling stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* String Lights */}
      <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-center overflow-hidden">
        <div className="flex space-x-8">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-white animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                backgroundColor: i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#ffd700' : '#ff69b4'
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 p-2 sm:p-4">
        {/* Hidden Admin Access Button */}
        {!isAdmin && (
          <button
            onClick={showAdminLogin}
            className="fixed top-4 left-4 w-8 h-8 bg-gray-800 bg-opacity-50 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-all duration-200 text-xs z-50"
            title="เข้าสู่ระบบแอดมิน"
          >
            🔐
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-4 sm:mb-8 mt-8 sm:mt-16">
          <div className="flex flex-col sm:flex-row justify-center items-center mb-2 sm:mb-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="text-pink-300 text-lg sm:text-2xl mr-2">รวม❤️</div>
              <div className="text-pink-400 text-2xl sm:text-4xl font-bold">ศิษย์เก่า</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center mb-2 sm:mb-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="text-blue-300 text-lg sm:text-2xl mr-2">คืนสู่เหย้า</div>
              <div className="text-yellow-400 text-2xl sm:text-4xl font-bold">ชาวเหลืองฟ้า</div>
            </div>
            <div className="bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:ml-4 transform -rotate-12">
              <div className="text-xs sm:text-sm">โต๊ะจีน</div>
              <div className="text-sm sm:text-lg font-bold">โต๊ะละ 2,000 บาท</div>
            </div>
          </div>
          <div className="text-yellow-300 text-sm sm:text-lg mb-2 sm:mb-4 px-2">
            และร่วมพิธีมุฑิตาจิตคุณครูรุ่งนภา เชิงกลาง เนื่องในโอกาสเกษียณอายุราชการ
          </div>

          {/* Stage */}
          <div className="mb-4 sm:mb-8">
            <div className="w-48 sm:w-96 h-8 sm:h-16 bg-gradient-to-r from-yellow-600 to-yellow-800 mx-auto rounded-lg shadow-lg relative">
              <div className="w-full h-full bg-gradient-to-b from-yellow-400 to-yellow-700 rounded-lg border-2 sm:border-4 border-yellow-500 flex items-center justify-center">
                <div className="text-yellow-900 font-bold text-xs sm:text-lg">🎭 เวที 🎭</div>
              </div>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex justify-center space-x-2 sm:space-x-4 mb-4">
              <button
                onClick={() => setIsDragMode(!isDragMode)}
                className={`px-3 sm:px-6 py-1 sm:py-2 rounded-lg transition-colors font-bold text-sm sm:text-base ${
                  isDragMode 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isDragMode ? '🔒 ปิดการลาก' : '🔓 เปิดการลาก'} โต๊ะ
              </button>
              <button
                onClick={resetTablePositions}
                className="bg-red-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-red-700 transition-colors font-bold text-sm sm:text-base"
              >
                🔄 รีเซ็ตตำแหน่ง
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-2 sm:space-x-4 mb-4 sm:mb-8">
            {isAdmin && (
              <>
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-green-700 transition-colors font-bold text-sm sm:text-base"
                >
                  📊 Export CSV
                </button>
                <button
                  onClick={() => window.open('https://docs.google.com/spreadsheets/d/1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40/edit', '_blank')}
                  className="bg-purple-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-purple-700 transition-colors font-bold text-sm sm:text-base"
                >
                  📝 แก้ไข Google Sheets
                </button>
              </>
            )}
            <button
              onClick={loadBookings}
              className="bg-blue-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm sm:text-base"
            >
              🔄 รีเฟรช
            </button>
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-red-700 transition-colors font-bold text-sm sm:text-base"
              >
                🚪 ออกจากระบบ
              </button>
            ) : (
              <button
                onClick={showAdminLogin}
                className="bg-purple-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-purple-700 transition-colors font-bold text-sm sm:text-base"
              >
                👑 เข้าสู่ระบบแอดมิน
              </button>
            )}
          </div>

          {/* User Status */}
          <div className="text-center mb-4">
            <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${
              isAdmin 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-white'
            }`}>
              {isAdmin ? '👑 แอดมิน' : '👁️ ผู้เยี่ยมชม'} - 
              {isAdmin ? ' สามารถจัดการทุกอย่างได้' : ' ดูข้อมูลอย่างเดียว'}
            </span>
          </div>
        </div>

        {/* Table Layout - Draggable System */}
        <div className="max-w-7xl mx-auto px-2 sm:px-2">
          <div className="relative bg-gray-900 bg-opacity-30 rounded-lg p-4 min-h-96" style={{ minHeight: '600px' }}>
            {/* Grid Background (optional visual guide) */}
            {isAdmin && isDragMode && (
              <div className="absolute inset-0 opacity-20 pointer-events-none" 
                   style={{
                     backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                   }}
              />
            )}
            
            {/* Zone Labels */}
            <div className="absolute top-2 left-4 text-purple-300 font-bold text-xs sm:text-sm">
              โซนด้านใน
            </div>
            <div className="absolute top-2 right-4 text-orange-300 font-bold text-xs sm:text-sm">
              โซนด้านนอก
            </div>
            
            {/* Stage */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className="w-32 sm:w-48 h-6 sm:h-8 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-lg shadow-lg relative">
                <div className="w-full h-full bg-gradient-to-b from-yellow-400 to-yellow-700 rounded-lg border border-yellow-500 flex items-center justify-center">
                  <div className="text-yellow-900 font-bold text-xs">🎭 เวที 🎭</div>
                </div>
              </div>
            </div>

            {/* Draggable Tables */}
            {tables.map((table) => (
              <DraggableTable
                key={table.table_number}
                tableNumber={table.table_number}
                table={table}
                isAdmin={isAdmin && isDragMode}
                onTableClick={handleTableClick}
                position={table.position}
                onPositionChange={handlePositionChange}
              />
            ))}
            
            {/* Instructions */}
            <div className="absolute bottom-2 left-2 text-xs text-gray-400">
              {isAdmin 
                ? isDragMode 
                  ? '🖱️ ลากโต๊ะเพื่อย้าย คลิกเพื่อจอง'
                  : '🔒 โหมดล็อก - คลิกโต๊ะเพื่อจอง'
                : '👁️ คลิกโต๊ะเพื่อดูข้อมูล'
              }
            </div>
          </div>
        </div>

        {/* Fireworks */}
        <div className="absolute bottom-20 right-20">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${i * 20}px`,
                bottom: `${i * 15}px`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Decorative Flags */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="flex justify-center space-x-2">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="w-6 h-8 clip-path-triangle"
                style={{
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd93d'][i % 5]
                }}
              />
            ))}
          </div>
        </div>

        {/* Backdrop Label */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="bg-red-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-lg sm:text-xl font-bold transform -rotate-3 shadow-lg">
            Backdrop
          </div>
        </div>

        {/* Google Sheets Data */}
        <div className="mt-8 sm:mt-16 mb-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-yellow-300 text-xl sm:text-2xl font-bold">
                📝 ข้อมูลจาก Google Sheets ({sheetData.length} รายการ)
              </h2>
              
              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <span className="text-yellow-300 text-sm">เรียงตาม:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'table_number' | 'booking_date' | 'payment_date' | 'payment_status')}
                  className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="payment_status">สถานะการจ่าย</option>
                  <option value="table_number">หมายเลขโต๊ะ</option>
                  <option value="payment_date">เวลาจ่ายเงิน</option>
                </select>
              </div>
            </div>
            
            {sheetData.length === 0 ? (
              <div className="text-center text-gray-300 py-8">
                ยังไม่มีข้อมูลจาก Google Sheets
              </div>
            ) : (
              <div className="bg-white bg-opacity-90 rounded-lg shadow-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          ชื่อ-สกุล
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          หมายเลขโต๊ะ
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          การชำระเงิน
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                          ผู้รับเงิน
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                          เวลาจ่าย
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                          เบอร์
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sheetData
                        .filter(entry => entry.guestName) // แสดงเฉพาะที่มีชื่อ
                        .sort((a, b) => {
                          if (sortBy === 'payment_status') {
                            // จ่ายแล้วขึ้นก่อน
                            const aStatus = a.paymentStatus.includes('จ่าย')
                            const bStatus = b.paymentStatus.includes('จ่าย')
                            if (aStatus !== bStatus) return bStatus ? 1 : -1
                            return a.orderNumber - b.orderNumber
                          } else if (sortBy === 'payment_date') {
                            if (a.paymentDate && b.paymentDate) {
                              return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
                            }
                            return a.paymentDate ? -1 : b.paymentDate ? 1 : 0
                          } else {
                            // เรียงตามหมายเลขโต๊ะแรก
                            const aFirstTable = parseInt(a.tableNumbers.split(',')[0] || '999')
                            const bFirstTable = parseInt(b.tableNumbers.split(',')[0] || '999')
                            return aFirstTable - bFirstTable
                          }
                        })
                        .map((entry, index) => (
                          <tr 
                            key={entry.orderNumber}
                            className={`
                              hover:bg-gray-50 transition-colors
                              ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            `}
                          >
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.guestName}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="text-sm text-gray-900 font-bold text-blue-600">
                                {entry.tableNumbers || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <span className={`
                                inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                ${entry.paymentStatus.includes('จ่าย')
                                  ? 'bg-green-100 text-green-800' 
                                  : entry.paymentStatus
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              `}>
                                {entry.paymentStatus || 'ยังไม่กรอก'}
                              </span>
                            </td>
                            <td className="px-3 py-2 hidden sm:table-cell">
                              <div className="text-sm text-gray-500">
                                {entry.receiver || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2 hidden md:table-cell">
                              <div className="text-xs text-gray-500">
                                {entry.paymentDate || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2 hidden lg:table-cell">
                              <div className="text-sm text-gray-500">
                                {entry.phoneNumber || '-'}
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                
                {/* Summary */}
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">
                      รวม {sheetData.length} รายการ
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-orange-600 font-medium">
                        ยังไม่จ่าย: {sheetData.filter(s => !s.paymentStatus.includes('จ่าย')).length}
                      </span>
                      <span className="text-green-600 font-medium">
                        จ่ายแล้ว: {sheetData.filter(s => s.paymentStatus.includes('จ่าย')).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking List */}
        <div className="mt-8 sm:mt-16 mb-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-yellow-300 text-xl sm:text-2xl font-bold">
                📋 รายชื่อผู้จอง ({bookings.length} โต๊ะ)
              </h2>
              
              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <span className="text-yellow-300 text-sm">เรียงตาม:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'table_number' | 'booking_date' | 'payment_date')}
                  className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="table_number">หมายเลขโต๊ะ</option>
                  <option value="booking_date">เวลาจอง</option>
                  <option value="payment_date">เวลาจ่ายเงิน</option>
                </select>
              </div>
            </div>
            
            {bookings.length === 0 ? (
              <div className="text-center text-gray-300 py-8">
                ยังไม่มีการจองโต๊ะ
              </div>
            ) : (
              <div className="bg-white bg-opacity-90 rounded-lg shadow-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          โต๊ะ
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          ชื่อผู้จอง
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                          เบอร์โทร
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          จำนวน
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                          โซน
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          สถานะ
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                          เวลาจอง
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                          เวลาจ่ายเงิน
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                          หมายเหตุ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings
                        .sort((a, b) => {
                          if (sortBy === 'table_number') {
                            return a.table_number - b.table_number
                          } else if (sortBy === 'booking_date') {
                            return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
                          } else if (sortBy === 'payment_date') {
                            // จ่ายแล้วขึ้นก่อน แล้วเรียงตามเวลาจ่าย
                            if (a.payment_status === 'paid' && b.payment_status === 'paid') {
                              if (a.payment_date && b.payment_date) {
                                return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
                              }
                              return 0
                            } else if (a.payment_status === 'paid') {
                              return -1
                            } else if (b.payment_status === 'paid') {
                              return 1
                            }
                            return a.table_number - b.table_number
                          }
                          return 0
                        })
                        .map((booking, index) => (
                          <tr 
                            key={booking.table_number}
                            className={`
                              hover:bg-gray-50 transition-colors cursor-pointer
                              ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            `}
                            onClick={() => {
                              if (isAdmin) {
                                setSelectedTable(booking.table_number)
                                setShowBookingForm(true)
                              }
                            }}
                          >
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                                  ${booking.payment_status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}
                                `}>
                                  {booking.table_number}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.guest_name}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-sm text-gray-500">
                                {booking.phone_number}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="text-sm text-gray-900">
                                {booking.party_size} คน
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center hidden md:table-cell">
                              <span className={`
                                inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                ${booking.zone === 'inside' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                                }
                              `}>
                                {booking.zone === 'inside' ? 'ด้านใน' : 'ด้านนอก'}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <span className={`
                                inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                ${booking.payment_status === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                                }
                              `}>
                                {booking.payment_status === 'paid' ? '✅ จ่ายแล้ว' : '📝 จองแล้ว'}
                              </span>
                            </td>
                            <td className="px-3 py-2 hidden lg:table-cell">
                              <div className="text-xs text-gray-500">
                                {new Date(booking.booking_date).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                <br />
                                {new Date(booking.booking_date).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-3 py-2 hidden xl:table-cell">
                              <div className="text-xs text-gray-500">
                                {booking.payment_date ? (
                                  <>
                                    {new Date(booking.payment_date).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                    <br />
                                    {new Date(booking.payment_date).toLocaleTimeString('th-TH', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </>
                                ) : '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2 hidden lg:table-cell">
                              <div className="text-sm text-gray-500 max-w-xs truncate" title={booking.notes || ''}>
                                {booking.notes || '-'}
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile view additional info */}
                <div className="sm:hidden p-4 bg-gray-50 border-t">
                  <div className="text-xs text-gray-600">
                    💡 แตะแถวเพื่อดูรายละเอียดเพิ่มเติม (แอดมินแก้ไขใน Google Sheets)
                    <br />
                    📅 เรียงลำดับ: {sortBy === 'table_number' ? 'หมายเลขโต๊ะ' : sortBy === 'booking_date' ? 'เวลาจอง' : 'เวลาจ่ายเงิน'}
                  </div>
                </div>
                
                {/* Table summary */}
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">
                      รวม {bookings.length} โต๊ะ จาก 65 โต๊ะ
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-orange-600 font-medium">
                        จองแล้ว: {bookings.filter(b => b.payment_status === 'booked').length}
                      </span>
                      <span className="text-green-600 font-medium">
                        จ่ายแล้ว: {bookings.filter(b => b.payment_status === 'paid').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Info */}
        <div className="fixed top-4 right-2 sm:right-4 bg-black bg-opacity-50 text-white p-2 sm:p-4 rounded-lg text-xs sm:text-sm max-w-48 sm:max-w-none">
          <div>จองแล้ว: {bookings.length} โต๊ะ</div>
          <div>จ่ายแล้ว: {bookings.filter(b => b.payment_status === 'paid').length} โต๊ะ</div>
          <div className="text-xs mt-1 sm:mt-2 text-gray-300 hidden sm:block">
            อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
          </div>
          <div className="mt-1 sm:mt-2 space-y-1">
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-400 border border-white/20"></div>
                <span className="text-xs sm:text-sm">โต๊ะว่าง</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{65 - bookings.length}</span>
            </div>
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 border border-white/20"></div>
                <span className="text-xs sm:text-sm">จองแล้ว</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{bookings.filter(b => b.payment_status === 'booked').length}</span>
            </div>
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border border-white/20"></div>
                <span className="text-xs sm:text-sm">จ่ายแล้ว</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{bookings.filter(b => b.payment_status === 'paid').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal สำหรับจองโต๊ะ */}
      {showBookingForm && selectedTable && isAdmin && (
        <BookingModal
          tableNumber={selectedTable}
          zone={selectedTable <= 41 ? 'inside' : 'outside'}
          existingBooking={tables.find(t => t.table_number === selectedTable)?.booking}
          onSubmit={handleBooking}
          onClose={() => {
            setShowBookingForm(false)
            setSelectedTable(null)
          }}
          onDelete={handleCancelBooking}
        />
      )}
    </div>
  )
}

function BookingModal({ 
  tableNumber, 
  zone, 
  onSubmit, 
  onClose,
  onDelete,
  existingBooking
}: {
  tableNumber: number
  zone: 'inside' | 'outside'
  onSubmit: (data: Omit<TableBooking, 'id' | 'created_at'>) => void
  onClose: () => void
  onDelete: (tableNumber: number) => void
  existingBooking?: TableBooking
}) {
  const [formData, setFormData] = useState({
    guest_name: existingBooking?.guest_name || '',
    phone_number: existingBooking?.phone_number || '',
    party_size: existingBooking?.party_size || 8,
    payment_status: (existingBooking?.payment_status || 'booked') as 'booked' | 'paid',
    notes: existingBooking?.notes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.guest_name.trim() || !formData.phone_number.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    onSubmit({
      table_number: tableNumber,
      guest_name: formData.guest_name.trim(),
      phone_number: formData.phone_number.trim(),
      party_size: formData.party_size,
      payment_status: formData.payment_status,
      booking_date: existingBooking?.booking_date || new Date().toISOString(),
      notes: formData.notes.trim(),
      zone
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
          {existingBooking ? 'แก้ไข' : 'จอง'}โต๊ะ {tableNumber} ({zone === 'inside' ? 'ด้านใน' : 'ด้านนอก'})
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">ชื่อผู้จอง *</label>
            <input
              type="text"
              value={formData.guest_name}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="กรอกชื่อผู้จอง"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">เบอร์โทรศัพท์ *</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="กรอกเบอร์โทรศัพท์"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">จำนวนคน</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.party_size}
              onChange={(e) => setFormData(prev => ({ ...prev, party_size: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">สถานะการชำระ *</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payment_status"
                  value="booked"
                  checked={formData.payment_status === 'booked'}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value as 'booked' | 'paid' }))}
                  className="mr-2"
                />
                <span className="text-orange-600">จองเฉยๆ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payment_status"
                  value="paid"
                  checked={formData.payment_status === 'paid'}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value as 'booked' | 'paid' }))}
                  className="mr-2"
                />
                <span className="text-green-600">จ่ายแล้ว</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              rows={3}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              ยกเลิก
            </button>
            {existingBooking && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการลบการจองนี้หรือไม่?')) {
                    onDelete(tableNumber)
                    onClose()
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                ลบการจอง
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              {existingBooking ? '📝 แก้ไขใน Google Sheets' : '📝 เพิ่มใน Google Sheets'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
