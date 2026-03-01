'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Settings, 
  LogOut, 
  Users, 
  Calendar, 
  DollarSign,
  Image as ImageIcon,
  Database,
  Lock,
  Loader2,
  Save,
  Code,
  Server,
  Plus,
  Pencil,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  description: string;
  active: boolean;
}

interface Master {
  id: number;
  name: string;
  photo: string;
  telegramId: string;
  login: string;
  password: string;
  active: boolean;
}

export function DeveloperScreen() {
  const { developer, developerLogout } = useGoodLakStore();
  const [activeSection, setActiveSection] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    appName: 'GOOD Лак',
    logoUrl: '',
    primaryColor: '#ec4899',
    secondaryColor: '#06b6d4',
    telegramBotToken: '',
    spreadsheetId: '',
    driveFolderId: ''
  });
  const [saveMessage, setSaveMessage] = useState('');

  // Услуги
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: 0, duration: 60, description: '' });

  // Мастера
  const [masters, setMasters] = useState<Master[]>([]);
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  const [newMaster, setNewMaster] = useState({ name: '', photo: '', telegramId: '', login: '', password: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeSection === 'services') {
      loadServices();
    } else if (activeSection === 'masters') {
      loadMasters();
    }
  }, [activeSection]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak?action=getAppSettings');
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAppSettings',
          settings: settings
        })
      });
      const data = await response.json();
      if (data.success) {
        setSaveMessage('Настройки сохранены!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== УСЛУГИ ====================

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak?action=getAllServices');
      const data = await response.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addService',
          service: newService
        })
      });
      const data = await response.json();
      if (data.success) {
        setServices([...services, data.data]);
        setNewService({ name: '', price: 0, duration: 60, description: '' });
        setIsAddingService(false);
      }
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async (service: Service) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateService',
          serviceId: service.id,
          service: {
            name: service.name,
            price: service.price,
            duration: service.duration,
            description: service.description,
            active: service.active
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setServices(services.map(s => s.id === service.id ? service : s));
        setEditingService(null);
      }
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Удалить услугу?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteService',
          serviceId: serviceId
        })
      });
      const data = await response.json();
      if (data.success) {
        setServices(services.filter(s => s.id !== serviceId));
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== МАСТЕРА ====================

  const loadMasters = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak?action=getAllMasters');
      const data = await response.json();
      if (data.success) {
        setMasters(data.data);
      }
    } catch (error) {
      console.error('Error loading masters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMaster = async () => {
    if (!newMaster.name.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMaster',
          master: newMaster
        })
      });
      const data = await response.json();
      if (data.success) {
        setMasters([...masters, data.data]);
        setNewMaster({ name: '', photo: '', telegramId: '', login: '', password: '' });
        setIsAddingMaster(false);
      }
    } catch (error) {
      console.error('Error adding master:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMaster = async (master: Master) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMasterByAdmin',
          masterId: master.id,
          master: {
            name: master.name,
            photo: master.photo,
            telegramId: master.telegramId,
            login: master.login,
            password: master.password,
            active: master.active
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setMasters(masters.map(m => m.id === master.id ? master : m));
        setEditingMaster(null);
      }
    } catch (error) {
      console.error('Error updating master:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMaster = async (masterId: number) => {
    if (!confirm('Удалить мастера?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteMaster',
          masterId: masterId
        })
      });
      const data = await response.json();
      if (data.success) {
        setMasters(masters.filter(m => m.id !== masterId));
      }
    } catch (error) {
      console.error('Error deleting master:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { id: 'settings', title: 'Настройки приложения', icon: Settings, description: 'Название, цвета, логотип' },
    { id: 'database', title: 'База данных', icon: Database, description: 'Google Sheets, Drive' },
    { id: 'admins', title: 'Администраторы', icon: Users, description: 'Управление доступом' },
    { id: 'services', title: 'Услуги', icon: DollarSign, description: 'Список услуг и цен' },
    { id: 'masters', title: 'Мастера', icon: Calendar, description: 'Управление мастерами' },
  ];

  if (activeSection !== 'main') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <header className="bg-gray-900 border-b border-gray-700 p-4 shadow-lg">
          <div className="flex items-center max-w-md mx-auto">
            <button
              onClick={() => setActiveSection('main')}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {menuItems.find(m => m.id === activeSection)?.title || 'Панель разработчика'}
            </h1>
            <button
              onClick={developerLogout}
              className="ml-auto p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 max-w-md mx-auto w-full overflow-auto">
          {activeSection === 'settings' && (
            <div className="space-y-4">
              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Основные настройки
                  </h3>
                  
                  <div>
                    <label className="text-sm text-gray-400">Название приложения</label>
                    <Input
                      value={settings.appName}
                      onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">URL логотипа</label>
                    <Input
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Основной цвет</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-12 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Второй цвет</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.secondaryColor}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="w-12 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.secondaryColor}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {saveMessage && (
                    <p className={`text-sm ${saveMessage.includes('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>
                      {saveMessage}
                    </p>
                  )}

                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить настройки
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'database' && (
            <div className="space-y-4">
              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Подключение к сервисам
                  </h3>
                  
                  <div>
                    <label className="text-sm text-gray-400">Telegram Bot Token</label>
                    <Input
                      type="password"
                      value={settings.telegramBotToken}
                      onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                      placeholder="123456:ABC..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Google Spreadsheet ID</label>
                    <Input
                      value={settings.spreadsheetId}
                      onChange={(e) => setSettings({ ...settings, spreadsheetId: e.target.value })}
                      placeholder="1abc123..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Google Drive Folder ID</label>
                    <Input
                      value={settings.driveFolderId}
                      onChange={(e) => setSettings({ ...settings, driveFolderId: e.target.value })}
                      placeholder="1abc123..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  {saveMessage && (
                    <p className={`text-sm ${saveMessage.includes('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>
                      {saveMessage}
                    </p>
                  )}

                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить настройки
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-3">Инструкция по настройке</h3>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>1. Создайте бота через @BotFather в Telegram</p>
                    <p>2. Создайте Google таблицу и скопируйте её ID из URL</p>
                    <p>3. Создайте папку на Google Drive для фото</p>
                    <p>4. Разверните Apps Script и получите URL</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'admins' && (
            <div className="space-y-4">
              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-3">Управление администраторами</h3>
                  <p className="text-gray-400 text-sm">
                    Администраторы настраиваются в Google таблице на листе "Администраторы".
                    Добавьте новых администраторов напрямую в таблицу.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-3">Текущий администратор</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{developer?.login || 'Admin'}</p>
                      <p className="text-gray-400 text-sm">Вход выполнен</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'services' && (
            <div className="space-y-4">
              {/* Кнопка добавления */}
              {!isAddingService && (
                <Button 
                  onClick={() => setIsAddingService(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить услугу
                </Button>
              )}

              {/* Форма добавления */}
              {isAddingService && (
                <Card className="border-0 shadow-lg bg-gray-800">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-white">Новая услуга</h3>
                    <Input
                      placeholder="Название услуги"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Цена (руб)</label>
                        <Input
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Длительность (мин)</label>
                        <Input
                          type="number"
                          value={newService.duration}
                          onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <Input
                      placeholder="Описание (необязательно)"
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddService}
                        disabled={isLoading || !newService.name.trim()}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsAddingService(false);
                          setNewService({ name: '', price: 0, duration: 60, description: '' });
                        }}
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Список услуг */}
              {services.map(service => (
                <Card key={service.id} className={`border-0 shadow-lg ${service.active ? 'bg-gray-800' : 'bg-gray-900 opacity-60'}`}>
                  <CardContent className="p-4">
                    {editingService?.id === service.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editingService.name}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">Цена</label>
                            <Input
                              type="number"
                              value={editingService.price}
                              onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Длит.</label>
                            <Input
                              type="number"
                              value={editingService.duration}
                              onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleUpdateService(editingService)}
                            disabled={isLoading}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => setEditingService(null)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium">{service.name}</h3>
                            {!service.active && (
                              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">неактивна</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">
                            {service.price} руб • {service.duration} мин
                          </p>
                          {service.description && (
                            <p className="text-gray-500 text-xs mt-1">{service.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingService(service)}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                          >
                            <Pencil className="h-4 w-4 text-gray-300" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4 text-gray-300" />
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {services.length === 0 && !isLoading && (
                <p className="text-center text-gray-400 py-8">Нет услуг</p>
              )}
            </div>
          )}

          {activeSection === 'masters' && (
            <div className="space-y-4">
              {/* Кнопка добавления */}
              {!isAddingMaster && (
                <Button 
                  onClick={() => setIsAddingMaster(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить мастера
                </Button>
              )}

              {/* Форма добавления */}
              {isAddingMaster && (
                <Card className="border-0 shadow-lg bg-gray-800">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-white">Новый мастер</h3>
                    <Input
                      placeholder="Имя мастера *"
                      value={newMaster.name}
                      onChange={(e) => setNewMaster({ ...newMaster, name: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="URL фото"
                      value={newMaster.photo}
                      onChange={(e) => setNewMaster({ ...newMaster, photo: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Telegram ID"
                      value={newMaster.telegramId}
                      onChange={(e) => setNewMaster({ ...newMaster, telegramId: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Логин"
                      value={newMaster.login}
                      onChange={(e) => setNewMaster({ ...newMaster, login: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Пароль"
                      value={newMaster.password}
                      onChange={(e) => setNewMaster({ ...newMaster, password: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddMaster}
                        disabled={isLoading || !newMaster.name.trim()}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsAddingMaster(false);
                          setNewMaster({ name: '', photo: '', telegramId: '', login: '', password: '' });
                        }}
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Список мастеров */}
              {masters.map(master => (
                <Card key={master.id} className={`border-0 shadow-lg ${master.active ? 'bg-gray-800' : 'bg-gray-900 opacity-60'}`}>
                  <CardContent className="p-4">
                    {editingMaster?.id === master.id ? (
                      <div className="space-y-3">
                        <Input
                          placeholder="Имя"
                          value={editingMaster.name}
                          onChange={(e) => setEditingMaster({ ...editingMaster, name: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <Input
                          placeholder="URL фото"
                          value={editingMaster.photo}
                          onChange={(e) => setEditingMaster({ ...editingMaster, photo: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <Input
                          placeholder="Telegram ID"
                          value={editingMaster.telegramId}
                          onChange={(e) => setEditingMaster({ ...editingMaster, telegramId: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <Input
                          placeholder="Логин"
                          value={editingMaster.login}
                          onChange={(e) => setEditingMaster({ ...editingMaster, login: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <Input
                          placeholder="Пароль"
                          value={editingMaster.password}
                          onChange={(e) => setEditingMaster({ ...editingMaster, password: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingMaster.active}
                            onChange={(e) => setEditingMaster({ ...editingMaster, active: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-gray-300 text-sm">Активен</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleUpdateMaster(editingMaster)}
                            disabled={isLoading}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => setEditingMaster(null)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-12 w-12 rounded-full bg-pink-600 flex items-center justify-center overflow-hidden">
                            {master.photo ? (
                              <img src={master.photo} alt={master.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-lg">{master.name?.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-medium">{master.name}</h3>
                              {!master.active && (
                                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">неактивен</span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {master.login || 'Нет логина'}
                            </p>
                            {master.telegramId && (
                              <p className="text-gray-500 text-xs">TG: {master.telegramId}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingMaster(master)}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                          >
                            <Pencil className="h-4 w-4 text-gray-300" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaster(master.id)}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4 text-gray-300" />
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {masters.length === 0 && !isLoading && (
                <p className="text-center text-gray-400 py-8">Нет мастеров</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-900 border-b border-gray-700 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Панель разработчика</h2>
              <p className="text-gray-400 text-sm">{developer?.login || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={developerLogout}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Card
              key={item.id}
              className="border-0 shadow-lg bg-gray-800 hover:bg-gray-750 cursor-pointer transition-colors"
              onClick={() => setActiveSection(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gray-700 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Card className="border-0 shadow-lg bg-gray-800">
            <CardContent className="p-4">
              <h3 className="text-white font-medium mb-2">Информация о системе</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Версия: 1.0.0</p>
                <p>Backend: Google Apps Script</p>
                <p>Frontend: Next.js 15</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
