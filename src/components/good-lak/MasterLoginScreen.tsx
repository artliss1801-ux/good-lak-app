'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from './Logo';
import { LogIn, Loader2 } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

interface MasterLoginScreenProps {
  onLoginSuccess: (master: { id: string | number; name: string; telegramId?: string | number }) => void;
}

export function MasterLoginScreen({ onLoginSuccess }: MasterLoginScreenProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setError: setGlobalError } = useGoodLakStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      setError('Введите логин и пароль');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/good-lak?action=loginMaster&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`
      );
      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.data);
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-gray-800">
              Вход для мастеров
            </CardTitle>
            <p className="text-sm text-gray-600">
              GOOD Лак Мастер
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Введите логин"
                  className="border-gray-200 focus:border-cyan-300 focus:ring-cyan-200"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="border-gray-200 focus:border-cyan-300 focus:ring-cyan-200"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Войти
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
