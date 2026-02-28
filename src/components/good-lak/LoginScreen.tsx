'use client';

import { useState } from 'react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Loader2, ArrowLeft, Lock, Code } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

export function LoginScreen() {
  const { setScreen, setUser, setAuthenticated, setMaster, setMasterAuthenticated, setDeveloper, setDeveloperAuthenticated } = useGoodLakStore();
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [showDeveloperLogin, setShowDeveloperLogin] = useState(false);
  const [phone, setPhone] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Имя бота
  const BOT_NAME = 'iren_nails_goodlak_bot';

  const handleTelegramLogin = () => {
    // Открываем правильный Telegram бот для регистрации
    window.open(`https://t.me/${BOT_NAME}`, '_blank');
  };

  // Нормализация номера телефона
  const normalizePhone = (phoneInput: string): string => {
    // Удаляем все кроме цифр
    let digits = phoneInput.replace(/\D/g, '');
    
    // Если начинается с 8, заменяем на 7
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    
    // Если не начинается с 7, добавляем 7
    if (!digits.startsWith('7')) {
      digits = '7' + digits;
    }
    
    return digits;
  };

  const handlePhoneLogin = async () => {
    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    
    if (normalizedPhone.length !== 11) {
      setError('Введите корректный номер телефона');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Ищем пользователя по телефону
      const response = await fetch(`/api/good-lak?action=getUserByPhone&phone=${normalizedPhone}`);
      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data);
        setAuthenticated(true);
        setScreen('home');
      } else {
        setError('Пользователь не найден. Зарегистрируйтесь через Telegram');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  // Вход мастера по логину и паролю
  const handleMasterLogin = async () => {
    if (!login.trim()) {
      setError('Введите логин');
      return;
    }

    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/good-lak?action=loginMaster&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`);
      const data = await response.json();

      if (data.success && data.data) {
        setMaster(data.data);
        setMasterAuthenticated(true);
        // Не нужно менять экран - GoodLakApp автоматически покажет MasterLakApp
      } else {
        setError(data.error || 'Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  // Вход разработчика по логину и паролю
  const handleDeveloperLogin = async () => {
    if (!login.trim()) {
      setError('Введите логин');
      return;
    }

    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/good-lak?action=loginAdmin&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`);
      const data = await response.json();

      if (data.success && data.data) {
        setDeveloper(data.data);
        setDeveloperAuthenticated(true);
        // Не нужно менять экран - GoodLakApp автоматически покажет DeveloperScreen
      } else {
        setError(data.error || 'Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPhoneLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-cyan-50">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardContent className="pt-8 pb-8 px-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Вход по телефону
                </h2>
                <p className="text-gray-600">
                  Введите номер телефона, указанный при регистрации
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 text-lg text-center"
                  disabled={isLoading}
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              </div>

              <Button
                onClick={handlePhoneLogin}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  'Войти'
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => { setShowPhoneLogin(false); setError(''); }}
                  className="text-gray-600 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Экран входа для мастера
  if (showMasterLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-cyan-50">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardContent className="pt-8 pb-8 px-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Вход для мастера
                </h2>
                <p className="text-gray-600">
                  Введите логин и пароль
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Логин"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="h-12 text-lg"
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-lg"
                  disabled={isLoading}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMasterLogin(); }}
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              </div>

              <Button
                onClick={handleMasterLogin}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  'Войти как мастер'
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => { setShowMasterLogin(false); setError(''); setLogin(''); setPassword(''); }}
                  className="text-gray-600 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Экран входа для разработчика
  if (showDeveloperLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          <Card className="border-0 shadow-xl bg-gray-800">
            <CardContent className="pt-8 pb-8 px-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-white">
                  Вход для разработчика
                </h2>
                <p className="text-gray-400">
                  Введите логин и пароль администратора
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Логин"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="h-12 text-lg bg-gray-700 border-gray-600 text-white"
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-lg bg-gray-700 border-gray-600 text-white"
                  disabled={isLoading}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDeveloperLogin(); }}
                />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              </div>

              <Button
                onClick={handleDeveloperLogin}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  'Войти как разработчик'
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => { setShowDeveloperLogin(false); setError(''); setLogin(''); setPassword(''); }}
                  className="text-gray-400 hover:text-gray-300 text-sm flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardContent className="pt-8 pb-8 px-6 space-y-6">
            {/* Логотип по ширине кнопок */}
            <Logo size="full" />
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                Добро пожаловать!
              </h2>
              <p className="text-gray-600">
                Войдите через Telegram для записи на маникюр
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => setShowPhoneLogin(true)}
                className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg transition-all duration-300"
              >
                Вход
              </Button>
              
              <Button
                onClick={() => setShowMasterLogin(true)}
                variant="outline"
                className="w-full h-14 text-lg border-2 border-cyan-400 text-cyan-600 hover:bg-cyan-50 rounded-xl shadow-lg transition-all duration-300"
              >
                <Lock className="mr-3 h-6 w-6" />
                Вход для мастера
              </Button>
              
              <Button
                onClick={handleTelegramLogin}
                variant="outline"
                className="w-full h-14 text-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl shadow-lg transition-all duration-300"
              >
                <MessageCircle className="mr-3 h-6 w-6" />
                Регистрация через Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center space-y-2">
          <button
            onClick={() => setShowDeveloperLogin(true)}
            className="text-gray-400 hover:text-gray-600 text-xs underline"
          >
            Вход для разработчика
          </button>
        </div>
      </div>
    </div>
  );
}
