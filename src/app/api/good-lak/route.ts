import { NextRequest, NextResponse } from 'next/server';

// URL вашего опубликованного Google Apps Script
const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzqFpZ68RYKerFs8ikqhXdZrHuA_toHrR1ZoE-V2gec8Pli8VqkvyOvA5faL8ZqdatxHA/exec';

// Конвертация даты из dd.MM.yyyy в yyyy-MM-dd
function convertToISODate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Если уже в формате yyyy-MM-dd
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Если в формате dd.MM.yyyy
  if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const parts = dateStr.split('.');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  return dateStr;
}

// Функция для нормализации времени из Google Sheets
function normalizeTime(time: unknown): string {
  if (!time) return '';
  
  if (typeof time === 'string') {
    if (time.includes('1899-12-30T')) {
      const match = time.match(/T(\d{2}):(\d{2})/);
      if (match) {
        return match[1] + ':' + match[2];
      }
    }
    
    if (time.includes(':') && !time.includes('T')) {
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
  
  if (typeof time === 'object' && time !== null) {
    const timeStr = String(time);
    const match = timeStr.match(/T(\d{2}):(\d{2})/);
    if (match) {
      return match[1] + ':' + match[2];
    }
  }
  
  return String(time);
}

// Нормализация расписания - даты конвертируем в yyyy-MM-dd для клиента
function normalizeSchedule(data: unknown) {
  if (!Array.isArray(data)) return data;
  
  return data.map((item: Record<string, unknown>) => ({
    ...item,
    date: convertToISODate(String(item.date || '')),
    start: normalizeTime(item.start),
    end: normalizeTime(item.end),
    breakStart: normalizeTime(item.breakStart),
    breakEnd: normalizeTime(item.breakEnd),
  }));
}

// Генерация слотов времени
function generateTimeSlots(
  start: string,
  end: string,
  breakStart: string,
  breakEnd: string,
  duration: number,
  date: string,
  bookedAppointments: { time: string; duration: number }[] = []
): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];

  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);
  const breakStartMinutes = parseTime(breakStart);
  const breakEndMinutes = parseTime(breakEnd);

  if (startMinutes >= endMinutes) {
    return [];
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let currentMinutesSlot = startMinutes;

  while (currentMinutesSlot + duration <= endMinutes) {
    const isPast = today === date && currentMinutesSlot <= currentMinutes;

    const slotStart = currentMinutesSlot;
    const slotEnd = currentMinutesSlot + duration;

    const overlapsBreak = breakStartMinutes && breakEndMinutes &&
                          (slotStart < breakEndMinutes && slotEnd > breakStartMinutes);

    const hasConflict = bookedAppointments.some(apt => {
      const aptStart = parseTime(apt.time);
      const aptDuration = apt.duration || 60;
      const aptEnd = aptStart + aptDuration;

      return slotStart < aptEnd && slotEnd > aptStart;
    });

    if (!isPast && !hasConflict && !overlapsBreak) {
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

async function fetchFromAppsScript(params: Record<string, string>) {
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    redirect: 'follow',
  });
  return response.json();
}

async function postToAppsScript(data: Record<string, unknown>) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    redirect: 'follow',
  });
  return response.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    let result;

    switch (action) {
      case 'getMasters':
        result = await fetchFromAppsScript({ action: 'getMasters' });
        break;
      case 'getServices':
        result = await fetchFromAppsScript({ action: 'getServices' });
        break;
      case 'getMasterSchedule':
        result = await fetchFromAppsScript({
          action: 'getMasterSchedule',
          masterId: searchParams.get('masterId') || '',
        });
        if (result.success && result.data) {
          result.data = normalizeSchedule(result.data);
        }
        break;
      case 'getAvailableSlots': {
        const scheduleResult = await fetchFromAppsScript({
          action: 'getMasterSchedule',
          masterId: searchParams.get('masterId') || '',
        });

        if (scheduleResult.success && scheduleResult.data) {
          scheduleResult.data = normalizeSchedule(scheduleResult.data);
        }

        const date = searchParams.get('date') || ''; // yyyy-MM-dd
        const masterId = searchParams.get('masterId') || '';
        const serviceId = searchParams.get('serviceId') || '';

        const daySchedule = scheduleResult.data?.find((s: { date: string }) => s.date === date);

        if (!daySchedule || daySchedule.status !== 'Рабочий') {
          result = { success: true, data: [], message: 'Нет рабочих часов на эту дату' };
          break;
        }

        if (!daySchedule.start || !daySchedule.end) {
          result = { success: true, data: [], message: 'Не указано время работы' };
          break;
        }

        const servicesResult = await fetchFromAppsScript({ action: 'getServices' });
        const service = servicesResult.data?.find((s: { id: string | number }) => String(s.id) === String(serviceId));
        const duration = service?.duration || 60;

        const appointmentsResult = await fetchFromAppsScript({
          action: 'getMasterAppointmentsForDate',
          masterId: masterId,
          date: date,
        });

        const bookedAppointments: { time: string; duration: number }[] = [];
        if (appointmentsResult.success && Array.isArray(appointmentsResult.data)) {
          appointmentsResult.data.forEach((apt: { time?: string; Время?: string; duration?: number; Длительность?: number }) => {
            const time = apt.time || apt.Время || '';
            const aptDuration = apt.duration || apt.Длительность || 60;
            if (time) {
              bookedAppointments.push({
                time: normalizeTime(time),
                duration: parseInt(String(aptDuration)) || 60
              });
            }
          });
        }

        const slots = generateTimeSlots(
          daySchedule.start,
          daySchedule.end,
          daySchedule.breakStart,
          daySchedule.breakEnd,
          duration,
          date,
          bookedAppointments
        );

        result = { success: true, data: slots };
        break;
      }
      case 'getUser':
        result = await fetchFromAppsScript({
          action: 'getUser',
          telegramId: searchParams.get('telegramId') || '',
        });
        break;
      case 'getUserByPhone':
        result = await fetchFromAppsScript({
          action: 'getUserByPhone',
          phone: searchParams.get('phone') || '',
        });
        break;
      case 'getUserAppointments':
        result = await fetchFromAppsScript({
          action: 'getUserAppointments',
          userId: searchParams.get('userId') || '',
        });
        // Конвертируем даты в записи пользователя
        if (result.success && result.data) {
          result.data = result.data.map((apt: { date: string }) => ({
            ...apt,
            date: convertToISODate(apt.date)
          }));
        }
        break;
      case 'loginMaster':
        result = await fetchFromAppsScript({
          action: 'loginMaster',
          login: searchParams.get('login') || '',
          password: searchParams.get('password') || '',
        });
        break;
      case 'loginAdmin':
        result = await fetchFromAppsScript({
          action: 'loginAdmin',
          login: searchParams.get('login') || '',
          password: searchParams.get('password') || '',
        });
        break;
      case 'getAppSettings':
        result = await fetchFromAppsScript({
          action: 'getAppSettings',
        });
        break;
      case 'getMasterAppointments':
        result = await fetchFromAppsScript({
          action: 'getMasterAppointments',
          masterId: searchParams.get('masterId') || '',
        });
        // Конвертируем даты
        if (result.success && result.data) {
          result.data = result.data.map((apt: { date: string }) => ({
            ...apt,
            date: convertToISODate(apt.date)
          }));
        }
        break;
      case 'getMasterClients':
        result = await fetchFromAppsScript({
          action: 'getMasterClients',
          masterId: searchParams.get('masterId') || '',
        });
        break;
      case 'getMasterFinances':
        result = await fetchFromAppsScript({
          action: 'getMasterFinances',
          masterId: searchParams.get('masterId') || '',
        });
        // Конвертируем даты
        if (result.success && result.data?.records) {
          result.data.records = result.data.records.map((r: { date: string }) => ({
            ...r,
            date: convertToISODate(r.date)
          }));
        }
        break;
      case 'getMasterFinancesCompleted': {
        // Новый endpoint для финансов по завершенным услугам
        result = await fetchFromAppsScript({
          action: 'getMasterFinancesCompleted',
          masterId: searchParams.get('masterId') || '',
          month: searchParams.get('month') || '',
          year: searchParams.get('year') || '',
        });
        // Конвертируем даты
        if (result.success && result.data) {
          if (result.data.completedRecords) {
            result.data.completedRecords = result.data.completedRecords.map((r: { date: string }) => ({
              ...r,
              date: convertToISODate(r.date)
            }));
          }
          if (result.data.expenses) {
            result.data.expenses = result.data.expenses.map((r: { date: string }) => ({
              ...r,
              date: convertToISODate(r.date)
            }));
          }
          if (result.data.plannedRecords) {
            result.data.plannedRecords = result.data.plannedRecords.map((r: { date: string }) => ({
              ...r,
              date: convertToISODate(r.date)
            }));
          }
        }
        break;
      }
      case 'getMasterInfo':
        result = await fetchFromAppsScript({
          action: 'getMasterInfo',
          masterId: searchParams.get('masterId') || '',
        });
        break;
      case 'getUserProfile':
        result = await fetchFromAppsScript({
          action: 'getUserProfile',
          userId: searchParams.get('userId') || '',
        });
        // Конвертируем дату рождения в yyyy-MM-dd для input type="date"
        if (result.success && result.data?.birthDate) {
          result.data.birthDate = convertToISODate(result.data.birthDate);
        }
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    let result;

    switch (data.action) {
      case 'registerUser':
        result = await postToAppsScript({
          action: 'registerUser',
          user: data.user,
        });
        break;
      case 'createAppointment':
        result = await postToAppsScript({
          action: 'createAppointment',
          appointment: data.appointment,
        });
        break;
      case 'updateAppointment':
        result = await postToAppsScript({
          action: 'updateAppointment',
          appointmentId: data.appointmentId,
          data: data.data,
        });
        break;
      case 'cancelAppointment':
        result = await postToAppsScript({
          action: 'cancelAppointment',
          appointmentId: data.appointmentId,
        });
        break;
      case 'addComment':
        result = await postToAppsScript({
          action: 'addComment',
          appointmentId: data.appointmentId,
          comment: data.comment,
        });
        break;
      case 'updateSchedule':
        result = await postToAppsScript({
          action: 'updateSchedule',
          masterId: data.masterId,
          schedule: data.schedule,
        });
        break;
      case 'updateScheduleBatch':
        result = await postToAppsScript({
          action: 'updateScheduleBatch',
          masterId: data.masterId,
          schedules: data.schedules,
        });
        break;
      case 'addClient':
        result = await postToAppsScript({
          action: 'addClient',
          client: data.client,
        });
        break;
      case 'addFinanceRecord':
        result = await postToAppsScript({
          action: 'addFinanceRecord',
          record: data.record,
        });
        break;
      case 'updateUserProfile':
        result = await postToAppsScript({
          action: 'updateUserProfile',
          userId: data.userId,
          profile: data.profile,
        });
        break;
      case 'updateMasterProfile':
        result = await postToAppsScript({
          action: 'updateMasterProfile',
          masterId: data.masterId,
          profile: data.profile,
        });
        break;
      case 'updateMasterFullProfile':
        result = await postToAppsScript({
          action: 'updateMasterFullProfile',
          masterId: data.masterId,
          profile: data.profile,
        });
        break;
      case 'uploadMasterPhoto':
        result = await postToAppsScript({
          action: 'uploadMasterPhoto',
          masterId: data.masterId,
          photoBase64: data.photoBase64,
        });
        break;
      case 'updateMasterPhotoSettings':
        result = await postToAppsScript({
          action: 'updateMasterPhotoSettings',
          masterId: data.masterId,
          photoScale: data.photoScale,
          photoTranslateX: data.photoTranslateX,
          photoTranslateY: data.photoTranslateY,
        });
        break;
      case 'updateAppSettings':
        result = await postToAppsScript({
          action: 'updateAppSettings',
          settings: data.settings,
        });
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + data.action };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
