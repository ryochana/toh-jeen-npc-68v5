import { NextResponse } from 'next/server'

// Google Apps Script Web App URL ที่จะสร้างทีหลัง
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || ''

export async function POST(request: Request) {
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'Google Apps Script URL ยังไม่ได้ตั้งค่า' },
        { status: 500 }
      )
    }

    const body = await request.json()
    console.log('Updating Google Sheets with data:', body)

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Google Sheets update result:', result)

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error('Error updating Google Sheets:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดต Google Sheets: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'Google Apps Script URL ยังไม่ได้ตั้งค่า' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'ไม่พบหมายเลขลำดับที่ต้องการลบ' },
        { status: 400 }
      )
    }

    console.log('Deleting from Google Sheets, order number:', orderNumber)

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        orderNumber: parseInt(orderNumber)
      })
    })

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Google Sheets delete result:', result)

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error('Error deleting from Google Sheets:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูลจาก Google Sheets: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
