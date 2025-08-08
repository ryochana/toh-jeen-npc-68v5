'use client'

import { useState, useEffect } from 'react'
import { fetchSheetData, type SheetBooking } from '@/lib/googleSheets'
import AdminLogin from '@/components/AdminLogin'
import DraggableTable from '@/components/DraggableTable'
import SheetBookingForm from '@/components/SheetBookingForm'

interface TableInfo {
  table_number: number
  zone: 'inside' | 'outside'
  position: { x: number; y: number }
  is_booked: boolean
  booking?: SheetBooking
}

export default function TableBookingPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDragMode, setIsDragMode] = useState(false)
  const [sheetData, setSheetData] = useState<SheetBooking[]>([])
  const [sortBy, setSortBy] = useState<'table_number' | 'booking_date' | 'payment_date' | 'payment_status'>('payment_status')
  const [showSheetForm, setShowSheetForm] = useState(false)
  const [selectedSheetEntry, setSelectedSheetEntry] = useState<SheetBooking | null>(null)

  const initializeTables = (): TableInfo[] => {
    const tableData: TableInfo[] = []
    
    // กำหนดตำแหน่งเริ่มต้นของโต๊ะแต่ละโต๊ะ
    const getInitialPosition = (tableNum: number) => {
      if (tableNum <= 41) {
        // โซนด้านใน (1-41) - อยู่ด้านซ้าย จัดเรียง 7 คอลัมน์
        const tablesPerRow = 7
        const row = Math.floor((tableNum - 1) / tablesPerRow)
        const col = (tableNum - 1) % tablesPerRow
        return { 
          x: col * 70 + 50,   // เพิ่มระยะห่างเป็น 70px
          y: row * 80 + 140   // เพิ่มระยะห่างเป็น 80px
        }
      } else {
        // โซนด้านนอก (42-65) - อยู่ด้านขวา
        const adjustedNum = tableNum - 42
        const tablesPerRow = 6
        const row = Math.floor(adjustedNum / tablesPerRow)
        const col = adjustedNum % tablesPerRow
        return { 
          x: col * 70 + 600,  // เลื่อนไปขวามากขึ้นเป็น 600
          y: row * 80 + 140   // เพิ่มระยะห่างเป็น 80px
        }
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
      
      // อัปเดตตารางโต๊ะโดยใช้ข้อมูลจาก Google Sheets
      const updatedTables = initializeTables().map(table => {
        // หาการจองในแต่ละ entry ที่มีโต๊ะนี้
        const booking = sheetData.find(entry => {
          const tableNumbers = entry.tableNumbers?.split(',').map((t: string) => parseInt(t.trim())) || []
          return tableNumbers.includes(table.table_number)
        })
        
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
        alert(`โต๊ะ ${tableNumber}\nผู้จอง: ${table.booking?.guestName}\nสถานะ: ${table.booking?.paymentStatus?.includes('จ่าย') ? 'จ่ายแล้ว' : 'จองแล้ว'}`)
      } else {
        alert(`โต๊ะ ${tableNumber} ยังว่างอยู่`)
      }
      return
    }
    
    // แอดมินเปิด SheetBookingForm เลย
    const table = tables.find(t => t.table_number === tableNumber)
    
    if (table?.is_booked && table.booking) {
      // ถ้าโต๊ะมีการจองแล้ว ให้แก้ไขข้อมูลเดิม
      setSelectedSheetEntry(table.booking)
    } else {
      // ถ้าโต๊ะว่าง ให้สร้างข้อมูลใหม่
      const nextOrderNumber = Math.max(...sheetData.map(s => s.orderNumber), 0) + 1
      setSelectedSheetEntry({
        orderNumber: nextOrderNumber,
        guestName: '',
        partySize: 8,
        paymentStatus: '',
        tableNumbers: tableNumber.toString(),
        receiver: '',
        paymentDate: '',
        phoneNumber: ''
      })
    }
    
    setShowSheetForm(true)
  }

  const handlePositionChange = (tableNumber: number, newPosition: { x: number; y: number }) => {
    if (!isAdmin) return
    
    // ระบบดันโต๊ะและ snap to grid
    const snapToGrid = (pos: { x: number; y: number }) => {
      const gridSize = 70 // เพิ่มขนาด grid ให้เหมาะกับระยะห่างใหม่
      return {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize
      }
    }
    
    // ตรวจสอบการชนกันและดันโต๊ะอื่น
    const checkCollisions = (movingTable: number, targetPos: { x: number; y: number }) => {
      const tableWidth = 70  // ขนาดโต๊ะใหม่
      const tableHeight = 80
      const buffer = 15      // เพิ่มระยะห่าง buffer
      
      const updatedTables = [...tables]
      const movingTableIndex = updatedTables.findIndex(t => t.table_number === movingTable)
      if (movingTableIndex === -1) return updatedTables
      
      // อัปเดตตำแหน่งของโต๊ะที่ย้าย
      updatedTables[movingTableIndex].position = targetPos
      
      // ตรวจสอบการชนกับโต๊ะอื่น
      for (let i = 0; i < updatedTables.length; i++) {
        if (i === movingTableIndex) continue
        
        const otherTable = updatedTables[i]
        const dx = Math.abs(targetPos.x - otherTable.position.x)
        const dy = Math.abs(targetPos.y - otherTable.position.y)
        
        // ถ้าชนกัน ให้ดันโต๊ะที่ชน
        if (dx < tableWidth && dy < tableHeight) {
          const pushDirection = {
            x: targetPos.x > otherTable.position.x ? -1 : 1,
            y: targetPos.y > otherTable.position.y ? -1 : 1
          }
          
          // คำนวณตำแหน่งใหม่ของโต๊ะที่ถูกดัน
          const newPushedPos = {
            x: otherTable.position.x + pushDirection.x * (tableWidth + buffer),
            y: otherTable.position.y + pushDirection.y * (tableHeight + buffer)
          }
          
          // Snap to grid
          updatedTables[i].position = snapToGrid(newPushedPos)
        }
      }
      
      return updatedTables
    }
    
    const snappedPosition = snapToGrid(newPosition)
    const updatedTables = checkCollisions(tableNumber, snappedPosition)
    
    setTables(updatedTables)
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

  const handleSheetEntryClick = (entry: SheetBooking) => {
    if (!isAdmin) {
      // แสดงข้อมูลสำหรับผู้เยี่ยมชม
      alert(`ข้อมูลการจอง:\n\nชื่อ: ${entry.guestName}\nโต๊ะ: ${entry.tableNumbers}\nสถานะ: ${entry.paymentStatus || 'ยังไม่กรอก'}\nเบอร์: ${entry.phoneNumber || '-'}`)
      return
    }
    
    // แอดมินสามารถแก้ไขได้
    setSelectedSheetEntry(entry)
    setShowSheetForm(true)
  }

  const handleSheetSubmit = async (data: SheetBooking) => {
    if (!isAdmin) {
      alert('ไม่มีสิทธิ์ในการแก้ไขข้อมูล')
      return
    }

    try {
      console.log('Submitting sheet data:', data)
      
      const response = await fetch('/api/sheets-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      }

      alert('บันทึกข้อมูลสำเร็จ!')
      
      // รีเฟรชข้อมูลหลังจากบันทึก
      setTimeout(() => {
        loadBookings()
      }, 1000)
      
      setShowSheetForm(false)
      setSelectedSheetEntry(null)
    } catch (error) {
      console.error('Error saving sheet data:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error as Error).message)
    }
  }

  const handleSheetDelete = async (orderNumber: number) => {
    if (!isAdmin) {
      alert('ไม่มีสิทธิ์ในการลบข้อมูล')
      return
    }

    try {
      const response = await fetch(`/api/sheets-update?orderNumber=${orderNumber}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'เกิดข้อผิดพลาดในการลบข้อมูล')
      }

      alert('ลบข้อมูลสำเร็จ!')
      
      // รีเฟรชข้อมูลหลังจากลบ
      setTimeout(() => {
        loadBookings()
      }, 1000)
    } catch (error) {
      console.error('Error deleting sheet data:', error)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + (error as Error).message)
    }
  }

  const addNewSheetEntry = () => {
    if (!isAdmin) {
      alert('ไม่มีสิทธิ์ในการเพิ่มข้อมูล')
      return
    }
    
    // หาหมายเลขลำดับถัดไป
    const nextOrderNumber = Math.max(...sheetData.map(s => s.orderNumber), 0) + 1
    
    setSelectedSheetEntry({
      orderNumber: nextOrderNumber,
      guestName: '',
      partySize: 8,
      paymentStatus: '',
      tableNumbers: '',
      receiver: '',
      paymentDate: '',
      phoneNumber: ''
    })
    setShowSheetForm(true)
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
        <div className="w-full px-2 sm:px-4 mb-16">
          <div className="overflow-x-auto">
            <div className="relative bg-gray-900 bg-opacity-30 rounded-lg p-4" style={{ minHeight: '700px', width: '1100px', minWidth: '1100px' }}>
            {/* Grid Background (optional visual guide) */}
            {isAdmin && isDragMode && (
              <div className="absolute inset-0 opacity-20 pointer-events-none" 
                   style={{
                     backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                     backgroundSize: '70px 80px'
                   }}
              />
            )}
            
            {/* Zone Inside Box - ด้านซ้าย */}
            <div className="absolute border-2 border-purple-400 border-dashed rounded-lg bg-purple-900 bg-opacity-20" 
                 style={{
                   left: '30px',
                   top: '120px', 
                   width: '520px',
                   height: '500px'
                 }}>
              <div className="absolute -top-6 left-2 text-purple-300 font-bold text-sm bg-gray-900 px-2 rounded">
                🏛️ โซนด้านใน (1-41)
              </div>
            </div>
            
            {/* Zone Outside Box - ด้านขวา */}
            <div className="absolute border-2 border-orange-400 border-dashed rounded-lg bg-orange-900 bg-opacity-20" 
                 style={{
                   left: '580px',
                   top: '120px',
                   width: '450px', 
                   height: '500px'
                 }}>
              <div className="absolute -top-6 left-2 text-orange-300 font-bold text-sm bg-gray-900 px-2 rounded">
                🌟 โซนด้านนอก (42-65)
              </div>
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
              
              <div className="flex items-center space-x-2">
                {/* Add New Button */}
                {isAdmin && (
                  <button
                    onClick={addNewSheetEntry}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm font-bold"
                  >
                    ➕ เพิ่มใหม่
                  </button>
                )}
                
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
                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          ลำดับ
                        </th>
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
                              hover:bg-gray-50 transition-colors cursor-pointer
                              ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                              ${isAdmin ? 'hover:bg-blue-50' : ''}
                            `}
                            onClick={() => handleSheetEntryClick(entry)}
                            title={isAdmin ? 'คลิกเพื่อแก้ไข' : 'คลิกเพื่อดูรายละเอียด'}
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="text-sm font-bold text-gray-700">
                                {entry.orderNumber}
                              </div>
                            </td>
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

        {/* Status Info */}
        <div className="fixed top-4 right-2 sm:right-4 bg-black bg-opacity-50 text-white p-2 sm:p-4 rounded-lg text-xs sm:text-sm max-w-48 sm:max-w-none">
          <div>จองแล้ว: {sheetData.length} รายการ</div>
          <div>จ่ายแล้ว: {sheetData.filter((entry: any) => entry.paymentStatus?.includes('จ่าย')).length} รายการ</div>
          <div className="text-xs mt-1 sm:mt-2 text-gray-300 hidden sm:block">
            อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
          </div>
          <div className="mt-1 sm:mt-2 space-y-1">
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-400 border border-white/20"></div>
                <span className="text-xs sm:text-sm">โต๊ะว่าง</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{65 - tables.filter(t => t.is_booked).length}</span>
            </div>
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 border border-white/20"></div>
                <span className="text-xs sm:text-sm">จองแล้ว</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{sheetData.filter((entry: any) => !entry.paymentStatus?.includes('จ่าย')).length}</span>
            </div>
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border border-white/20"></div>
                <span className="text-xs sm:text-sm">จ่ายแล้ว</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{sheetData.filter((entry: any) => entry.paymentStatus?.includes('จ่าย')).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal สำหรับแก้ไขข้อมูล Google Sheets */}
      {showSheetForm && selectedSheetEntry && isAdmin && (
        <SheetBookingForm
          existingBooking={selectedSheetEntry}
          onSubmit={handleSheetSubmit}
          onClose={() => {
            setShowSheetForm(false)
            setSelectedSheetEntry(null)
          }}
          onDelete={handleSheetDelete}
        />
      )}
    </div>
  )
}

