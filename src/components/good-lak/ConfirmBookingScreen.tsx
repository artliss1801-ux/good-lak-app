'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, Sparkles, Calendar, Clock, Check, X, Loader2 } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';

// Извлечение ID файла из Google Drive URL
function extractGoogleDriveFileId(url: string | undefined): string | null {
  if (!url) return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /open\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

// Получение проксированной ссылки на изображение (обходит CORS)
function getProxiedImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `/api/image-proxy?id=${fileId}`;
  }

  // Если это не Google Drive URL, возвращаем как есть
  return url;
}

export function ConfirmBookingScreen() {
  const { 
    booking, 
    user,
    editingAppointmentId,
    selectedAppointment,
    resetBooking, 
    setScreen,
    setError
  } = useGoodLakStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDateRussian = (dateStr: string) => {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    const dayOfMonth = format(date, 'd', { locale: ru });
    const month = format(date, 'MMMM', { locale: ru });
    const year = format(date, 'yyyy', { locale: ru });
    const weekday = format(date, 'EEEE', { locale: ru });
    return `${dayOfMonth} ${month} ${year} (${weekday})`;
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (editingAppointmentId) {
        // Обновляем существующую запись (перенос)
        const response = await fetch('/api/good-lak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateAppointment',
            appointmentId: editingAppointmentId,
            data: {
              date: booking.selectedDate,
              time: booking.selectedTime,
              userId: user?.id,
              masterId: booking.selectedMaster?.id,
              serviceName: booking.selectedService?.name,
            }
          })
        });
        const data = await response.json();
        if (data.success) {
          resetBooking();
          setScreen('booking-success');
        } else {
          setError(data.error || 'Ошибка при переносе записи');
        }
      } else {
        // Создаём новую запись
        const response = await fetch('/api/good-lak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createAppointment',
            appointment: {
              userId: user?.id,
              phone: user?.phone,
              masterId: booking.selectedMaster?.id,
              serviceId: booking.selectedService?.id,
              date: booking.selectedDate,
              time: booking.selectedTime,
            }
          })
        });
        const data = await response.json();
        if (data.success) {
          setScreen('booking-success');
        } else {
          setError(data.error || 'Ошибка при создании записи');
        }
      }
    } catch (error) {
      setError('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setScreen('select-master');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setScreen('select-datetime')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">
            {editingAppointmentId ? 'Подтверждение переноса' : 'Подтверждение записи'}
          </h1>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4">
            <h2 className="text-lg font-semibold text-white text-center">
              {editingAppointmentId ? 'Новые дата и время' : 'Проверьте данные записи'}
            </h2>
          </div>
          
          <CardContent className="p-6 space-y-4">
            {/* Master with photo */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              {booking.selectedMaster?.photo ? (
                <img 
                  src={getProxiedImageUrl(booking.selectedMaster.photo) || booking.selectedMaster.photo} 
                  alt={booking.selectedMaster.name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-pink-300"
                  onError={(e) => {
                    console.log('Failed to load master photo:', booking.selectedMaster?.photo);
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center ${booking.selectedMaster?.photo ? 'hidden' : ''}`}>
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Мастер</p>
                <p className="font-semibold text-gray-800">{booking.selectedMaster?.name}</p>
              </div>
            </div>
            
            {/* Service */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Услуга</p>
                <p className="font-semibold text-gray-800">{booking.selectedService?.name}</p>
              </div>
            </div>
            
            {/* Date */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Дата</p>
                <p className="font-semibold text-gray-800 capitalize">
                  {booking.selectedDate && formatDateRussian(booking.selectedDate)}
                </p>
              </div>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-400 to-green-400 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Время</p>
                <p className="font-semibold text-gray-800">{booking.selectedTime}</p>
              </div>
            </div>

            {/* Old appointment info for reschedule */}
            {editingAppointmentId && selectedAppointment && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-700 font-medium mb-1">Предыдущая запись:</p>
                <p className="text-sm text-amber-600">
                  {formatDateRussian(selectedAppointment.date)} в {selectedAppointment.time}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Buttons */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white rounded-xl shadow-lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                {editingAppointmentId ? 'Подтвердить перенос' : 'Подтвердить'}
              </>
            )}
          </Button>
          
          <Button
            onClick={handleEdit}
            variant="outline"
            className="w-full h-12 text-lg border-2 border-gray-300 text-gray-700 rounded-xl"
          >
            <X className="mr-2 h-5 w-5" />
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
