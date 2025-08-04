'use client'

import { useState, useEffect } from 'react'
import { supabase, type TableBooking } from '@/lib/supabase'

// ประเภทข้อมูลการจองโต๊ะ
interface TableBooking {
  id: number
  table_number: number
  guest_name: string
  phone_number: string
  party_size: number
  booking_date: string
  notes?: string
  zone: 'inside' | 'outside' // โซนใน (1-41) หรือโซนนอก (42+)
  created_at?: string
}

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

  // สร้างข้อมูลโต๊ะทั้งหมด (1-60 โต๊ะ)
  const initializeTables = (): TableInfo[] => {
    const tableData: TableInfo[] = []
    
    // โต๊ะด้านใน (1-41)
    for (let i = 1; i <= 41; i++) {
      tableData.push({
        table_number: i,
        zone: 'inside',
        position: getTablePosition(i, 'inside'),
        is_booked: false
      })
    }
    
    // โต๊ะด้านนอก (42-60)
    for (let i = 42; i <= 60; i++) {
      tableData.push({
        table_number: i,
        zone: 'outside',
        position: getTablePosition(i, 'outside'),
        is_booked: false
      })
    }
    
    return tableData
  }

  // คำนวณตำแหน่งโต๊ะบนแผนผัง
  const getTablePosition = (tableNumber: number, zone: 'inside' | 'outside') => {
    if (zone === 'inside') {
      // จัดเรียงโต๊ะด้านในเป็นแถว
      const row = Math.floor((tableNumber - 1) / 7)
      const col = (tableNumber - 1) % 7
      return { x: col * 80 + 50, y: row * 80 + 100 }
    } else {
      // จัดเรียงโต๊ะด้านนอกรอบๆ
      const outsideIndex = tableNumber - 42
      const row = Math.floor(outsideIndex / 6)
      const col = outsideIndex % 6
      return { x: col * 80 + 50, y: row * 80 + 50 }
    }
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

  // Export ข้อมูลเป็น Excel
  const exportToExcel = async () => {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ระบบจองโต๊ะงานแต่งงาน</h1>
              <p className="text-gray-600 mt-2">จำนวนโต๊ะที่จองแล้ว: {bookings.length} โต๊ะ</p>
            </div>
            <div className="space-x-4">
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                📊 Export CSV
              </button>
              <button
                onClick={loadBookings}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {/* แผนผังโต๊ะ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">แผนผังโต๊ะ</h2>
          
          {/* Legend */}
          <div className="flex space-x-6 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>โต๊ะว่าง</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>โต๊ะที่จองแล้ว</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>โต๊ะที่เลือก</span>
            </div>
          </div>

          {/* โซนด้านใน */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center">🏛️ หอประชุม (โต๊ะ 1-41)</h3>
            <div className="border-4 border-gray-400 rounded-lg p-6 bg-gray-50 relative">
              <div className="grid grid-cols-7 gap-4">
                {tables.filter(t => t.zone === 'inside').map(table => (
                  <button
                    key={table.table_number}
                    onClick={() => {
                      if (table.is_booked) {
                        if (confirm('โต๊ะนี้จองแล้ว ต้องการดูรายละเอียดหรือยกเลิกการจองหรือไม่?')) {
                          handleCancelBooking(table.table_number)
                        }
                      } else {
                        setSelectedTable(table.table_number)
                        setShowBookingForm(true)
                      }
                    }}
                    className={`
                      w-16 h-16 rounded-lg font-bold text-white transition-all hover:scale-105
                      ${table.is_booked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : selectedTable === table.table_number
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-green-500 hover:bg-green-600'
                      }
                    `}
                    title={table.is_booked ? `จองแล้ว: ${table.booking?.guest_name}` : 'คลิกเพื่อจอง'}
                  >
                    {table.table_number}
                  </button>
                ))}
              </div>
              
              {/* ทางเดิน */}
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
                <div className="w-full h-2 bg-orange-400 opacity-50"></div>
                <div className="text-center text-sm text-orange-600 font-semibold">ทางเดิน</div>
              </div>
            </div>
          </div>

          {/* โซนด้านนอก */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">🌳 บริเวณด้านนอก (โต๊ะ 42+)</h3>
            <div className="border-4 border-green-400 rounded-lg p-6 bg-green-50">
              <div className="grid grid-cols-6 gap-4">
                {tables.filter(t => t.zone === 'outside').map(table => (
                  <button
                    key={table.table_number}
                    onClick={() => {
                      if (table.is_booked) {
                        if (confirm('โต๊ะนี้จองแล้ว ต้องการดูรายละเอียดหรือยกเลิกการจองหรือไม่?')) {
                          handleCancelBooking(table.table_number)
                        }
                      } else {
                        setSelectedTable(table.table_number)
                        setShowBookingForm(true)
                      }
                    }}
                    className={`
                      w-16 h-16 rounded-lg font-bold text-white transition-all hover:scale-105
                      ${table.is_booked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : selectedTable === table.table_number
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-green-500 hover:bg-green-600'
                      }
                    `}
                    title={table.is_booked ? `จองแล้ว: ${table.booking?.guest_name}` : 'คลิกเพื่อจอง'}
                  >
                    {table.table_number}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* รายการการจองทั้งหมด */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">รายการการจองทั้งหมด</h2>
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ยังไม่มีการจองโต๊ะ</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">หมายเลขโต๊ะ</th>
                    <th className="border p-2 text-left">ชื่อผู้จอง</th>
                    <th className="border p-2 text-left">เบอร์โทรศัพท์</th>
                    <th className="border p-2 text-left">จำนวนคน</th>
                    <th className="border p-2 text-left">โซน</th>
                    <th className="border p-2 text-left">หมายเหตุ</th>
                    <th className="border p-2 text-left">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="border p-2 font-bold">โต๊ะ {booking.table_number}</td>
                      <td className="border p-2">{booking.guest_name}</td>
                      <td className="border p-2">{booking.phone_number}</td>
                      <td className="border p-2">{booking.party_size} คน</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          booking.zone === 'inside' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {booking.zone === 'inside' ? 'ด้านใน' : 'ด้านนอก'}
                        </span>
                      </td>
                      <td className="border p-2">{booking.notes || '-'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleCancelBooking(booking.table_number)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          ยกเลิก
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    party_size: 1,
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
        <h3 className="text-xl font-bold mb-4">
          จองโต๊ะ {tableNumber} ({zone === 'inside' ? 'ด้านใน' : 'ด้านนอก'})
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อผู้จอง *</label>
            <input
              type="text"
              value={formData.guest_name}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="กรอกชื่อผู้จอง"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์ *</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="กรอกเบอร์โทรศัพท์"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">จำนวนคน</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.party_size}
              onChange={(e) => setFormData(prev => ({ ...prev, party_size: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              จองโต๊ะ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
