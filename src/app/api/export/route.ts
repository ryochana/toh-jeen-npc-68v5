import { NextResponse } from 'next/server'
import { supabase, type TableBooking } from '@/lib/supabase'

export async function GET() {
  try {
    // ดึงข้อมูลการจองทั้งหมดจาก Supabase
    const { data: bookings, error } = await supabase
      .from('table_bookings')
      .select('*')
      .order('table_number')

    if (error) throw error

    // สร้าง CSV content
    const headers = ['หมายเลขโต๊ะ', 'ชื่อผู้จอง', 'เบอร์โทรศัพท์', 'จำนวนคน', 'วันที่จอง', 'โซน', 'หมายเหตุ']
    
    const csvRows = bookings?.map((booking: TableBooking) => [
      booking.table_number,
      booking.guest_name,
      booking.phone_number,
      booking.party_size,
      new Date(booking.booking_date).toLocaleDateString('th-TH'),
      booking.zone === 'inside' ? 'ด้านในหอประชุม' : 'ด้านนอกหอประชุม',
      booking.notes || '-'
    ]) || []

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // เพิ่ม BOM สำหรับ UTF-8
    const csvWithBOM = '\uFEFF' + csvContent

    // สร้างชื่อไฟล์พร้อมวันที่
    const fileName = `รายการจองโต๊ะงานแต่งงาน_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.csv`

    // ส่งไฟล์กลับ
    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
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
