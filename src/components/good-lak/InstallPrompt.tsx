'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download, Share, Plus, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getInstallState() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIOS: false, isStandalone: false };
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return { isIOS, isStandalone };
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const handledRef = useRef(false);

  // Получаем состояние при первом рендере на клиенте
  const { isIOS, isStandalone } = typeof window !== 'undefined'
    ? getInstallState()
    : { isIOS: false, isStandalone: false };

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    if (isStandalone) return;

    // Слушаем событие beforeinstallprompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Для iOS тоже можно установить
    if (isIOS) {
      setCanInstall(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [isStandalone, isIOS]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowDialog(false);
        setCanInstall(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Не показываем если SSR или уже установлено
  if (typeof window === 'undefined') return null;
  if (isStandalone || !canInstall) return null;

  return (
    <>
      {/* Ссылка внизу экрана */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/5 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto px-4 pb-2 pt-6 pointer-events-auto">
          <button
            onClick={() => setShowDialog(true)}
            className="w-full text-center text-sm text-pink-500 hover:text-pink-600 py-2 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Установить приложение
          </button>
        </div>
      </div>

      {/* Диалог с инструкцией */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Установить GOOD Лак
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Добавьте приложение на главный экран для быстрого доступа
            </p>

            {isIOS ? (
              <div className="text-sm text-gray-600 bg-gray-100 rounded-xl p-4 text-left">
                <p className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-pink-100 text-pink-500 text-xs font-bold">1</span>
                  Нажмите <Share className="h-5 w-5 text-pink-500" /> (Поделиться)
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-pink-100 text-pink-500 text-xs font-bold">2</span>
                  Нажмите <Plus className="h-5 w-5 text-pink-500" /> (На экран Домой)
                </p>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all"
              >
                <Download className="h-5 w-5 inline mr-2" />
                Установить
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
