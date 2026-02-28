'use client';

import Image from 'next/image';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'full' }) {
  const configs = {
    sm: { width: 80, height: 80, className: '' },
    md: { width: 120, height: 120, className: '' },
    lg: { width: 180, height: 180, className: '' },
    full: { width: 400, height: 150, className: 'w-full h-auto' },
  };

  const config = configs[size];

  return (
    <div className="flex items-center justify-center w-full">
      <Image
        src="/logo.png"
        alt="GOOD Лак - Студия маникюра"
        width={config.width}
        height={config.height}
        className={`drop-shadow-lg ${config.className}`}
        priority
        style={size === 'full' ? { width: '100%', height: 'auto' } : undefined}
      />
    </div>
  );
}
