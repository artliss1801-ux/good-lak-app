'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';
import { format, addDays, startOfDay, isBefore, parse, isValid, startOfMonth, endOfMonth, getDay, setDate, isSameDay, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';

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

export function SelectDateTimeScreen() {
  const {
    booking,
    availableSlots,
    setAvailableSlots,
    schedule,
    setSchedule,
    selectDate,
    selectTime,
    setScreen,
    setError,
    editingAppointmentId
  } = useGoodLakStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>(
    booking.selectedDate ? parse(booking.selectedDate, 'yyyy-MM-dd', new Date()) : undefined
  );
  const [selectedTimeLocal, setSelectedTimeLocal] = useState<string | null>(
    booking.selectedTime
  );
  const [dateInput, setDateInput] = useState(
    booking.selectedDate ? format(parse(booking.selectedDate, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy') : ''
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workingDates, setWorkingDates] = useState<Set<string>>(new Set());
  const [timeLoading, setTimeLoading] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (selectedDateObj) {
      const dateStr = format(selectedDateObj, 'yyyy-MM-dd');
      fetchAvailableSlots(dateStr);
    }
  }, [selectedDateObj]);

  const fetchSchedule = async () => {
    setLocalLoading(true);
    try {
      const response = await fetch(
        `/api/good-lak?action=getMasterSchedule&masterId=${booking.selectedMaster?.id}`
      );
      const data = await response.json();
      if (data.success) {
        setSchedule(data.data);
        
        // Даты уже в yyyy-MM-dd после нормализации в route.ts
        const workingDays = new Set<string>();
        data.data.forEach((d: { date: string; status: string }) => {
          if (d.status === 'Рабочий') {
            // Конвертируем в yyyy-MM-dd если нужно
            const isoDate = convertToISODate(d.date);
            if (isoDate) {
              workingDays.add(isoDate);
            }
          }
        });
        
        setWorkingDates(workingDays);

        // Автовыбор первой рабочей даты
        if (!selectedDateObj) {
          const today = new Date();
          for (let i = 0; i < 60; i++) {
            const checkDate = addDays(today, i);
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            if (workingDays.has(dateStr)) {
              setSelectedDateObj(checkDate);
              setDateInput(format(checkDate, 'dd.MM.yyyy'));
              break;
            }
          }
        }
      }
    } catch (error) {
      setError('Ошибка загрузки графика');
    } finally {
      setLocalLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    setTimeLoading(true);
    setSelectedTimeLocal(null);
    setAvailableSlots([]);
    
    try {
      const response = await fetch(
        `/api/good-lak?action=getAvailableSlots&masterId=${booking.selectedMaster?.id}&date=${date}&serviceId=${booking.selectedService?.id}`
      );
      const data = await response.json();
      console.log('Available slots response:', data);
      
      if (data.success) {
        setAvailableSlots(data.data);
      } else {
        setAvailableSlots([]);
        console.log('No slots available:', data.message);
      }
    } catch (error) {
      setError('Ошибка загрузки времени');
      setAvailableSlots([]);
    } finally {
      setTimeLoading(false);
    }
  };

  const handleDateInputChange = (value: string) => {
    // Форматируем ввод (только цифры и точки)
    let formatted = value.replace(/[^\d.]/g, '');
    setDateInput(formatted);
    
    // Пробуем распарсить дату в формате DD.MM.YYYY
    if (formatted.length === 10) {
      const parsed = parse(formatted, 'dd.MM.yyyy', new Date());
      if (isValid(parsed) && isDateSelectable(parsed)) {
        setSelectedDateObj(parsed);
      }
    }
  };

  const handleCalendarClick = (day: number) => {
    const newDate = setDate(currentMonth, day);
    if (isDateSelectable(newDate)) {
      setSelectedDateObj(newDate);
      setDateInput(format(newDate, 'dd.MM.yyyy'));
    }
  };

  const handleContinue = () => {
    if (selectedDateObj && selectedTimeLocal) {
      const dateStr = format(selectedDateObj, 'yyyy-MM-dd');
      selectDate(dateStr);
      selectTime(selectedTimeLocal);
      setScreen('confirm-booking');
    }
  };

  const isDateWorking = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return workingDates.has(dateStr);
  };

  const isDateSelectable = (date: Date) => {
    const today = startOfDay(new Date());
    return !isBefore(date, today) && isDateWorking(date);
  };

  const formatDateRussian = (date: Date) => {
    return format(date, 'd MMMM yyyy (EEEE)', { locale: ru });
  };

  // Генерация календаря
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDay = getDay(monthStart);
    const daysInMonth = monthEnd.getDate();
    
    const days: { day: number; date: Date; isCurrentMonth: boolean }[] = [];
    
    // Пустые ячейки в начале (воскресенье = 0, понедельник = 1)
    const offset = startDay === 0 ? 6 : startDay - 1;
    for (let i = 0; i < offset; i++) {
      days.push({ day: 0, date: new Date(), isCurrentMonth: false });
    }
    
    // Дни месяца
    for (let i = 1; i <= daysInMonth; i++) {
      const date = setDate(currentMonth, i);
      days.push({ day: i, date, isCurrentMonth: true });
    }
    
    return days;
  };

  const goToPrevMonth = () => {
    setCurrentMonth(addDays(currentMonth, -30));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addDays(currentMonth, 30));
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setScreen('select-service')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Выберите дату и время</h1>
            <p className="text-white/80 text-sm">
              {booking.selectedMaster?.name} • {booking.selectedService?.name}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4 pb-32">
        
        {/* Date Input */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата записи
            </label>
            <Input
              type="text"
              placeholder="ДД.ММ.ГГГГ (напр. 23.02.2026)"
              value={dateInput}
              onChange={(e) => handleDateInputChange(e.target.value)}
              className="h-12 text-center text-lg"
            />
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPrevMonth}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </h3>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {localLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, index) => {
                  if (!item.isCurrentMonth || item.day === 0) {
                    return <div key={index} className="aspect-square" />;
                  }

                  const isSelected = selectedDateObj && isSameDay(item.date, selectedDateObj);
                  const isToday = isSameDay(item.date, new Date());
                  const selectable = isDateSelectable(item.date);

                  return (
                    <button
                      key={index}
                      onClick={() => handleCalendarClick(item.day)}
                      disabled={!selectable}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                        transition-all duration-150
                        ${isSelected 
                          ? 'bg-pink-500 text-white shadow-md scale-105' 
                          : isToday
                            ? 'bg-pink-100 text-pink-700'
                            : selectable
                              ? 'bg-white hover:bg-pink-50 hover:border-pink-300 border border-gray-200 text-gray-700'
                              : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                        }
                      `}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>
            )}

            {workingDates.size === 0 && !localLoading && (
              <div className="text-center py-4 text-amber-600 text-sm flex items-center justify-center gap-2 mt-4">
                <AlertCircle className="h-4 w-4" />
                Нет рабочих дней в ближайшее время
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Info */}
        {selectedDateObj && isDateSelectable(selectedDateObj) && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-pink-50 to-cyan-50">
            <CardContent className="p-4">
              <p className="text-center font-medium text-gray-700 capitalize">
                📅 {formatDateRussian(selectedDateObj)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Time Selection */}
        {selectedDateObj && isDateSelectable(selectedDateObj) && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-cyan-500" />
                <h3 className="font-semibold text-gray-800">Доступное время</h3>
              </div>

              {timeLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Нет свободного времени на эту дату</p>
                  <p className="text-sm mt-1">Попробуйте выбрать другой день</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTimeLocal === slot.time;

                    return (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTimeLocal(slot.time)}
                        className={`p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-md scale-105'
                            : 'border-gray-200 bg-white hover:border-cyan-300 text-gray-700 hover:bg-cyan-50'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invalid date warning */}
        {selectedDateObj && !isDateSelectable(selectedDateObj) && (
          <Card className="border-0 shadow-lg bg-red-50">
            <CardContent className="p-4">
              <p className="text-center text-red-600 text-sm flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Выберите рабочий день
              </p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Fixed Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleContinue}
            disabled={!selectedDateObj || !selectedTimeLocal || !isDateSelectable(selectedDateObj)}
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingAppointmentId ? 'Подтвердить перенос' : 'Продолжить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
