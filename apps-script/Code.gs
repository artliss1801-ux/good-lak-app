/**
 * GOOD Лак - Система управления студией маникюра
 * Google Apps Script для работы с Google Sheets
 */

// ==================== КОНФИГУРАЦИЯ ====================

const CONFIG = {
  TELEGRAM_BOT_TOKEN: '8584455339:AAH0H3TybbDOA6yaV0jPB1Fi-hVdV1EK17k',
  SPREADSHEET_ID: '1fGHWvAwiSH-D-xMeuzlPgoO3guRE88eTXBZXTSzOlK0',
  DRIVE_FOLDER_ID: '1HBum3dteSl45lNOdP3dmh5QQD_3iDZM7',
  
  SHEETS: {
    MASTERS: 'Мастера',
    SERVICES: 'Услуги',
    USERS: 'Пользователи',
    APPOINTMENTS: 'Записи',
    INCOME_EXPENSES: 'Доходы и расходы',
    SCHEDULE_PREFIX: 'График_',
    TELEGRAM_MESSAGES: 'TelegramMessages'
  },
  
  STATUS: {
    CONFIRMED: 'Подтверждено',
    PENDING: 'Ожидает подтверждения',
    CANCELLED: 'Отменено',
    COMPLETED: 'Завершено'
  },
  
  MESSAGE_TYPES: {
    REGISTRATION: 'registration',
    APPOINTMENT: 'appointment',
    REMINDER: 'reminder'
  }
};

// ==================== СЛУЖЕБНЫЕ ФУНКЦИИ ====================

function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function generateId() {
  return Date.now();
}

// ВСЕ даты в таблицу записываем в формате dd.MM.yyyy
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    if (date.match(/^\d{2}\.\d{2}\.\d{4}$/)) return date;
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = date.split('-');
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return date;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, 'Europe/Moscow', 'dd.MM.yyyy');
}

function formatDateFromISO(dateStr) {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

function formatDateToISO(dateStr) {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const parts = dateStr.split('.');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function formatDateRussian(dateStr) {
  if (!dateStr) return '';
  
  let d;
  if (typeof dateStr === 'string') {
    if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const parts = dateStr.split('.');
      d = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateStr.split('-');
      d = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr);
  }
  
  if (isNaN(d.getTime())) return dateStr;
  
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const dayOfWeek = days[d.getDay()];
  
  return `${day} ${month} ${year} г. (${dayOfWeek})`;
}

function formatTime(time) {
  if (!time) return '';
  
  if (typeof time === 'string') {
    if (time.includes(':')) {
      const parts = time.split(':');
      if (parts.length >= 2) {
        return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
      }
    }
    return time;
  }
  
  if (typeof time === 'number') {
    const totalMinutes = Math.round(time * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (time instanceof Date) {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return String(time);
}

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  if (!digits.startsWith('7') && digits.length > 0) {
    digits = '7' + digits;
  }
  return digits;
}

// ==================== API ENDPOINTS ====================

function doGet(e) {
  if (e.parameter.action === 'telegramWebhook') {
    return ContentService.createTextOutput(JSON.stringify({status: 'webhook_active'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = e.parameter.action;
  let result;
  
  try {
    switch (action) {
      case 'getMasters':
        result = getMasters();
        break;
      case 'getAllMasters':
        result = getAllMasters();
        break;
      case 'getServices':
        result = getServices();
        break;
      case 'getAllServices':
        result = getAllServices();
        break;
      case 'getMasterSchedule':
        result = getMasterSchedule(e.parameter.masterId);
        break;
      case 'getAvailableSlots':
        result = getAvailableSlots(e.parameter.masterId, e.parameter.date, e.parameter.serviceId);
        break;
      case 'getUser':
        result = getUser(e.parameter.telegramId);
        break;
      case 'getUserByPhone':
        result = getUserByPhone(e.parameter.phone);
        break;
      case 'getUserAppointments':
        result = getUserAppointments(e.parameter.userId);
        break;
      case 'getMasterAppointments':
        result = getMasterAppointments(e.parameter.masterId);
        break;
      case 'getMasterAppointmentsForDate':
        result = getMasterAppointmentsForDate(e.parameter.masterId, e.parameter.date);
        break;
      case 'getMasterClients':
        result = getMasterClients(e.parameter.masterId);
        break;
      case 'getMasterFinances':
        result = getMasterFinances(e.parameter.masterId);
        break;
      case 'getMasterFinancesCompleted':
        result = getMasterFinancesCompleted(e.parameter.masterId, e.parameter.month, e.parameter.year);
        break;
      case 'getMasterInfo':
        result = getMasterInfo(e.parameter.masterId);
        break;
      case 'getUserProfile':
        result = getUserProfile(e.parameter.userId);
        break;
      case 'loginMaster':
        result = loginMaster(e.parameter.login, e.parameter.password);
        break;
      case 'loginAdmin':
        result = loginAdmin(e.parameter.login, e.parameter.password);
        break;
      case 'getAppSettings':
        result = getAppSettings();
        break;
      case 'test':
        result = { success: true, message: 'API works!', time: new Date().toISOString() };
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (error) {
    console.error('API Error:', error);
    result = { success: false, error: error.toString() };
  }
  
  const output = ContentService.createTextOutput(JSON.stringify(result));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doPost(e) {
  if (e.parameter.action === 'telegramWebhook') {
    try {
      const update = JSON.parse(e.postData.contents);
      handleTelegramUpdate(update);
      return ContentService.createTextOutput('OK');
    } catch (err) {
      return ContentService.createTextOutput('Error: ' + err.toString());
    }
  }
  
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    
    switch (data.action) {
      case 'registerUser':
        result = registerUser(data.user);
        break;
      case 'createAppointment':
        result = createAppointment(data.appointment);
        break;
      case 'updateAppointment':
        result = updateAppointment(data.appointmentId, data.data);
        break;
      case 'cancelAppointment':
        result = cancelAppointment(data.appointmentId);
        break;
      case 'addComment':
        result = addComment(data.appointmentId, data.comment);
        break;
      case 'updateSchedule':
        result = updateSchedule(data.masterId, data.schedule);
        break;
      case 'updateScheduleBatch':
        result = updateScheduleBatch(data.masterId, data.schedules);
        break;
      case 'addClient':
        result = addClient(data.client);
        break;
      case 'addFinanceRecord':
        result = addFinanceRecord(data.record);
        break;
      case 'updateUserProfile':
        result = updateUserProfile(data.userId, data.profile);
        break;
      case 'updateMasterProfile':
        result = updateMasterProfile(data.masterId, data.profile);
        break;
      case 'updateMasterFullProfile':
        result = updateMasterFullProfile(data.masterId, data.profile);
        break;
      case 'uploadMasterPhoto':
        result = uploadMasterPhoto(data.masterId, data.photoBase64);
        break;
      case 'updateMasterPhotoSettings':
        result = updateMasterPhotoSettings(data.masterId, data.photoScale, data.photoTranslateX, data.photoTranslateY);
        break;
      case 'updateAppSettings':
        result = updateAppSettings(data.settings);
        break;
      // Услуги
      case 'addService':
        result = addService(data.service);
        break;
      case 'updateService':
        result = updateService(data.serviceId, data.service);
        break;
      case 'deleteService':
        result = deleteService(data.serviceId);
        break;
      // Мастера
      case 'addMaster':
        result = addMaster(data.master);
        break;
      case 'updateMasterByAdmin':
        result = updateMasterByAdmin(data.masterId, data.master);
        break;
      case 'deleteMaster':
        result = deleteMaster(data.masterId);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + data.action };
    }
    
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    const output = ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

// ==================== МАСТЕРА ====================

function getMasters() {
  const sheet = getSheet(CONFIG.SHEETS.MASTERS);
  if (!sheet) return { success: false, error: 'Лист "Мастера" не найден' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  const headers = data[0];
  const masters = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach((h, idx) => obj[h] = row[idx]);
    
    const activeValue = obj['Активен'];
    const isActive = activeValue === 1 || activeValue === true || activeValue === '1' || 
                     activeValue === 'true' || activeValue === 'Да' || activeValue === 'да';
    
    if (isActive && obj['Имя']) {
      masters.push({
        id: obj['ID'],
        name: obj['Имя'],
        photo: obj['СсылкаНаФото'] || '',
        telegramId: obj['TelegramID'],
        login: obj['Логин'],
        photoScale: obj['photoScale'] || 1,
        photoTranslateX: obj['photoTranslateX'] || 0,
        photoTranslateY: obj['photoTranslateY'] || 0
      });
    }
  }
  
  return { success: true, data: masters };
}

function getMasterByLogin(login) {
  const data = getSheetData(CONFIG.SHEETS.MASTERS);
  return data.find(m => m['Логин'] === login);
}

function getMasterInfo(masterId) {
  const data = getSheetData(CONFIG.SHEETS.MASTERS);
  const master = data.find(m => String(m['ID']) === String(masterId));
  
  if (!master) return { success: false, error: 'Мастер не найден' };
  
  return {
    success: true,
    data: {
      id: master['ID'],
      name: master['Имя'],
      photo: master['СсылкаНаФото'] || '',
      telegramId: master['TelegramID'],
      login: master['Логин'],
      photoScale: master['photoScale'] || 1,
      photoTranslateX: master['photoTranslateX'] || 0,
      photoTranslateY: master['photoTranslateY'] || 0
    }
  };
}

function loginMaster(login, password) {
  const master = getMasterByLogin(login);
  if (!master) return { success: false, error: 'Мастер не найден' };
  if (String(master['Пароль']) !== String(password)) return { success: false, error: 'Неверный пароль' };
  
  return {
    success: true,
    data: {
      id: master['ID'],
      name: master['Имя'],
      photo: master['СсылкаНаФото'] || '',
      telegramId: master['TelegramID'],
      login: master['Логин'],
      photoScale: master['photoScale'] || 1,
      photoTranslateX: master['photoTranslateX'] || 0,
      photoTranslateY: master['photoTranslateY'] || 0
    }
  };
}

function updateMasterProfile(masterId, profile) {
  const sheet = getSheet(CONFIG.SHEETS.MASTERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const photoIdx = headers.indexOf('СсылкаНаФото');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(masterId)) {
      if (profile.photo && photoIdx !== -1) {
        data[i][photoIdx] = profile.photo;
      }
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Мастер не найден' };
}

// Полное обновление профиля мастера (имя, логин, пароль)
function updateMasterFullProfile(masterId, profile) {
  const sheet = getSheet(CONFIG.SHEETS.MASTERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const nameIdx = headers.indexOf('Имя');
  const loginIdx = headers.indexOf('Логин');
  const passwordIdx = headers.indexOf('Пароль');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(masterId)) {
      // Проверяем текущий пароль если меняем пароль
      if (profile.newPassword) {
        const currentPassword = data[i][passwordIdx];
        if (profile.currentPassword && String(currentPassword) !== String(profile.currentPassword)) {
          return { success: false, error: 'Неверный текущий пароль' };
        }
      }
      
      // Обновляем имя
      if (profile.name && nameIdx !== -1) {
        data[i][nameIdx] = profile.name;
      }
      
      // Обновляем логин
      if (profile.login !== undefined && loginIdx !== -1) {
        data[i][loginIdx] = profile.login;
      }
      
      // Обновляем пароль
      if (profile.newPassword && passwordIdx !== -1) {
        data[i][passwordIdx] = profile.newPassword;
      }
      
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      return { 
        success: true,
        data: {
          id: masterId,
          name: profile.name || data[i][nameIdx],
          login: profile.login !== undefined ? profile.login : data[i][loginIdx]
        }
      };
    }
  }
  
  return { success: false, error: 'Мастер не найден' };
}

function uploadMasterPhoto(masterId, photoBase64) {
  try {
    // Проверяем доступ к Drive
    let folder;
    try {
      folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } catch (driveError) {
      // Если нет доступа к папке, пробуем создать файл в корне Drive
      console.error('Drive access error:', driveError.toString());
      return { 
        success: false, 
        error: 'Нет доступа к Google Drive. Запустите функцию authorizeDrive() в редакторе Apps Script для авторизации.',
        details: driveError.toString()
      };
    }
    
    const base64Data = photoBase64.split(',')[1] || photoBase64;
    const decoded = Utilities.base64Decode(base64Data);
    
    let mimeType = 'image/jpeg';
    if (photoBase64.includes('data:image/png')) mimeType = 'image/png';
    else if (photoBase64.includes('data:image/gif')) mimeType = 'image/gif';
    
    const blob = Utilities.newBlob(decoded, mimeType);
    blob.setName('master_' + masterId + '_' + Date.now() + '.jpg');
    
    const file = folder.createFile(blob);
    
    const fileId = file.getId();
    const photoUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    updateMasterProfile(masterId, { photo: photoUrl });
    
    return { success: true, photoUrl: photoUrl };
  } catch (e) {
    console.error('Upload error:', e.toString());
    return { success: false, error: e.toString() };
  }
}

// Обновление параметров редактирования фото (без обрезки)
function updateMasterPhotoSettings(masterId, photoScale, photoTranslateX, photoTranslateY) {
  const sheet = getSheet(CONFIG.SHEETS.MASTERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Находим или создаём колонки для параметров фото
  let photoScaleIdx = headers.indexOf('photoScale');
  let photoTranslateXIdx = headers.indexOf('photoTranslateX');
  let photoTranslateYIdx = headers.indexOf('photoTranslateY');
  
  // Если колонок нет - добавляем их
  if (photoScaleIdx === -1 || photoTranslateXIdx === -1 || photoTranslateYIdx === -1) {
    const lastCol = headers.length;
    
    if (photoScaleIdx === -1) {
      sheet.getRange(1, lastCol + 1).setValue('photoScale');
      headers.push('photoScale');
      photoScaleIdx = lastCol;
    }
    if (photoTranslateXIdx === -1) {
      sheet.getRange(1, lastCol + 2).setValue('photoTranslateX');
      headers.push('photoTranslateX');
      photoTranslateXIdx = lastCol + 1;
    }
    if (photoTranslateYIdx === -1) {
      sheet.getRange(1, lastCol + 3).setValue('photoTranslateY');
      headers.push('photoTranslateY');
      photoTranslateYIdx = lastCol + 2;
    }
    
    // Перечитываем данные после добавления колонок
    const newData = sheet.getDataRange().getValues();
    for (let i = 1; i < newData.length; i++) {
      if (String(newData[i][0]) === String(masterId)) {
        // Записываем параметры в новые колонки
        sheet.getRange(i + 1, photoScaleIdx + 1).setValue(photoScale || 1);
        sheet.getRange(i + 1, photoTranslateXIdx + 1).setValue(photoTranslateX || 0);
        sheet.getRange(i + 1, photoTranslateYIdx + 1).setValue(photoTranslateY || 0);
        
        return { 
          success: true,
          data: {
            photoScale: photoScale || 1,
            photoTranslateX: photoTranslateX || 0,
            photoTranslateY: photoTranslateY || 0
          }
        };
      }
    }
  } else {
    // Колонки уже существуют
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(masterId)) {
        sheet.getRange(i + 1, photoScaleIdx + 1).setValue(photoScale || 1);
        sheet.getRange(i + 1, photoTranslateXIdx + 1).setValue(photoTranslateX || 0);
        sheet.getRange(i + 1, photoTranslateYIdx + 1).setValue(photoTranslateY || 0);
        
        return { 
          success: true,
          data: {
            photoScale: photoScale || 1,
            photoTranslateX: photoTranslateX || 0,
            photoTranslateY: photoTranslateY || 0
          }
        };
      }
    }
  }
  
  return { success: false, error: 'Мастер не найден' };
}

// Функция для авторизации доступа к Google Drive
// ЗАПУСТИТЕ ЭТУ ФУНКЦИЮ ОДИН РАЗ В РЕДАКТОРЕ APPS SCRIPT
function authorizeDrive() {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    console.log('Drive access authorized successfully!');
    console.log('Folder name:', folder.getName());
    return 'Drive access authorized successfully! Folder: ' + folder.getName();
  } catch (e) {
    console.error('Drive authorization failed:', e.toString());
    return 'Drive authorization failed: ' + e.toString();
  }
}

// ==================== АДМИНИСТРАТОРЫ ====================

function loginAdmin(login, password) {
  // Получаем данные из листа Администраторы
  const sheet = getSheet('Администраторы');
  if (!sheet) return { success: false, error: 'Лист "Администраторы" не найден' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: 'Нет администраторов' };
  
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach((h, idx) => obj[h] = row[idx]);
    
    // Проверяем логин и пароль
    if (obj['Логин'] === login && String(obj['Пароль']) === String(password)) {
      return {
        success: true,
        data: {
          id: obj['ID'] || i,
          login: obj['Логин'],
          name: obj['Имя'] || obj['Логин']
        }
      };
    }
  }
  
  return { success: false, error: 'Неверный логин или пароль' };
}

// ==================== НАСТРОЙКИ ПРИЛОЖЕНИЯ ====================

function getAppSettings() {
  const sheet = getSheet('Настройки');
  if (!sheet) {
    return { 
      success: true, 
      data: {
        appName: 'GOOD Лак',
        logoUrl: '',
        primaryColor: '#ec4899',
        secondaryColor: '#06b6d4',
        telegramBotToken: CONFIG.TELEGRAM_BOT_TOKEN,
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        driveFolderId: CONFIG.DRIVE_FOLDER_ID
      }
    };
  }
  
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][1] !== undefined) {
      settings[data[i][0]] = data[i][1];
    }
  }
  
  return {
    success: true,
    data: {
      appName: settings['appName'] || settings['Название'] || 'GOOD Лак',
      logoUrl: settings['logoUrl'] || settings['Логотип'] || '',
      primaryColor: settings['primaryColor'] || settings['ОсновнойЦвет'] || '#ec4899',
      secondaryColor: settings['secondaryColor'] || settings['ВторойЦвет'] || '#06b6d4',
      telegramBotToken: CONFIG.TELEGRAM_BOT_TOKEN,
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      driveFolderId: CONFIG.DRIVE_FOLDER_ID
    }
  };
}

function updateAppSettings(settings) {
  let sheet = getSheet('Настройки');
  
  // Создаём лист если не существует
  if (!sheet) {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    sheet = ss.insertSheet('Настройки');
  }
  
  // Очищаем и записываем настройки
  sheet.clear();
  
  const rows = [
    ['appName', settings.appName || 'GOOD Лак'],
    ['logoUrl', settings.logoUrl || ''],
    ['primaryColor', settings.primaryColor || '#ec4899'],
    ['secondaryColor', settings.secondaryColor || '#06b6d4']
  ];
  
  rows.forEach((row, idx) => {
    sheet.getRange(idx + 1, 1, 1, 2).setValues([row]);
  });
  
  return { success: true, message: 'Настройки сохранены' };
}

// ==================== УСЛУГИ ====================

function getServices() {
  const data = getSheetData(CONFIG.SHEETS.SERVICES);
  const services = data
    .filter(s => {
      const active = s['Активна'];
      // Услуга активна если: значение не 0, не false, не '0', не 'false'
      // Пустое значение, null, undefined считаются активными (по умолчанию)
      if (active === 0 || active === false || active === '0' || active === 'false' || active === 'FALSE') {
        return false;
      }
      // У услуги должно быть название
      return s['Название'] && String(s['Название']).trim() !== '';
    })
    .map(s => ({
      id: s['ID'],
      name: s['Название'],
      price: s['Цена'] || 0,
      duration: s['Длительность'] || 60,
      description: s['Описание'] || '',
      active: s['Активна'] !== 0 && s['Активна'] !== false && s['Активна'] !== '0' && s['Активна'] !== 'false'
    }));
  
  return { success: true, data: services };
}

// Получить все услуги (включая неактивные) для разработчика
function getAllServices() {
  const data = getSheetData(CONFIG.SHEETS.SERVICES);
  const services = data.map(s => ({
    id: s['ID'],
    name: s['Название'],
    price: s['Цена'] || 0,
    duration: s['Длительность'] || 60,
    description: s['Описание'] || '',
    active: s['Активна'] === 1 || s['Активна'] === true || s['Активна'] === '1' || s['Активна'] === 'true'
  }));
  
  return { success: true, data: services };
}

// Добавить новую услугу
function addService(serviceData) {
  const sheet = getSheet(CONFIG.SHEETS.SERVICES);
  if (!sheet) return { success: false, error: 'Лист "Услуги" не найден' };
  
  const newId = Date.now();
  
  sheet.appendRow([
    newId,
    serviceData.name,
    serviceData.price || 0,
    serviceData.duration || 60,
    serviceData.description || '',
    1 // Активна по умолчанию
  ]);
  
  return { 
    success: true, 
    data: { 
      id: newId,
      name: serviceData.name,
      price: serviceData.price || 0,
      duration: serviceData.duration || 60,
      description: serviceData.description || '',
      active: true
    } 
  };
}

// Обновить услугу
function updateService(serviceId, serviceData) {
  const sheet = getSheet(CONFIG.SHEETS.SERVICES);
  if (!sheet) return { success: false, error: 'Лист "Услуги" не найден' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIdx = headers.indexOf('ID');
  const nameIdx = headers.indexOf('Название');
  const priceIdx = headers.indexOf('Цена');
  const durationIdx = headers.indexOf('Длительность');
  const descriptionIdx = headers.indexOf('Описание');
  const activeIdx = headers.indexOf('Активна');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(serviceId)) {
      if (serviceData.name !== undefined && nameIdx !== -1) {
        data[i][nameIdx] = serviceData.name;
      }
      if (serviceData.price !== undefined && priceIdx !== -1) {
        data[i][priceIdx] = serviceData.price;
      }
      if (serviceData.duration !== undefined && durationIdx !== -1) {
        data[i][durationIdx] = serviceData.duration;
      }
      if (serviceData.description !== undefined && descriptionIdx !== -1) {
        data[i][descriptionIdx] = serviceData.description;
      }
      if (serviceData.active !== undefined && activeIdx !== -1) {
        data[i][activeIdx] = serviceData.active ? 1 : 0;
      }
      
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Услуга не найдена' };
}

// Удалить услугу (полное удаление строки из таблицы)
function deleteService(serviceId) {
  const sheet = getSheet(CONFIG.SHEETS.SERVICES);
  if (!sheet) return { success: false, error: 'Лист "Услуги" не найден' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIdx = headers.indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(serviceId)) {
      // Удаляем строку полностью
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Услуга не найдена' };
}

// Функция для отладки - показать все услуги с их статусами
function debugServices() {
  const data = getSheetData(CONFIG.SHEETS.SERVICES);
  console.log('=== DEBUG: Services Data ===');
  console.log('Total rows:', data.length);
  
  data.forEach((s, idx) => {
    console.log(`Row ${idx + 1}:`, {
      ID: s['ID'],
      Название: s['Название'],
      Активна: s['Активна'],
      'Тип Активна': typeof s['Активна'],
      'Активна raw': JSON.stringify(s['Активна'])
    });
  });
  
  return {
    success: true,
    data: data.map(s => ({
      id: s['ID'],
      name: s['Название'],
      active: s['Активна'],
      activeType: typeof s['Активна']
    }))
  };
}

// ==================== МАСТЕРА (для разработчика) ====================

// Получить всех мастеров (полная информация)
function getAllMasters() {
  const data = getSheetData(CONFIG.SHEETS.MASTERS);
  const masters = data.map(m => ({
    id: m['ID'],
    name: m['Имя'] || '',
    photo: m['СсылкаНаФото'] || '',
    telegramId: m['TelegramID'] || '',
    login: m['Логин'] || '',
    password: m['Пароль'] || '',
    active: m['Активен'] === 1 || m['Активен'] === true || m['Активен'] === '1' || m['Активен'] === 'true',
    photoScale: m['photoScale'] || 1,
    photoTranslateX: m['photoTranslateX'] || 0,
    photoTranslateY: m['photoTranslateY'] || 0
  }));
  
  return { success: true, data: masters };
}

// Добавить нового мастера
function addMaster(masterData) {
  const sheet = getSheet(CONFIG.SHEETS.MASTERS);
  if (!sheet) return { success: false, error: 'Лист "Мастера" не найден' };
  
  const newId = Date.now();
  
  sheet.appendRow([
    newId,
    masterData.name,
    masterData.photo || '',
    masterData.telegramId || '',
    masterData.login || '',
    masterData.password || '',
    1, // Активен по умолчанию
    1, // photoScale
    0, // photoTranslateX
    0  // photoTranslateY
  ]);
  
  return { 
    success: true, 
    data: { 
      id: newId,
      name: masterData.name,
      photo: masterData.photo || '',
      telegramId: masterData.telegramId || '',
      login: masterData.login || '',
      active: true
    } 
  };
}

// Обновить мастера (для разработчика)
function updateMasterByAdmin(masterId, masterData) {
  const sheet = getSheet(CONFIG.SHEETS.MASTERS);
  if (!sheet) return { success: false, error: 'Лист "Мастера" не найден' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIdx = headers.indexOf('ID');
  const nameIdx = headers.indexOf('Имя');
  const photoIdx = headers.indexOf('СсылкаНаФото');
  const telegramIdx = headers.indexOf('TelegramID');
  const loginIdx = headers.indexOf('Логин');
  const passwordIdx = headers.indexOf('Пароль');
  const activeIdx = headers.indexOf('Активен');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(masterId)) {
      if (masterData.name !== undefined && nameIdx !== -1) {
        data[i][nameIdx] = masterData.name;
      }
      if (masterData.photo !== undefined && photoIdx !== -1) {
        data[i][photoIdx] = masterData.photo;
      }
      if (masterData.telegramId !== undefined && telegramIdx !== -1) {
        data[i][telegramIdx] = masterData.telegramId;
      }
      if (masterData.login !== undefined && loginIdx !== -1) {
        data[i][loginIdx] = masterData.login;
      }
      if (masterData.password !== undefined && passwordIdx !== -1) {
        data[i][passwordIdx] = masterData.password;
      }
      if (masterData.active !== undefined && activeIdx !== -1) {
        data[i][activeIdx] = masterData.active ? 1 : 0;
      }
      
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Мастер не найден' };
}

// Удалить мастера (полное удаление строки из таблицы)
function deleteMaster(masterId) {
  const sheet = getSheet(CONFIG.SHEETS.MASTERS);
  if (!sheet) return { success: false, error: 'Лист "Мастера" не найден' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIdx = headers.indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(masterId)) {
      // Удаляем строку полностью
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Мастер не найден' };
}

// ==================== ГРАФИК МАСТЕРА ====================

function getMasterSchedule(masterId) {
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const master = masters.find(m => String(m['ID']) === String(masterId));
  
  if (!master) return { success: false, error: 'Мастер не найден для ID: ' + masterId };
  
  const masterName = master['Имя'];
  const telegramId = master['TelegramID'];
  const scheduleSheetName = `График_${masterName}_${telegramId}`;
  
  let scheduleSheet = getSheet(scheduleSheetName);
  if (!scheduleSheet) {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const allSheets = ss.getSheets();
    scheduleSheet = allSheets.find(s => 
      s.getName().includes('График') && s.getName().includes(masterName)
    );
    
    if (!scheduleSheet) return { success: false, error: `Лист графика не найден: ${scheduleSheetName}` };
  }
  
  return processScheduleSheet(scheduleSheet);
}

function processScheduleSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [], message: 'График пуст' };
  
  const headers = data[0];
  const schedule = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach((h, idx) => obj[h] = row[idx]);
    
    const dateValue = obj['Дата'] || row[0];
    const status = obj['Статус'] || row[1] || '';
    const start = obj['Начало'] || row[2] || '';
    const end = obj['Конец'] || row[3] || '';
    const breakStart = obj['Перерыв_Начало'] || obj['НачалоПерерыва'] || row[4] || '';
    const breakEnd = obj['Перерыв_Конец'] || obj['КонецПерерыва'] || row[5] || '';
    
    if (dateValue) {
      schedule.push({
        date: formatDate(dateValue),
        status: String(status).trim(),
        start: formatTime(start),
        end: formatTime(end),
        breakStart: formatTime(breakStart),
        breakEnd: formatTime(breakEnd)
      });
    }
  }
  
  return { success: true, data: schedule };
}

function getAvailableSlots(masterId, date, serviceId) {
  const dateForSearch = formatDateFromISO(date);
  
  const scheduleResult = getMasterSchedule(masterId);
  if (!scheduleResult.success) return scheduleResult;
  
  const schedule = scheduleResult.data;
  
  let daySchedule = schedule.find(s => s.date === dateForSearch);
  if (!daySchedule) daySchedule = schedule.find(s => s.date === date);
  
  if (!daySchedule) return { success: true, data: [], message: 'Нет графика на эту дату' };
  if (daySchedule.status !== 'Рабочий') return { success: true, data: [], message: `День не рабочий: ${daySchedule.status}` };
  if (!daySchedule.start || !daySchedule.end) return { success: true, data: [], message: 'Не указано время работы' };
  
  const servicesResult = getServices();
  const service = servicesResult.data.find(s => String(s.id) === String(serviceId));
  const duration = service ? (service.duration || 60) : 60;
  
  const appointments = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const dayAppointments = appointments.filter(a => {
    const aptDate = formatDate(a['Дата']);
    const aptMasterId = a['IdМастера'];
    const aptStatus = a['Статус'];
    
    const dateMatch = aptDate === dateForSearch || aptDate === date;
    
    return dateMatch && 
           String(aptMasterId) === String(masterId) && 
           aptStatus !== CONFIG.STATUS.CANCELLED;
  });
  
  const slots = generateTimeSlots(
    daySchedule.start,
    daySchedule.end,
    daySchedule.breakStart,
    daySchedule.breakEnd,
    duration,
    dayAppointments,
    dateForSearch
  );
  
  return { success: true, data: slots };
}

function generateTimeSlots(start, end, breakStart, breakEnd, duration, appointments, date) {
  const slots = [];
  
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':');
    if (parts.length >= 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return 0;
  };
  
  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);
  const breakStartMinutes = parseTime(breakStart);
  const breakEndMinutes = parseTime(breakEnd);
  
  if (startMinutes >= endMinutes) return [];
  
  const now = new Date();
  const today = formatDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  let currentMinutesSlot = startMinutes;
  
  while (currentMinutesSlot + duration <= endMinutes) {
    const slotStart = currentMinutesSlot;
    const slotEnd = currentMinutesSlot + duration;
    
    const overlapsBreak = breakStartMinutes && breakEndMinutes && 
                          (slotStart < breakEndMinutes && slotEnd > breakStartMinutes);
    
    const isBooked = appointments.some(a => {
      const aptTime = formatTime(a['Время']);
      const aptMinutes = parseTime(aptTime);
      const aptDuration = parseInt(a['Длительность']) || duration;
      const aptEnd = aptMinutes + aptDuration;
      
      return (slotStart < aptEnd && slotEnd > aptMinutes);
    });
    
    const isPast = (today === date && currentMinutesSlot <= currentMinutes);
    
    if (!isBooked && !isPast && !overlapsBreak) {
      const hours = Math.floor(currentMinutesSlot / 60);
      const minutes = currentMinutesSlot % 60;
      slots.push({
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        available: true
      });
    }
    
    currentMinutesSlot += 60;
  }
  
  return slots;
}

// ==================== ПОЛЬЗОВАТЕЛИ ====================

function getUser(telegramId) {
  const data = getSheetData(CONFIG.SHEETS.USERS);
  const user = data.find(u => String(u['TelegramId']) === String(telegramId));
  
  if (!user) return { success: false, error: 'Пользователь не найден' };
  
  return {
    success: true,
    data: {
      id: user['ID'],
      name: user['Имя'],
      phone: user['Телефон'],
      telegramId: user['TelegramId']
    }
  };
}

function getUserByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  const data = getSheetData(CONFIG.SHEETS.USERS);
  const user = data.find(u => normalizePhone(u['Телефон']) === normalizedPhone);
  
  if (!user) return { success: false, error: 'Пользователь не найден' };
  
  return {
    success: true,
    data: {
      id: user['ID'],
      name: user['Имя'],
      phone: user['Телефон'],
      telegramId: user['TelegramId']
    }
  };
}

function getUserProfile(userId) {
  const data = getSheetData(CONFIG.SHEETS.USERS);
  const user = data.find(u => String(u['ID']) === String(userId));
  
  if (!user) return { success: false, error: 'Пользователь не найден' };
  
  // Форматируем дату рождения в dd.MM.yyyy
  let birthDate = user['ДатаРождения'] || '';
  if (birthDate) {
    birthDate = formatDate(birthDate);
  }
  
  return {
    success: true,
    data: {
      id: user['ID'],
      name: user['Имя'],
      phone: user['Телефон'],
      telegramId: user['TelegramId'],
      birthDate: birthDate,
      about: user['ОСебе'] || ''
    }
  };
}

function updateUserProfile(userId, profile) {
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const birthDateIdx = headers.indexOf('ДатаРождения');
  const aboutIdx = headers.indexOf('ОСебе');
  const nameIdx = headers.indexOf('Имя');
  const phoneIdx = headers.indexOf('Телефон');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      if (profile.name && nameIdx !== -1) {
        data[i][nameIdx] = profile.name;
      }
      // Разрешаем обновление телефона
      if (profile.phone && phoneIdx !== -1) {
        data[i][phoneIdx] = profile.phone;
      }
      if (profile.birthDate !== undefined && birthDateIdx !== -1) {
        // Сохраняем в формате dd.MM.yyyy
        data[i][birthDateIdx] = formatDate(profile.birthDate);
      }
      if (profile.about !== undefined && aboutIdx !== -1) {
        data[i][aboutIdx] = profile.about;
      }
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Пользователь не найден' };
}

function registerUser(userData) {
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  const data = getSheetData(CONFIG.SHEETS.USERS);
  
  const existingByTelegram = data.find(u => String(u['TelegramId']) === String(userData.telegramId));
  if (existingByTelegram) {
    return { 
      success: true, 
      data: { 
        id: existingByTelegram['ID'],
        name: existingByTelegram['Имя'],
        phone: existingByTelegram['Телефон'],
        telegramId: existingByTelegram['TelegramId']
      }
    };
  }
  
  const normalizedPhone = normalizePhone(userData.phone);
  const existingByPhone = data.find(u => normalizePhone(u['Телефон']) === normalizedPhone);
  if (existingByPhone) {
    return { 
      success: true, 
      data: { 
        id: existingByPhone['ID'],
        name: existingByPhone['Имя'],
        phone: existingByPhone['Телефон'],
        telegramId: userData.telegramId
      }
    };
  }
  
  const newId = generateId();
  sheet.appendRow([
    newId,
    userData.name,
    userData.phone,
    userData.telegramId,
    'Создан через Telegram',
    0,
    '',
    '',
    ''
  ]);
  
  return {
    success: true,
    data: {
      id: newId,
      name: userData.name,
      phone: userData.phone,
      telegramId: userData.telegramId
    }
  };
}

// ==================== ЗАПИСИ ====================

function getUserAppointments(userId) {
  const data = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);
  
  const appointments = data
    .filter(a => String(a['ID_Пользователя']) === String(userId) && a['Статус'] !== CONFIG.STATUS.CANCELLED)
    .map(a => {
      const master = masters.find(m => String(m['ID']) === String(a['IdМастера']));
      const service = services.find(s => String(s['ID']) === String(a['IdУслуги']));
      return {
        id: a['ID'],
        masterId: a['IdМастера'],
        masterName: master ? master['Имя'] : 'Неизвестно',
        serviceId: a['IdУслуги'],
        serviceName: service ? service['Название'] : 'Неизвестно',
        date: formatDate(a['Дата']),
        time: formatTime(a['Время']),
        price: a['Цена'] || 0,
        status: a['Статус'],
        comment: a['Комментарий'] || ''
      };
    });
  
  return { success: true, data: appointments };
}

function getMasterAppointments(masterId) {
  const data = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const users = getSheetData(CONFIG.SHEETS.USERS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);
  
  const today = formatDate(new Date());
  
  const appointments = data
    .filter(a => String(a['IdМастера']) === String(masterId))
    .map(a => {
      const user = users.find(u => String(u['ID']) === String(a['ID_Пользователя']));
      const service = services.find(s => String(s['ID']) === String(a['IdУслуги']));
      return {
        id: a['ID'],
        userId: a['ID_Пользователя'],
        clientName: user ? user['Имя'] : 'Неизвестно',
        clientPhone: a['ТелефонКлиента'] || (user ? user['Телефон'] : ''),
        serviceId: a['IdУслуги'],
        serviceName: service ? service['Название'] : 'Неизвестно',
        date: formatDate(a['Дата']),
        time: formatTime(a['Время']),
        price: a['Цена'] || 0,
        status: a['Статус'],
        comment: a['Комментарий'] || '',
        duration: a['Длительность'] || (service ? service['Длительность'] : 60) || 60
      };
    })
    .filter(apt => {
      // Показываем:
      // 1. Все подтвержденные и ожидающие записи (независимо от даты)
      // 2. Завершенные записи
      const isActive = apt.status === CONFIG.STATUS.CONFIRMED || apt.status === CONFIG.STATUS.PENDING;
      const isCompleted = apt.status === CONFIG.STATUS.COMPLETED;
      return isActive || isCompleted;
    })
    .sort((a, b) => {
      // Сортируем: сначала предстоящие по дате, потом завершенные (новые сначала)
      const aActive = a.status !== CONFIG.STATUS.COMPLETED;
      const bActive = b.status !== CONFIG.STATUS.COMPLETED;
      
      if (aActive && bActive) {
        return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
      }
      if (!aActive && !bActive) {
        return b.date.localeCompare(a.date);
      }
      return aActive ? -1 : 1;
    });
  
  return { success: true, data: appointments };
}

function getMasterAppointmentsForDate(masterId, date) {
  const data = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);

  const dateForSearch = formatDateFromISO(date);

  const appointments = data
    .filter(a => {
      const aptDate = formatDate(a['Дата']);
      const aptMasterId = a['IdМастера'];
      const aptStatus = a['Статус'];
      return (aptDate === dateForSearch || aptDate === date) &&
             String(aptMasterId) === String(masterId) &&
             aptStatus !== CONFIG.STATUS.CANCELLED;
    })
    .map(a => {
      const service = services.find(s => String(s['ID']) === String(a['IdУслуги']));
      const duration = parseInt(a['Длительность']) || (service ? service['Длительность'] : 60) || 60;
      return {
        id: a['ID'],
        time: formatTime(a['Время']),
        duration: duration
      };
    });

  return { success: true, data: appointments };
}

function createAppointment(appointmentData) {
  const sheet = getSheet(CONFIG.SHEETS.APPOINTMENTS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);
  const service = services.find(s => String(s['ID']) === String(appointmentData.serviceId));
  
  const newId = generateId();
  const now = new Date();
  
  const formattedDate = formatDate(appointmentData.date);
  
  sheet.appendRow([
    newId,
    appointmentData.phone || '',
    appointmentData.userId,
    appointmentData.masterId,
    appointmentData.serviceId,
    formattedDate,
    appointmentData.time,
    CONFIG.STATUS.CONFIRMED,
    service ? service['Цена'] : 0,
    '',
    Utilities.formatDate(now, 'Europe/Moscow', 'yyyy-MM-dd HH:mm:ss'),
    service ? service['Длительность'] : 60,
    ''
  ]);
  
  sendAppointmentNotifications(newId, appointmentData, service);
  
  return { success: true, data: { id: newId } };
}

function updateAppointment(appointmentId, updateData) {
  const sheet = getSheet(CONFIG.SHEETS.APPOINTMENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(appointmentId)) {
      const oldDate = formatDate(data[i][5]);
      const oldTime = formatTime(data[i][6]);
      
      if (updateData.date) {
        data[i][5] = formatDate(updateData.date);
      }
      if (updateData.time) data[i][6] = updateData.time;
      if (updateData.status) data[i][7] = updateData.status;
      if (updateData.serviceId) {
        const services = getSheetData(CONFIG.SHEETS.SERVICES);
        const service = services.find(s => String(s['ID']) === String(updateData.serviceId));
        if (service) {
          data[i][4] = updateData.serviceId;
          data[i][8] = service['Цена'];
          data[i][11] = service['Длительность'];
        }
      }
      
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      
      if (updateData.date || updateData.time) {
        const rowData = {};
        headers.forEach((h, idx) => rowData[h] = data[i][idx]);
        const newDate = formatDate(updateData.date || data[i][5]);
        const newTime = updateData.time || oldTime;
        sendRescheduleNotification(rowData, oldDate, oldTime, { date: newDate, time: newTime });
      }
      
      return { success: true };
    }
  }
  
  return { success: false, error: 'Запись не найдена' };
}

function sendRescheduleNotification(appointment, oldDate, oldTime, updateData) {
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const users = getSheetData(CONFIG.SHEETS.USERS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);
  
  const master = masters.find(m => String(m['ID']) === String(appointment['IdМастера']));
  const user = users.find(u => String(u['ID']) === String(appointment['ID_Пользователя']));
  const service = services.find(s => String(s['ID']) === String(appointment['IdУслуги']));
  
  if (!master || !user) return;
  
  const serviceName = service ? service['Название'] : 'Неизвестно';
  
  sendTelegramMessage(user['TelegramId'], `
🔄 <b>Запись перенесена!</b>

👩‍🎨 Мастер: ${master['Имя']}
💄 Услуга: ${serviceName}

❌ Было: ${formatDateRussian(oldDate)} в ${oldTime}
✅ Стало: ${formatDateRussian(updateData.date)} в ${updateData.time}

До встречи в GOOD Лак!
  `);
  
  sendTelegramMessage(master['TelegramID'], `
🔄 <b>Запись перенесена!</b>

👤 Клиент: ${user['Имя']}
📞 Телефон: ${user['Телефон']}
💄 Услуга: ${serviceName}

❌ Было: ${formatDateRussian(oldDate)} в ${oldTime}
✅ Стало: ${formatDateRussian(updateData.date)} в ${updateData.time}
  `);
}

function cancelAppointment(appointmentId) {
  return updateAppointment(appointmentId, { status: CONFIG.STATUS.CANCELLED });
}

function addComment(appointmentId, comment) {
  const sheet = getSheet(CONFIG.SHEETS.APPOINTMENTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(appointmentId)) {
      data[i][12] = comment;
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Запись не найдена' };
}

// ==================== ФИНАНСЫ ====================

function getMasterFinances(masterId) {
  const sheet = getSheet(CONFIG.SHEETS.INCOME_EXPENSES);
  if (!sheet) return { success: true, data: { records: [], totalIncome: 0, totalExpenses: 0, balance: 0 } };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: { records: [], totalIncome: 0, totalExpenses: 0, balance: 0 } };
  
  const headers = data[0];
  
  let masterIdIdx = headers.indexOf('ID_Мастера');
  if (masterIdIdx === -1) masterIdIdx = headers.indexOf('IDМастера');
  if (masterIdIdx === -1) masterIdIdx = headers.indexOf('IdМастера');
  if (masterIdIdx === -1) masterIdIdx = 1;
  
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowMasterId = row[masterIdIdx];
    
    if (String(rowMasterId) === String(masterId)) {
      const obj = {};
      headers.forEach((h, idx) => obj[h] = row[idx]);
      
      records.push({
        id: obj['ID'] || i,
        type: obj['Тип'] || '',
        amount: parseFloat(obj['Сумма']) || 0,
        category: obj['Категория'] || '',
        date: formatDate(obj['Дата']),
        description: obj['Описание'] || ''
      });
    }
  }
  
  const income = records.filter(r => r.type === 'Доход').reduce((sum, r) => sum + r.amount, 0);
  const expenses = records.filter(r => r.type === 'Расход').reduce((sum, r) => sum + r.amount, 0);
  
  return {
    success: true,
    data: {
      records,
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    }
  };
}

// Финансы только по ЗАВЕРШЕННЫМ услугам + планируемый доход с учетом расходов
function getMasterFinancesCompleted(masterId, month, year) {
  const appointments = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);
  const users = getSheetData(CONFIG.SHEETS.USERS);
  
  const today = formatDate(new Date());
  
  // Завершенные записи = доход
  const completedAppointments = appointments.filter(a => {
    const aptMasterId = String(a['IdМастера']);
    const aptStatus = a['Статус'];
    return aptMasterId === String(masterId) && aptStatus === CONFIG.STATUS.COMPLETED;
  });
  
  let completedIncome = 0;
  const completedRecords = [];
  
  completedAppointments.forEach(a => {
    const service = services.find(s => String(s['ID']) === String(a['IdУслуги']));
    const user = users.find(u => String(u['ID']) === String(a['ID_Пользователя']));
    const price = a['Цена'] || (service ? service['Цена'] : 0) || 0;
    
    const aptDate = formatDate(a['Дата']);
    const parts = aptDate.split('.');
    
    // Фильтр по месяцу если указан
    if (month && year && parts.length === 3) {
      const aptMonth = parseInt(parts[1]);
      const aptYear = parseInt(parts[2]);
      if (aptMonth !== parseInt(month) || aptYear !== parseInt(year)) {
        return; // Пропускаем если не подходит под фильтр
      }
    }
    
    completedIncome += price;
    
    completedRecords.push({
      id: a['ID'],
      type: 'Доход',
      amount: price,
      category: service ? service['Название'] : 'Услуга',
      date: aptDate,
      description: `Клиент: ${user ? user['Имя'] : 'Неизвестно'}`
    });
  });
  
  // Расходы из листа - фильтруем по месяцу
  const financesResult = getMasterFinances(masterId);
  let monthExpenses = 0;
  const monthExpenseRecords = [];
  
  financesResult.data.records.filter(r => r.type === 'Расход').forEach(r => {
    const expDate = r.date;
    const parts = expDate.split('.');
    
    if (month && year && parts.length === 3) {
      const expMonth = parseInt(parts[1]);
      const expYear = parseInt(parts[2]);
      if (expMonth === parseInt(month) && expYear === parseInt(year)) {
        monthExpenses += r.amount;
        monthExpenseRecords.push(r);
      }
    } else {
      monthExpenses += r.amount;
      monthExpenseRecords.push(r);
    }
  });
  
  // Все расходы для общего баланса
  const totalExpenses = financesResult.data.totalExpenses;
  
  // Планируемый доход (подтвержденные и ожидающие записи) - фильтр по месяцу
  let plannedIncome = 0;
  const plannedAppointments = appointments.filter(a => {
    const aptMasterId = String(a['IdМастера']);
    const aptStatus = a['Статус'];
    const aptDate = formatDate(a['Дата']);
    const isActive = aptStatus === CONFIG.STATUS.CONFIRMED || aptStatus === CONFIG.STATUS.PENDING;
    const isNotCancelled = aptStatus !== CONFIG.STATUS.CANCELLED;
    const isNotCompleted = aptStatus !== CONFIG.STATUS.COMPLETED;
    return aptMasterId === String(masterId) && isActive && isNotCancelled && isNotCompleted;
  });
  
  // Фильтр по месяцу если указан
  let filteredPlanned = plannedAppointments;
  if (month && year) {
    filteredPlanned = plannedAppointments.filter(a => {
      const aptDate = formatDate(a['Дата']);
      const parts = aptDate.split('.');
      if (parts.length === 3) {
        const aptMonth = parseInt(parts[1]);
        const aptYear = parseInt(parts[2]);
        return aptMonth === parseInt(month) && aptYear === parseInt(year);
      }
      return true;
    });
  }
  
  const plannedRecords = filteredPlanned.map(a => {
    const service = services.find(s => String(s['ID']) === String(a['IdУслуги']));
    const user = users.find(u => String(u['ID']) === String(a['ID_Пользователя']));
    const price = a['Цена'] || (service ? service['Цена'] : 0) || 0;
    plannedIncome += price;
    
    return {
      id: 'planned_' + a['ID'],
      type: 'Планируется',
      amount: price,
      category: service ? service['Название'] : 'Услуга',
      date: formatDate(a['Дата']),
      description: `Клиент: ${user ? user['Имя'] : 'Неизвестно'}`
    };
  });
  
  return {
    success: true,
    data: {
      completedRecords,
      expenses: monthExpenseRecords,
      plannedRecords,
      completedIncome,
      totalExpenses,
      monthExpenses,
      plannedIncome,
      plannedNet: plannedIncome - monthExpenses,
      balance: completedIncome - totalExpenses
    }
  };
}

// ==================== РАСПИСАНИЕ ====================

function updateSchedule(masterId, scheduleData) {
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const master = masters.find(m => String(m['ID']) === String(masterId));
  
  if (!master) return { success: false, error: 'Мастер не найден' };
  
  const masterName = master['Имя'];
  const telegramId = master['TelegramID'];
  const scheduleSheetName = `График_${masterName}_${telegramId}`;
  
  let scheduleSheet = getSheet(scheduleSheetName);
  if (!scheduleSheet) {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    scheduleSheet = ss.getSheetByName(scheduleSheetName);
    
    if (!scheduleSheet) {
      // Создаем новый лист если не существует
      scheduleSheet = ss.insertSheet(scheduleSheetName);
      scheduleSheet.appendRow(['Дата', 'Статус', 'Начало', 'Конец', 'Перерыв_Начало', 'Перерыв_Конец']);
    }
  }
  
  const data = scheduleSheet.getDataRange().getValues();
  const headers = data[0];
  
  const dateIdx = headers.indexOf('Дата');
  const statusIdx = headers.indexOf('Статус');
  const startIdx = headers.indexOf('Начало');
  const endIdx = headers.indexOf('Конец');
  const breakStartIdx = headers.indexOf('Перерыв_Начало');
  const breakEndIdx = headers.indexOf('Перерыв_Конец');
  
  const dateToFind = formatDate(scheduleData.date);
  
  // Ищем существующую запись
  for (let i = 1; i < data.length; i++) {
    const existingDate = formatDate(data[i][dateIdx]);
    if (existingDate === dateToFind) {
      // Обновляем существующую запись
      if (statusIdx !== -1) data[i][statusIdx] = scheduleData.status;
      if (startIdx !== -1) data[i][startIdx] = scheduleData.start || '';
      if (endIdx !== -1) data[i][endIdx] = scheduleData.end || '';
      if (breakStartIdx !== -1) data[i][breakStartIdx] = scheduleData.breakStart || '';
      if (breakEndIdx !== -1) data[i][breakEndIdx] = scheduleData.breakEnd || '';
      
      scheduleSheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      return { success: true };
    }
  }
  
  // Добавляем новую запись
  scheduleSheet.appendRow([
    dateToFind,
    scheduleData.status,
    scheduleData.start || '',
    scheduleData.end || '',
    scheduleData.breakStart || '',
    scheduleData.breakEnd || ''
  ]);
  
  return { success: true };
}

// Пакетное обновление расписания для всех дней месяца
function updateScheduleBatch(masterId, schedules) {
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const master = masters.find(m => String(m['ID']) === String(masterId));
  
  if (!master) return { success: false, error: 'Мастер не найден' };
  
  const masterName = master['Имя'];
  const telegramId = master['TelegramID'];
  const scheduleSheetName = `График_${masterName}_${telegramId}`;
  
  let scheduleSheet = getSheet(scheduleSheetName);
  if (!scheduleSheet) {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    scheduleSheet = ss.getSheetByName(scheduleSheetName);
    
    if (!scheduleSheet) {
      scheduleSheet = ss.insertSheet(scheduleSheetName);
      scheduleSheet.appendRow(['Дата', 'Статус', 'Начало', 'Конец', 'Перерыв_Начало', 'Перерыв_Конец']);
    }
  }
  
  const data = scheduleSheet.getDataRange().getValues();
  const headers = data[0];
  
  const dateIdx = headers.indexOf('Дата');
  const statusIdx = headers.indexOf('Статус');
  const startIdx = headers.indexOf('Начало');
  const endIdx = headers.indexOf('Конец');
  const breakStartIdx = headers.indexOf('Перерыв_Начало');
  const breakEndIdx = headers.indexOf('Перерыв_Конец');
  
  // Создаем карту существующих дат
  const existingDates = new Map();
  for (let i = 1; i < data.length; i++) {
    const existingDate = formatDate(data[i][dateIdx]);
    existingDates.set(existingDate, i);
  }
  
  // Обрабатываем каждое расписание
  const rowsToAdd = [];
  schedules.forEach(scheduleData => {
    const dateToFind = formatDate(scheduleData.date);
    
    if (existingDates.has(dateToFind)) {
      // Обновляем существующую запись
      const rowIdx = existingDates.get(dateToFind);
      data[rowIdx][statusIdx] = scheduleData.status;
      data[rowIdx][startIdx] = scheduleData.start || '';
      data[rowIdx][endIdx] = scheduleData.end || '';
      data[rowIdx][breakStartIdx] = scheduleData.breakStart || '';
      data[rowIdx][breakEndIdx] = scheduleData.breakEnd || '';
    } else {
      // Добавляем в список новых строк
      rowsToAdd.push([
        dateToFind,
        scheduleData.status,
        scheduleData.start || '',
        scheduleData.end || '',
        scheduleData.breakStart || '',
        scheduleData.breakEnd || ''
      ]);
    }
  });
  
  // Обновляем существующие строки
  existingDates.forEach((rowIdx, date) => {
    scheduleSheet.getRange(rowIdx + 1, 1, 1, headers.length).setValues([data[rowIdx]]);
  });
  
  // Добавляем новые строки
  if (rowsToAdd.length > 0) {
    scheduleSheet.getRange(data.length + 1, 1, rowsToAdd.length, headers.length).setValues(rowsToAdd);
  }
  
  return { success: true };
}

// ==================== АВТОМАТИЧЕСКОЕ УПРАВЛЕНИЕ ГРАФИКОМ ====================

// Автоматическое обновление графиков всех мастеров
// Удаляет прошедшие дни и добавляет новые (минимум 60 дней вперёд)
// Не трогает дни, добавленные мастером вручную (> 60 дней от сегодня)
function autoUpdateAllMasterSchedules() {
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  
  console.log('Всего мастеров в таблице:', masters.length);
  
  // Фильтруем только активных мастеров
  const activeMasters = masters.filter(m => {
    const active = m['Активен'];
    const isActive = active === 1 || active === true || active === '1' || active === 'true' || active === 'Да' || active === 'да';
    console.log('Мастер:', m['Имя'], ', Активен:', active, ', isAcive:', isActive);
    return isActive;
  });
  
  console.log('Активных мастеров:', activeMasters.length);
  
  if (activeMasters.length === 0) {
    return 'Нет активных мастеров для обновления графиков';
  }
  
  const results = [];
  activeMasters.forEach(master => {
    try {
      const result = autoUpdateMasterSchedule(master['ID']);
      console.log('Результат обновления мастера', master['Имя'], ':', JSON.stringify(result));
      results.push({ master: master['Имя'], result });
    } catch (e) {
      console.error('Ошибка обновления графика мастера', master['Имя'], ':', e.toString());
      results.push({ master: master['Имя'], error: e.toString() });
    }
  });
  
  return 'Графики обновлены:\n' + results.map(r => r.master + ': ' + (r.error || 'OK (удалено: ' + r.result.deleted + ', добавлено: ' + r.result.added + ')')).join('\n');
}

// Автоматическое обновление графика конкретного мастера
function autoUpdateMasterSchedule(masterId) {
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const master = masters.find(m => String(m['ID']) === String(masterId));
  
  if (!master) {
    console.log('Мастер не найден для ID:', masterId);
    return { success: false, error: 'Мастер не найден' };
  }
  
  const masterName = master['Имя'];
  const telegramId = master['TelegramID'];
  
  console.log('Обновление графика для мастера:', masterName, ', TelegramID:', telegramId);
  
  // Ищем лист графика
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const allSheets = ss.getSheets();
  
  // Возможные варианты имени листа
  const possibleNames = [
    `График_${masterName}_${telegramId}`,
    `График ${masterName}`,
    `График_${masterName}`,
    masterName + '_график'
  ];
  
  console.log('Возможные имена листа:', possibleNames.join(', '));
  console.log('Все листы:', allSheets.map(s => s.getName()).join(', '));
  
  let scheduleSheet = null;
  
  // Сначала ищем по точному совпадению
  for (const name of possibleNames) {
    scheduleSheet = ss.getSheetByName(name);
    if (scheduleSheet) {
      console.log('Найден лист по имени:', name);
      break;
    }
  }
  
  // Если не нашли, ищем по частичному совпадению
  if (!scheduleSheet) {
    for (const sheet of allSheets) {
      const sheetName = sheet.getName();
      if (sheetName.includes('График') && sheetName.includes(masterName)) {
        scheduleSheet = sheet;
        console.log('Найден лист по частичному совпадению:', sheetName);
        break;
      }
    }
  }
  
  if (!scheduleSheet) {
    console.log('Лист графика не найден, создаём новый');
    scheduleSheet = ss.insertSheet(`График_${masterName}_${telegramId}`);
    scheduleSheet.appendRow(['Дата', 'Статус', 'Начало', 'Конец', 'Перерыв_Начало', 'Перерыв_Конец']);
  }
  
  const data = scheduleSheet.getDataRange().getValues();
  console.log('Данные графика, строк:', data.length);
  
  if (data.length <= 1) {
    console.log('График пуст, только заголовки');
  }
  
  const headers = data[0];
  console.log('Заголовки:', headers.join(', '));
  
  const dateIdx = headers.indexOf('Дата');
  
  if (dateIdx === -1) {
    console.log('Колонка "Дата" не найдена!');
    return { success: false, error: 'Колонка "Дата" не найдена' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Дата через 60 дней
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 60);
  
  console.log('Сегодня:', formatDate(today));
  console.log('Дата через 60 дней:', formatDate(futureDate));
  
  // Карта существующих дат (строка даты -> индекс строки)
  const existingDates = new Map();
  const rowsToKeep = [];
  let deletedCount = 0;
  
  // Проходим по всем строкам и определяем, какие оставить
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dateValue = row[dateIdx];
    const dateStr = formatDate(dateValue);
    
    // Парсим дату
    let rowDate = null;
    if (dateStr && dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const parts = dateStr.split('.');
      rowDate = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
      rowDate.setHours(0, 0, 0, 0);
    }
    
    if (rowDate) {
      // Прошедшие дни - удаляем
      if (rowDate < today) {
        console.log('Удаляем прошедший день:', dateStr);
        deletedCount++;
        continue; // Не добавляем в rowsToKeep
      }
      
      // Дни > 60 дней от сегодня - оставляем (добавлены мастером вручную)
      if (rowDate > futureDate) {
        console.log('Сохраняем день мастера (более 60 дней):', dateStr);
        rowsToKeep.push(row);
        existingDates.set(dateStr, true);
        continue;
      }
      
      // Дни в пределах 60 дней - оставляем
      rowsToKeep.push(row);
      existingDates.set(dateStr, true);
    } else {
      // Если не смогли распознать дату, всё равно оставляем строку
      console.log('Не распознана дата в строке', i, ':', dateValue);
      rowsToKeep.push(row);
    }
  }
  
  // Определяем, какие даты нужно добавить
  const datesToAdd = [];
  const currentAddDate = new Date(today);
  
  while (currentAddDate <= futureDate) {
    const dateStr = formatDate(currentAddDate);
    
    if (!existingDates.has(dateStr)) {
      // Определяем день недели для дефолтного статуса
      const dayOfWeek = currentAddDate.getDay();
      // 0 = воскресенье, 6 = суббота
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      datesToAdd.push([
        dateStr,
        isWeekend ? 'Выходной' : 'Рабочий',
        isWeekend ? '' : '09:00',
        isWeekend ? '' : '19:00',
        isWeekend ? '' : '13:00',
        isWeekend ? '' : '14:00'
      ]);
    }
    
    currentAddDate.setDate(currentAddDate.getDate() + 1);
  }
  
  console.log('Строк для сохранения:', rowsToKeep.length);
  console.log('Новых дат для добавления:', datesToAdd.length);
  
  // Очищаем лист и записываем обновлённые данные
  scheduleSheet.clear();
  scheduleSheet.appendRow(headers);
  
  // Записываем сохранённые строки с правильным форматированием времени
  if (rowsToKeep.length > 0) {
    // Форматируем время в строках чтобы избежать даты 30.12.1899
    const formattedRows = rowsToKeep.map(row => {
      const newRow = [...row];
      // Форматируем колонки времени (индексы 2, 3, 4, 5 - Начало, Конец, Перерыв_Начало, Перерыв_Конец)
      for (let idx = 2; idx <= 5; idx++) {
        if (newRow[idx]) {
          newRow[idx] = formatTime(newRow[idx]);
        }
      }
      return newRow;
    });
    scheduleSheet.getRange(2, 1, formattedRows.length, headers.length).setValues(formattedRows);
  }
  
  // Записываем новые даты
  if (datesToAdd.length > 0) {
    scheduleSheet.getRange(rowsToKeep.length + 2, 1, datesToAdd.length, headers.length).setValues(datesToAdd);
  }
  
  console.log('График обновлён: удалено прошедших дней:', deletedCount, ', добавлено новых:', datesToAdd.length);
  
  return { 
    success: true, 
    deleted: deletedCount,
    added: datesToAdd.length,
    kept: rowsToKeep.length
  };
}

// Тестовая функция для проверки
function testAutoUpdateSchedule() {
  const result = autoUpdateAllMasterSchedules();
  console.log(result);
  return result;
}

// ==================== КЛИЕНТЫ ====================

function getMasterClients(masterId) {
  const appointments = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const users = getSheetData(CONFIG.SHEETS.USERS);
  
  const clientMap = new Map();
  
  appointments
    .filter(a => String(a['IdМастера']) === String(masterId) && a['Статус'] !== CONFIG.STATUS.CANCELLED)
    .forEach(a => {
      const userId = a['ID_Пользователя'];
      if (userId && !clientMap.has(userId)) {
        const user = users.find(u => String(u['ID']) === String(userId));
        if (user) {
          clientMap.set(userId, {
            id: user['ID'],
            name: user['Имя'],
            phone: user['Телефон'],
            totalVisits: 0
          });
        }
      }
      if (clientMap.has(userId)) {
        const client = clientMap.get(userId);
        client.totalVisits++;
      }
    });
  
  return { success: true, data: Array.from(clientMap.values()) };
}

function addClient(client) {
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  const data = getSheetData(CONFIG.SHEETS.USERS);
  
  const normalizedPhone = normalizePhone(client.phone);
  const existing = data.find(u => normalizePhone(u['Телефон']) === normalizedPhone);
  
  if (existing) {
    return { success: true, data: { id: existing['ID'], name: existing['Имя'], phone: existing['Телефон'], totalVisits: 0 } };
  }
  
  const newId = generateId();
  sheet.appendRow([
    newId,
    client.name,
    client.phone,
    '',
    'Добавлен мастером',
    0,
    '',
    '',
    ''
  ]);
  
  return { success: true, data: { id: newId, name: client.name, phone: client.phone, totalVisits: 0 } };
}

// ==================== РАСХОДЫ ====================

function addFinanceRecord(record) {
  const sheet = getSheet(CONFIG.SHEETS.INCOME_EXPENSES);
  if (!sheet) return { success: false, error: 'Лист "Доходы и расходы" не найден' };
  
  const newId = generateId();
  const formattedDate = formatDate(record.date);
  
  sheet.appendRow([
    newId,
    record.masterId,
    record.type,
    record.amount,
    record.category,
    formattedDate,
    record.description || ''
  ]);
  
  return { success: true, data: { id: newId } };
}

// ==================== TELEGRAM ====================

// Отправка сообщения (без сохранения ID)
function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Telegram error:', e);
  }
}

// Отправка сообщения с возвратом ID сообщения
function sendTelegramMessageWithId(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    
    const result = JSON.parse(response.getContentText());
    if (result.ok && result.result) {
      return result.result.message_id;
    }
    return null;
  } catch (e) {
    console.error('Telegram error:', e);
    return null;
  }
}

// Удаление сообщения
function deleteTelegramMessage(chatId, messageId) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/deleteMessage`;
    const payload = {
      chat_id: chatId,
      message_id: messageId
    };
    
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    
    return true;
  } catch (e) {
    console.error('Telegram delete error:', e);
    return false;
  }
}

// Сохранение сообщения для последующего удаления
function saveMessageForDeletion(chatId, messageId, messageType, appointmentId, deleteAfterMinutes) {
  const sheet = getSheet(CONFIG.SHEETS.TELEGRAM_MESSAGES);
  if (!sheet) {
    // Создаём лист если не существует
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const newSheet = ss.insertSheet(CONFIG.SHEETS.TELEGRAM_MESSAGES);
    newSheet.appendRow(['ID', 'ChatId', 'MessageId', 'MessageType', 'AppointmentId', 'CreatedAt', 'DeleteAt', 'Deleted']);
  }
  
  const messageSheet = getSheet(CONFIG.SHEETS.TELEGRAM_MESSAGES);
  const now = new Date();
  const deleteAt = new Date(now.getTime() + (deleteAfterMinutes || 0) * 60000);
  
  messageSheet.appendRow([
    Date.now(),
    chatId,
    messageId,
    messageType,
    appointmentId || '',
    now.toISOString(),
    deleteAt.toISOString(),
    false
  ]);
}

// Удаление всех сообщений регистрации через минуту
function deleteRegistrationMessages() {
  const sheet = getSheet(CONFIG.SHEETS.TELEGRAM_MESSAGES);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const messageType = row[3];
    const deleted = row[7];
    
    if (messageType === CONFIG.MESSAGE_TYPES.REGISTRATION && deleted !== true) {
      const deleteAt = new Date(row[6]);
      
      if (now >= deleteAt) {
        const chatId = row[1];
        const messageId = row[2];
        
        // Удаляем сообщение
        deleteTelegramMessage(chatId, messageId);
        
        // Помечаем как удалённое
        sheet.getRange(i + 1, 8).setValue(true);
      }
    }
  }
}

// Удаление сообщений о прошедших записях
function deletePastAppointmentMessages() {
  const sheet = getSheet(CONFIG.SHEETS.TELEGRAM_MESSAGES);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  const appointments = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const messageType = row[3];
    const appointmentId = row[4];
    const deleted = row[7];
    
    if (messageType === CONFIG.MESSAGE_TYPES.APPOINTMENT && appointmentId && deleted !== true) {
      // Находим запись
      const appointment = appointments.find(a => String(a['ID']) === String(appointmentId));
      
      if (appointment) {
        const aptDate = formatDate(appointment['Дата']);
        const aptTime = formatTime(appointment['Время']);
        
        // Парсим дату и время записи
        const dateParts = aptDate.split('.');
        const timeParts = aptTime.split(':');
        
        if (dateParts.length === 3 && timeParts.length >= 2) {
          const appointmentDateTime = new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[0]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1])
          );
          
          // Добавляем 1 час после записи для удаления
          const deleteTime = new Date(appointmentDateTime.getTime() + 60 * 60000);
          
          if (now >= deleteTime) {
            const chatId = row[1];
            const messageId = row[2];
            
            // Удаляем сообщение
            deleteTelegramMessage(chatId, messageId);
            
            // Помечаем как удалённое
            sheet.getRange(i + 1, 8).setValue(true);
          }
        }
      }
    }
  }
}

function sendAppointmentNotifications(appointmentId, appointmentData, service) {
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const users = getSheetData(CONFIG.SHEETS.USERS);
  
  const master = masters.find(m => String(m['ID']) === String(appointmentData.masterId));
  const serviceName = service ? service['Название'] : 'Неизвестно';
  
  const formattedDate = formatDateRussian(appointmentData.date);
  
  // Получаем информацию о клиенте если есть userId
  let clientInfo = 'Не указан';
  let clientTelegramId = null;
  if (appointmentData.userId) {
    const user = users.find(u => String(u['ID']) === String(appointmentData.userId));
    if (user) {
      clientInfo = user['Имя'] || 'Из приложения';
      clientTelegramId = user['TelegramId'];
    }
  }
  
  // Уведомление КЛИЕНТУ с сохранением ID для удаления
  if (clientTelegramId && master) {
    const clientMessageId = sendTelegramMessageWithId(clientTelegramId, `
✅ <b>Запись подтверждена!</b>

👩‍🎨 Мастер: ${master['Имя']}
💄 Услуга: ${serviceName}

📆 ${formattedDate}
⏰ Время: ${appointmentData.time}

До встречи в GOOD Лак!
    `);
    
    // Сохраняем сообщение для удаления после прошедшей записи
    if (clientMessageId) {
      saveMessageForDeletion(clientTelegramId, clientMessageId, CONFIG.MESSAGE_TYPES.APPOINTMENT, appointmentId, 0);
    }
  }
  
  // Уведомление МАСТЕРУ с сохранением ID для удаления
  if (master && master['TelegramID']) {
    const masterMessageId = sendTelegramMessageWithId(master['TelegramID'], `
📅 <b>Новая запись!</b>

👤 Клиент: ${clientInfo}
📞 Телефон: ${appointmentData.phone || 'Не указан'}
💄 Услуга: ${serviceName}

📆 ${formattedDate}
⏰ Время: ${appointmentData.time}
    `);
    
    // Сохраняем сообщение для удаления после прошедшей записи
    if (masterMessageId) {
      saveMessageForDeletion(master['TelegramID'], masterMessageId, CONFIG.MESSAGE_TYPES.APPOINTMENT, appointmentId, 0);
    }
  }
}

function handleTelegramUpdate(update) {
  if (!update.message) return;
  
  const chatId = update.message.chat.id;
  const text = update.message.text || '';
  
  // Простая проверка команды
  if (text === '/start') {
    // Удаляем сообщение пользователя
    const userMessageId = update.message.message_id;
    deleteTelegramMessage(chatId, userMessageId);
    
    // Отправляем сообщение с сохранением ID для удаления через 1 минуту
    const messageId = sendTelegramMessageWithId(chatId, `
👋 Добро пожаловать в GOOD Лак!

Для записи на маникюр используйте наше приложение.

Ваш Telegram ID: ${chatId}
    `);
    
    // Сохраняем сообщение регистрации для удаления через 1 минуту
    if (messageId) {
      saveMessageForDeletion(chatId, messageId, CONFIG.MESSAGE_TYPES.REGISTRATION, null, 1);
    }
  }
}

function setTelegramWebhook() {
  const webhookUrl = CONFIG.APPS_SCRIPT_URL + '?action=telegramWebhook';
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
  
  const response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());
}

// ==================== НАПОМИНАНИЯ ====================

// Функция для отправки утренних напоминаний в 08:00
// Запускается триггером каждый день в 08:00
function sendMorningReminders() {
  const today = formatDate(new Date());
  const appointments = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const users = getSheetData(CONFIG.SHEETS.USERS);
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);
  
  // Фильтруем записи на сегодня (только подтвержденные)
  const todayAppointments = appointments.filter(a => {
    const aptDate = formatDate(a['Дата']);
    return aptDate === today && a['Статус'] === CONFIG.STATUS.CONFIRMED;
  });
  
  console.log('Утренние напоминания: найдено записей на сегодня:', todayAppointments.length);
  
  todayAppointments.forEach(apt => {
    const user = users.find(u => String(u['ID']) === String(apt['ID_Пользователя']));
    const master = masters.find(m => String(m['ID']) === String(apt['IdМастера']));
    const service = services.find(s => String(s['ID']) === String(apt['IdУслуги']));
    
    const serviceName = service ? service['Название'] : 'Услуга';
    const masterName = master ? master['Имя'] : 'Мастер';
    const aptTime = formatTime(apt['Время']);
    
    // Напоминание КЛИЕНТУ
    if (user && user['TelegramId']) {
      sendTelegramMessage(user['TelegramId'], `
🔔 <b>Напоминание о записи!</b>

Сегодня у вас запись в GOOD Лак:

👩‍🎨 Мастер: ${masterName}
💄 Услуга: ${serviceName}
⏰ Время: ${aptTime}

Ждем вас! 🌸
      `);
    }
    
    // Напоминание МАСТЕРУ
    if (master && master['TelegramID']) {
      const clientName = user ? user['Имя'] : 'Клиент';
      const clientPhone = apt['ТелефонКлиента'] || (user ? user['Телефон'] : 'Не указан');
      
      sendTelegramMessage(master['TelegramID'], `
🔔 <b>Напоминание: сегодня запись!</b>

👤 Клиент: ${clientName}
📞 Телефон: ${clientPhone}
💄 Услуга: ${serviceName}
⏰ Время: ${aptTime}
      `);
    }
  });
}

// Функция для отправки напоминаний за час до записи
// Запускается триггером каждые 10 минут
function sendHourBeforeReminders() {
  const now = new Date();
  const today = formatDate(now);
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinutes;
  
  const appointments = getSheetData(CONFIG.SHEETS.APPOINTMENTS);
  const users = getSheetData(CONFIG.SHEETS.USERS);
  const masters = getSheetData(CONFIG.SHEETS.MASTERS);
  const services = getSheetData(CONFIG.SHEETS.SERVICES);
  
  // Фильтруем записи на сегодня (только подтвержденные)
  const todayAppointments = appointments.filter(a => {
    const aptDate = formatDate(a['Дата']);
    return aptDate === today && a['Статус'] === CONFIG.STATUS.CONFIRMED;
  });
  
  todayAppointments.forEach(apt => {
    const aptTime = formatTime(apt['Время']);
    const timeParts = aptTime.split(':');
    const aptHour = parseInt(timeParts[0]) || 0;
    const aptMinutes = parseInt(timeParts[1]) || 0;
    const aptTimeMinutes = aptHour * 60 + aptMinutes;
    
    // Разница в минутах
    const diffMinutes = aptTimeMinutes - currentTimeMinutes;
    
    // Если до записи 50-70 минут (около часа)
    if (diffMinutes >= 50 && diffMinutes <= 70) {
      const user = users.find(u => String(u['ID']) === String(apt['ID_Пользователя']));
      const master = masters.find(m => String(m['ID']) === String(apt['IdМастера']));
      const service = services.find(s => String(s['ID']) === String(apt['IdУслуги']));
      
      const serviceName = service ? service['Название'] : 'Услуга';
      const masterName = master ? master['Имя'] : 'Мастер';
      
      // Напоминание КЛИЕНТУ за час
      if (user && user['TelegramId']) {
        sendTelegramMessage(user['TelegramId'], `
⏰ <b>Через час у вас запись!</b>

👩‍🎨 Мастер: ${masterName}
💄 Услуга: ${serviceName}
⏰ Время: ${aptTime}

Не забудьте! До встречи в GOOD Лак! 🌸
        `);
      }
      
      // Напоминание МАСТЕРУ за час
      if (master && master['TelegramID']) {
        const clientName = user ? user['Имя'] : 'Клиент';
        const clientPhone = apt['ТелефонКлиента'] || (user ? user['Телефон'] : 'Не указан');
        
        sendTelegramMessage(master['TelegramID'], `
⏰ <b>Через час - запись!</b>

👤 Клиент: ${clientName}
📞 Телефон: ${clientPhone}
💄 Услуга: ${serviceName}
⏰ Время: ${aptTime}
        `);
      }
      
      console.log('Отправлено напоминание за час для записи:', apt['ID']);
    }
  });
}

// ==================== ТРИГГЕРЫ ====================

// Создание триггеров - ЗАПУСТИТЕ ЭТУ ФУНКЦИЮ ОДИН РАЗ
function createReminderTriggers() {
  // Удаляем старые триггеры
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendMorningReminders' || 
        trigger.getHandlerFunction() === 'sendHourBeforeReminders' ||
        trigger.getHandlerFunction() === 'deleteRegistrationMessages' ||
        trigger.getHandlerFunction() === 'deletePastAppointmentMessages' ||
        trigger.getHandlerFunction() === 'autoUpdateAllMasterSchedules') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Триггер для утренних напоминаний в 08:00
  ScriptApp.newTrigger('sendMorningReminders')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();
  
  // Триггер для напоминаний за час - каждые 10 минут
  ScriptApp.newTrigger('sendHourBeforeReminders')
    .timeBased()
    .everyMinutes(10)
    .create();
  
  // Триггер для удаления сообщений регистрации - каждую минуту
  ScriptApp.newTrigger('deleteRegistrationMessages')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  // Триггер для удаления сообщений о прошедших записях - каждые 10 минут
  ScriptApp.newTrigger('deletePastAppointmentMessages')
    .timeBased()
    .everyMinutes(10)
    .create();
  
  // Триггер для автоматического обновления графиков - ежедневно в 00:05
  ScriptApp.newTrigger('autoUpdateAllMasterSchedules')
    .timeBased()
    .atHour(0)
    .nearMinute(5)
    .everyDays(1)
    .create();
  
  console.log('Все триггеры созданы!');
  return 'Триггеры созданы:\n' +
    '- Утренние напоминания в 08:00\n' +
    '- Напоминания за час (каждые 10 минут)\n' +
    '- Удаление сообщений регистрации (каждую минуту)\n' +
    '- Удаление сообщений записей (каждые 10 минут)\n' +
    '- Автообновление графиков (ежедневно в 00:05)';
}

// Удаление всех триггеров
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  console.log('Все триггеры удалены');
  return 'Все триггеры удалены';
}
