import { NextRequest, NextResponse } from 'next/server';

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = '8584455339:AAH0H3TybbDOA6yaV0jPB1Fi-hVdV1EK17k';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqFpZ68RYKerFs8ikqhXdZrHuA_toHrR1ZoE-V2gec8Pli8VqkvyOvA5faL8ZqdatxHA/exec';

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(chatId: string, text: string, keyboard?: object) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  
  if (keyboard) {
    payload.reply_markup = JSON.stringify(keyboard);
  }
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// Функция для вызова Google Apps Script
async function callAppsScript(params: Record<string, string>, method: 'GET' | 'POST' = 'GET', body?: object) {
  if (method === 'GET') {
    const url = new URL(APPS_SCRIPT_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    const response = await fetch(url.toString(), { redirect: 'follow' });
    return response.json();
  } else {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });
    return response.json();
  }
}

// Нормализация телефона
function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  if (!digits.startsWith('7') && digits.length > 0) {
    digits = '7' + digits;
  }
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    console.log('Telegram update:', JSON.stringify(update));
    
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }
    
    const message = update.message;
    const chatId = String(message.chat.id);
    const text = message.text;
    const contact = message.contact;
    
    // /start команда
    if (text && text.startsWith('/start')) {
      const welcomeMessage = `
💅 <b>Добро пожаловать в GOOD Лак!</b>

Для записи на маникюр нам нужно знать ваши контакты.
Нажмите кнопку "Поделиться контактом" ниже.

После регистрации вы сможете:
✅ Записываться на прием
📅 Переносить записи
💬 Оставлять комментарии мастеру
      `;
      
      await sendTelegramMessage(chatId, welcomeMessage, {
        keyboard: [[{
          text: '📱 Поделиться контактом',
          request_contact: true
        }]],
        resize_keyboard: true,
        one_time_keyboard: true
      });
      
      return NextResponse.json({ ok: true });
    }
    
    // Контакт
    if (contact) {
      const name = contact.first_name + (contact.last_name ? ' ' + contact.last_name : '');
      const phone = contact.phone_number;
      const telegramId = contact.user_id;
      
      const result = await callAppsScript({}, 'POST', {
        action: 'registerUser',
        user: {
          name: name,
          phone: normalizePhone(phone),
          telegramId: telegramId
        }
      });
      
      if (result.success) {
        const successMessage = `
✅ <b>Регистрация успешна!</b>

Добро пожаловать, ${result.data.name}!

Теперь вы можете записаться на маникюр.
Вернитесь в приложение и обновите страницу.
        `;
        await sendTelegramMessage(chatId, successMessage);
      } else {
        await sendTelegramMessage(chatId, 'Произошла ошибка при регистрации. Попробуйте позже.');
      }
      
      return NextResponse.json({ ok: true });
    }
    
    // Неизвестная команда
    if (text) {
      await sendTelegramMessage(chatId, 'Используйте /start для начала работы');
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Telegram webhook endpoint active' });
}
