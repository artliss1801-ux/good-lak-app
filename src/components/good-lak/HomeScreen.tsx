'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, ClipboardList, LogOut, User, Settings } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';
import { Logo } from './Logo';

export function HomeScreen() {
  const { user, setScreen, logout } = useGoodLakStore();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      {/* Header с логотипом */}
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="h-10 w-32">
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen('profile')}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Settings className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <LogOut className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Welcome */}
      <div className="p-6 max-w-md mx-auto w-full">
        {/* Приветствие без клика */}
        <div className="mb-6 p-4 bg-gradient-to-r from-pink-100 to-cyan-100 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <User className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">
                Привет, {user?.name || 'Гость'}!
              </h2>
              <p className="text-gray-600">
                Рады видеть вас в GOOD Лак
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Card 
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
            onClick={() => setScreen('select-master')}
          >
            <CardContent className="p-0">
              <div className="flex items-center p-5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:from-pink-600 group-hover:to-rose-600 transition-all">
                <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center mr-4">
                  <CalendarDays className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Записаться на прием
                  </h3>
                  <p className="text-white/80 text-sm">
                    Выберите мастера, услугу и время
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
            onClick={() => setScreen('my-appointments')}
          >
            <CardContent className="p-0">
              <div className="flex items-center p-5 bg-gradient-to-r from-cyan-500 to-teal-500 group-hover:from-cyan-600 group-hover:to-teal-600 transition-all">
                <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center mr-4">
                  <ClipboardList className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Мои записи
                  </h3>
                  <p className="text-white/80 text-sm">
                    Просмотр и управление записями
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto p-4 text-center">
        <p className="text-gray-500 text-sm">
          GOOD Лак — студия маникюра
        </p>
      </footer>
    </div>
  );
}
