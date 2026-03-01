'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, MessageSquare, RefreshCw, X, Loader2 } from 'lucide-react';
import { useGoodLakStore, Appointment } from '@/store/good-lak-store';

export function MyAppointmentsScreen() {
  const {
    user,
    appointments,
    masters,
    services,
    setAppointments,
    setMasters,
    setServices,
    setSelectedAppointment,
    setEditingAppointment,
    setBooking,
    setScreen,
    setError
  } = useGoodLakStore();

  const [isLoading, setIsLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | number | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchMastersAndServices();
  }, []);

  const fetchMastersAndServices = async () => {
    try {
      const [mastersRes, servicesRes] = await Promise.all([
        fetch('/api/good-lak?action=getMasters'),
        fetch('/api/good-lak?action=getServices')
      ]);
      const mastersData = await mastersRes.json();
      const servicesData = await servicesRes.json();
      if (mastersData.success) setMasters(mastersData.data);
      if (servicesData.success) setServices(servicesData.data);
    } catch (error) {
      console.error('Error fetching masters/services:', error);
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/good-lak?action=getUserAppointments&userId=${user?.id}`
      );
      const data = await response.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      setError('Ошибка загрузки записей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setScreen('comment');
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditingAppointment(appointment.id);

    // Находим мастера и услугу по ID или имени
    const master = masters.find(m =>
      m.id === appointment.masterId || m.name === appointment.masterName
    );
    const service = services.find(s =>
      s.id === appointment.serviceId || s.name === appointment.serviceName
    );

    // Устанавливаем booking с данными из записи
    setBooking({
      selectedMaster: master || { id: appointment.masterId || '', name: appointment.masterName },
      selectedService: service || { id: appointment.serviceId || '', name: appointment.serviceName, price: appointment.price, duration: 60 },
      selectedDate: null,
      selectedTime: null,
    });

    setScreen('select-datetime');
  };

  const handleCancel = async (appointmentId: string | number) => {
    setCancelingId(appointmentId);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancelAppointment',
          appointmentId: appointmentId
        })
      });
      const data = await response.json();
      if (data.success) {
        setAppointments(appointments.filter(a => a.id !== appointmentId));
        setConfirmCancel(null);
      } else {
        setError(data.error || 'Ошибка отмены записи');
      }
    } catch (error) {
      setError('Ошибка соединения');
    } finally {
      setCancelingId(null);
    }
  };

  // Форматирование даты в русском формате: "27 февраля 2026 г. (пятница)"
  const formatDateRussian = (dateStr: string) => {
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
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Подтверждено':
        return 'bg-green-100 text-green-700';
      case 'Ожидает подтверждения':
        return 'bg-yellow-100 text-yellow-700';
      case 'Отменено':
        return 'bg-red-100 text-red-700';
      case 'Завершено':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const today = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
  
  // Сортировка записей по дате и времени
  const sortAppointments = (a: Appointment, b: Appointment) => {
    // Сначала по дате
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    // Если даты одинаковые - по времени
    return a.time.localeCompare(b.time);
  };
  
  const upcomingAppointments = appointments
    .filter(a => a.date >= today && a.status !== 'Отменено')
    .sort(sortAppointments); // По возрастанию - ближайшие сначала
  
  const pastAppointments = appointments
    .filter(a => a.date < today || a.status === 'Отменено')
    .sort((a, b) => sortAppointments(b, a)); // По убыванию - недавние сначала

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
          <h1 className="text-xl font-semibold text-white">Мои записи</h1>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">У вас пока нет записей</p>
              <Button
                onClick={() => setScreen('select-master')}
                className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white"
              >
                Записаться на прием
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Upcoming appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Предстоящие записи
                </h2>
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-0 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-pink-100 to-cyan-100 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">
                            {appointment.masterName}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Sparkles className="h-4 w-4 text-pink-500" />
                            <span>{appointment.serviceName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-cyan-500" />
                            <span className="capitalize">{formatDateRussian(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 text-teal-500" />
                            <span>{appointment.time}</span>
                          </div>
                          {appointment.comment && (
                            <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg mt-2">
                              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm italic">{appointment.comment}</span>
                            </div>
                          )}
                        </div>
                        
                        {confirmCancel === appointment.id ? (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-red-700 text-sm mb-3">
                              Вы уверены, что хотите отменить запись?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleCancel(appointment.id)}
                                disabled={cancelingId === appointment.id}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                              >
                                {cancelingId === appointment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Да, отменить'
                                )}
                              </Button>
                              <Button
                                onClick={() => setConfirmCancel(null)}
                                variant="outline"
                                className="flex-1"
                              >
                                Нет
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleComment(appointment)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Комментарий
                            </Button>
                            <Button
                              onClick={() => handleReschedule(appointment)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Перенести
                            </Button>
                            <Button
                              onClick={() => setConfirmCancel(appointment.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Past appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Прошедшие записи
                </h2>
                <div className="space-y-3">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-0 shadow-md opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">
                              {appointment.masterName} • {appointment.serviceName}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {formatDateRussian(appointment.date)} в {appointment.time}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sparkles icon component
function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
