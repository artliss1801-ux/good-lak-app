'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

export function SelectServiceScreen() {
  const { 
    services, 
    setServices, 
    booking, 
    selectService, 
    setScreen, 
    setError 
  } = useGoodLakStore();
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (services.length === 0) {
      fetchServices();
    }
  }, []);

  const fetchServices = async () => {
    setLocalLoading(true);
    try {
      const response = await fetch('/api/good-lak?action=getServices');
      const data = await response.json();
      if (data.success) {
        setServices(data.data);
      } else {
        setError(data.error || 'Не удалось загрузить услуги');
      }
    } catch (error) {
      setError('Ошибка соединения');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSelectService = (service: typeof services[0]) => {
    selectService(service);
    setScreen('select-datetime');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} ч ${mins} мин`;
    } else if (hours > 0) {
      return `${hours} ч`;
    } else {
      return `${mins} мин`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setScreen('select-master')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Выберите услугу</h1>
            <p className="text-white/80 text-sm">Мастер: {booking.selectedMaster?.name}</p>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {localLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : services.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Нет доступных услуг</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                onClick={() => handleSelectService(service)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center p-4 bg-white group-hover:bg-gray-50 transition-colors">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center mr-4 shadow-md">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-gray-400 text-xs mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
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
