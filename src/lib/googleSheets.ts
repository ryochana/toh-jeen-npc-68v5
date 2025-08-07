// Google Sheets CSV Export Configuration
export const GOOGLE_SHEETS_CONFIG = {
  SHEET_ID: '1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40', // จาก URL ที่คุณส่งมา
  GID: '1917120107', // gid ของชีท "โต๊ะจีน"
  CSV_URL: `https://docs.google.com/spreadsheets/d/1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40/export?format=csv&gid=1917120107`
}

export interface SheetBooking {
  orderNumber: number      // คอลัมน์ A - ที่ (ลำดับการจอง)
  guestName: string       // คอลัมน์ B - ชื่อ-สกุล
  partySize: number       // คอลัมน์ C - จำนวน (ไม่แสดงผล)
  paymentStatus: string   // คอลัมน์ D - การชำระเงิน (สำคัญสุด!)
  tableNumbers: string    // คอลัมน์ E - หมายเลขโต๊ะ (รองรับหลายโต๊ะ)
  receiver: string        // คอลัมน์ F - ผู้รับเงิน
  paymentDate: string     // คอลัมน์ G - เวลาจ่าย
  phoneNumber: string     // คอลัมน์ H - เบอร์
}

// แปลงข้อมูล CSV เป็น array
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim())
  return lines.map(line => {
    // แยก CSV โดยคำนึงถึง comma ใน quotes
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

// แปลงข้อมูลจาก CSV เป็น format ที่ใช้ในแอป
export function parseSheetData(csvText: string): SheetBooking[] {
  const rows = parseCSV(csvText)
  
  if (rows.length <= 1) return [] // ไม่มีข้อมูลหรือมีแค่ header
  
  // ข้าม header row (แถวแรก) และแปลงข้อมูล
  return rows
    .slice(1) // ข้าม header
    .filter(row => row[1] && row[1].toString().trim()) // กรองแถวที่มีชื่อ-สกุล
    .map(row => ({
      orderNumber: parseInt(row[0]?.toString() || '0'),
      guestName: row[1]?.toString() || '',
      partySize: parseInt(row[2]?.toString() || '1'),
      paymentStatus: row[3]?.toString() || '',
      tableNumbers: row[4]?.toString() || '', // หมายเลขโต๊ะ (อาจมีหลายโต๊ะแยกด้วย ,)
      receiver: row[5]?.toString() || '', // ผู้รับเงิน
      paymentDate: row[6]?.toString() || '', // เวลาจ่าย
      phoneNumber: row[7]?.toString() || '' // เบอร์
    }))
    .filter(booking => booking.guestName) // กรองเฉพาะที่มีชื่อ
}

// ดึงข้อมูลจาก Google Sheets ผ่าน API route (เพื่อแก้ปัญหา CORS)
export async function fetchSheetData(): Promise<SheetBooking[]> {
  try {
    console.log('Fetching from Google Sheets via API route...')
    
    const response = await fetch('/api/sheets', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const csvText = await response.text()
    console.log('Raw CSV data:', csvText.substring(0, 200) + '...')
    
    const bookings = parseSheetData(csvText)
    console.log('Parsed bookings:', bookings)
    
    return bookings
  } catch (error) {
    console.error('Error fetching from Google Sheets CSV:', error)
    throw error
  }
}

// แปลง SheetBooking เป็น TableBooking format เดิม
// เนื่องจาก 1 SheetBooking อาจมีหลายโต๊ะ จึงต้อง return array
export function convertToTableBookings(sheetBooking: SheetBooking): any[] {
  // แยกหมายเลขโต๊ะ เช่น "5,6,7" เป็น [5, 6, 7]
  const tableNumbers = sheetBooking.tableNumbers
    .split(',')
    .map(num => parseInt(num.trim()))
    .filter(num => !isNaN(num) && num > 0)
  
  // ถ้าไม่มีหมายเลขโต๊ะ ให้ return array ว่าง
  if (tableNumbers.length === 0) return []
  
  // สร้าง TableBooking สำหรับแต่ละโต๊ะ
  return tableNumbers.map(tableNum => ({
    id: tableNum,
    table_number: tableNum,
    guest_name: sheetBooking.guestName,
    phone_number: sheetBooking.phoneNumber,
    party_size: Math.ceil(sheetBooking.partySize / tableNumbers.length) || 8, // แบ่งจำนวนคนตามจำนวนโต๊ะ
    booking_date: sheetBooking.paymentDate || new Date().toISOString(),
    payment_date: sheetBooking.paymentStatus.includes('จ่าย') ? sheetBooking.paymentDate : null,
    notes: sheetBooking.receiver ? `ผู้รับเงิน: ${sheetBooking.receiver}` : '',
    zone: tableNum <= 41 ? 'inside' : 'outside',
    payment_status: sheetBooking.paymentStatus.includes('จ่าย') ? 'paid' : 'booked',
    created_at: new Date().toISOString()
  }))
}
