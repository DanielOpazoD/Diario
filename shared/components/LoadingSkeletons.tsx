import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export const ViewSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export const ModalSkeleton: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <Skeleton className="h-64 w-full" />
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
