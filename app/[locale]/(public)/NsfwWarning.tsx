'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';

interface NsfwWarningProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function NsfwWarning({ onConfirm, onCancel }: NsfwWarningProps) {
  const t = useTranslations('nsfw');
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли сохраненный выбор
    const savedChoice = localStorage.getItem('nsfw-confirmed');
    if (savedChoice === 'true') {
      onConfirm();
    }
  }, [onConfirm]);

  const handleConfirm = () => {
    if (rememberChoice) {
      localStorage.setItem('nsfw-confirmed', 'true');
    }
    onConfirm();
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 w-full max-w-md mx-4">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('warning')}
              </Dialog.Title>
            </div>
            
            <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-6">
              Этот контент предназначен только для взрослых. Вам должно быть не менее 18 лет для просмотра.
            </Dialog.Description>

            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberChoice}
                  onChange={(e) => setRememberChoice(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('remember')}
                </span>
              </label>

              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('confirm')}
                  </button>
                </Dialog.Close>
                
                <Dialog.Close asChild>
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
