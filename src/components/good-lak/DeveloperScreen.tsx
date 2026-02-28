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
  Server
} from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

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

  useEffect(() => {
    loadSettings();
  }, []);

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

  const menuItems = [
    { id: 'settings', title: 'Настройки приложения', icon: Settings, description: 'Название, цвета, логотип' },
    { id: 'database', title: 'База данных', icon: Database, description: 'Google Sheets, Drive' },
    { id: 'admins', title: 'Администраторы', icon: Users, description: 'Управление доступом' },
    { id: 'services', title: 'Услуги', icon: DollarSign, description: 'Список услуг и цен' },
    { id: 'masters', title: 'Мастера', icon: Calendar, description: 'Управление мастерами' },
    { id: 'logs', title: 'Логи системы', icon: Code, description: 'Просмотр логов' },
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

        <div className="flex-1 p-4 max-w-md mx-auto w-full">
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
              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-3">Управление услугами</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Услуги настраиваются в Google таблице на листе "Услуги".
                  </p>
                  <Button 
                    onClick={() => window.open('https://docs.google.com/spreadsheets/d/', '_blank')}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300"
                  >
                    Открыть таблицу
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'masters' && (
            <div className="space-y-4">
              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-3">Управление мастерами</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Мастера настраиваются в Google таблице на листе "Мастера".
                  </p>
                  <Button 
                    onClick={() => window.open('https://docs.google.com/spreadsheets/d/', '_blank')}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300"
                  >
                    Открыть таблицу
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'logs' && (
            <div className="space-y-4">
              <Card className="border-0 shadow-lg bg-gray-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-3">Системные логи</h3>
                  <p className="text-gray-400 text-sm">
                    Логи доступны в консоли Apps Script и в логах сервера.
                  </p>
                  <pre className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-400 overflow-auto">
                    {`// Проверьте логи в:
// 1. Apps Script Dashboard
// 2. Серверные логи (Vercel/другой хостинг)
// 3. Browser Console (F12)`}
                  </pre>
                </CardContent>
              </Card>
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
