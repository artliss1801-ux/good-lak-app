'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

// Извлечение ID файла из Google Drive URL
function extractGoogleDriveFileId(url: string | undefined): string | null {
  if (!url) return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /open\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

// Получение проксированной ссылки на изображение (обходит CORS)
function getProxiedImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `/api/image-proxy?id=${fileId}`;
  }

  // Если это не Google Drive URL, возвращаем как есть
  return url;
}

export function SelectMasterScreen() {
  const { masters, setMasters, selectMaster, setScreen, error, setError } = useGoodLakStore();
  const [localLoading, setLocalLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Всегда загружаем мастеров заново
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    setLocalLoading(true);
    setError(null);
    setDebugInfo('');
    
    try {
      console.log('Fetching masters from API...');
      const response = await fetch('/api/good-lak?action=getMasters');
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('Masters loaded:', data.data?.length || 0);
        
        // Логируем данные о фото мастеров
        data.data?.forEach((master: { id: string | number; name: string; photo?: string }) => {
          console.log(`Master ${master.name} photo:`, master.photo);
        });
        
        setMasters(data.data || []);
        setDebugInfo(`Загружено мастеров: ${data.data?.length || 0}`);
      } else {
        console.error('API error:', data.error);
        setError(data.error || 'Не удалось загрузить мастеров');
        setDebugInfo(`Ошибка: ${data.error}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Ошибка соединения с сервером');
      setDebugInfo(`Ошибка соединения: ${err}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSelectMaster = (master: typeof masters[0]) => {
    selectMaster(master);
    setScreen('select-service');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setScreen('home')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Выберите мастера</h1>
          <button
            onClick={fetchMasters}
            className="ml-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            disabled={localLoading}
          >
            <RefreshCw className={`h-5 w-5 text-white ${localLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {localLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <p className="mt-4 text-gray-600">Загрузка мастеров...</p>
          </div>
        ) : error ? (
          <Card className="border-0 shadow-lg border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-2">Ошибка загрузки</p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <Button onClick={fetchMasters} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        ) : masters.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Нет доступных мастеров</p>
              <p className="text-gray-500 text-sm mb-4">
                Проверьте, что в Google Sheets есть активные мастера
              </p>
              {debugInfo && (
                <p className="text-xs text-gray-400 mb-4 bg-gray-100 p-2 rounded">
                  {debugInfo}
                </p>
              )}
              <Button onClick={fetchMasters} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {debugInfo && (
              <p className="text-xs text-gray-500 text-center mb-2">{debugInfo}</p>
            )}
            {masters.map((master) => (
              <Card
                key={master.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                onClick={() => handleSelectMaster(master)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center p-4 bg-white group-hover:bg-gray-50 transition-colors">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center mr-4 shadow-md overflow-hidden">
                      {master.photo ? (
                        <img 
                          src={getProxiedImageUrl(master.photo) || master.photo} 
                          alt={master.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.log('Failed to load image for master:', master.name, master.photo);
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      <User className={`h-8 w-8 text-white fallback-icon ${master.photo ? 'hidden' : ''}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {master.name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Нажмите для выбора
                      </p>
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
