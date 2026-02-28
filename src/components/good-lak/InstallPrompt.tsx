'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getInstallState() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIOS: false, isStandalone: false, isDismissed: false };
  }
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  const isDismissed = dismissedTime ? (Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) : false;
  
  return { isIOS, isStandalone, isDismissed };
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const handledRef = useRef(false);

  // Получаем состояние при первом рендере на клиенте
  const { isIOS, isStandalone, isDismissed } = typeof window !== 'undefined' 
    ? getInstallState() 
    : { isIOS: false, isStandalone: false, isDismissed: false };

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    if (isStandalone || isDismissed) return;

    // Слушаем событие beforeinstallprompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Для iOS показываем подсказку через 3 секунды
    let timeout: ReturnType<typeof setTimeout>;
    if (isIOS) {
      timeout = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (timeout) clearTimeout(timeout);
    };
  }, [isStandalone, isDismissed, isIOS]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // Не показываем если SSR, уже установлено или отклонено
  if (typeof window === 'undefined') return null;
  if (!showPrompt || isStandalone || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Card className="shadow-2xl border-pink-200 bg-gradient-to-r from-pink-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm">
                Установите GOOD Лак
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Добавьте приложение на главный экран для быстрого доступа
              </p>

              {isIOS ? (
                <div className="mt-3 text-xs text-gray-600 bg-gray-100 rounded-lg p-2">
                  <p className="flex items-center gap-1">
                    1. Нажмите <Share className="h-4 w-4 inline text-pink-500" /> (Поделиться)
                  </p>
                  <p className="flex items-center gap-1 mt-1">
                    2. Нажмите <Plus className="h-4 w-4 inline text-pink-500" /> (На экран Домой)
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleInstall}
                  className="mt-3 w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 h-9 text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Установить
                </Button>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
