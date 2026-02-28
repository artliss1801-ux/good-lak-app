'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Wallet, Settings, LogOut, TrendingUp, TrendingDown, User, Settings as SettingsIcon } from 'lucide-react';
import { useGoodLakStore, Master, MasterScreen } from '@/store/good-lak-store';

interface MasterHomeScreenProps {
  master: Master;
  onLogout: () => void;
  onNavigate: (screen: MasterScreen) => void;
}

interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
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

export function MasterHomeScreen({ master, onLogout, onNavigate }: MasterHomeScreenProps) {
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, [master.id]);

  // Обновляем фото при изменении master
  useEffect(() => {
    if (master.photo) {
      setPhotoUrl(getDirectImageUrl(master.photo, true));
    }
  }, [master.photo]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Получаем записи мастера
      const appointmentsRes = await fetch(`/api/good-lak?action=getMasterAppointments&masterId=${master.id}`);
      const appointmentsData = await appointmentsRes.json();
      
      if (appointmentsData.success) {
        const today = new Date().toISOString().split('T')[0];
        const todayCount = appointmentsData.data.filter(
          (a: { date: string; status: string }) => a.date === today && a.status !== 'Отменено'
        ).length;
        setTodayAppointments(todayCount);
      }

      // Получаем финансы
      const financesRes = await fetch(`/api/good-lak?action=getMasterFinances&masterId=${master.id}`);
      const financesData = await financesRes.json();
      
      if (financesData.success) {
        setFinanceSummary(financesData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems: Array<{
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    screen: MasterScreen;
  }> = [
    {
      title: 'Мои записи',
      subtitle: `${todayAppointments} записей сегодня`,
      icon: Calendar,
      color: 'from-pink-500 to-rose-500',
      screen: 'appointments'
    },
    {
      title: 'Мои клиенты',
      subtitle: 'Список клиентов',
      icon: Users,
      color: 'from-cyan-500 to-teal-500',
      screen: 'clients'
    },
    {
      title: 'Доходы и расходы',
      subtitle: financeSummary ? `Баланс: ${financeSummary.balance.toLocaleString()} ₽` : 'Загрузка...',
      icon: Wallet,
      color: 'from-green-500 to-emerald-500',
      screen: 'finances'
    },
    {
      title: 'Мой график',
      subtitle: 'Управление расписанием',
      icon: Settings,
      color: 'from-purple-500 to-violet-500',
      screen: 'schedule'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-500 to-teal-500 p-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Приветствие без клика */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={master.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.log('Photo load error via proxy, hiding image');
                    (e.target as HTMLImageElement).style.display = 'none';
                    setPhotoUrl('');
                  }}
                  onLoad={() => {
                    console.log('Photo loaded successfully via proxy');
                  }}
                />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Привет, {master.name}!</h2>
              <p className="text-white/80 text-sm">GOOD Лак Мастер</p>
            </div>
          </div>
          
          {/* Кнопки справа */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('profile')}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Мой профиль"
            >
              <SettingsIcon className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Выйти"
            >
              <LogOut className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            {financeSummary && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className="border-0 shadow-md bg-green-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-green-600">Доходы</p>
                        <p className="font-semibold text-green-700">
                          {financeSummary.totalIncome.toLocaleString()} ₽
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-red-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-xs text-red-600">Расходы</p>
                        <p className="font-semibold text-red-700">
                          {financeSummary.totalExpenses.toLocaleString()} ₽
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-3">
              {menuItems.map((item) => (
                <Card
                  key={item.screen}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                  onClick={() => onNavigate(item.screen)}
                >
                  <CardContent className="p-0">
                    <div className={`flex items-center p-4 bg-gradient-to-r ${item.color} group-hover:opacity-90 transition-opacity`}>
                      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mr-4">
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {item.title}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-gray-500 text-sm">GOOD Лак Мастер</p>
      </footer>
    </div>
  );
}
