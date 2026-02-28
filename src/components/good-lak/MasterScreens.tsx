'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  User, 
  Loader2, 
  Calendar, 
  DollarSign, 
  Clock,
  Plus,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  Edit,
  Trash2,
  Check,
  Settings
} from 'lucide-react';
import { useGoodLakStore, Service, Appointment } from '@/store/good-lak-store';
import { PhotoEditor, MasterPhotoDisplay } from './PhotoEditor';

// Конвертация dd.MM.yyyy в yyyy-MM-dd
function convertToISODate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
  if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const parts = dateStr.split('.');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Конвертация yyyy-MM-dd в dd.MM.yyyy
function convertToDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) return dateStr;
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

// Форматирование даты в русском формате: "27 февраля 2026 г. (пятница)"
function formatDateRussian(dateStr: string): string {
  if (!dateStr) return '';
  
  let d;
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split('-');
    d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const parts = dateStr.split('.');
    d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
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

// Форматирование даты для ключа (yyyy-MM-dd) с локальным временем
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Извлечение ID файла из Google Drive URL
function extractGoogleDriveFileId(url: string | undefined): string | null {
  if (!url) return null;

  // Формат /d/{id}/
  const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];

  // Формат ?id={id}
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];

  return null;
}

// Получение проксированной ссылки на изображение (обходит CORS)
function getDirectImageUrl(url: string | undefined, addCacheBuster: boolean = false): string {
  if (!url) return '';

  // Проверяем, это Google Drive URL
  if (url.includes('drive.google.com')) {
    const fileId = extractGoogleDriveFileId(url);
    if (fileId) {
      // Используем наш прокси для обхода CORS
      let proxyUrl = `/api/image-proxy?id=${fileId}`;
      if (addCacheBuster) {
        proxyUrl += `&t=${Date.now()}`;
      }
      return proxyUrl;
    }
  }

  // Если это не Google Drive URL, возвращаем как есть
  if (addCacheBuster && url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  return url;
}

// ==================== MASTER APPOINTMENTS SCREEN ====================

export function MasterAppointmentsScreen() {
  const { masterAppointments, setMasterAppointments, master, setMasterScreen, isLoading, setLoading, services, setServices } = useGoodLakStore();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, [master]);

  const fetchAppointments = async () => {
    if (!master?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getMasterAppointments&masterId=${master.id}`);
      const data = await response.json();
      if (data.success) {
        setMasterAppointments(data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/good-lak?action=getServices');
      const data = await response.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Подтверждено': return 'bg-green-100 text-green-700';
      case 'Ожидает подтверждения': return 'bg-yellow-100 text-yellow-700';
      case 'Отменено': return 'bg-red-100 text-red-700';
      case 'Завершено': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Сегодняшняя дата в формате yyyy-MM-dd
  const today = formatDateKey(new Date());

  // Получаем только предстоящие записи
  const upcomingAppointments = masterAppointments.filter(apt => 
    apt.date >= today && apt.status !== 'Отменено' && apt.status !== 'Завершено'
  );

  // Подсчет записей по датам для календаря
  const appointmentsByDate: Record<string, number> = {};
  upcomingAppointments.forEach(apt => {
    const dateKey = convertToISODate(apt.date);
    appointmentsByDate[dateKey] = (appointmentsByDate[dateKey] || 0) + 1;
  });

  // Записи на выбранную дату
  const appointmentsForSelectedDate = selectedDate 
    ? upcomingAppointments.filter(apt => convertToISODate(apt.date) === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time))
    : [];

  // Генерация дней месяца для календаря
  const generateMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6;
    
    for (let i = startPadding; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    const endPadding = 7 - (days.length % 7);
    if (endPadding < 7) {
      for (let i = 1; i <= endPadding; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }
    
    return days;
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Обновление статуса записи
  const handleUpdateStatus = async (appointmentId: string | number, newStatus: string) => {
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAppointment',
          appointmentId: appointmentId,
          data: { status: newStatus }
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  // Обновление записи
  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAppointment',
          appointmentId: editingAppointment.id,
          data: {
            date: editingAppointment.date,
            time: editingAppointment.time,
            serviceId: editingAppointment.serviceId
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setEditingAppointment(null);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  // Создание новой записи мастером
  const handleCreateAppointment = async () => {
    if (!master?.id || !newAppointment.clientName || !newAppointment.serviceId || !newAppointment.date || !newAppointment.time) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createAppointment',
          appointment: {
            masterId: master.id,
            serviceId: newAppointment.serviceId,
            date: newAppointment.date,
            time: newAppointment.time,
            phone: newAppointment.clientPhone,
            userId: null
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowAddForm(false);
        setNewAppointment({ clientName: '', clientPhone: '', serviceId: '', date: '', time: '' });
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setMasterScreen('home')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Записи</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="ml-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="flex gap-2 p-4 max-w-md mx-auto w-full">
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('calendar')}
          className={viewMode === 'calendar' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          Календарь
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
          className={viewMode === 'list' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          Список
        </Button>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : viewMode === 'calendar' ? (
          <>
            {/* Календарь */}
            <Card className="border-0 shadow-lg mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateMonthDays().map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const count = appointmentsByDate[dateKey] || 0;
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const isToday = dateKey === today;
                    const isSelected = dateKey === selectedDate;
                    const hasAppointments = count > 0;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(dateKey)}
                        className={`
                          aspect-square rounded-lg text-sm font-medium
                          flex flex-col items-center justify-center
                          transition-all duration-200 relative
                          ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                          ${isToday ? 'ring-2 ring-pink-500' : ''}
                          ${isSelected ? 'bg-pink-500 text-white' : ''}
                          ${hasAppointments && !isSelected ? 'bg-pink-100' : ''}
                          hover:opacity-80
                        `}
                      >
                        <span>{date.getDate()}</span>
                        {hasAppointments && (
                          <span className={`absolute bottom-1 text-xs font-bold ${isSelected ? 'text-white' : 'text-pink-600'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Записи на выбранную дату */}
            {selectedDate && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  {formatDateRussian(selectedDate)} ({appointmentsForSelectedDate.length} записей)
                </h3>
                {appointmentsForSelectedDate.length === 0 ? (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 text-center text-gray-500">
                      Нет записей на эту дату
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {appointmentsForSelectedDate.map((apt) => (
                      <Card key={apt.id} className="border-0 shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800">{apt.clientName || 'Клиент'}</h3>
                              <p className="text-gray-500 text-sm">{apt.clientPhone || 'Не указан'}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {apt.time}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-gray-600">{apt.serviceName}</span>
                            <span className="font-semibold text-pink-600">{apt.price} ₽</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingAppointment(apt)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Изменить
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(apt.id, 'Завершено')}
                              className="text-xs text-green-600"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Завершить
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(apt.id, 'Отменено')}
                              className="text-xs text-red-600"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Отменить
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Список записей */
          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Нет предстоящих записей</p>
                </CardContent>
              </Card>
            ) : (
              upcomingAppointments
                .sort((a, b) => {
                  const dateCompare = a.date.localeCompare(b.date);
                  if (dateCompare !== 0) return dateCompare;
                  return a.time.localeCompare(b.time);
                })
                .map((apt) => (
                  <Card key={apt.id} className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{apt.clientName || 'Клиент'}</h3>
                          <p className="text-gray-500 text-sm">{apt.clientPhone || 'Не указан'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateRussian(apt.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {apt.time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">{apt.serviceName}</span>
                        <span className="font-semibold text-pink-600">{apt.price} ₽</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAppointment(apt)}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Изменить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(apt.id, 'Завершено')}
                          className="text-xs text-green-600"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Завершить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(apt.id, 'Отменено')}
                          className="text-xs text-red-600"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Отменить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        )}
      </div>

      {/* Форма редактирования записи - без прозрачности */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm bg-white shadow-2xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Редактировать запись</h3>
                <button onClick={() => setEditingAppointment(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Дата</label>
                <Input
                  type="date"
                  value={editingAppointment.date}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, date: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Время</label>
                <Input
                  type="time"
                  value={editingAppointment.time}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, time: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Услуга</label>
                <select
                  className="w-full h-10 border rounded px-2 bg-white"
                  value={editingAppointment.serviceId || ''}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, serviceId: e.target.value })}
                >
                  {services.map((s: Service) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.price}₽</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingAppointment(null)} className="flex-1">
                  Отмена
                </Button>
                <Button onClick={handleUpdateAppointment} className="flex-1 bg-pink-500 hover:bg-pink-600">
                  Сохранить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Форма добавления новой записи - без прозрачности */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm bg-white shadow-2xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Новая запись</h3>
                <button onClick={() => setShowAddForm(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Имя клиента</label>
                <Input
                  value={newAppointment.clientName}
                  onChange={(e) => setNewAppointment({ ...newAppointment, clientName: e.target.value })}
                  placeholder="Имя"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Телефон</label>
                <Input
                  value={newAppointment.clientPhone}
                  onChange={(e) => setNewAppointment({ ...newAppointment, clientPhone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Услуга</label>
                <select
                  className="w-full h-10 border rounded px-2 bg-white"
                  value={newAppointment.serviceId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, serviceId: e.target.value })}
                >
                  <option value="">Выберите услугу</option>
                  {services.map((s: Service) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.price}₽</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">Дата</label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Время</label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Отмена
                </Button>
                <Button onClick={handleCreateAppointment} className="flex-1 bg-pink-500 hover:bg-pink-600">
                  Создать
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ==================== MASTER CLIENTS SCREEN ====================

export function MasterClientsScreen() {
  const { masterClients, setMasterClients, master, setMasterScreen, isLoading, setLoading } = useGoodLakStore();
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchClients();
  }, [master]);

  const fetchClients = async () => {
    if (!master?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getMasterClients&masterId=${master.id}`);
      const data = await response.json();
      if (data.success) {
        setMasterClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phone) return;

    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addClient',
          client: newClient
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowAddClient(false);
        setNewClient({ name: '', phone: '' });
        fetchClients();
      }
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setMasterScreen('home')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Клиенты</h1>
          <button
            onClick={() => setShowAddClient(true)}
            className="ml-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {showAddClient ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Добавить клиента</h3>
              <Input
                placeholder="Имя"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
              <Input
                placeholder="Телефон"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddClient(false)} className="flex-1">
                  Отмена
                </Button>
                <Button onClick={handleAddClient} className="flex-1 bg-pink-500 hover:bg-pink-600">
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : masterClients.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Нет клиентов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {masterClients.map((client) => (
              <Card key={client.id} className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{client.name}</h3>
                      <p className="text-gray-500 text-sm">{client.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Посещений</p>
                      <p className="font-semibold text-pink-600">{client.totalVisits}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MASTER FINANCES SCREEN ====================

export function MasterFinancesScreen() {
  const { master, setMasterScreen, isLoading, setLoading } = useGoodLakStore();
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [financeData, setFinanceData] = useState<{
    completedRecords: Array<{ id: string | number; type: string; amount: number; category: string; date: string; description: string }>;
    expenses: Array<{ id: string | number; type: string; amount: number; category: string; date: string; description: string }>;
    plannedRecords: Array<{ id: string | number; type: string; amount: number; category: string; date: string; description: string }>;
    completedIncome: number;
    totalExpenses: number;
    plannedIncome: number;
    balance: number;
    monthExpenses: number;
    plannedNet: number;
  }>({
    completedRecords: [],
    expenses: [],
    plannedRecords: [],
    completedIncome: 0,
    totalExpenses: 0,
    plannedIncome: 0,
    balance: 0,
    monthExpenses: 0,
    plannedNet: 0
  });
  const [newRecord, setNewRecord] = useState({
    type: 'Расход' as 'Доход' | 'Расход',
    amount: '',
    category: '',
    description: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchFinances();
  }, [master, selectedMonth, selectedYear]);

  const fetchFinances = async () => {
    if (!master?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/good-lak?action=getMasterFinancesCompleted&masterId=${master.id}&month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await response.json();
      if (data.success) {
        setFinanceData(data.data);
      }
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.amount || !newRecord.category) {
      alert('Заполните сумму и категорию');
      return;
    }

    if (!master?.id) {
      alert('Ошибка: мастер не определен');
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addFinanceRecord',
          record: {
            masterId: master.id,
            type: newRecord.type,
            amount: parseFloat(newRecord.amount),
            category: newRecord.category,
            description: newRecord.description,
            date: formatDateKey(new Date())
          }
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setShowAddRecord(false);
        setNewRecord({ type: 'Расход', amount: '', category: '', description: '' });
        fetchFinances();
      } else {
        alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error adding finance record:', error);
      alert('Ошибка соединения');
    } finally {
      setIsAdding(false);
    }
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Фильтруем записи по выбранному месяцу и сортируем
  const allRecords = [
    ...financeData.completedRecords.map(r => ({ ...r, recordType: 'completed' as const })),
    ...financeData.expenses.map(r => ({ ...r, recordType: 'expense' as const })),
    ...financeData.plannedRecords.map(r => ({ ...r, recordType: 'planned' as const }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Планируется с учетом расходов
  const plannedNet = financeData.plannedIncome - financeData.monthExpenses;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setMasterScreen('home')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Финансы</h1>
          <button
            onClick={() => setShowAddRecord(true)}
            className="ml-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Выбор месяца */}
      <div className="p-4 max-w-md mx-auto w-full">
        <div className="flex gap-2 items-center justify-center mb-4">
          <select
            className="h-10 border rounded px-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            className="h-10 border rounded px-2"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-0 shadow-lg bg-green-50">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Завершено</p>
              <p className="font-semibold text-green-600">{financeData.completedIncome.toLocaleString()} ₽</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-red-50">
            <CardContent className="p-3 text-center">
              <TrendingDown className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Расходы за месяц</p>
              <p className="font-semibold text-red-600">{(financeData.monthExpenses || 0).toLocaleString()} ₽</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardContent className="p-3 text-center">
              <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Планируется</p>
              <p className="font-semibold text-blue-600">{plannedNet.toLocaleString()} ₽</p>
              <p className="text-xs text-gray-400">доходы - расходы</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-pink-50">
            <CardContent className="p-3 text-center">
              <Wallet className="h-5 w-5 text-pink-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Баланс текущий</p>
              <p className="font-semibold text-pink-600">{financeData.balance.toLocaleString()} ₽</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {showAddRecord ? (
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Добавить расход</h3>
              <div className="flex gap-2">
                <Button
                  variant={newRecord.type === 'Доход' ? 'default' : 'outline'}
                  onClick={() => setNewRecord({ ...newRecord, type: 'Доход' })}
                  className={newRecord.type === 'Доход' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  Доход
                </Button>
                <Button
                  variant={newRecord.type === 'Расход' ? 'default' : 'outline'}
                  onClick={() => setNewRecord({ ...newRecord, type: 'Расход' })}
                  className={newRecord.type === 'Расход' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  Расход
                </Button>
              </div>
              <Input
                type="number"
                placeholder="Сумма"
                value={newRecord.amount}
                onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
              />
              <Input
                placeholder="Категория"
                value={newRecord.category}
                onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
              />
              <Input
                placeholder="Описание (необязательно)"
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddRecord(false)} 
                  className="flex-1"
                  disabled={isAdding}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleAddRecord} 
                  className="flex-1 bg-pink-500 hover:bg-pink-600"
                  disabled={isAdding}
                >
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Добавить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : allRecords.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Нет записей за выбранный период</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {allRecords.map((record) => (
              <Card key={`${record.id}-${record.recordType}`} className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {record.recordType === 'completed' && (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                      )}
                      {record.recordType === 'expense' && (
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                      {record.recordType === 'planned' && (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{record.category}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateRussian(record.date)} {record.recordType === 'planned' && '(план)'}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${
                      record.recordType === 'expense' ? 'text-red-600' : 
                      record.recordType === 'planned' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {record.recordType === 'expense' ? '-' : '+'}{record.amount} ₽
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MASTER SCHEDULE SCREEN ====================

export function MasterScheduleScreen() {
  const { schedule, setSchedule, master, setMasterScreen, isLoading, setLoading } = useGoodLakStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    status: 'Рабочий',
    start: '09:00',
    end: '18:00',
    breakStart: '',
    breakEnd: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Настройки по умолчанию
  const [defaultSettings, setDefaultSettings] = useState({
    start: '09:00',
    end: '18:00',
    breakStart: '',
    breakEnd: ''
  });
  const [showDefaultSettings, setShowDefaultSettings] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, [master]);

  const fetchSchedule = async () => {
    if (!master?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getMasterSchedule&masterId=${master.id}`);
      const data = await response.json();
      if (data.success) {
        setSchedule(data.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Генерация дней месяца для календаря
  const generateMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6;
    
    for (let i = startPadding; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    const endPadding = 7 - (days.length % 7);
    if (endPadding < 7) {
      for (let i = 1; i <= endPadding; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }
    
    return days;
  };

  // Получить статус дня по дате
  const getDayStatus = (dateKey: string) => {
    const daySchedule = schedule.find(s => {
      const scheduleDate = s.date;
      if (scheduleDate === dateKey) return true;
      const convertedDate = convertToISODate(scheduleDate);
      return convertedDate === dateKey;
    });
    return daySchedule?.status || 'Не задан';
  };

  // Получить расписание дня
  const getDayScheduleData = (dateKey: string) => {
    return schedule.find(s => {
      const scheduleDate = s.date;
      if (scheduleDate === dateKey) return true;
      const convertedDate = convertToISODate(scheduleDate);
      return convertedDate === dateKey;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Рабочий': return 'bg-green-500 text-white';
      case 'Выходной': return 'bg-gray-300 text-gray-700';
      case 'Отпуск': return 'bg-blue-400 text-white';
      case 'Больничный': return 'bg-red-400 text-white';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const handleDateClick = (date: Date) => {
    const dateKey = formatDateKey(date);
    setSelectedDate(dateKey);
    
    const daySchedule = getDayScheduleData(dateKey);
    if (daySchedule) {
      setEditData({
        status: daySchedule.status || 'Рабочий',
        start: daySchedule.start || defaultSettings.start,
        end: daySchedule.end || defaultSettings.end,
        breakStart: daySchedule.breakStart || defaultSettings.breakStart,
        breakEnd: daySchedule.breakEnd || defaultSettings.breakEnd
      });
    } else {
      // Используем настройки по умолчанию
      setEditData({
        status: 'Рабочий',
        start: defaultSettings.start,
        end: defaultSettings.end,
        breakStart: defaultSettings.breakStart,
        breakEnd: defaultSettings.breakEnd
      });
    }
  };

  const handleSaveSchedule = async () => {
    if (!master?.id || !selectedDate) return;

    setIsSaving(true);
    try {
      // Если статус "Выходной", очищаем время работы
      const dataToSave = {
        ...editData,
        start: editData.status === 'Выходной' ? '' : editData.start,
        end: editData.status === 'Выходной' ? '' : editData.end,
        breakStart: editData.status === 'Выходной' ? '' : editData.breakStart,
        breakEnd: editData.status === 'Выходной' ? '' : editData.breakEnd,
      };

      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSchedule',
          masterId: master.id,
          schedule: {
            date: selectedDate,
            ...dataToSave
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedule();
        setSelectedDate(null);
      } else {
        alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  // Применить настройки по умолчанию ко всем рабочим дням месяца
  const handleApplyDefaultsToMonth = async () => {
    if (!master?.id) return;
    
    setIsSaving(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Создаём записи для всех дней месяца
      const updates = [];
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dateKey = formatDateKey(date);
        
        // Пропускаем выходные (суббота = 6, воскресенье = 0)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        updates.push({
          date: dateKey,
          status: isWeekend ? 'Выходной' : 'Рабочий',
          start: isWeekend ? '' : defaultSettings.start,
          end: isWeekend ? '' : defaultSettings.end,
          breakStart: isWeekend ? '' : defaultSettings.breakStart,
          breakEnd: isWeekend ? '' : defaultSettings.breakEnd
        });
      }
      
      // Отправляем批量 обновление
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateScheduleBatch',
          masterId: master.id,
          schedules: updates
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchSchedule();
        setShowDefaultSettings(false);
      } else {
        alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error applying defaults:', error);
      alert('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const today = formatDateKey(new Date());

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setMasterScreen('home')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">График работы</h1>
          <button
            onClick={() => setShowDefaultSettings(!showDefaultSettings)}
            className="ml-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Настройки по умолчанию"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <>
            {/* Настройки по умолчанию */}
            {showDefaultSettings && (
              <Card className="border-0 shadow-lg mb-4 bg-cyan-50">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-cyan-600" />
                    Настройки по умолчанию
                  </h3>
                  <p className="text-xs text-gray-600">
                    Применяются ко всем рабочим дням месяца (пн-пт)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Начало работы</label>
                      <Input
                        type="time"
                        value={defaultSettings.start}
                        onChange={(e) => setDefaultSettings({ ...defaultSettings, start: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Конец работы</label>
                      <Input
                        type="time"
                        value={defaultSettings.end}
                        onChange={(e) => setDefaultSettings({ ...defaultSettings, end: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Перерыв с</label>
                      <Input
                        type="time"
                        value={defaultSettings.breakStart}
                        onChange={(e) => setDefaultSettings({ ...defaultSettings, breakStart: e.target.value })}
                        className="h-10"
                        placeholder="13:00"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Перерыв до</label>
                      <Input
                        type="time"
                        value={defaultSettings.breakEnd}
                        onChange={(e) => setDefaultSettings({ ...defaultSettings, breakEnd: e.target.value })}
                        className="h-10"
                        placeholder="14:00"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleApplyDefaultsToMonth}
                    disabled={isSaving}
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Применить к текущему месяцу
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-0 shadow-lg mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateMonthDays().map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const status = getDayStatus(dateKey);
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const isToday = dateKey === today;
                    const isSelected = dateKey === selectedDate;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        className={`
                          aspect-square rounded-lg text-sm font-medium
                          flex items-center justify-center
                          transition-all duration-200
                          ${!isCurrentMonth ? 'text-gray-300' : ''}
                          ${isToday ? 'ring-2 ring-pink-500' : ''}
                          ${isSelected ? 'ring-2 ring-cyan-500' : ''}
                          ${getStatusColor(status)}
                          hover:opacity-80
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500"></span> Рабочий
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-300"></span> Выходной
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-400"></span> Отпуск
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-400"></span> Больничный
                  </span>
                </div>
              </CardContent>
            </Card>

            {selectedDate && (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold">
                    {formatDateRussian(selectedDate)}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={editData.status === 'Рабочий' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditData({ ...editData, status: 'Рабочий' })}
                      className={editData.status === 'Рабочий' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      Рабочий
                    </Button>
                    <Button
                      variant={editData.status === 'Выходной' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditData({ ...editData, status: 'Выходной' })}
                      className={editData.status === 'Выходной' ? 'bg-gray-500 hover:bg-gray-600' : ''}
                    >
                      Выходной
                    </Button>
                    <Button
                      variant={editData.status === 'Отпуск' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditData({ ...editData, status: 'Отпуск' })}
                      className={editData.status === 'Отпуск' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    >
                      Отпуск
                    </Button>
                    <Button
                      variant={editData.status === 'Больничный' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditData({ ...editData, status: 'Больничный' })}
                      className={editData.status === 'Больничный' ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      Больничный
                    </Button>
                  </div>

                  {editData.status === 'Рабочий' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Начало</label>
                          <Input
                            type="time"
                            value={editData.start}
                            onChange={(e) => setEditData({ ...editData, start: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Конец</label>
                          <Input
                            type="time"
                            value={editData.end}
                            onChange={(e) => setEditData({ ...editData, end: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Перерыв с</label>
                          <Input
                            type="time"
                            value={editData.breakStart}
                            onChange={(e) => setEditData({ ...editData, breakStart: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Перерыв до</label>
                          <Input
                            type="time"
                            value={editData.breakEnd}
                            onChange={(e) => setEditData({ ...editData, breakEnd: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDate(null)}
                      className="flex-1"
                      disabled={isSaving}
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleSaveSchedule}
                      className="flex-1 bg-pink-500 hover:bg-pink-600"
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==================== MASTER PROFILE SCREEN ====================

export function MasterProfileScreen() {
  const { master, setMaster, setMasterScreen } = useGoodLakStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    login: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  // Состояния для редактора фото
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedPhotoBase64, setSelectedPhotoBase64] = useState<string>('');
  const [editingExistingPhoto, setEditingExistingPhoto] = useState(false);
  // Текущие параметры редактирования для повторного редактирования
  const [currentPhotoScale, setCurrentPhotoScale] = useState(1);
  const [currentPhotoTranslateX, setCurrentPhotoTranslateX] = useState(0);
  const [currentPhotoTranslateY, setCurrentPhotoTranslateY] = useState(0);

  // Обновляем photoUrl при изменении master.photo
  useEffect(() => {
    if (master?.photo) {
      // Добавляем cache-buster для обхода кэша Google Drive
      setPhotoUrl(getDirectImageUrl(master.photo, true));
      console.log('Master photo URL:', master.photo);
      console.log('Converted photo URL:', getDirectImageUrl(master.photo, true));
    }
  }, [master?.photo]);

  // Инициализируем editData при входе в режим редактирования
  useEffect(() => {
    if (master) {
      setEditData({
        name: master.name || '',
        login: master.login || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [master]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !master?.id) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Сбрасываем input, чтобы можно было выбрать тот же файл снова
    e.target.value = '';

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedPhotoBase64(base64);
        setEditingExistingPhoto(false);
        setShowPhotoEditor(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setMessage('Ошибка чтения файла');
    }
  };

  // Открыть редактор для существующего фото
  const handleEditExistingPhoto = async () => {
    if (!photoUrl) return;
    
    setIsSaving(true);
    try {
      // Загружаем текущее фото для редактирования
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedPhotoBase64(base64);
        setEditingExistingPhoto(true);
        // Устанавливаем текущие параметры редактирования
        setCurrentPhotoScale(master?.photoScale || 1);
        setCurrentPhotoTranslateX(master?.photoTranslateX || 0);
        setCurrentPhotoTranslateY(master?.photoTranslateY || 0);
        setShowPhotoEditor(true);
        setIsSaving(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading photo for editing:', error);
      setMessage('Ошибка загрузки фото');
      setIsSaving(false);
    }
  };

  // Сохранение фото с параметрами редактирования (без обрезки)
  const handleSavePhotoSettings = async (data: {
    originalImageSrc: string;
    scale: number;
    translateX: number;
    translateY: number;
  }) => {
    if (!master?.id) return;

    setShowPhotoEditor(false);
    setIsSaving(true);
    setMessage('');

    try {
      // Если это новое фото (base64), загружаем его на сервер
      let photoUrl = master.photo;
      
      if (data.originalImageSrc.startsWith('data:')) {
        // Это новое фото - загружаем
        const response = await fetch('/api/good-lak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'uploadMasterPhoto',
            masterId: master.id,
            photoBase64: data.originalImageSrc
          })
        });

        const result = await response.json();

        if (result.success && result.photoUrl) {
          console.log('Photo uploaded successfully, URL:', result.photoUrl);
          photoUrl = result.photoUrl;
        } else {
          console.error('Photo upload failed:', result);
          setMessage('Ошибка загрузки фото: ' + (result.error || 'Неизвестная ошибка'));
          return;
        }
      }

      // Сохраняем параметры редактирования
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMasterPhotoSettings',
          masterId: master.id,
          photoScale: data.scale,
          photoTranslateX: data.translateX,
          photoTranslateY: data.translateY
        })
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем master с новыми параметрами
        setMaster({
          ...master,
          photo: photoUrl,
          photoScale: data.scale,
          photoTranslateX: data.translateX,
          photoTranslateY: data.translateY
        });
        
        // Обновляем photoUrl
        if (photoUrl) {
          setPhotoUrl(getDirectImageUrl(photoUrl, true));
        }
        
        setMessage('Фото успешно сохранено');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Ошибка сохранения параметров фото');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      setMessage('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!master?.id) return;
    
    // Валидация
    if (!editData.name.trim()) {
      setMessage('Имя не может быть пустым');
      return;
    }

    // Если меняем пароль - проверяем
    if (editData.newPassword || editData.confirmPassword) {
      if (!editData.currentPassword) {
        setMessage('Введите текущий пароль');
        return;
      }
      if (editData.newPassword !== editData.confirmPassword) {
        setMessage('Новые пароли не совпадают');
        return;
      }
      if (editData.newPassword.length < 4) {
        setMessage('Пароль должен быть не менее 4 символов');
        return;
      }
    }

    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMasterFullProfile',
          masterId: master.id,
          profile: {
            name: editData.name,
            login: editData.login,
            currentPassword: editData.currentPassword || undefined,
            newPassword: editData.newPassword || undefined
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setMaster({
          ...master,
          name: editData.name,
          login: editData.login
        });
        setIsEditing(false);
        setMessage('Профиль успешно обновлен');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  if (!master) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setMasterScreen('home')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Мой профиль</h1>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6 space-y-6">
            {/* Photo */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                {/* Основное фото - кликабельное */}
                <button
                  type="button"
                  onClick={() => {
                    if (photoUrl) {
                      handleEditExistingPhoto();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={isSaving}
                  className="h-28 w-28 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center shadow-lg overflow-hidden cursor-pointer hover:ring-4 hover:ring-pink-300 transition-all"
                  title={photoUrl ? "Нажмите для редактирования фото" : "Нажмите для добавления фото"}
                >
                  {photoUrl ? (
                    <MasterPhotoDisplay
                      imageSrc={photoUrl}
                      scale={master?.photoScale || 1}
                      translateX={master?.photoTranslateX || 0}
                      translateY={master?.photoTranslateY || 0}
                      size={112}
                      className="h-full w-full"
                    />
                  ) : (
                    <User className="h-14 w-14 text-white" />
                  )}
                  {/* Оверлей при наведении */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Edit className="h-8 w-8 text-white" />
                  </div>
                </button>
                
                {/* Кнопка камеры для добавления нового фото */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-lg transition-colors"
                  title="Загрузить новое фото"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                {photoUrl 
                  ? 'Нажмите на фото для редактирования' 
                  : 'Нажмите на иконку камеры, чтобы добавить фото'}
              </p>
            </div>

            {/* Info / Edit Form */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя *
                  </label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="Ваше имя"
                    className="h-12"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Логин
                  </label>
                  <Input
                    value={editData.login}
                    onChange={(e) => setEditData({ ...editData, login: e.target.value })}
                    placeholder="Логин для входа"
                    className="h-12"
                    disabled={isSaving}
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">Изменить пароль (оставьте пустым, если не хотите менять)</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Текущий пароль
                      </label>
                      <Input
                        type="password"
                        value={editData.currentPassword}
                        onChange={(e) => setEditData({ ...editData, currentPassword: e.target.value })}
                        placeholder="Введите текущий пароль"
                        className="h-12"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Новый пароль
                      </label>
                      <Input
                        type="password"
                        value={editData.newPassword}
                        onChange={(e) => setEditData({ ...editData, newPassword: e.target.value })}
                        placeholder="Введите новый пароль"
                        className="h-12"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Подтвердите новый пароль
                      </label>
                      <Input
                        type="password"
                        value={editData.confirmPassword}
                        onChange={(e) => setEditData({ ...editData, confirmPassword: e.target.value })}
                        placeholder="Повторите новый пароль"
                        className="h-12"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <p className={`text-center text-sm ${message.includes('успешно') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setMessage('');
                      setEditData({
                        name: master.name || '',
                        login: master.login || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="flex-1"
                    disabled={isSaving}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Сохранить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  <Input
                    value={master.name}
                    disabled
                    className="h-12 bg-gray-50 text-gray-700"
                  />
                </div>

                {master.login && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Логин
                    </label>
                    <Input
                      value={master.login}
                      disabled
                      className="h-12 bg-gray-50 text-gray-700"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль
                  </label>
                  <Input
                    value="••••••••"
                    disabled
                    className="h-12 bg-gray-50 text-gray-700"
                  />
                </div>

                {/* Message */}
                {message && (
                  <p className={`text-center text-sm ${message.includes('успешно') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}

                {/* Edit Button */}
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать профиль
                </Button>

                {/* Back button */}
                <Button
                  onClick={() => setMasterScreen('home')}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Редактор фото */}
      {showPhotoEditor && selectedPhotoBase64 && (
        <PhotoEditor
          imageSrc={selectedPhotoBase64}
          initialScale={currentPhotoScale}
          initialTranslateX={currentPhotoTranslateX}
          initialTranslateY={currentPhotoTranslateY}
          onSave={handleSavePhotoSettings}
          onCancel={() => {
            setShowPhotoEditor(false);
            setSelectedPhotoBase64('');
          }}
        />
      )}
    </div>
  );
}
