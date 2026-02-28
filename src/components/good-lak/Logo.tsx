'use client';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'full' }) {
  const configs = {
    sm: { width: 80, height: 32 },
    md: { width: 120, height: 48 },
    lg: { width: 180, height: 72 },
    full: { width: 400, height: 150 },
  };

  const config = configs[size];

  return (
    <div className="flex items-center justify-center w-full">
      <svg 
        viewBox="0 0 400 150" 
        width={config.width}
        height={config.height}
        className="drop-shadow-lg"
        style={size === 'full' ? { width: '100%', height: 'auto' } : undefined}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ec4899' }} />
            <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
          </linearGradient>
        </defs>
        <rect width="400" height="150" fill="white" rx="12"/>
        <text 
          x="200" 
          y="75" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontFamily="Arial, sans-serif" 
          fontSize="48" 
          fontWeight="bold" 
          fill="url(#logoGrad)"
        >
          GOOD Лак
        </text>
        <text 
          x="200" 
          y="115" 
          textAnchor="middle" 
          fontFamily="Arial, sans-serif" 
          fontSize="18" 
          fill="#666"
        >
          Студия маникюра
        </text>
      </svg>
    </div>
  );
}
