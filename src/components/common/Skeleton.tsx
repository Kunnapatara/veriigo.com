import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius = '12px',
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-800/60 border border-slate-700/40 ${className}`}
      style={{
        width: width,
        height: height,
        borderRadius: borderRadius,
      }}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer" />
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <Skeleton height="24px" width="40%" />
        <Skeleton height="36px" width="60%" />
        <Skeleton height="16px" width="80%" />
        <div className="flex gap-3 pt-2">
          <Skeleton height="32px" width="120px" borderRadius="9999px" />
          <Skeleton height="32px" width="160px" borderRadius="9999px" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton height="16px" width="50%" />
              <Skeleton height="36px" width="36px" borderRadius="50%" />
            </div>
            <Skeleton height="32px" width="70%" />
            <Skeleton height="12px" width="90%" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <Skeleton height="20px" width="40%" />
          <Skeleton height="240px" width="100%" borderRadius="16px" />
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <Skeleton height="20px" width="40%" />
          <Skeleton height="240px" width="100%" borderRadius="16px" />
        </div>
      </div>
    </div>
  );
};
