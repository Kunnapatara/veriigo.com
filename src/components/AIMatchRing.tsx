import React from 'react';

interface AIMatchRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const AIMatchRing: React.FC<AIMatchRingProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const sizePixels = size === 'sm' ? 48 : size === 'md' ? 64 : 88;
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const radius = (sizePixels - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color theme based on score
  let strokeColor = '#1e40af'; // Primary Deep Blue for high match
  let bgBadge = 'bg-blue-50 text-blue-700 border-blue-200';

  if (score >= 85) {
    strokeColor = '#16a34a'; // High match green
    bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (score >= 65) {
    strokeColor = '#2563eb'; // Medium match blue
    bgBadge = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (score >= 50) {
    strokeColor = '#d97706'; // Moderate yellow/amber
    bgBadge = 'bg-amber-50 text-amber-700 border-amber-200';
  } else {
    strokeColor = '#dc2626'; // Gap red
    bgBadge = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: sizePixels, height: sizePixels }}>
        <svg className="transform -rotate-90" width={sizePixels} height={sizePixels}>
          {/* Background Ring */}
          <circle
            cx={sizePixels / 2}
            cy={sizePixels / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx={sizePixels / 2}
            cy={sizePixels / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-bold text-slate-800 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
            {score}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={`mt-1 text-[11px] font-semibold border rounded-full px-2 py-0.5 ${bgBadge}`}>
          {score >= 80 ? 'ตรงสเปกมาก' : score >= 60 ? 'ตรงปานกลาง' : 'ต้องเตรียมเพิ่ม'}
        </span>
      )}
    </div>
  );
};
