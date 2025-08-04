import { NextResponse } from 'next/server'
import { supabase, type TableBooking } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // ดึงข้อมูลการจองทั้งหมดจาก Supabase พร้อมข้อมูลล่าสุด
    const { data: bookings, error } = await supabase
      .from('table_bookings')
      .select('*')
      .order('table_number')

    if (error) throw error

    // สร้าง Excel data
    const headers = ['หมายเลขโต๊ะ', 'ชื่อผู้จอง', 'เบอร์โทรศัพท์', 'จำนวนคน', 'วันที่จอง', 'โซน', 'สถานะการชำระ', 'หมายเหตุ']
    
    const excelRows = bookings?.map((booking: TableBooking) => [
      booking.table_number,
      booking.guest_name,
      booking.phone_number,
      booking.party_size,
      new Date(booking.booking_date).toLocaleDateString('th-TH'),
      booking.zone === 'inside' ? 'ด้านในหอประชุม' : 'ด้านนอกหอประชุม',
      booking.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองเฉยๆ',
      booking.notes || '-'
    ]) || []

    // สร้าง worksheet
    const worksheetData = [headers, ...excelRows]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // สร้าง workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการจองโต๊ะ')

    // แปลงเป็น buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // สร้างชื่อไฟล์พร้อมวันที่
    const fileName = `รายการจองโต๊ะงานแต่งงาน_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`

    // ส่งไฟล์กลับ
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    })

  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการ export ข้อมูล' },
      { status: 500 }
    )
  }
}
