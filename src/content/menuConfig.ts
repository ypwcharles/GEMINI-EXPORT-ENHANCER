import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import React from 'react'; // Needed for React.ComponentType

// Define structure for menu item configuration
export interface MenuItemConfig {
  id: keyof typeof S_MENU_ITEM_LABELS; // Use keys for type safety and lookup
  icon: React.ComponentType<React.ComponentProps<'svg'>>; // Type for Heroicon components
  // Action function signature - it will be imported from actions.ts later
  // action: (blockRoot: HTMLElement) => Promise<void>;
}

// Define localized strings for menu items
export const S_MENU_ITEM_LABELS = {
  copyImage: {
    zh: '复制为图片',
    en: 'Copy as Image',
  },
  downloadImage: {
    zh: '下载为图片',
    en: 'Download as Image',
  },
  copyMarkdown: {
    zh: '复制为 Markdown',
    en: 'Copy as Markdown',
  },
  downloadMarkdown: {
    zh: '下载为 Markdown',
    en: 'Download as Markdown',
  },
  selectMultipleMessages: {
    zh: '选择多条信息分享',
    en: 'Select Multiple Messages',
  },
} as const; // Use 'as const' for stricter typing of keys

// Helper function to get the localized label
export function getLocalizedLabel(
  actionKey: keyof typeof S_MENU_ITEM_LABELS,
  pageLang: string
): string {
  const lang = pageLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  // Ensure lookup happens correctly with 'as const'
  const labels = S_MENU_ITEM_LABELS[actionKey];
  return labels[lang] || labels['en']; // Fallback to English
}

// Define the actual menu items configuration
// We separate this from the labels to potentially add more config later
// The 'action' property will be filled in content.tsx by importing from actions.ts
export const MENU_ITEMS_CONFIG: Omit<MenuItemConfig, 'action'>[] = [
  {
    id: 'copyImage',
    icon: PhotoIcon,
  },
  {
    id: 'downloadImage',
    icon: ArrowDownTrayIcon,
  },
  {
    id: 'copyMarkdown',
    icon: ClipboardDocumentIcon,
  },
  {
    id: 'downloadMarkdown',
    icon: ArrowDownTrayIcon,
  },
  {
    id: 'selectMultipleMessages',
    icon: QueueListIcon,
  },
]; 