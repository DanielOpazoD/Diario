import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-gray-200/60 dark:bg-white/5 rounded ${className}`}>
    <div className="absolute inset-0 animate-shimmer shimmer-bg" />
  </div>
);

export const ViewSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-6 animate-fade-in">
    <div className="flex items-center justify-between mb-2">
      <Skeleton className="h-9 w-64 rounded-xl" />
      <Skeleton className="h-11 w-36 rounded-2xl" />
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-6 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-panel border border-white/20 dark:border-white/5 shadow-premium-sm space-y-4">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg opacity-60" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-pill" />
            <Skeleton className="h-7 w-24 rounded-pill" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl opacity-40" />
        </div>
      ))}
    </div>
  </div>
);

export const ModalSkeleton: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md animate-fade-in" />
    <div className="relative glass md:rounded-panel shadow-premium-xl w-full max-w-2xl flex flex-col overflow-hidden animate-slide-up border-white/40 dark:border-white/10 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-12 w-full rounded-control" />
          <Skeleton className="h-12 w-full rounded-control" />
        </div>
        <Skeleton className="h-40 w-full rounded-control opacity-60" />
        <Skeleton className="h-12 w-full rounded-control" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Skeleton className="h-11 w-28 rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>
    </div>
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-8 animate-fade-in">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-56 rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-11 w-28 rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-panel border border-white/20 dark:border-white/5 shadow-premium-sm space-y-3">
          <Skeleton className="h-5 w-24 rounded-lg opacity-60" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      ))}
    </div>
    <div className="bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-panel border border-white/20 dark:border-white/5 shadow-premium p-6">
      <Skeleton className="h-72 w-full rounded-xl opacity-30" />
    </div>
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-6 max-w-4xl">
    <Skeleton className="h-8 w-32" />
    {[1, 2, 3].map((section) => (
      <div key={section} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const TasksSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const BookmarksSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

export const HistorySkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="flex items-center justify-between flex-wrap gap-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default {
  ViewSkeleton,
  ModalSkeleton,
  StatsSkeleton,
  SettingsSkeleton,
  TasksSkeleton,
  BookmarksSkeleton,
  HistorySkeleton,
};
