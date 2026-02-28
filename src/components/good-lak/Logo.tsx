'use client';

import Image from 'next/image';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'full' }) {
  const configs = {
    sm: { width: 128, height: 40, className: '' },
    md: { width: 200, height: 63, className: '' },
    lg: { width: 300, height: 94, className: '' },
    full: { width: 400, height: 125, className: 'w-full h-auto' },
  };

  const config = configs[size];

  return (
    <div className="flex items-center justify-center w-full">
      <Image
        src="/logo.png"
        alt="GOOD Лак - Студия маникюра"
        width={config.width}
        height={config.height}
        className={`drop-shadow-lg object-contain ${config.className}`}
        priority
        style={size === 'full' ? { width: '100%', height: 'auto' } : { height: 'auto' }}
      />
    </div>
  );
}
