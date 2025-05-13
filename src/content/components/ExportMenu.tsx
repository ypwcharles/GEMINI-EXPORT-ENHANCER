import React, { useState, useRef, useEffect } from 'react';
import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  CheckIcon,
  ClipboardIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ExportMenuProps {
  targetElement: HTMLElement;
  onExportAction: (actionType: string, element: HTMLElement) => void;
}

const ExportMenu: React.FC<ExportMenuProps> = ({
  targetElement,
  onExportAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setCopyStatus('idle'); // Reset status when opening/closing
  };

  const closeMenu = () => {
    setIsOpen(false);
    setCopyStatus('idle');
  };

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = async (actionType: string) => {
    console.log('Action clicked:', actionType, 'Target:', targetElement);
    setCopyStatus('idle'); // Reset status before action

    try {
      await onExportAction(actionType, targetElement); // Assume onExportAction might be async now

      if (actionType.startsWith('copy')) {
        setCopyStatus('success');
        // Keep menu open briefly to show success, then close
        setTimeout(() => {
          closeMenu();
        }, 1500); // Close after 1.5 seconds
      } else {
        // For downloads, close immediately as browser handles feedback
        closeMenu();
        // Optionally trigger a toast notification here for download start
      }
    } catch (error) {
      console.error('Export action failed:', error);
      setCopyStatus('error');
      // Keep menu open briefly to show error, then close
      setTimeout(() => {
        closeMenu();
      }, 2000); // Close after 2 seconds
    }
  };

  const menuItems = [
    {
      label: '复制为 Markdown',
      icon: copyStatus === 'success' && isOpen ? CheckIcon : ClipboardIcon,
      action: 'copyMarkdown',
      disabled: copyStatus === 'success' || copyStatus === 'error',
    },
    {
      label: '下载为 Markdown',
      icon: ArrowDownTrayIcon,
      action: 'downloadMarkdown',
      disabled: copyStatus !== 'idle',
    },
    {
      label: '复制为图片',
      icon: copyStatus === 'success' && isOpen ? CheckIcon : PhotoIcon,
      action: 'copyImage',
      disabled: copyStatus === 'success' || copyStatus === 'error',
    },
    {
      label: '下载为图片',
      icon: ArrowDownTrayIcon,
      action: 'downloadImage',
      disabled: copyStatus !== 'idle',
    },
  ];

  // Simple icon button for triggering the menu
  const TriggerButton = () => (
    <button
      onClick={toggleMenu}
      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-150"
      aria-label="Export options"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>

    </button>
  );

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <TriggerButton />

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50" // Added z-index
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {menuItems.map((item) => (
              <button
                key={item.action}
                onClick={() => handleActionClick(item.action)}
                disabled={item.disabled}
                className={`text-gray-700 dark:text-gray-200 block w-full text-left px-4 py-2 text-sm ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                } flex items-center transition-colors duration-150`}
                role="menuitem"
              >
                <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
                {copyStatus === 'error' && item.action.startsWith('copy') && (
                  <XMarkIcon className="ml-auto h-5 w-5 text-red-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu; 