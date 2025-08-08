import { useState } from 'react'
import { type SheetBooking } from '@/lib/googleSheets'

interface BookingFormProps {
  existingBooking?: SheetBooking
  onSubmit: (data: SheetBooking) => void
  onClose: () => void
  onDelete?: (orderNumber: number) => void
}

export default function SheetBookingForm({ 
  existingBooking, 
  onSubmit, 
  onClose,
  onDelete
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    orderNumber: existingBooking?.orderNumber || 0,
    guestName: existingBooking?.guestName || '',
    partySize: existingBooking?.partySize || 8,
    paymentStatus: existingBooking?.paymentStatus || '',
    tableNumbers: existingBooking?.tableNumbers || '',
    receiver: existingBooking?.receiver || '',
    paymentDate: existingBooking?.paymentDate || '',
    phoneNumber: existingBooking?.phoneNumber || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.guestName.trim()) {
      alert('กรุณากรอกชื่อ-สกุล')
      return
    }

    if (!formData.tableNumbers.trim()) {
      alert('กรุณากรอกหมายเลขโต๊ะ')
      return
    }

    onSubmit({
      orderNumber: formData.orderNumber,
      guestName: formData.guestName.trim(),
      partySize: formData.partySize,
      paymentStatus: formData.paymentStatus.trim(),
      tableNumbers: formData.tableNumbers.trim(),
      receiver: formData.receiver.trim(),
      paymentDate: formData.paymentDate.trim(),
      phoneNumber: formData.phoneNumber.trim()
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
          {existingBooking ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อ-สกุล */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              ชื่อ-สกุล *
            </label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="เช่น คุณสมชาย ใจดี"
              required
            />
          </div>

          {/* จำนวนคน */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              จำนวนคน
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.partySize}
              onChange={(e) => setFormData(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            />
          </div>

          {/* การชำระเงิน */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              การชำระเงิน *
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            >
              <option value="">-- เลือกสถานะ --</option>
              <option value="จ่ายแล้ว">จ่ายแล้ว</option>
              <option value="โอนแล้ว">โอนแล้ว</option>
              <option value="จองแล้ว">จองแล้ว</option>
              <option value="รอการชำระ">รอการชำระ</option>
              <option value="ยกเลิก">ยกเลิก</option>
            </select>
          </div>

          {/* หมายเลขโต๊ะ */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              หมายเลขโต๊ะ *
            </label>
            <input
              type="text"
              value={formData.tableNumbers}
              onChange={(e) => setFormData(prev => ({ ...prev, tableNumbers: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="เช่น 5,6,7 หรือ 12"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 สำหรับหลายโต๊ะ ให้แยกด้วยเครื่องหมายจุลภาค เช่น 5,6,7
            </div>
          </div>

          {/* ผู้รับเงิน */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              ผู้รับเงิน
            </label>
            <input
              type="text"
              value={formData.receiver}
              onChange={(e) => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="เช่น บัญชี รร, คุณสมหมาย"
            />
          </div>

          {/* เวลาจ่าย */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              เวลาจ่าย
            </label>
            <input
              type="text"
              value={formData.paymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="เช่น 01/08/2025 10:30"
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 รูปแบบ: วัน/เดือน/ปี ชั่วโมง:นาที
            </div>
          </div>

          {/* เบอร์โทร */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              placeholder="เช่น 081-234-5678"
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
            {existingBooking && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
                    onDelete(existingBooking.orderNumber)
                    onClose()
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                ลบข้อมูล
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              {existingBooking ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
