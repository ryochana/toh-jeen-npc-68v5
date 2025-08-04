-- สร้างตาราง table_bookings ใน Supabase
-- รันคำสั่งนี้ใน SQL Editor ของ Supabase

CREATE TABLE IF NOT EXISTS table_bookings (
  id BIGSERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  zone TEXT NOT NULL CHECK (zone IN ('inside', 'outside')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- เพิ่ม index เพื่อ performance
CREATE INDEX IF NOT EXISTS idx_table_bookings_table_number ON table_bookings(table_number);
CREATE INDEX IF NOT EXISTS idx_table_bookings_zone ON table_bookings(zone);
CREATE INDEX IF NOT EXISTS idx_table_bookings_booking_date ON table_bookings(booking_date);

-- เพิ่ม Row Level Security (RLS)
ALTER TABLE table_bookings ENABLE ROW LEVEL SECURITY;

-- สร้าง policy ให้ทุกคนสามารถอ่านและเขียนได้ (สำหรับการใช้งานเบื้องต้น)
-- ในการใช้งานจริง ควรปรับ policy ให้เหมาะสม
CREATE POLICY "Allow all operations on table_bookings" ON table_bookings
  FOR ALL USING (true) WITH CHECK (true);

-- เพิ่มข้อมูลตัวอย่าง (ถ้าต้องการ)
INSERT INTO table_bookings (table_number, guest_name, phone_number, party_size, zone, notes) VALUES
  (1, 'นายสมชาย ใจดี', '081-234-5678', 8, 'inside', 'โต๊ะญาติฝ่ายเจ้าบาว'),
  (5, 'นางสาวปิยดา สวยงาม', '089-876-5432', 10, 'inside', 'โต๊ะเพื่อนเจ้าสาว'),
  (42, 'นายวิชาญ รักสนุก', '092-111-2222', 6, 'outside', 'โต๊ะเพื่อนร่วมงาน')
ON CONFLICT (table_number) DO NOTHING;
