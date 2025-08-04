# ระบบจองโต๊ะงานแต่งงาน 💒

เว็บแอปพลิเคชันสำหรับจัดการการจองโต๊ะงานแต่งงาน พัฒนาด้วย Next.js และ Supabase

## ✨ ฟีเจอร์หลัก

- 🗺️ **แผนผังโต๊ะแบบ Interactive** - แสดงโต๊ะทั้งหมดพร้อมสถานะการจอง
- 🏛️ **การแบ่งโซน** - โต๊ะ 1-41 (ด้านในหอประชุม) และ 42+ (ด้านนอก)
- 📝 **ระบบจองโต๊ะ** - จองโต๊ะพร้อมข้อมูลผู้จอง
- 📊 **Export ข้อมูล** - ส่งออกรายงานเป็น CSV ภาษาไทย
- 🔄 **Real-time Updates** - อัปเดตสถานะการจองแบบทันที
- ❌ **ยกเลิกการจอง** - จัดการการยกเลิกได้ง่าย

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel Ready

## 🚀 การติดตั้งและใช้งาน

### 1. Clone โปรเจ็กต์
\`\`\`bash
git clone <repository-url>
cd wedding-table-booking
\`\`\`

### 2. ติดตั้ง Dependencies
\`\`\`bash
npm install
# หรือ
yarn install
\`\`\`

### 3. ตั้งค่า Supabase
1. เข้าไปที่ [Supabase](https://supabase.com)
2. สร้างโปรเจ็กต์ใหม่
3. รันคำสั่ง SQL ในไฟล์ \`supabase-setup.sql\`
4. คัดลอก URL และ API Key

### 4. ตั้งค่า Environment Variables
สร้างไฟล์ \`.env.local\`:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 5. รันโปรเจ็กต์
\`\`\`bash
npm run dev
\`\`\`

เปิดเบราว์เซอร์ไปที่ \`http://localhost:3000\`

## 📋 โครงสร้างฐานข้อมูล

### ตาราง \`table_bookings\`
- \`id\` - Primary key
- \`table_number\` - หมายเลขโต๊ะ (unique)
- \`guest_name\` - ชื่อผู้จอง
- \`phone_number\` - เบอร์โทรศัพท์
- \`party_size\` - จำนวนคน
- \`booking_date\` - วันที่จอง
- \`notes\` - หมายเหตุ
- \`zone\` - โซน ('inside' หรือ 'outside')
- \`created_at\` - วันที่สร้างรายการ

## 🗺️ การจัดเรียงโต๊ะ

### โซนด้านใน (หอประชุม)
- โต๊ะหมายเลข 1-41
- จัดเรียงเป็นแถวใน layout แบบห้องประชุม
- มีทางเดินแบ่งตรงกลาง

### โซนด้านนอก
- โต๊ะหมายเลข 42 ขึ้นไป
- จัดเรียงรอบบริเวณด้านนอกหอประชุม

## 🎨 การใช้งาน UI

1. **เลือกโต๊ะ**: คลิกที่โต๊ะสีเขียว (ว่าง) เพื่อจอง
2. **ดูข้อมูลการจอง**: คลิกที่โต๊ะสีแดง (จองแล้ว) เพื่อดูรายละเอียด
3. **ยกเลิกการจอง**: คลิกที่โต๊ะที่จองแล้วและเลือกยกเลิก
4. **Export ข้อมูล**: คลิกปุ่ม "Export CSV" เพื่อดาวน์โหลดรายงาน

## 🎯 สี Layout
- 🟢 **สีเขียว**: โต๊ะว่าง (คลิกได้)
- 🔴 **สีแดง**: โต๊ะที่จองแล้ว
- 🔵 **สีน้ำเงิน**: โต๊ะที่เลือก
- 🟠 **ทางเดิน**: เส้นสีส้มแบ่งโซน

## 🚀 Deploy บน Vercel

1. Push โค้ดขึ้น GitHub
2. เชื่อมต่อ GitHub repository กับ Vercel
3. ตั้งค่า Environment Variables ใน Vercel
4. Deploy!

## 📝 การปรับแต่ง

### เพิ่มโต๊ะใหม่
แก้ไขใน \`src/app/page.tsx\`:
\`\`\`typescript
// เพิ่มจำนวนโต๊ะในฟังก์ชัน initializeTables()
for (let i = 42; i <= 80; i++) { // เปลี่ยนจาก 60 เป็น 80
  // ...
}
\`\`\`

### ปรับ Layout โต๊ะ
แก้ไขฟังก์ชัน \`getTablePosition()\` ใน \`src/app/page.tsx\`

## 📄 ไฟล์สำคัญ

- \`src/app/page.tsx\` - หน้าหลักและ logic การจองโต๊ะ
- \`src/app/api/export/route.ts\` - API สำหรับ export ข้อมูล
- \`src/lib/supabase.ts\` - การตั้งค่า Supabase client
- \`supabase-setup.sql\` - SQL สำหรับสร้างตาราง

## 🤝 การมีส่วนร่วม

1. Fork โปรเจ็กต์
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push และสร้าง Pull Request

## 📞 การติดต่อ

หากมีคำถามหรือข้อเสนอแนะ กรุณาสร้าง Issue ใน GitHub

---

**พัฒนาด้วยความรักสำหรับคู่รักทุกคู่ 💕**
