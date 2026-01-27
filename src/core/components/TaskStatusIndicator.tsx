import React from 'react';
import { CheckCircle2, ClipboardList, ClipboardX } from 'lucide-react';

interface TaskStatusIndicatorProps {
  pendingCount: number;
  completedCount: number;
  className?: string;
  iconClassName?: string;
}

const TaskStatusIndicator: React.FC<TaskStatusIndicatorProps> = ({
  pendingCount,
  completedCount,
  className = '',
  iconClassName = 'w-4 h-4',
}) => {
  const total = pendingCount + completedCount;
  const badgeBase = 'absolute flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[8px] font-black leading-none';
  const wrapperClass = `relative inline-flex items-center justify-center ${className}`;

  if (total === 0) {
    return (
      <span className={wrapperClass}>
        <ClipboardX className={`${iconClassName} text-gray-400`} />
      </span>
    );
  }

  if (pendingCount > 0 && completedCount > 0) {
    return (
      <span className={wrapperClass}>
        <ClipboardList className={`${iconClassName} text-amber-500`} />
        <span className={`${badgeBase} -left-1 -top-1 bg-amber-500 text-white`}>
          {pendingCount}
        </span>
        <span className={`${badgeBase} -right-1 -top-1 bg-emerald-500 text-white`}>
          {completedCount}
        </span>
      </span>
    );
  }

  if (pendingCount > 0) {
    return (
      <span className={wrapperClass}>
        <ClipboardList className={`${iconClassName} text-amber-500`} />
        <span className={`${badgeBase} -right-1 -top-1 bg-amber-500 text-white`}>
          {pendingCount}
        </span>
      </span>
    );
  }

  return (
    <span className={wrapperClass}>
      <CheckCircle2 className={`${iconClassName} text-emerald-500`} />
      <span className={`${badgeBase} -right-1 -top-1 bg-emerald-500 text-white`}>
        {completedCount}
      </span>
    </span>
  );
};

export default TaskStatusIndicator;
