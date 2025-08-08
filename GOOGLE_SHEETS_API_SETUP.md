# การตั้งค่า Google Sheets API Key

## ขั้นตอนการสร้าง Google Sheets API Key

### 1. เข้าไปที่ Google Cloud Console
- ไปที่: https://console.cloud.google.com/

### 2. สร้างหรือเลือก Project
- ถ้ายังไม่มี Project ให้สร้างใหม่
- ถ้ามีแล้วให้เลือก Project ที่ต้องการใช้

### 3. เปิดใช้งาน Google Sheets API
- ไปที่ **APIs & Services > Library**
- ค้นหา "Google Sheets API"
- คลิก **ENABLE**

### 4. สร้าง API Key
- ไปที่ **APIs & Services > Credentials**
- คลิก **+ CREATE CREDENTIALS**
- เลือก **API key**
- คัดลอก API Key ที่ได้

### 5. จำกัดสิทธิ์ API Key (แนะนำ)
- คลิกที่ API Key ที่สร้างใหม่
- ใน **API restrictions** เลือก **Restrict key**
- เลือกเฉพาะ **Google Sheets API**
- คลิก **SAVE**

### 6. ตั้งค่าใน Project
- เปิดไฟล์ `.env.local`
- แก้ไขบรรทัด:
```
GOOGLE_SHEETS_API_KEY=ใส่_API_Key_ที่ได้จากขั้นตอนที่_4
```

### 7. รีสตาร์ท Development Server
```bash
npm run dev
```

## หมายเหตุ
- Google Sheets ที่ใช้ต้องเป็น **Public** หรือ **Anyone with the link can view**
- API Key นี้ใช้สำหรับอ่านและเขียนข้อมูลใน Google Sheets โดยตรง
- ไม่ต้องสร้าง Google Apps Script อีกแล้ว

## การแก้ไขปัญหา
- ถ้าได้ error "API key not valid" ให้ตรวจสอบว่า Google Sheets API เปิดใช้งานแล้ว
- ถ้าได้ error "The caller does not have permission" ให้ตรวจสอบว่า Google Sheets เป็น Public
- ถ้าได้ error อื่นๆ ให้ดู Console logs ใน Browser Developer Tools
