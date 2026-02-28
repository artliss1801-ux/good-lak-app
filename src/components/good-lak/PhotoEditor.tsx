'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from 'lucide-react';

interface PhotoEditorProps {
  imageSrc: string;
  onSave: (data: {
    originalImageSrc: string;
    scale: number;
    translateX: number;
    translateY: number;
  }) => void;
  onCancel: () => void;
  // Начальные параметры для повторного редактирования
  initialScale?: number;
  initialTranslateX?: number;
  initialTranslateY?: number;
}

export function PhotoEditor({
  imageSrc,
  onSave,
  onCancel,
  initialScale = 1,
  initialTranslateX = 0,
  initialTranslateY = 0
}: PhotoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Размер контейнера редактора (круг)
  const containerSize = 280;

  // Состояния
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Масштаб: 1 = изображение покрывает круг (cover), > 1 = увеличено, < 1 = уменьшено
  const [scale, setScale] = useState(initialScale);

  // Смещение для панорамирования (в пикселях экрана)
  const [translateX, setTranslateX] = useState(initialTranslateX);
  const [translateY, setTranslateY] = useState(initialTranslateY);

  // Перетаскивание
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tx: 0, ty: 0 });

  // Загрузка изображения
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      // Устанавливаем начальные параметры только если они переданы
      if (initialScale !== 1 || initialTranslateX !== 0 || initialTranslateY !== 0) {
        setScale(initialScale);
        setTranslateX(initialTranslateX);
        setTranslateY(initialTranslateY);
      } else {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
      }
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc, initialScale, initialTranslateX, initialTranslateY]);

  // Масштабирование колесиком мыши
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 4));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Начало перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      tx: translateX,
      ty: translateY
    });
  };

  // Перетаскивание
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setTranslateX(dragStart.tx + dx);
    setTranslateY(dragStart.ty + dy);
  };

  // Конец перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Сенсорные события
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: translateX,
        ty: translateY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;

    setTranslateX(dragStart.tx + dx);
    setTranslateY(dragStart.ty + dy);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Кнопки масштабирования
  const zoomInBtn = () => setScale(prev => Math.min(prev * 1.2, 4));
  const zoomOutBtn = () => setScale(prev => Math.max(prev / 1.2, 0.5));
  const resetView = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Сохранение - передаём параметры без обрезки
  const handleSave = () => {
    onSave({
      originalImageSrc: imageSrc,
      scale,
      translateX,
      translateY
    });
  };

  // Определяем базовый размер изображения
  const aspectRatio = naturalWidth / naturalHeight;

  // Размеры изображения при scale=1 (cover - покрывает весь круг)
  // При cover меньшая сторона = containerSize
  const minDim = Math.min(naturalWidth, naturalHeight);

  // Определяем базовый размер для cover
  // Задаём только ОДИН размер, второй - auto для сохранения пропорций
  let baseWidth: number;
  let baseHeight: 'auto' | number;

  if (aspectRatio >= 1) {
    // Широкое изображение: высота = containerSize (меньшая сторона)
    baseHeight = containerSize;
    baseWidth = containerSize * aspectRatio;
  } else {
    // Высокое изображение: ширина = containerSize (меньшая сторона)
    baseWidth = containerSize;
    baseHeight = containerSize / aspectRatio;
  }

  // CSS для изображения - используем transform для масштабирования
  // Задаём только один размер явно для сохранения пропорций
  const imgStyle: React.CSSProperties = aspectRatio >= 1
    ? {
        // Широкое: задаём высоту, ширина auto
        position: 'absolute',
        height: `${baseHeight}px`,
        width: 'auto',
        left: `${(containerSize - baseWidth) / 2}px`,
        top: '0px',
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        transformOrigin: 'center center',
        userSelect: 'none',
        pointerEvents: 'none'
      }
    : {
        // Высокое: задаём ширину, высота auto
        position: 'absolute',
        width: `${baseWidth}px`,
        height: 'auto',
        left: '0px',
        top: `${(containerSize - (baseHeight as number)) / 2}px`,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        transformOrigin: 'center center',
        userSelect: 'none',
        pointerEvents: 'none'
      };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Редактирование фото</h3>
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            Колёсико мыши — масштаб. Перетаскивание — позиционирование.
          </p>

          {/* Область редактирования */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative rounded-full overflow-hidden bg-gray-800 cursor-move border-4 border-pink-400 shadow-inner"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: `${containerSize}px`,
                height: `${containerSize}px`
              }}
            >
              {imageLoaded && (
                <img
                  src={imageSrc}
                  alt="Edit"
                  draggable={false}
                  style={imgStyle}
                />
              )}

              {/* Сетка-помощник */}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/30 rounded-full" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 pointer-events-none" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 pointer-events-none" />
            </div>
          </div>

          {/* Контролы масштабирования */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOutBtn}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomInBtn}
              disabled={scale >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              title="Сбросить"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-pink-500 hover:bg-pink-600">
              <Check className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Компонент для отображения фото с параметрами редактирования
export function MasterPhotoDisplay({
  imageSrc,
  scale = 1,
  translateX = 0,
  translateY = 0,
  size = 112, // 28 * 4 = 112px (h-28 w-28)
  className = ''
}: {
  imageSrc: string;
  scale?: number;
  translateX?: number;
  translateY?: number;
  size?: number;
  className?: string;
}) {
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  if (!loaded || !naturalWidth || !naturalHeight) {
    return null;
  }

  const aspectRatio = naturalWidth / naturalHeight;

  // Базовый размер для cover (меньшая сторона = size)
  let baseWidth: number;
  let baseHeight: number;

  if (aspectRatio >= 1) {
    // Широкое: высота = size
    baseHeight = size;
    baseWidth = size * aspectRatio;
  } else {
    // Высокое: ширина = size
    baseWidth = size;
    baseHeight = size / aspectRatio;
  }

  // Масштабируем параметры translate под размер отображения
  const sizeRatio = size / 280; // 280 - размер контейнера редактора
  const scaledTranslateX = translateX * sizeRatio;
  const scaledTranslateY = translateY * sizeRatio;

  const imgStyle: React.CSSProperties = aspectRatio >= 1
    ? {
        position: 'absolute',
        height: `${baseHeight}px`,
        width: 'auto',
        left: `${(size - baseWidth) / 2}px`,
        top: '0px',
        transform: `translate(${scaledTranslateX}px, ${scaledTranslateY}px) scale(${scale})`,
        transformOrigin: 'center center'
      }
    : {
        position: 'absolute',
        width: `${baseWidth}px`,
        height: 'auto',
        left: '0px',
        top: `${(size - baseHeight) / 2}px`,
        transform: `translate(${scaledTranslateX}px, ${scaledTranslateY}px) scale(${scale})`,
        transformOrigin: 'center center'
      };

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={imageSrc}
        alt="Master"
        style={imgStyle}
      />
    </div>
  );
}
