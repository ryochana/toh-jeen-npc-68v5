<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# โปรเจ็กต์ระบบจองโต๊ะงานแต่งงาน

นี่คือโปรเจ็กต์ Next.js TypeScript สำหรับระบบจองโต๊ะงานแต่งงาน ที่เชื่อมต่อกับ Supabase และมีฟีเจอร์ export ข้อมูลเป็น CSV

## เทคโนโลยีที่ใช้
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- React hooks

## ฟีเจอร์หลัก
- แผนผังโต๊ะแบบ interactive (โต๊ะ 1-41 ด้านใน, 42+ ด้านนอก)
- ระบบจองโต๊ะแบบ real-time
- การแบ่งโซนตามรูปแบบหอประชุม
- Export ข้อมูลเป็น CSV ภาษาไทย
- ระบบยกเลิกการจอง
- UI/UX เป็นภาษาไทยทั้งหมด

## การจัดการ State
- ใช้ React hooks สำหรับจัดการ state ภายใน component
- เชื่อมต่อ Supabase โดยตรงสำหรับ database operations
- Real-time updates หลังจาก CRUD operations

เมื่อทำการแก้ไขโค้ด ให้คำนึงถึง:
1. การจัดการ TypeScript types อย่างเข้มงวด
2. การใช้ Tailwind CSS สำหรับ styling
3. การทำงานกับ Supabase client
4. การจัดการ error handling ที่เหมาะสม
5. การใช้ภาษาไทยในทุกส่วนของ UI
