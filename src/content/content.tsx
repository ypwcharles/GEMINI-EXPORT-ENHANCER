import React from 'react'; // Import React
import ReactDOM from 'react-dom/client'; // Import ReactDOM
// import Toast from '../ui_components/Toast'; // No longer needed
import { Toaster } from '@/components/ui/sonner'; // Import shadcn/ui Toaster (Sonner wrapper)
import { toast } from 'sonner'; // Import toast function from Sonner
import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  // CheckIcon, // Not directly used in itemsToInject anymore for initial icon
  // ClipboardIcon, // Not directly used
  // XMarkIcon, // Used for error states, not initial menu item
} from '@heroicons/react/24/outline'; // Ensure all needed icons are imported
import { GEMINI_SELECTORS } from './selectors';
// Remove direct core imports if actions.ts now handles them
// import { htmlToMarkdown } from '../core/markdownConverter';
// import { generateImageBlob } from '../core/imageGenerator';

import {
  MENU_ITEMS_CONFIG,
  // S_MENU_ITEM_LABELS, // Not directly needed if getLocalizedLabel is used
} from './menuConfig';

import {
  handleCopyMarkdown,
  handleDownloadMarkdown,
  handleCopyImage,
  handleDownloadImage,
  // triggerDownload // Not directly needed if actions handle it
} from './actions';

console.log("Gemini Export Enhancer: Script start. Mode: Inject into Share Menu.");

// Create a container for the Toaster and render it once.
let toasterContainer: HTMLElement | null = null;
if (!document.getElementById('gemini-enhancer-toaster-container')) {
  toasterContainer = document.createElement('div');
  toasterContainer.id = 'gemini-enhancer-toaster-container';
  // Minimal styling for the container, Toaster itself will handle its positioning and appearance.
  // It needs to be in the DOM for the Toaster to portal into.
  toasterContainer.style.zIndex = '2147483647'; // Ensure it's on top
  document.body.appendChild(toasterContainer);
  const toasterRoot = ReactDOM.createRoot(toasterContainer);
  toasterRoot.render(
    <React.StrictMode>
      <Toaster richColors position="bottom-right" />
    </React.StrictMode>
  );
  console.log('Sonner Toaster rendered into #gemini-enhancer-toaster-container');
}

// Global variables for Toast rendering are no longer needed
// let toastRoot: ReactDOM.Root | null = null;
// let toastContainer: HTMLDivElement | null = null;

// Old showToast function is replaced by direct calls to sonner's toast()
// const showToast = (message: string, type: 'success' | 'error' | 'info') => { ... };

// Helper function to trigger download
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename;

  document.body.appendChild(downloadLink);
  try {
    downloadLink.click();
    console.log(`Download triggered for ${filename}`);
  } catch (e) {
    console.error('Error triggering download click:', e);
    // Fallback or inform user
    alert('自动下载失败，请检查浏览器设置或手动操作。');
  }
  document.body.removeChild(downloadLink);

  // Revoke the object URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Define localized strings for menu items
const S_MENU_ITEM_LABELS = {
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
};

// Helper function to get the localized label
function getLocalizedLabel(actionKey: keyof typeof S_MENU_ITEM_LABELS, pageLang: string): string {
  const lang = pageLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  return S_MENU_ITEM_LABELS[actionKey][lang] || S_MENU_ITEM_LABELS[actionKey]['en']; // Fallback to English
}

function addCustomMenuItems(shareMenuPanel: HTMLElement, answerBlockRoot: HTMLElement) {
  if (shareMenuPanel.querySelector('.gemini-enhancer-custom-item')) {
    return;
  }
  console.log("Gemini Export Enhancer: Share menu panel found, associating with answer block:", answerBlockRoot);

  const pageLang = document.documentElement.lang || 'en'; // Default to 'en' if lang attribute is missing

  // Map action IDs to their handler functions
  const actionHandlers = {
    copyImage: handleCopyImage,
    downloadImage: handleDownloadImage,
    copyMarkdown: handleCopyMarkdown,
    downloadMarkdown: handleDownloadMarkdown,
  };

  const originalFirstChild = shareMenuPanel.firstChild;

  MENU_ITEMS_CONFIG.forEach(itemConfig => {
    const button = document.createElement('button');
    button.setAttribute('role', 'menuitem');
    button.classList.add('gemini-enhancer-custom-item');

    // Styling (display, align, width, padding, height, textAlign, border, background, cursor, fontSize, fontFamily)
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.width = '100%';
    button.style.padding = '0px 16px';
    button.style.height = '48px';
    button.style.textAlign = 'left';
    button.style.border = 'none';
    button.style.background = 'none';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontFamily = 'inherit';

    const nativeMenuButton = shareMenuPanel.querySelector('button[mat-menu-item]');
    button.style.color = nativeMenuButton ? getComputedStyle(nativeMenuButton).color : 'rgb(32, 33, 36)';

    // Hover effect with Dark Mode detection
    const isDarkMode = document.documentElement.getAttribute('dark') === 'true' ||
                       document.documentElement.classList.contains('dark') ||
                       (window.getComputedStyle(document.body).backgroundColor &&
                        parseInt(window.getComputedStyle(document.body).backgroundColor.split('(')[1]) < 128);
    const lightModeHoverBg = 'rgba(0, 0, 0, 0.04)';
    const darkModeHoverBg = 'rgba(255, 255, 255, 0.1)';
    button.onmouseenter = () => {
        button.style.backgroundColor = isDarkMode ? darkModeHoverBg : lightModeHoverBg;
    };
    button.onmouseleave = () => {
        button.style.backgroundColor = 'transparent';
    };

    // Create and append Icon
    const iconContainer = document.createElement('span');
    iconContainer.style.marginRight = '16px';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    const iconRoot = ReactDOM.createRoot(iconContainer);
    iconRoot.render(React.createElement(itemConfig.icon, { style: { width: '20px', height: '20px' } }));
    button.appendChild(iconContainer);

    // Create and append Text (with specific fontWeight and localized label)
    const textSpan = document.createElement('span');
    textSpan.textContent = getLocalizedLabel(itemConfig.id, pageLang);
    const nativeMenuItemText = shareMenuPanel.querySelector('button[mat-menu-item] span.mat-mdc-menu-item-text');
    if (nativeMenuItemText) {
      textSpan.style.fontWeight = getComputedStyle(nativeMenuItemText as HTMLElement).fontWeight;
    } else {
      textSpan.style.fontWeight = '500';
    }
    button.appendChild(textSpan);

    // Onclick Handler
    const actionToPerform = actionHandlers[itemConfig.id];
    button.onclick = async (e) => {
      console.log(`Gemini Export Enhancer: Custom button '${textSpan.textContent}' CLICKED.`);
      e.stopPropagation();
      e.preventDefault();
      try {
        await actionToPerform(answerBlockRoot);
      } catch (error) {
        console.error(`Gemini Export Enhancer: Error executing ${itemConfig.id}:`, error);
        // Generic error toast, specific toasts should be in action handlers
        toast.error('操作失败', { description: '执行操作时发生未知错误。' });
      }
      // Attempt to close menu
      setTimeout(() => {
          const menuPanelToClose = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel) as HTMLElement;
          if (menuPanelToClose && menuPanelToClose.offsetParent !== null) {
              try {
                  const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop');
                  if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) {
                      cdkBackdrop.click(); return;
                  }
                  document.body.click();
              } catch (closeError) {
                  console.error("Error attempting to close menu panel:", closeError);
              }
          }
      }, 100);
    };

    shareMenuPanel.prepend(button);
    console.log(`Gemini Export Enhancer: Prepended '${textSpan.textContent}'`);
  });

  // Add Divider after all custom items
  const customItems = shareMenuPanel.querySelectorAll('.gemini-enhancer-custom-item');
  const lastPrependedItem = customItems[customItems.length - 1];
  if (lastPrependedItem && lastPrependedItem.nextSibling) {
      if (!(lastPrependedItem.nextSibling instanceof HTMLElement && lastPrependedItem.nextSibling.tagName.toLowerCase() === 'mat-divider')) {
            const newDivider = document.createElement('mat-divider');
            newDivider.setAttribute('role', 'separator');
            newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)';
            newDivider.style.margin = '8px 0';
            shareMenuPanel.insertBefore(newDivider, lastPrependedItem.nextSibling);
      }
  } else if (lastPrependedItem && !lastPrependedItem.nextSibling && originalFirstChild) {
       const newDivider = document.createElement('mat-divider');
        newDivider.setAttribute('role', 'separator');
        newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)';
        newDivider.style.margin = '8px 0';
        shareMenuPanel.appendChild(newDivider);
  }
}

function handleShareButtonClick(this: HTMLButtonElement, event: MouseEvent, answerBlockRoot: HTMLElement) {
  console.log("Gemini Export Enhancer: Original Share & Export button clicked:", this, "for answer block:", answerBlockRoot);
  const M_OBSERVER_CONFIG = { childList: true, subtree: true };
  let menuFound = false;
  const menuObserver = new MutationObserver((mutationsList, observer) => {
    const menuPanel = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel);
    if (menuPanel) {
      menuFound = true;
      addCustomMenuItems(menuPanel as HTMLElement, answerBlockRoot);
      observer.disconnect();
    }
  });
  menuObserver.observe(document.body, M_OBSERVER_CONFIG);
  setTimeout(() => {
    if (!menuFound) {
      console.log("Gemini Export Enhancer: Menu observer timed out. Menu panel NOT found for selector:", GEMINI_SELECTORS.shareMenu.menuPanel);
    }
    menuObserver.disconnect();
  }, 3000);
}

function processAnswerElement(answerBlockRootElement: HTMLElement) { 
  console.log("Gemini Export Enhancer: Processing model-response element:", answerBlockRootElement);
  const INTERNAL_OBSERVER_CONFIG = { childList: true, subtree: true };
  let buttonFound = false;
  const internalObserver = new MutationObserver((mutationsList, observer) => {
    const shareButton = answerBlockRootElement.querySelector<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
    if (shareButton) {
      buttonFound = true;
      if (!(shareButton as any).__hasGeminiEnhancerListener) {
        shareButton.addEventListener('click', (event) => handleShareButtonClick.call(shareButton, event, answerBlockRootElement));
        (shareButton as any).__hasGeminiEnhancerListener = true;
      }
      observer.disconnect();
    }
  });
  internalObserver.observe(answerBlockRootElement, INTERNAL_OBSERVER_CONFIG);
  const initialShareButton = answerBlockRootElement.querySelector<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
  if (initialShareButton) {
      buttonFound = true;
       if (!(initialShareButton as any).__hasGeminiEnhancerListener) {
        initialShareButton.addEventListener('click', (event) => handleShareButtonClick.call(initialShareButton, event, answerBlockRootElement));
        (initialShareButton as any).__hasGeminiEnhancerListener = true;
      }
      internalObserver.disconnect();
  } else {
       console.log("Gemini Export Enhancer: Share button not found initially, internal observer is active.");
  }
  setTimeout(() => {
    if (!buttonFound) {
        console.log("Gemini Export Enhancer: Internal observer timed out. Share button never found within:", answerBlockRootElement);
    }
    internalObserver.disconnect();
  }, 5000); 
}

const mainObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.matches && typeof element.matches === 'function' && element.matches(GEMINI_SELECTORS.answerContainer)) {
            processAnswerElement(element);
          } else {
            const childAnswers = element.querySelectorAll<HTMLElement>(GEMINI_SELECTORS.answerContainer);
            if (childAnswers.length > 0) {
              childAnswers.forEach(processAnswerElement);
            }
          }
        }
      });
    }
  }
});

if (document.body) {
    mainObserver.observe(document.body, { childList: true, subtree: true });
    console.log("Gemini Export Enhancer: Main MutationObserver is now active on document.body.");
} else {
    // Fallback for very early injection, though less likely for body
    document.addEventListener('DOMContentLoaded', () => {
        mainObserver.observe(document.body, { childList: true, subtree: true });
        console.log("Gemini Export Enhancer: Main MutationObserver is now active on document.body (DOMContentLoaded).");
    });
}

// 后续步骤：
// 1. 使用 MutationObserver 监听目标元素（如回答容器）的出现
// 2. 将 ExportMenu 注入到每个目标元素旁边，而不是body
// 3. 从 ExportMenu 传递回调以处理导出操作 