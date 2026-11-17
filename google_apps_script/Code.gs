/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT BACKEND CHO LANDING PAGE GIÀY THỂ THAO BẢO HỘ
 * Nhận đơn hàng từ Landing Page (GitHub Pages) -> Lưu tự động vào Google Sheet "Orders"
 * Hỗ trợ thông báo tức thì về Telegram Bot kèm nút Gọi điện / Nhắn Zalo
 * =========================================================================================
 */

// Cấu hình tên Sheet lưu đơn
const SHEET_ORDERS_NAME = "Orders";

/**
 * 1. Xử lý GET request (Dùng để kiểm tra trạng thái Web App hoạt động)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Backend cho Landing Page Giày Thể Thao đang hoạt động tốt!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 2. Xử lý POST request khi khách bấm "Đặt ngay" trên Landing Page
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Khóa lock 30s để tránh xung đột ghi đè đồng thời nhiều đơn
  lock.tryLock(30000);

  try {
    let data = {};

    // Phân tích dữ liệu gửi lên (Hỗ trợ cả JSON body lẫn Form URL Encoded)
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // 1. Chuẩn hóa dữ liệu
    const now = new Date();
    const timeFormatted = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");
    
    // Tạo mã đơn hàng ngẫu nhiên nếu client chưa truyền
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const dateCode = Utilities.formatDate(now, "GMT+7", "yyMMdd");
    const orderId = data.order_id || ("DH-" + dateCode + "-" + randStr);

    const fullName = (data.full_name || "").toString().trim();
    
    // Đảm bảo SĐT luôn giữ số 0 ở đầu khi lưu vào Google Sheets
    let rawPhone = (data.phone_number || "").toString().trim().replace(/[\s\.\-\(\)]/g, "");
    if (rawPhone.startsWith("+84")) {
      rawPhone = "0" + rawPhone.slice(3);
    } else if (rawPhone.startsWith("84") && rawPhone.length > 9) {
      rawPhone = "0" + rawPhone.slice(2);
    }
    const phoneFormatted = "'" + rawPhone; // Dấu nháy đơn ép Sheets hiểu là kiểu chuỗi (Text)

    const province = (data.province || "").toString().trim();
    const district = (data.district || "").toString().trim();
    const address = (data.address || "").toString().trim();
    const fullAddress = address + (district ? ", " + district : "") + (province ? ", " + province : "");

    const product = (data.product || "Giày Thể Thao").toString().trim();
    const size = (data.size || "40").toString().trim();
    const quantity = parseInt(data.quantity) || 1;
    
    // Xác định đơn giá & thành tiền
    let price = data.price || "329.000đ";
    if (product.includes("cổ cao") || product.includes("399")) {
      price = "399.000đ";
    }
    const totalAmount = data.total_amount || price;
    const status = data.status || "Chờ xác nhận";
    const note = (data.note || "Đơn đặt từ Landing Page").toString().trim();

    // 2. Mở Spreadsheet & Khởi tạo Sheet Orders nếu chưa có
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_ORDERS_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_ORDERS_NAME);
      // Thiết lập hàng tiêu đề chuẩn
      const headers = [
        "Thời gian",
        "Mã đơn hàng",
        "Họ và tên",
        "Số điện thoại",
        "Tỉnh / Thành",
        "Quận / Huyện",
        "Địa chỉ chi tiết",
        "Sản phẩm",
        "Size",
        "Số lượng",
        "Đơn giá",
        "Tổng tiền",
        "Trạng thái",
        "Ghi chú"
      ];
      sheet.appendRow(headers);

      // Định dạng hàng tiêu đề đẹp mắt
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1a202c")
                 .setFontColor("#ffffff")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // 3. Ghi dòng đơn hàng mới vào Google Sheet
    sheet.appendRow([
      timeFormatted,
      orderId,
      fullName,
      phoneFormatted,
      province,
      district,
      address,
      product,
      size,
      quantity,
      price,
      totalAmount,
      status,
      note
    ]);

    // 4. (Tùy chọn) Gửi thông báo về Telegram Bot nếu đã cấu hình
    try {
      sendTelegramNotification({
        orderId: orderId,
        fullName: fullName,
        phone: rawPhone,
        address: fullAddress,
        product: product,
        size: size,
        totalAmount: totalAmount,
        time: timeFormatted
      });
    } catch (telegramErr) {
      Logger.log("Telegram notification error: " + telegramErr.toString());
    }

    // 5. Trả về kết quả JSON thành công
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      order_id: orderId,
      message: "Đơn hàng của quý khách đã được lưu thành công!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Lỗi doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. Hàm gửi tin nhắn Telegram Bot kèm nút bấm gọi nhanh (Tùy chọn)
 * Cấu hình: Mở Tiện ích mở rộng -> Thuộc tính dự án (Script Properties)
 * - TELEGRAM_BOT_TOKEN: Token của bot Telegram (ví dụ: 123456:ABC-DEF...)
 * - TELEGRAM_CHAT_ID: Chat ID nhóm hoặc cá nhân nhận đơn (ví dụ: -10012345678)
 */
function sendTelegramNotification(order) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  const chatId = props.getProperty("TELEGRAM_CHAT_ID");

  if (!botToken || !chatId) {
    return; // Chưa cấu hình Telegram thì bỏ qua
  }

  const messageText = 
    "🛒 <b>ĐƠN HÀNG MỚI TỪ LANDING PAGE!</b>\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "🆔 <b>Mã đơn:</b> <code>" + order.orderId + "</code>\n" +
    "⏰ <b>Thời gian:</b> " + order.time + "\n" +
    "👤 <b>Khách hàng:</b> " + order.fullName + "\n" +
    "📞 <b>Điện thoại:</b> <code>" + order.phone + "</code>\n" +
    "📍 <b>Địa chỉ:</b> " + order.address + "\n" +
    "👟 <b>Sản phẩm:</b> " + order.product + "\n" +
    "📏 <b>Size giày:</b> " + order.size + "\n" +
    "💰 <b>Tổng tiền:</b> <b>" + order.totalAmount + "</b>\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "⚡ <i>Vui lòng gọi xác nhận đơn sớm cho khách!</i>";

  const payload = {
    chat_id: chatId,
    text: messageText,
    parse_mode: "HTML",
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          { text: "📞 Gọi Khách Ngay", url: "tel:" + order.phone },
          { text: "💬 Nhắn Tin Zalo", url: "https://zalo.me/" + order.phone }
        ]
      ]
    })
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", options);
}
