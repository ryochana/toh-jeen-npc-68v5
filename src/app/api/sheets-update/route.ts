import { NextRequest, NextResponse } from 'next/server'

// Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || ''

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

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'Google Apps Script URL ยังไม่ได้ตั้งค่า กรุณาตั้งค่า GOOGLE_APPS_SCRIPT_URL ใน .env.local' },
        { status: 500 }
      )
    }

    const data: SheetBooking = await request.json()
    
    console.log('Sending data to Google Apps Script:', data)
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    return NextResponse.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ!' })
  } catch (error) {
    console.error('Error calling Google Apps Script:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'Google Apps Script URL ยังไม่ได้ตั้งค่า กรุณาตั้งค่า GOOGLE_APPS_SCRIPT_URL ใน .env.local' },
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
    
    console.log('Deleting order number:', orderNumber)
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        orderNumber: orderNumber
      })
    })

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    return NextResponse.json({ success: true, message: 'ลบข้อมูลสำเร็จ!' })
  } catch (error) {
    console.error('Error deleting from Google Apps Script:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูล: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
