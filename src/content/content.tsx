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

// Import from the new observer file
import { initializeDeepResearchObserver, setAddCustomMenuItemsUtility } from './deepResearchObserver';

console.log("Gemini Export Enhancer: Script start. Mode: Inject into Share Menu & Deep Research Toolbar.");

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

// Helper function to get the localized label - EXPORT this function
export function getLocalizedLabel(actionKey: keyof typeof S_MENU_ITEM_LABELS, pageLang: string): string {
  const lang = pageLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  return S_MENU_ITEM_LABELS[actionKey][lang] || S_MENU_ITEM_LABELS[actionKey]['en']; 
}

// --- Global State for associating click with share menu ---
let lastClickedAnswerBlockRoot: HTMLElement | null = null;
// ---

// MODIFIED and EXPORTED addCustomMenuItems function
export function addCustomMenuItems(
  menuPanel: HTMLElement, 
  answerBlockRoot: HTMLElement,
  contentSelectorForActions?: string, // New parameter for specific content selector
  closeMenuCallback?: () => void // New parameter for custom close callback
) {
  if (menuPanel.querySelector('.gemini-enhancer-custom-item')) {
    console.log("Gemini Export Enhancer: Custom items already exist in this menu panel. Skipping injection.");
    return;
  }
  console.log("Gemini Export Enhancer: Adding custom menu items to panel:", menuPanel, "associated with block:", answerBlockRoot, "selector override:", contentSelectorForActions);

  const pageLang = document.documentElement.lang || 'en';
  const actionHandlers = {
    copyImage: handleCopyImage,
    downloadImage: handleDownloadImage,
    copyMarkdown: handleCopyMarkdown,
    downloadMarkdown: handleDownloadMarkdown,
  };
  const originalFirstChild = menuPanel.firstChild;

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

    const nativeMenuButton = menuPanel.querySelector('button[mat-menu-item]');
    // Determine text and icon colors based on theme
    const isDarkMode = document.documentElement.getAttribute('dark') === 'true' ||
                       document.documentElement.classList.contains('dark') ||
                       (window.getComputedStyle(document.body).backgroundColor &&
                        parseInt(window.getComputedStyle(document.body).backgroundColor.split('(')[1]) < 128);

    let itemTextColor: string;
    let itemIconColor: string;

    if (isDarkMode) {
      itemTextColor = 'rgb(232, 234, 237)'; // Light gray for dark mode text
      itemIconColor = 'rgb(232, 234, 237)'; // Light gray for dark mode icons
    } else {
      itemTextColor = nativeMenuButton ? getComputedStyle(nativeMenuButton).color : 'rgb(32, 33, 36)';
      itemIconColor = 'rgb(32, 33, 36)'; // Dark gray for light mode icons
    }
    button.style.color = itemTextColor;

    // Hover effect with Dark Mode detection
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
    // Use the dynamically determined itemIconColor
    iconRoot.render(React.createElement(itemConfig.icon, { style: { width: '20px', height: '20px', color: itemIconColor } }));
    button.appendChild(iconContainer);

    // Create and append Text (with specific fontWeight and localized label)
    const textSpan = document.createElement('span');
    textSpan.textContent = getLocalizedLabel(itemConfig.id, pageLang);
    const nativeMenuItemText = menuPanel.querySelector('button[mat-menu-item] span.mat-mdc-menu-item-text');
    if (nativeMenuItemText) {
      textSpan.style.fontWeight = getComputedStyle(nativeMenuItemText as HTMLElement).fontWeight;
    } else {
      textSpan.style.fontWeight = '500';
    }
    button.appendChild(textSpan);

    const actionToPerform = actionHandlers[itemConfig.id];
    button.onclick = async (e) => {
      console.log(`Gemini Export Enhancer: Custom button '${textSpan.textContent}' CLICKED. Selector for action: ${contentSelectorForActions}`);
      e.stopPropagation();
      e.preventDefault();
      
      const currentAnswerBlockRoot = answerBlockRoot;
      if (!currentAnswerBlockRoot) {
           console.error("Gemini Export Enhancer: Cannot perform action, associated answer block is missing.");
           toast.error('操作失败', { description: '无法关联到对应的回答块。' });
           return;
      }
      try {
        // Pass the contentSelectorForActions to the action handler
        await actionToPerform(currentAnswerBlockRoot, contentSelectorForActions);
      } catch (error) {
        console.error(`Gemini Export Enhancer: Error executing ${itemConfig.id}:`, error);
        toast.error('操作失败', { description: '执行操作时发生未知错误。' });
      }
      
      // Use closeMenuCallback if provided, otherwise use default logic for native share menu
      if (closeMenuCallback) {
        setTimeout(closeMenuCallback, 100);
      } else {
        setTimeout(() => {
            const nativeMenuPanelToClose = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel) as HTMLElement;
            // Ensure we are closing the *correct* native menu if multiple could exist, though usually only one is open.
            if (nativeMenuPanelToClose && nativeMenuPanelToClose === menuPanel && nativeMenuPanelToClose.offsetParent !== null) {
                try {
                    const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop');
                    if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) { cdkBackdrop.click(); return; }
                    document.body.click(); // Fallback to close generic popups
                } catch (closeError) { console.error("Error attempting to close native menu panel:", closeError); }
            }
         }, 100);
      }
    };

    menuPanel.prepend(button);
  });

  // Add Divider after all custom items
  const customItems = menuPanel.querySelectorAll('.gemini-enhancer-custom-item');
  const lastPrependedItem = customItems[customItems.length - 1];
  if (lastPrependedItem && lastPrependedItem.nextSibling) {
      if (!(lastPrependedItem.nextSibling instanceof HTMLElement && lastPrependedItem.nextSibling.tagName.toLowerCase() === 'mat-divider')) {
            const newDivider = document.createElement('mat-divider');
            newDivider.setAttribute('role', 'separator');
            newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)';
            newDivider.style.margin = '8px 0';
            menuPanel.insertBefore(newDivider, lastPrependedItem.nextSibling);
      }
  } else if (lastPrependedItem && !lastPrependedItem.nextSibling && originalFirstChild) {
       const newDivider = document.createElement('mat-divider');
        newDivider.setAttribute('role', 'separator');
        newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)';
        newDivider.style.margin = '8px 0';
        menuPanel.appendChild(newDivider);
  }
}

// Provide the modified addCustomMenuItems to the observer module
setAddCustomMenuItemsUtility(addCustomMenuItems);

// --- Global Click Listener for regular share menu (remains largely the same) ---
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (target.closest('.gemini-enhancer-custom-item') || target.closest('.gemini-enhancer-deep-research-export-trigger') || target.closest('.gemini-enhancer-custom-menu-panel')) {
    // If click is within any of our custom UI, let their handlers manage it.
    return;
  }

  const shareButton = target.closest<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
  
  document.querySelectorAll<HTMLButtonElement>(`${GEMINI_SELECTORS.answerContainer} ${GEMINI_SELECTORS.injectionPointInAnswer}`).forEach(btn => {
    if (btn !== shareButton) { 
        btn.removeAttribute('data-gemini-enhancer-triggered-menu');
    }
  });

  if (shareButton) {
    const answerBlock = shareButton.closest<HTMLElement>(GEMINI_SELECTORS.answerContainer);
    if (answerBlock) {
      console.log("Gemini Export Enhancer: Share button clicked for regular answer, associated block:", answerBlock);
      shareButton.setAttribute('data-gemini-enhancer-triggered-menu', 'true'); 
      lastClickedAnswerBlockRoot = answerBlock; 
    } else {
        console.warn("Gemini Export Enhancer: Share button clicked, but couldn't find parent answer block.");
        lastClickedAnswerBlockRoot = null; 
        shareButton.removeAttribute('data-gemini-enhancer-triggered-menu');
    }
  } 
}, true); 
console.log("Gemini Export Enhancer: Global click listener for regular share menu added.");
// ---

// --- Main Mutation Observer for regular share menu (remains largely the same) ---
const mainShareMenuObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          let menuPanelToProcess: HTMLElement | null = null;

          if (element.matches && typeof element.matches === 'function' && element.matches(GEMINI_SELECTORS.shareMenu.menuPanel)) {
            menuPanelToProcess = element;
          }
          else if (element.querySelector) {
             const foundPanel = element.querySelector<HTMLElement>(GEMINI_SELECTORS.shareMenu.menuPanel);
             if (foundPanel) {
                menuPanelToProcess = foundPanel;
             }
          }

          if (menuPanelToProcess && lastClickedAnswerBlockRoot) {
            // Check if this menuPanel is not part of our custom deep research menu
            if (menuPanelToProcess.closest('.gemini-enhancer-custom-menu-panel')) {
                return; // This is our own custom menu, not a native one to inject into.
            }

            const expectedTriggerButton = lastClickedAnswerBlockRoot.querySelector<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
            
            if (expectedTriggerButton && expectedTriggerButton.getAttribute('data-gemini-enhancer-triggered-menu') === 'true') {
              console.log("Gemini Export Enhancer: Valid trigger for native share menu panel confirmed.");
              // Call addCustomMenuItems WITHOUT contentSelectorForActions and WITHOUT closeMenuCallback for native share menu
              addCustomMenuItems(menuPanelToProcess, lastClickedAnswerBlockRoot);
              expectedTriggerButton.removeAttribute('data-gemini-enhancer-triggered-menu'); 
            } 
          } 
        }
      });
    }
  }
});

if (document.body) {
    mainShareMenuObserver.observe(document.body, { childList: true, subtree: true });
    console.log("Gemini Export Enhancer: Main MutationObserver for native share menu is now active.");
} else {
    document.addEventListener('DOMContentLoaded', () => {
        mainShareMenuObserver.observe(document.body, { childList: true, subtree: true });
        console.log("Gemini Export Enhancer: Main MutationObserver for native share menu is now active (DOMContentLoaded).");
    });
}

// Initialize the Deep Research Observer
initializeDeepResearchObserver();

// 后续步骤：
// 1. 使用 MutationObserver 监听目标元素（如回答容器）的出现
// 2. 将 ExportMenu 注入到每个目标元素旁边，而不是body
// 3. 从 ExportMenu 传递回调以处理导出操作 