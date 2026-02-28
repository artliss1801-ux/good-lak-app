'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Save, Loader2, Edit2 } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

// Конвертация любой даты в yyyy-MM-dd для input type="date"
function dateToInputFormat(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  const str = dateStr.trim();
  
  // Если уже в формате yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // Если в формате dd.MM.yyyy
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
    const parts = str.split('.');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Если это число (Excel date serial) - Google Sheets хранит даты как число дней с 30.12.1899
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0 && num < 100000) { // разумный диапазон для дат
    // Excel date serial number to JS date
    // Google Sheets использует 30.12.1899 как базовую дату
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + num * 86400000);
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Попытка распарсить ISO дату (YYYY-MM-DDTHH:mm:ss.sssZ)
  if (str.includes('T')) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // Ignore
    }
  }
  
  // Попытка распарсить как дату
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      // Проверяем, что год разумный (не 1900, что может быть ошибкой Excel)
      if (year > 1900 && year < 2100) {
        return `${year}-${month}-${day}`;
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  return '';
}

// Конвертация даты из yyyy-MM-dd в dd.MM.yyyy для хранения
function dateToStorageFormat(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  // Если в формате yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  
  // Если уже в формате dd.MM.yyyy
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  return dateStr;
}

export function ProfileScreen() {
  const { user, setUser, setScreen } = useGoodLakStore();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  // Инициализируем дату рождения из кэша если есть
  const [birthDate, setBirthDate] = useState(() => {
    if (user?.birthDate) {
      return dateToInputFormat(user.birthDate);
    }
    return '';
  });
  const [about, setAbout] = useState(user?.about || '');
  const [isLoading, setIsLoading] = useState(false); // Начинаем с false, т.к. данные уже есть в кэше
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false); // Флаг загрузки с сервера

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getUserProfile&userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setName(data.data.name || '');
        setPhone(data.data.phone || '');
        
        // Дата приходит в разных форматах, конвертируем для input
        const birthDateFromServer = data.data.birthDate || '';
        console.log('birthDateFromServer:', birthDateFromServer);
        const convertedDate = dateToInputFormat(birthDateFromServer);
        console.log('convertedDate:', convertedDate);
        setBirthDate(convertedDate);
        
        setAbout(data.data.about || '');
        setHasLoadedFromServer(true);
        
        // Обновляем пользователя в store с актуальными данными
        setUser({
          ...user,
          name: data.data.name || '',
          phone: data.data.phone || '',
          birthDate: birthDateFromServer,
          about: data.data.about || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user, setUser]);

  useEffect(() => {
    // Загружаем профиль с сервера только если еще не загружали
    // и если у нас нет полных данных (например, даты рождения)
    if (!hasLoadedFromServer && user?.id && !user?.birthDate) {
      fetchProfile();
    }
  }, [fetchProfile, hasLoadedFromServer, user?.id, user?.birthDate]);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setMessage('');
    
    try {
      // Конвертируем дату в dd.MM.yyyy для хранения
      const formattedBirthDate = birthDate ? dateToStorageFormat(birthDate) : '';
      
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUserProfile',
          userId: user.id,
          profile: {
            name,
            phone: phone, // Отправляем телефон для обновления
            birthDate: formattedBirthDate, // В формате dd.MM.yyyy
            about
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('Профиль успешно сохранён');
        // Обновляем пользователя в store
        setUser({
          ...user,
          name,
          phone,
          birthDate: formattedBirthDate,
          about
        });
        setIsEditingPhone(false);
        
        // Перечитываем профиль чтобы убедиться что данные сохранены
        setTimeout(() => {
          fetchProfile();
        }, 500);
      } else {
        setMessage('Ошибка сохранения: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Форматируем телефон в формат +7 (XXX) XXX-XX-XX
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7') && digits.length > 0) {
      digits = '7' + digits;
    }
    
    let formatted = '';
    if (digits.length > 0) {
      formatted = '+' + digits[0];
      if (digits.length > 1) {
        formatted += ' (' + digits.slice(1, 4);
      }
      if (digits.length > 4) {
        formatted += ') ' + digits.slice(4, 7);
      }
      if (digits.length > 7) {
        formatted += '-' + digits.slice(7, 9);
      }
      if (digits.length > 9) {
        formatted += '-' + digits.slice(9, 11);
      }
    }
    setPhone(formatted);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setScreen('home')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Мой профиль</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <div className="relative">
                    <Input
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+7 (___) ___-__-__"
                      className="h-12 pr-10"
                      disabled={!isEditingPhone}
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(!isEditingPhone)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isEditingPhone ? 'Нажмите на иконку карандаша для сохранения' : 'Нажмите на иконку карандаша для изменения'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата рождения
                  </label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Формат: день.месяц.год
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    О себе
                  </label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Расскажите немного о себе..."
                    className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                  />
                </div>
              </div>

              {/* Message */}
              {message && (
                <p className={`text-center text-sm ${message.includes('успешно') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
