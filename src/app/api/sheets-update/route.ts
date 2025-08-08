import { NextRequest, NextResponse } from 'next/server'

// Google Sheets API configuration
const SHEET_ID = '1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40'
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || ''

interface SheetBooking {
  orderNumber: number
  guestName: string
  partySize: number
  paymentStatus: string
  tableNumbers: string
  receiver: string
  paymentDate: string
  phoneNumber: string
}

// ดึงข้อมูลจาก Google Sheets
async function getSheetData(): Promise<SheetBooking[]> {
  const range = 'A:H' // คอลัมน์ A ถึง H
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch sheet data')
  }
  
  const data = await response.json()
  const rows = data.values || []
  
  // แปลงข้อมูลเป็น array ของ SheetBooking (ข้าม header row)
  return rows.slice(1).map((row: string[], index: number) => ({
    orderNumber: parseInt(row[0]) || index + 1,
    guestName: row[1] || '',
    partySize: parseInt(row[2]) || 8,
    paymentStatus: row[3] || '',
    tableNumbers: row[4] || '',
    receiver: row[5] || '',
    paymentDate: row[6] || '',
    phoneNumber: row[7] || ''
  })).filter(entry => entry.guestName) // แสดงเฉพาะที่มีชื่อ
}

// อัปเดตข้อมูลใน Google Sheets
async function updateSheetData(data: SheetBooking): Promise<void> {
  // ดึงข้อมูลปัจจุบันก่อน
  const currentData = await getSheetData()
  
  // หาแถวที่ต้องอัปเดต (ตาม orderNumber)
  const existingIndex = currentData.findIndex(item => item.orderNumber === data.orderNumber)
  
  let rowIndex: number
  if (existingIndex >= 0) {
    // แก้ไขข้อมูลเดิม (เพิ่ม 2 เพราะ index 0 คือ header และ array เริ่มจาก 0)
    rowIndex = existingIndex + 2
  } else {
    // เพิ่มข้อมูลใหม่ที่แถวสุดท้าย
    rowIndex = currentData.length + 2
  }
  
  // เตรียมข้อมูลสำหรับอัปเดต
  const values = [[
    data.orderNumber,
    data.guestName,
    data.partySize,
    data.paymentStatus,
    data.tableNumbers,
    data.receiver,
    data.paymentDate,
    data.phoneNumber
  ]]
  
  const range = `A${rowIndex}:H${rowIndex}`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: values
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update sheet: ${error}`)
  }
}

// ลบข้อมูลจาก Google Sheets
async function deleteSheetData(orderNumber: number): Promise<void> {
  // ดึงข้อมูลปัจจุบันก่อน
  const currentData = await getSheetData()
  
  // หาแถวที่ต้องลบ
  const existingIndex = currentData.findIndex(item => item.orderNumber === orderNumber)
  
  if (existingIndex < 0) {
    throw new Error('ไม่พบข้อมูลที่ต้องการลบ')
  }
  
  // คำนวณ rowIndex (เพิ่ม 2 เพราะ index 0 คือ header และ array เริ่มจาก 0)
  const rowIndex = existingIndex + 2
  
  // ลบแถวโดยการเคลียร์ข้อมูล
  const range = `A${rowIndex}:H${rowIndex}`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:clear?key=${API_KEY}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to delete sheet data: ${error}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Google Sheets API Key ยังไม่ได้ตั้งค่า กรุณาตั้งค่า GOOGLE_SHEETS_API_KEY ใน environment variables' },
        { status: 500 }
      )
    }

    const data: SheetBooking = await request.json()
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data.guestName) {
      return NextResponse.json(
        { error: 'ต้องระบุชื่อผู้จอง' },
        { status: 400 }
      )
    }
    
    console.log('Updating sheet data:', data)
    await updateSheetData(data)
    
    return NextResponse.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' })
  } catch (error) {
    console.error('Error updating sheet:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Google Sheets API Key ยังไม่ได้ตั้งค่า กรุณาตั้งค่า GOOGLE_SHEETS_API_KEY ใน environment variables' },
        { status: 500 }
      )
    }

    const url = new URL(request.url)
    const orderNumber = parseInt(url.searchParams.get('orderNumber') || '0')
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'ต้องระบุหมายเลขลำดับที่ต้องการลบ' },
        { status: 400 }
      )
    }
    
    console.log('Deleting sheet data for orderNumber:', orderNumber)
    await deleteSheetData(orderNumber)
    
    return NextResponse.json({ success: true, message: 'ลบข้อมูลสำเร็จ' })
  } catch (error) {
    console.error('Error deleting sheet data:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูล: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
