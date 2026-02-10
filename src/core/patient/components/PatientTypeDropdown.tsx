import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PatientTypeConfig } from '@shared/types';

type PatientTypeDropdownProps = {
  typeId: string;
  patientTypes: PatientTypeConfig[];
  placeholder: string;
  buttonClassName: string;
  menuClassName?: string;
  onSelectType: (typeId: string, typeLabel: string) => void;
};

const PatientTypeDropdown: React.FC<PatientTypeDropdownProps> = ({
  typeId,
  patientTypes,
  placeholder,
  buttonClassName,
  menuClassName,
  onSelectType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedType = useMemo(() => patientTypes.find((type) => type.id === typeId), [patientTypes, typeId]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const direction = spaceBelow < 220 && spaceAbove > spaceBelow ? 'up' : 'down';
    const top = direction === 'up' ? rect.top - 8 - 220 : rect.bottom + 6;
    const menuWidth = Math.max(160, Math.min(220, rect.width));
    const maxLeft = window.innerWidth - menuWidth - 8;
    const left = Math.max(8, Math.min(rect.left, maxLeft));
    setMenuStyle({ top, left, width: menuWidth });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeMenu, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClassName}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedType?.label || placeholder}</span>
        <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed z-[120] max-h-44 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-0.5 animate-fade-in ${menuClassName || ''}`}
          style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
        >
          {patientTypes.map((patientType) => (
            <button
              key={patientType.id}
              type="button"
              onClick={() => {
                onSelectType(patientType.id, patientType.label);
                closeMenu();
              }}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${typeId === patientType.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                }`}
            >
              <span>{patientType.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default PatientTypeDropdown;

