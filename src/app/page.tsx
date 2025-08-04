'use client'

import { useState, useEffect } from 'react'
import { supabase, type TableBooking } from '@/lib/supabase'

// ข้อมูลโต๊ะแต่ละโต๊ะ
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

  // สร้างข้อมูลโต๊ะทั้งหมดตามรูป (1-62 โต๊ะ)
  const initializeTables = (): TableInfo[] => {
    const tableData: TableInfo[] = []
    
    // โต๊ะด้านใน (1-41)
    for (let i = 1; i <= 41; i++) {
      tableData.push({
        table_number: i,
        zone: 'inside',
        position: { x: 0, y: 0 },
        is_booked: false
      })
    }
    
    // โต๊ะด้านนอก (42-62)
    for (let i = 42; i <= 62; i++) {
      tableData.push({
        table_number: i,
        zone: 'outside',
        position: { x: 0, y: 0 },
        is_booked: false
      })
    }
    
    return tableData
  }

  // โหลดข้อมูลการจองจาก Supabase
  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('table_bookings')
        .select('*')
        .order('table_number')
      
      if (error) throw error
      
      setBookings(data || [])
      
      // อัปเดตสถานะโต๊ะ
      const updatedTables = initializeTables().map(table => {
        const booking = data?.find(b => b.table_number === table.table_number)
        return {
          ...table,
          is_booked: !!booking,
          booking
        }
      })
      
      setTables(updatedTables)
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // บันทึกการจองใหม่
  const handleBooking = async (bookingData: Omit<TableBooking, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('table_bookings')
        .insert([bookingData])
        .select()
      
      if (error) throw error
      
      await loadBookings() // รีโหลดข้อมูล
      setShowBookingForm(false)
      setSelectedTable(null)
      alert('จองโต๊ะสำเร็จ!')
    } catch (error) {
      console.error('Error booking table:', error)
      alert('เกิดข้อผิดพลาดในการจองโต๊ะ')
    }
  }

  // ลบการจอง
  const handleCancelBooking = async (tableNumber: number) => {
    if (!confirm('คุณต้องการยกเลิกการจองโต๊ะนี้หรือไม่?')) return
    
    try {
      const { error } = await supabase
        .from('table_bookings')
        .delete()
        .eq('table_number', tableNumber)
      
      if (error) throw error
      
      await loadBookings()
      alert('ยกเลิกการจองสำเร็จ!')
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('เกิดข้อผิดพลาดในการยกเลิกการจอง')
    }
  }

  // Export ข้อมูลเป็น CSV
  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `รายการจองโต๊ะ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('เกิดข้อผิดพลาดในการ export ข้อมูล')
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-900">
        <div className="text-xl text-white">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
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

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="text-center mb-8 mt-16">
          <div className="flex justify-center items-center mb-4">
            <div className="text-pink-300 text-2xl mr-2">รวม❤️</div>
            <div className="text-pink-400 text-4xl font-bold">ศิษย์เก่า</div>
          </div>
          <div className="flex justify-center items-center mb-4">
            <div className="text-blue-300 text-2xl mr-2">คืนสู่เหย้า</div>
            <div className="text-yellow-400 text-4xl font-bold">ชาวเหลืองฟ้า</div>
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg ml-4 transform -rotate-12">
              <div className="text-sm">โต๊ะจีน</div>
              <div className="text-lg font-bold">โต๊ะละ 2,000 บาท</div>
            </div>
          </div>
          <div className="text-yellow-300 text-lg mb-4">
            และร่วมพิธีมุฑิตาจิตคุณครูรุ่งนภา เชิงกลาง เนื่องในโอกาสเกษียณอายุราชการ
          </div>

          {/* Stage */}
          <div className="mb-8">
            <div className="w-96 h-16 bg-gradient-to-r from-yellow-600 to-yellow-800 mx-auto rounded-lg shadow-lg">
              <div className="w-full h-full bg-gradient-to-b from-yellow-400 to-yellow-700 rounded-lg border-4 border-yellow-500"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={exportToCSV}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-bold"
            >
              📊 Export CSV
            </button>
            <button
              onClick={loadBookings}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              🔄 รีเฟรช
            </button>
          </div>
        </div>

        {/* Table Layout */}
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-start space-x-4 mb-8">
            {/* ฝั่งซ้าย (โต๊ะ 1-27) - 3 คอลัมน์ 9 แถว */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({length: 27}, (_, i) => i + 1).map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      if (table?.is_booked) {
                        if (confirm('โต๊ะนี้จองแล้ว ต้องการยกเลิกการจองหรือไม่?')) {
                          handleCancelBooking(tableNum)
                        }
                      } else {
                        setSelectedTable(tableNum)
                        setShowBookingForm(true)
                      }
                    }}
                    className={`
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${table?.is_booked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-purple-400 hover:bg-purple-500'
                      }
                    `}
                    title={table?.is_booked ? `จองแล้ว: ${table.booking?.guest_name}` : 'คลิกเพื่อจอง'}
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>

            {/* ทางเดิน 1 */}
            <div className="flex items-center justify-center h-96">
              <div className="w-6 h-96 bg-orange-500 rounded-full relative flex items-center justify-center">
                <div className="transform -rotate-90 text-orange-100 font-bold text-sm whitespace-nowrap">
                  ทางเดิน
                </div>
              </div>
            </div>

            {/* กลาง (โต๊ะ 28-41) - 2 คอลัมน์ 7 แถว */}
            <div className="grid grid-cols-2 gap-3">
              {[28,29,30,31,32,33,34,35,36,37,38,39,40,41].map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      if (table?.is_booked) {
                        if (confirm('โต๊ะนี้จองแล้ว ต้องการยกเลิกการจองหรือไม่?')) {
                          handleCancelBooking(tableNum)
                        }
                      } else {
                        setSelectedTable(tableNum)
                        setShowBookingForm(true)
                      }
                    }}
                    className={`
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${table?.is_booked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-purple-400 hover:bg-purple-500'
                      }
                    `}
                    title={table?.is_booked ? `จองแล้ว: ${table.booking?.guest_name}` : 'คลิกเพื่อจอง'}
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>

            {/* ทางเดิน 2 */}
            <div className="flex items-center justify-center h-96">
              <div className="w-6 h-96 bg-orange-500 rounded-full"></div>
            </div>

            {/* ฝั่งขวา (โต๊ะ 42-62) - 3 คอลัมน์ 7 แถว */}
            <div className="grid grid-cols-3 gap-3">
              {/* แถวบนสุด: 42, 43, 44 */}
              {[42,43,44].map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      if (table?.is_booked) {
                        if (confirm('โต๊ะนี้จองแล้ว ต้องการยกเลิกการจองหรือไม่?')) {
                          handleCancelBooking(tableNum)
                        }
                      } else {
                        setSelectedTable(tableNum)
                        setShowBookingForm(true)
                      }
                    }}
                    className={`
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${table?.is_booked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-purple-400 hover:bg-purple-500'
                      }
                    `}
                    title={table?.is_booked ? `จองแล้ว: ${table.booking?.guest_name}` : 'คลิกเพื่อจอง'}
                  >
                    {tableNum}
                  </button>
                )
              })}
              
              {/* แถวที่ 2: 42, 43, 44 (ซ้ำ) */}
              {[42,43,44].map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                return (
                  <button
                    key={`row2-${tableNum}`}
                    onClick={() => {
                      if (table?.is_booked) {
                        if (confirm('โต๊ะนี้จองแล้ว ต้องการยกเลิกการจองหรือไม่?')) {
                          handleCancelBooking(tableNum)
                        }
                      } else {
                        setSelectedTable(tableNum)
                        setShowBookingForm(true)
                      }
                    }}
                    className={`
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${table?.is_booked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-purple-400 hover:bg-purple-500'
                      }
                    `}
                    title={table?.is_booked ? `จองแล้ว: ${table.booking?.guest_name}` : 'คลิกเพื่อจอง'}
                  >
                    {tableNum}
                  </button>
                )
              })}

              {/* แถวที่ 3-7: 45-62 */}
              {[45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62].map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      if (table?.is_booked) {
                        if (confirm('โต๊ะนี้จองแล้ว ต้องการยกเลิกการจองหรือไม่?')) {
                          handleCancelBooking(tableNum)
                        }
                      } else {
                        setSelectedTable(tableNum)
                        setShowBookingForm(true)
                      }
                    }}
                    className={`
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${table?.is_booked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-purple-400 hover:bg-purple-500'
                      }
                    `}
                    title={table?.is_booked ? `จองแล้ว: ${table.booking?.guest_name}` : 'คลิกเพื่อจอง'}
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Backdrop Label */}
        <div className="text-center mt-8">
          <div className="bg-orange-500 text-white px-8 py-4 rounded-lg inline-block font-bold text-2xl transform rotate-1">
            Backdrop
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

        {/* Status Info */}
        <div className="fixed top-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
          <div>จำนวนโต๊ะที่จองแล้ว: {bookings.length} โต๊ะ</div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
              <span className="text-sm">โต๊ะว่าง</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm">โต๊ะที่จองแล้ว</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal สำหรับจองโต๊ะ */}
      {showBookingForm && selectedTable && (
        <BookingModal
          tableNumber={selectedTable}
          zone={selectedTable <= 41 ? 'inside' : 'outside'}
          onSubmit={handleBooking}
          onClose={() => {
            setShowBookingForm(false)
            setSelectedTable(null)
          }}
        />
      )}
    </div>
  )
}

// Component สำหรับ Modal การจอง
function BookingModal({ 
  tableNumber, 
  zone, 
  onSubmit, 
  onClose 
}: {
  tableNumber: number
  zone: 'inside' | 'outside'
  onSubmit: (data: Omit<TableBooking, 'id' | 'created_at'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    guest_name: '',
    phone_number: '',
    party_size: 8,
    notes: ''
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
      booking_date: new Date().toISOString(),
      notes: formData.notes.trim(),
      zone
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          จองโต๊ะ {tableNumber} ({zone === 'inside' ? 'ด้านใน' : 'ด้านนอก'})
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
            <label className="block text-sm font-medium mb-1 text-gray-700">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              rows={3}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              จองโต๊ะ (2,000 บาท)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
