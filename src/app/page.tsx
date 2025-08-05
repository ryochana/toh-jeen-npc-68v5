'use client'

import { useState, useEffect } from 'react'
import { supabase, type TableBooking } from '@/lib/supabase'

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

  const initializeTables = (): TableInfo[] => {
    const tableData: TableInfo[] = []
    
    for (let i = 1; i <= 41; i++) {
      tableData.push({
        table_number: i,
        zone: 'inside',
        position: { x: 0, y: 0 },
        is_booked: false
      })
    }
    
    for (let i = 42; i <= 65; i++) {
      tableData.push({
        table_number: i,
        zone: 'outside',
        position: { x: 0, y: 0 },
        is_booked: false
      })
    }
    
    return tableData
  }

  const loadBookings = async () => {
    try {
      console.log('Loading bookings from Supabase...')
      const { data, error } = await supabase
        .from('table_bookings')
        .select('*')
        .order('table_number')
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log(`Loaded ${data?.length || 0} bookings:`, data)
      setBookings(data || [])
      
      const updatedTables = initializeTables().map(table => {
        const booking = data?.find(b => b.table_number === table.table_number)
        return {
          ...table,
          is_booked: !!booking,
          booking
        }
      })
      
      setTables(updatedTables)
      console.log('Tables updated successfully')
    } catch (error) {
      console.error('Error loading bookings:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async (bookingData: Omit<TableBooking, 'id' | 'created_at'>) => {
    try {
      console.log('Submitting booking:', bookingData)
      const existingBooking = tables.find(t => t.table_number === bookingData.table_number)?.booking
      
      if (existingBooking) {
        console.log('Updating existing booking')
        const { error } = await supabase
          .from('table_bookings')
          .update(bookingData)
          .eq('table_number', bookingData.table_number)
        
        if (error) throw error
        alert('แก้ไขข้อมูลการจองสำเร็จ!')
      } else {
        console.log('Creating new booking')
        const { error } = await supabase
          .from('table_bookings')
          .insert([bookingData])
        
        if (error) throw error
        alert('จองโต๊ะสำเร็จ!')
      }
      
      console.log('Reloading bookings after update...')
      await loadBookings()
      setShowBookingForm(false)
      setSelectedTable(null)
    } catch (error) {
      console.error('Error booking table:', error)
      alert('เกิดข้อผิดพลาดในการจองโต๊ะ: ' + (error as Error).message)
    }
  }

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

  const exportToExcel = async () => {
    try {
      await loadBookings()
      
      const timestamp = Date.now()
      const response = await fetch(`/api/export?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      const now = new Date()
      const timeString = `${now.toLocaleDateString('th-TH').replace(/\//g, '-')}_${now.toLocaleTimeString('th-TH').replace(/:/g, '-')}`
      a.download = `รายการจองโต๊ะ_${timeString}.xlsx`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert(`Export สำเร็จ! ข้อมูล ${bookings.length} รายการ`)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('เกิดข้อผิดพลาดในการ export ข้อมูล')
    }
  }

  useEffect(() => {
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

          {/* Controls */}
          <div className="flex justify-center space-x-2 sm:space-x-4 mb-4 sm:mb-8">
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-green-700 transition-colors font-bold text-sm sm:text-base"
            >
              📊 Export Excel
            </button>
            <button
              onClick={loadBookings}
              className="bg-blue-600 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm sm:text-base"
            >
              🔄 รีเฟรช
            </button>
          </div>
        </div>

        {/* Table Layout - ตามภาพเป๊ะๆ */}
        <div className="max-w-7xl mx-auto px-1 sm:px-2">
          <div className="flex justify-center items-start space-x-2 sm:space-x-4 mb-4 sm:mb-8 overflow-x-auto pb-4 min-w-max">
            {/* ฝั่งซ้าย (โต๊ะ 1-27) - 3 คอลัมน์ 9 แถว */}
            <div className="grid grid-cols-3 gap-1 sm:gap-3 flex-shrink-0">
              <div className="col-span-3 text-center text-purple-300 font-bold mb-1 sm:mb-2 text-xs sm:text-base">
                โซนด้านใน (โต๊ะ 1-27)
              </div>
              {Array.from({length: 27}, (_, i) => i + 1).map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                const getTableColor = () => {
                  if (!table?.is_booked) return 'bg-purple-400 hover:bg-purple-500'
                  if (table.booking?.payment_status === 'paid') return 'bg-green-500 hover:bg-green-600'
                  return 'bg-orange-500 hover:bg-orange-600'
                }
                
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      setSelectedTable(tableNum)
                      setShowBookingForm(true)
                    }}
                    className={`
                      w-8 h-8 sm:w-16 sm:h-16 rounded-full text-white font-bold text-xs sm:text-lg transition-all hover:scale-105
                      ${getTableColor()}
                    `}
                    title={table?.is_booked ? 
                      `${table.booking?.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองแล้ว'}: ${table.booking?.guest_name}` : 
                      'คลิกเพื่อจอง'
                    }
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>

            {/* ทางเดิน 1 */}
            <div className="flex items-center justify-center h-48 sm:h-96 flex-shrink-0">
              <div className="w-3 sm:w-6 h-48 sm:h-96 bg-orange-500 rounded-full relative flex items-center justify-center">
                <div className="transform -rotate-90 text-orange-100 font-bold text-xs sm:text-sm whitespace-nowrap">
                  ทางเดิน
                </div>
              </div>
            </div>

            {/* กลาง (โต๊ะ 28-41) - 2 คอลัมน์ 7 แถว เริ่มจากแถวที่ 2 */}
            <div className="grid grid-cols-2 gap-1 sm:gap-3 flex-shrink-0 pt-6 sm:pt-20">
              <div className="col-span-2 text-center text-purple-300 font-bold mb-1 sm:mb-2 text-xs sm:text-base">
                โซนด้านใน (โต๊ะ 28-41)
              </div>
              {[28,29,30,31,32,33,34,35,36,37,38,39,40,41].map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                const getTableColor = () => {
                  if (!table?.is_booked) return 'bg-purple-400 hover:bg-purple-500'
                  if (table.booking?.payment_status === 'paid') return 'bg-green-500 hover:bg-green-600'
                  return 'bg-orange-500 hover:bg-orange-600'
                }
                
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      setSelectedTable(tableNum)
                      setShowBookingForm(true)
                    }}
                    className={`
                      w-8 h-8 sm:w-16 sm:h-16 rounded-full text-white font-bold text-xs sm:text-lg transition-all hover:scale-105
                      ${getTableColor()}
                    `}
                    title={table?.is_booked ? 
                      `${table.booking?.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองแล้ว'}: ${table.booking?.guest_name}` : 
                      'คลิกเพื่อจอง'
                    }
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>

            {/* ทางเดิน 2 */}
            <div className="flex items-center justify-center h-48 sm:h-96 flex-shrink-0">
              <div className="w-3 sm:w-6 h-48 sm:h-96 bg-orange-500 rounded-full relative flex items-center justify-center">
                <div className="transform -rotate-90 text-orange-100 font-bold text-xs sm:text-sm whitespace-nowrap">
                  ทางเดิน
                </div>
              </div>
            </div>

            {/* ฝั่งขวา (โต๊ะ 42-62) - 3 คอลัมน์ 7 แถว ตามภาพเป๊ะๆ */}
            <div className="grid grid-cols-3 gap-1 sm:gap-3 flex-shrink-0">
              <div className="col-span-3 text-center text-orange-300 font-bold mb-1 sm:mb-2 text-xs sm:text-base">
                โซนด้านนอก (โต๊ะ 42-62)
              </div>
              {[42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62].map((tableNum) => {
                const table = tables.find(t => t.table_number === tableNum)
                const getTableColor = () => {
                  if (!table?.is_booked) return 'bg-purple-400 hover:bg-purple-500'
                  if (table.booking?.payment_status === 'paid') return 'bg-green-500 hover:bg-green-600'
                  return 'bg-orange-500 hover:bg-orange-600'
                }
                
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      setSelectedTable(tableNum)
                      setShowBookingForm(true)
                    }}
                    className={`
                      w-8 h-8 sm:w-16 sm:h-16 rounded-full text-white font-bold text-xs sm:text-lg transition-all hover:scale-105
                      ${getTableColor()}
                    `}
                    title={table?.is_booked ? 
                      `${table.booking?.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองแล้ว'}: ${table.booking?.guest_name}` : 
                      'คลิกเพื่อจอง'
                    }
                  >
                    {tableNum}
                  </button>
                )
              })}
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

        {/* Booking List */}
        <div className="mt-8 sm:mt-16 mb-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-center text-yellow-300 text-xl sm:text-2xl font-bold mb-6">
              📋 รายชื่อผู้จอง ({bookings.length} โต๊ะ)
            </h2>
            
            {bookings.length === 0 ? (
              <div className="text-center text-gray-300 py-8">
                ยังไม่มีการจองโต๊ะ
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings
                  .sort((a, b) => a.table_number - b.table_number)
                  .map((booking) => (
                    <div
                      key={booking.table_number}
                      className={`
                        p-4 rounded-lg border-2 transition-all hover:scale-105
                        ${booking.payment_status === 'paid' 
                          ? 'bg-green-50 border-green-500 text-green-800' 
                          : 'bg-orange-50 border-orange-500 text-orange-800'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold">
                          โต๊ะ {booking.table_number}
                        </div>
                        <div className={`
                          px-2 py-1 rounded-full text-xs font-bold
                          ${booking.payment_status === 'paid' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-orange-500 text-white'
                          }
                        `}>
                          {booking.payment_status === 'paid' ? '✅ จ่ายแล้ว' : '📝 จองแล้ว'}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">ชื่อ:</span> {booking.guest_name}
                        </div>
                        <div>
                          <span className="font-medium">เบอร์:</span> {booking.phone_number}
                        </div>
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">จำนวน:</span> {booking.party_size} คน
                          </div>
                          <div>
                            <span className="font-medium">โซน:</span> {booking.zone === 'inside' ? 'ด้านใน' : 'ด้านนอก'}
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                            <span className="font-medium">หมายเหตุ:</span> {booking.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                }
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
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-400 rounded-full"></div>
                <span className="text-xs sm:text-sm">โต๊ะว่าง</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{65 - bookings.length}</span>
            </div>
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full"></div>
                <span className="text-xs sm:text-sm">จองแล้ว</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{bookings.filter(b => b.payment_status === 'booked').length}</span>
            </div>
            <div className="flex items-center justify-between space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm">จ่ายแล้ว</span>
              </div>
              <span className="text-xs sm:text-sm font-bold">{bookings.filter(b => b.payment_status === 'paid').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal สำหรับจองโต๊ะ */}
      {showBookingForm && selectedTable && (
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
              {existingBooking ? 'บันทึกการแก้ไข' : 'จองโต๊ะ (2,000 บาท)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
