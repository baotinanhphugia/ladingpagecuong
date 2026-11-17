/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT BACKEND CHO LANDING PAGE GIÀY THỂ THAO BẢO HỘ HÙNG VIỆT
 * Nhận đơn hàng từ Landing Page & Admin -> Lưu tự động vào Google Sheet "Orders"
 * Hỗ trợ thông báo tức thì về Telegram Bot & Email
 * Cung cấp API GET/POST cho trang quản trị Admin (Đồng bộ, cập nhật, xóa đơn hàng)
 * =========================================================================================
 */

const SHEET_ORDERS_NAME = "Orders";
const SHEET_CONFIG_NAME = "Config";

/**
 * 1. Xử lý GET request (Kiểm tra ping hoặc lấy danh sách đơn cho Admin)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "ping";

  if (action === "getOrders") {
    return getOrdersList_();
  } else if (action === "getConfig") {
    return getConfig_();
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Backend cho Giày Bảo Hộ Hùng Việt đang hoạt động ổn định 24/7!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 2. Xử lý POST request (Lưu đơn mới, cập nhật trạng thái đơn, lưu cấu hình)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    const action = data.action || "newOrder";

    // Phân luồng theo action
    if (action === "saveConfig") {
      return saveConfig_(data.config);
    } else if (action === "updateOrderStatus") {
      return updateOrderStatus_(data.order_id, data.status);
    } else if (action === "deleteOrder") {
      return deleteOrder_(data.order_id);
    }

    // Mặc định: Lưu đơn hàng mới từ Landing Page hoặc Admin
    return saveNewOrder_(data);

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
 * 3. Lưu đơn hàng mới vào Sheet Orders
 */
function saveNewOrder_(data) {
  const now = new Date();
  const timeFormatted = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  
  const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateCode = Utilities.formatDate(now, "GMT+7", "yyMMdd");
  const orderId = data.order_id || ("DH-" + dateCode + "-" + randStr);

  const fullName = (data.full_name || "").toString().trim();
  let rawPhone = (data.phone_number || "").toString().trim().replace(/[\s\.\-\(\)]/g, "");
  if (rawPhone.startsWith("+84")) {
    rawPhone = "0" + rawPhone.slice(3);
  } else if (rawPhone.startsWith("84") && rawPhone.length > 9) {
    rawPhone = "0" + rawPhone.slice(2);
  }
  const phoneFormatted = "'" + rawPhone;

  const province = (data.province || "").toString().trim();
  const district = (data.district || "").toString().trim();
  const address = (data.address || "").toString().trim();
  const fullAddress = address + (district ? ", " + district : "") + (province ? ", " + province : "");

  const product = (data.product || "Giày Bảo Hộ").toString().trim();
  const size = (data.size || "40").toString().trim();
  const quantity = parseInt(data.quantity) || 1;
  const price = data.price || "329.000đ";
  const totalAmount = data.total_amount || price;
  const status = data.status || "Chờ xác nhận";
  const note = (data.note || "Đơn đặt từ Landing Page").toString().trim();

  // Khởi tạo sheet nếu chưa có
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ORDERS_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ORDERS_NAME);
    const headers = [
      "Thời gian", "Mã đơn hàng", "Họ và tên", "Số điện thoại",
      "Tỉnh / Thành", "Quận / Huyện", "Địa chỉ chi tiết",
      "Sản phẩm", "Size", "Số lượng", "Đơn giá", "Tổng tiền",
      "Trạng thái", "Ghi chú"
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#111827")
               .setFontColor("#FFC400")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  // Ghi đơn vào sheet
  sheet.appendRow([
    timeFormatted, orderId, fullName, phoneFormatted,
    province, district, address, product, size,
    quantity, price, totalAmount, status, note
  ]);

  // Thông báo Telegram Bot
  try {
    sendTelegramNotification({
      orderId: orderId,
      fullName: fullName,
      phone: rawPhone,
      address: fullAddress,
      product: product,
      size: size,
      quantity: quantity,
      totalAmount: totalAmount,
      time: timeFormatted
    });
  } catch (e) {
    Logger.log("Telegram Error: " + e.toString());
  }

  // Thông báo Email nếu có cấu hình
  try {
    sendEmailNotification({
      orderId: orderId,
      fullName: fullName,
      phone: rawPhone,
      address: fullAddress,
      product: product,
      size: size,
      quantity: quantity,
      totalAmount: totalAmount,
      time: timeFormatted
    });
  } catch (e) {
    Logger.log("Email Error: " + e.toString());
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    order_id: orderId,
    message: "Đơn hàng đã được lưu thành công vào Google Sheet!"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 4. Gửi thông báo Telegram Bot
 */
function sendTelegramNotification(order) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  const chatId = props.getProperty("TELEGRAM_CHAT_ID");

  if (!botToken || !chatId) return;

  const msg = 
    "🛒 <b>ĐƠN HÀNG MỚI - XƯỞNG GIÀY HÙNG VIỆT</b>\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "🆔 <b>Mã đơn:</b> <code>" + order.orderId + "</code>\n" +
    "⏰ <b>Thời gian:</b> " + order.time + "\n" +
    "👤 <b>Khách hàng:</b> " + order.fullName + "\n" +
    "📞 <b>Điện thoại:</b> <code>" + order.phone + "</code>\n" +
    "📍 <b>Địa chỉ:</b> " + order.address + "\n" +
    "👟 <b>Sản phẩm:</b> " + order.product + " (Size: " + order.size + " | SL: " + order.quantity + " đôi)\n" +
    "💰 <b>Tổng tiền:</b> <b>" + order.totalAmount + "</b>\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "⚡ <i>Vui lòng gọi xác nhận đơn sớm cho khách!</i>";

  const payload = {
    chat_id: chatId,
    text: msg,
    parse_mode: "HTML",
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          { text: "📞 Gọi Khách", url: "tel:" + order.phone },
          { text: "💬 Nhắn Zalo", url: "https://zalo.me/" + order.phone }
        ]
      ]
    })
  };

  UrlFetchApp.fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

/**
 * 5. Gửi thông báo Email
 */
function sendEmailNotification(order) {
  const props = PropertiesService.getScriptProperties();
  const notifyEmail = props.getProperty("NOTIFY_EMAIL");
  if (!notifyEmail) return;

  const subject = `[ĐƠN HÀNG MỚI] ${order.orderId} - Khách: ${order.fullName} (${order.totalAmount})`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #FFC400; background: #111; padding: 14px; text-align: center; border-radius: 6px; margin: 0 0 16px;">
        🛡️ ĐƠN HÀNG MỚI TỪ LANDING PAGE
      </h2>
      <p><strong>Mã đơn hàng:</strong> <span style="color: #d97706; font-weight: bold;">${order.orderId}</span></p>
      <p><strong>Thời gian:</strong> ${order.time}</p>
      <p><strong>Khách hàng:</strong> ${order.fullName}</p>
      <p><strong>Số điện thoại:</strong> <a href="tel:${order.phone}">${order.phone}</a> | <a href="https://zalo.me/${order.phone}">Chat Zalo</a></p>
      <p><strong>Địa chỉ giao:</strong> ${order.address}</p>
      <p><strong>Sản phẩm:</strong> ${order.product} (Size: ${order.size} | Số lượng: ${order.quantity} đôi)</p>
      <p><strong>Tổng thanh toán:</strong> <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${order.totalAmount}</span></p>
      <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-left: 4px solid #FFC400;">
        ⚡ <em>Hệ thống Xưởng Giày Bảo Hộ Hùng Việt</em>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: notifyEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * 6. Lấy danh sách đơn hàng cho Admin
 */
function getOrdersList_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", orders: [] })).setMimeType(ContentService.MimeType.JSON);
  }

  const values = sheet.getDataRange().getValues();
  const orders = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[1]) continue; // bỏ qua nếu không có mã đơn
    orders.push({
      order_time: row[0],
      order_id: row[1],
      full_name: row[2],
      phone_number: (row[3] || "").toString().replace(/^'/, ""),
      province: row[4],
      district: row[5],
      address: row[6],
      product: row[7],
      size: row[8],
      quantity: row[9],
      price: row[10],
      total_amount: row[11],
      status: row[12],
      note: row[13]
    });
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    orders: orders
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 7. Cập nhật trạng thái đơn hàng
 */
function updateOrderStatus_(orderId, newStatus) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS_NAME);
  if (!sheet) return jsonError_("Không tìm thấy Sheet Orders");

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === orderId) {
      sheet.getRange(i + 1, 13).setValue(newStatus); // Cột 13: Trạng thái
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã cập nhật trạng thái đơn!" })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return jsonError_("Không tìm thấy mã đơn: " + orderId);
}

/**
 * 8. Xóa đơn hàng
 */
function deleteOrder_(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS_NAME);
  if (!sheet) return jsonError_("Không tìm thấy Sheet Orders");

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === orderId) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã xóa đơn hàng!" })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return jsonError_("Không tìm thấy mã đơn: " + orderId);
}

/**
 * 9. Lưu cấu hình vào Script Properties và Sheet Config
 */
function saveConfig_(cfg) {
  if (!cfg) return jsonError_("Dữ liệu cấu hình rỗng");

  const props = PropertiesService.getScriptProperties();
  if (cfg.telegramBotToken) props.setProperty("TELEGRAM_BOT_TOKEN", cfg.telegramBotToken);
  if (cfg.telegramChatId) props.setProperty("TELEGRAM_CHAT_ID", cfg.telegramChatId);
  if (cfg.notifyEmail) props.setProperty("NOTIFY_EMAIL", cfg.notifyEmail);

  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã lưu cấu hình thành công!" })).setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: msg })).setMimeType(ContentService.MimeType.JSON);
}
