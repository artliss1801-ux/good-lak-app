'use client';

import { useGoodLakStore } from '@/store/good-lak-store';
import { MasterLoginScreen } from './MasterLoginScreen';
import { MasterHomeScreen } from './MasterHomeScreen';
import { MasterAppointmentsScreen, MasterClientsScreen, MasterFinancesScreen, MasterScheduleScreen, MasterProfileScreen } from './MasterScreens';

export function MasterLakApp() {
  const { master, isMasterAuthenticated, masterScreen, setMaster, setMasterAuthenticated, setMasterScreen, masterLogout } = useGoodLakStore();

  const handleLogin = (masterData: { id: string | number; name: string; telegramId?: string | number; login?: string; photo?: string }) => {
    setMaster(masterData);
    setMasterAuthenticated(true);
    setMasterScreen('home');
  };

  const handleLogout = () => {
    masterLogout();
  };

  if (!master || !isMasterAuthenticated) {
    return <MasterLoginScreen onLoginSuccess={handleLogin} />;
  }

  switch (masterScreen) {
    case 'appointments':
      return <MasterAppointmentsScreen />;
    case 'clients':
      return <MasterClientsScreen />;
    case 'finances':
      return <MasterFinancesScreen />;
    case 'schedule':
      return <MasterScheduleScreen />;
    case 'profile':
      return <MasterProfileScreen />;
    default:
      return (
        <MasterHomeScreen
          master={master}
          onLogout={handleLogout}
          onNavigate={setMasterScreen}
        />
      );
  }
}
