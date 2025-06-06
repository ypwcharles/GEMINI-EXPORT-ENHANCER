// src/content/localization.ts

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
  cancelSelection: {
    zh: '取消多选',
    en: 'Cancel Selection',
  },
};

// Helper function to get the localized label
export function getLocalizedLabel(actionKey: keyof typeof S_MENU_ITEM_LABELS, pageLang: string): string {
  const lang = pageLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  return S_MENU_ITEM_LABELS[actionKey][lang] || S_MENU_ITEM_LABELS[actionKey]['en']; 
} 