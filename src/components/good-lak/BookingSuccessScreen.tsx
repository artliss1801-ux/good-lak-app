'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

export function BookingSuccessScreen() {
  const { resetBooking, setScreen } = useGoodLakStore();
  
  const handleReturn = () => {
    resetBooking();
    setScreen('home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      <Card className="border-0 shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-8 text-center">
          <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Запись успешно создана!
          </h1>
          <p className="text-white/90">
            Мы отправим вам напоминание в Telegram
          </p>
        </div>
        
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            Напоминание придёт в день записи в 08:00 и за час до процедуры
          </p>
          
          <Button
            onClick={handleReturn}
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white rounded-xl shadow-lg"
          >
            Вернуться на главный экран
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
