import { NextResponse } from 'next/server'

const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40/export?format=csv&gid=1917120107'

export async function GET() {
  try {
    console.log('Fetching from Google Sheets CSV via API route...')
    
    const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const csvText = await response.text()
    console.log('CSV data fetched successfully, length:', csvText.length)
    
    return new NextResponse(csvText, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('Error fetching CSV:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets' },
      { status: 500 }
    )
  }
}
