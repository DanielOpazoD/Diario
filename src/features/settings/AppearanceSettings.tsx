import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface AppearanceSettingsProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ theme, onToggleTheme }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Apariencia</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                        <Moon className="w-5 h-5 text-purple-400" />
                    ) : (
                        <Sun className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Modo Oscuro</p>
                        <p className="text-xs text-gray-500">Alternar entre tema claro y oscuro</p>
                    </div>
                </div>
                <button
                    onClick={onToggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                    aria-label="Toggle theme"
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );
};

export default AppearanceSettings;
