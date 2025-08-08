# การตั้งค่า Google Apps Script สำหรับการอัปเดตข้อมูล

## ขั้นตอนที่ 1: สร้าง Google Apps Script Project

1. ไปที่ [Google Apps Script](https://script.google.com/)
2. คลิก "New Project"
3. ตั้งชื่อโปรเจ็กต์ เช่น "Wedding Table Booking API"

## ขั้นตอนที่ 2: เขียนโค้ด Apps Script

คัดลอกโค้ดนี้ลงในไฟล์ `Code.gs`:

```javascript
// ID ของ Google Sheets
const SHEET_ID = '1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40';
const SHEET_NAME = 'โต๊ะจีน';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Received data:', data);
    
    if (data.action === 'delete') {
      return deleteRow(data.orderNumber);
    } else {
      return updateOrAddRow(data);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateOrAddRow(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // หาแถวที่ตรงกับ orderNumber
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) { // เริ่มจาก 1 เพื่อข้าม header
    if (values[i][0] == data.orderNumber) {
      rowIndex = i + 1; // +1 เพราะ getValues() เริ่มจาก 0 แต่ setValues() เริ่มจาก 1
      break;
    }
  }
  
  const rowData = [
    data.orderNumber,
    data.guestName,
    data.partySize,
    data.paymentStatus,
    data.tableNumbers,
    data.receiver,
    data.paymentDate,
    data.phoneNumber
  ];
  
  if (rowIndex > 0) {
    // อัปเดตแถวที่มีอยู่
    sheet.getRange(rowIndex, 1, 1, 8).setValues([rowData]);
    console.log('Updated row:', rowIndex);
  } else {
    // เพิ่มแถวใหม่
    sheet.appendRow(rowData);
    console.log('Added new row');
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, action: rowIndex > 0 ? 'updated' : 'added' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteRow(orderNumber) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // หาแถวที่ตรงกับ orderNumber
  for (let i = 1; i < values.length; i++) { // เริ่มจาก 1 เพื่อข้าม header
    if (values[i][0] == orderNumber) {
      sheet.deleteRow(i + 1); // +1 เพราะ deleteRow() เริ่มจาก 1
      console.log('Deleted row:', i + 1);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, action: 'deleted' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: 'ไม่พบข้อมูลที่ต้องการลบ' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ฟังก์ชันทดสอบ
function testUpdate() {
  const testData = {
    orderNumber: 999,
    guestName: 'ทดสอบ ระบบ',
    partySize: 8,
    paymentStatus: 'ทดสอบ',
    tableNumbers: '99',
    receiver: 'ทดสอบ',
    paymentDate: '08/08/2025 15:30',
    phoneNumber: '081-111-1111'
  };
  
  console.log(updateOrAddRow(testData));
}
```

## ขั้นตอนที่ 3: Deploy เป็น Web App

1. คลิก "Deploy" > "New deployment"
2. เลือก type: "Web app"
3. ตั้งค่า:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. คลิก "Deploy"
5. คัดลอก Web app URL ที่ได้

## ขั้นตอนที่ 4: อัปเดต Environment Variables

เพิ่มใน `.env.local`:
```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## ขั้นตอนที่ 5: ทดสอบระบบ

1. ใน Apps Script Editor คลิก "Run" บนฟังก์ชัน `testUpdate`
2. ตรวจสอบว่าข้อมูลทดสอบถูกเพิ่มใน Google Sheets
3. ลบข้อมูลทดสอบออก
4. ทดสอบจากเว็บแอป

## หมายเหตุ

- ต้องให้สิทธิ์ Apps Script ในการเข้าถึง Google Sheets
- ทุกครั้งที่แก้ไขโค้ด ต้อง Deploy ใหม่
- URL จะเปลี่ยนทุกครั้งที่ Deploy ใหม่ (เลือก "Manage deployments" > "Edit" เพื่อใช้ URL เดิม)
