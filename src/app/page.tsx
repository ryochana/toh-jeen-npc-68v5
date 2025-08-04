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
      const { data, error } = await supabase
        .from('table_bookings')
        .select('*')
        .order('table_number')
      
      if (error) throw error
      
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
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async (bookingData: Omit<TableBooking, 'id' | 'created_at'>) => {
    try {
      const existingBooking = tables.find(t => t.table_number === bookingData.table_number)?.booking
      
      if (existingBooking) {
        const { error } = await supabase
          .from('table_bookings')
          .update(bookingData)
          .eq('table_number', bookingData.table_number)
        
        if (error) throw error
        alert('แก้ไขข้อมูลการจองสำเร็จ!')
      } else {
        const { error } = await supabase
          .from('table_bookings')
          .insert([bookingData])
        
        if (error) throw error
        alert('จองโต๊ะสำเร็จ!')
      }
      
      await loadBookings()
      setShowBookingForm(false)
      setSelectedTable(null)
    } catch (error) {
      console.error('Error booking table:', error)
      alert('เกิดข้อผิดพลาดในการจองโต๊ะ')
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
      const response = await fetch('/api/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `รายการจองโต๊ะ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`
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
    <div className="min-h-screen bg-purple-900 text-white p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">ระบบจองโต๊ะงานแต่ง</h1>
        <div className="mb-4">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 mr-4"
          >
            📊 Export Excel
          </button>
          <button
            onClick={loadBookings}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 รีเฟรช
          </button>
        </div>
        <div className="bg-black bg-opacity-50 text-white p-4 rounded-lg inline-block">
          <div>จำนวนโต๊ะที่จองแล้ว: {bookings.length} โต๊ะ</div>
          <div>จำนวนโต๊ะที่จ่ายแล้ว: {bookings.filter(b => b.payment_status === 'paid').length} โต๊ะ</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4 bg-blue-600 px-4 py-2 rounded-lg">
              ด้านนอกหอประชุม (1-27)
            </h3>
            <div className="grid grid-cols-3 gap-3">
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
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${getTableColor()}
                    `}
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold mb-4 bg-red-600 px-4 py-2 rounded-lg">
              ด้านในหอประชุม (28-41)
            </h3>
            <div className="grid grid-cols-2 gap-3">
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
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${getTableColor()}
                    `}
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold mb-4 bg-blue-600 px-4 py-2 rounded-lg">
              ด้านนอกหอประชุม (42-65)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[42,43,44,63,64,65,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62].map((tableNum) => {
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
                      w-16 h-16 rounded-full text-white font-bold text-lg transition-all hover:scale-105
                      ${getTableColor()}
                    `}
                  >
                    {tableNum}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
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
          
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
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
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                ลบการจอง
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {existingBooking ? 'บันทึกการแก้ไข' : 'จองโต๊ะ (2,000 บาท)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
