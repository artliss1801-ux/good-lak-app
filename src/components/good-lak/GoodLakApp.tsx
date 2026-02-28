'use client';

import { useEffect } from 'react';
import { useGoodLakStore } from '@/store/good-lak-store';
import { LoginScreen } from './LoginScreen';
import { HomeScreen } from './HomeScreen';
import { SelectMasterScreen } from './SelectMasterScreen';
import { SelectServiceScreen } from './SelectServiceScreen';
import { SelectDateTimeScreen } from './SelectDateTimeScreen';
import { ConfirmBookingScreen } from './ConfirmBookingScreen';
import { BookingSuccessScreen } from './BookingSuccessScreen';
import { MyAppointmentsScreen } from './MyAppointmentsScreen';
import { CommentScreen } from './CommentScreen';
import { ProfileScreen } from './ProfileScreen';
import { MasterLakApp } from './MasterLakApp';
import { DeveloperScreen } from './DeveloperScreen';

export function GoodLakApp() {
  const currentScreen = useGoodLakStore((state) => state.currentScreen);
  const isMasterAuthenticated = useGoodLakStore((state) => state.isMasterAuthenticated);
  const isDeveloperAuthenticated = useGoodLakStore((state) => state.isDeveloperAuthenticated);

  // Автоматический polling для Telegram бота
  useEffect(() => {
    const pollTelegram = async () => {
      try {
        await fetch('/api/telegram-poll', { method: 'POST' });
      } catch (error) {
        console.error('Telegram poll error:', error);
      }
    };

    // Запуск при загрузке
    pollTelegram();

    // Запуск каждые 5 секунд
    const interval = setInterval(pollTelegram, 5000);

    return () => clearInterval(interval);
  }, []);

  // Если авторизован разработчик - показываем экран разработчика
  if (isDeveloperAuthenticated) {
    return <DeveloperScreen />;
  }

  // Если авторизован мастер - показываем мастер-приложение
  if (isMasterAuthenticated) {
    return <MasterLakApp />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen />;
      case 'home':
        return <HomeScreen />;
      case 'select-master':
        return <SelectMasterScreen />;
      case 'select-service':
        return <SelectServiceScreen />;
      case 'select-datetime':
        return <SelectDateTimeScreen />;
      case 'confirm-booking':
        return <ConfirmBookingScreen />;
      case 'booking-success':
        return <BookingSuccessScreen />;
      case 'my-appointments':
        return <MyAppointmentsScreen />;
      case 'comment':
        return <CommentScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <LoginScreen />;
    }
  };

  return (
    <div className="font-sans">
      {renderScreen()}
    </div>
  );
}
