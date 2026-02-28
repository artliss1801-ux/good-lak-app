'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Check, X, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Master {
  id: string | number;
  name: string;
  telegramId?: string | number;
}

interface Appointment {
  id: string | number;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: string;
  comment?: string;
}

interface Client {
  id: string | number;
  name: string;
  phone: string;
  totalVisits: number;
  notes?: string;
}

interface FinanceRecord {
  id: string | number;
  type: 'Доход' | 'Расход';
  amount: number;
  category: string;
  date: string;
  description?: string;
}

interface MasterAppointmentsScreenProps {
  master: Master;
  onBack: () => void;
}

export function MasterAppointmentsScreen({ master, onBack }: MasterAppointmentsScreenProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('today');

  useEffect(() => {
    fetchAppointments();
  }, [master.id]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getMasterAppointments&masterId=${master.id}`);
      const data = await response.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (appointmentId: string | number, status: string) => {
    try {
      await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAppointment',
          appointmentId,
          data: { status }
        })
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  const filteredAppointments = appointments.filter(a => {
    if (filter === 'today') return a.date === today && a.status !== 'Отменено';
    if (filter === 'upcoming') return a.date >= today && a.status !== 'Отменено';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Подтверждено': return 'bg-green-100 text-green-700';
      case 'Ожидает подтверждения': return 'bg-yellow-100 text-yellow-700';
      case 'Отменено': return 'bg-red-100 text-red-700';
      case 'Завершено': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      <header className="bg-gradient-to-r from-cyan-500 to-teal-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button onClick={onBack} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Мои записи</h1>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto w-full">
        <div className="flex gap-2 mb-4">
          {(['today', 'upcoming', 'all'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
            >
              {f === 'today' ? 'Сегодня' : f === 'upcoming' ? 'Предстоящие' : 'Все'}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center text-gray-600">
              Нет записей
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{appointment.clientName}</p>
                      <p className="text-sm text-gray-600">{appointment.serviceName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>📞 {appointment.clientPhone}</p>
                    <p>📅 {format(new Date(appointment.date), 'd MMMM', { locale: ru })} в {appointment.time}</p>
                    <p className="font-semibold text-cyan-600">{appointment.price} ₽</p>
                  </div>
                  {appointment.comment && (
                    <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded mb-3">
                      💬 {appointment.comment}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {appointment.status === 'Подтверждено' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(appointment.id, 'Завершено')}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <Check className="h-4 w-4 mr-1" /> Завершить
                      </Button>
                    )}
                    {appointment.status !== 'Отменено' && appointment.status !== 'Завершено' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'Отменено')}
                        className="text-red-600 border-red-200"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
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

// Master Clients Screen
interface MasterClientsScreenProps {
  master: Master;
  onBack: () => void;
}

export function MasterClientsScreen({ master, onBack }: MasterClientsScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchClients();
  }, [master.id]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getMasterClients&masterId=${master.id}`);
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addClient = async () => {
    if (!newClient.name || !newClient.phone) return;
    
    try {
      await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addClient',
          client: newClient
        })
      });
      setNewClient({ name: '', phone: '' });
      setShowAddForm(false);
      fetchClients();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      <header className="bg-gradient-to-r from-cyan-500 to-teal-500 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-xl font-semibold text-white">Мои клиенты</h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto w-full">
        {showAddForm && (
          <Card className="border-0 shadow-lg mb-4">
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder="Имя клиента"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
              <Input
                placeholder="Телефон"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={addClient} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  Добавить
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : clients.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center text-gray-600">
              Нет клиентов
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <Card key={client.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{client.name}</p>
                      <p className="text-sm text-gray-600">📞 {client.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Посещений</p>
                      <p className="font-semibold text-cyan-600">{client.totalVisits}</p>
                    </div>
                  </div>
                  {client.notes && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      📝 {client.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Master Finances Screen
interface MasterFinancesScreenProps {
  master: Master;
  onBack: () => void;
}

export function MasterFinancesScreen({ master, onBack }: MasterFinancesScreenProps) {
  const [finances, setFinances] = useState<{
    records: FinanceRecord[];
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'Доход' as 'Доход' | 'Расход',
    amount: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    fetchFinances();
  }, [master.id]);

  const fetchFinances = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getMasterFinances&masterId=${master.id}`);
      const data = await response.json();
      if (data.success) {
        setFinances(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addRecord = async () => {
    if (!newRecord.amount || !newRecord.category) return;
    
    try {
      await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addFinanceRecord',
          record: {
            masterId: master.id,
            type: newRecord.type,
            amount: parseInt(newRecord.amount),
            category: newRecord.category,
            description: newRecord.description,
            date: new Date().toISOString()
          }
        })
      });
      setNewRecord({ type: 'Доход', amount: '', category: '', description: '' });
      setShowAddForm(false);
      fetchFinances();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const categories = {
    'Доход': ['Услуги маникюра', 'Продажа материалов', 'Другое'],
    'Расход': ['Материалы', 'Аренда', 'Оборудование', 'Реклама', 'Другое']
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      <header className="bg-gradient-to-r from-cyan-500 to-teal-500 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-xl font-semibold text-white">Доходы и расходы</h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto w-full">
        {/* Summary */}
        {finances && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="border-0 shadow-md bg-green-50">
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-green-600">Доход</p>
                <p className="font-semibold text-green-700 text-sm">
                  {finances.totalIncome.toLocaleString()} ₽
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-red-50">
              <CardContent className="p-3 text-center">
                <TrendingDown className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <p className="text-xs text-red-600">Расход</p>
                <p className="font-semibold text-red-700 text-sm">
                  {finances.totalExpenses.toLocaleString()} ₽
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-cyan-50">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-cyan-600">Баланс</p>
                <p className={`font-semibold text-sm ${finances.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {finances.balance.toLocaleString()} ₽
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {showAddForm && (
          <Card className="border-0 shadow-lg mb-4">
            <CardContent className="p-4 space-y-3">
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
              <select
                className="w-full p-2 border rounded-md"
                value={newRecord.category}
                onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
              >
                <option value="">Выберите категорию</option>
                {categories[newRecord.type].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Input
                placeholder="Описание (необязательно)"
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={addRecord} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  Добавить
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : !finances || finances.records.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center text-gray-600">
              Нет записей
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {finances.records.map((record) => (
              <Card key={record.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {record.type === 'Доход' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{record.category}</p>
                        <p className="text-xs text-gray-500">{record.date}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${record.type === 'Доход' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.type === 'Доход' ? '+' : '-'}{record.amount.toLocaleString()} ₽
                    </p>
                  </div>
                  {record.description && (
                    <p className="text-xs text-gray-500 mt-1">{record.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Master Schedule Screen
interface MasterScheduleScreenProps {
  master: Master;
  onBack: () => void;
}

export function MasterScheduleScreen({ master, onBack }: MasterScheduleScreenProps) {
  const [schedule, setSchedule] = useState<{ date: string; status: string; start?: string; end?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [master.id]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/good-lak?action=getMasterSchedule&masterId=${master.id}`);
      const data = await response.json();
      if (data.success) {
        setSchedule(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayStatus = async (date: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Рабочий' ? 'Выходной' : 'Рабочий';
    try {
      await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSchedule',
          masterId: master.id,
          schedule: { date, status: newStatus, start: '9:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00' }
        })
      });
      fetchSchedule();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      <header className="bg-gradient-to-r from-cyan-500 to-teal-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button onClick={onBack} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Мой график</h1>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.filter(s => s.date >= today).slice(0, 14).map((day) => (
              <Card key={day.date} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">
                        {format(new Date(day.date), 'd MMMM, EEEE', { locale: ru })}
                      </p>
                      {day.status === 'Рабочий' && (
                        <p className="text-sm text-gray-500">
                          {day.start} - {day.end}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={day.status === 'Рабочий' ? 'default' : 'outline'}
                      onClick={() => toggleDayStatus(day.date, day.status)}
                      className={day.status === 'Рабочий' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {day.status === 'Рабочий' ? 'Рабочий' : 'Выходной'}
                    </Button>
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
