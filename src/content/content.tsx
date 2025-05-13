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

console.log("Gemini Export Enhancer: Script start. Mode: Inject into Share Menu via panel detection.");

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

// --- Global State for associating click with menu ---
let lastClickedAnswerBlockRoot: HTMLElement | null = null;
// ---

function addCustomMenuItems(shareMenuPanel: HTMLElement, answerBlockRoot: HTMLElement) {
  // Idempotency check: If custom items already exist, do nothing.
  if (shareMenuPanel.querySelector('.gemini-enhancer-custom-item')) {
    console.log("Gemini Export Enhancer: Custom items already exist in this menu panel. Skipping injection.");
    return;
  }
  console.log("Gemini Export Enhancer: Adding custom menu items to panel, associated with answer block:", answerBlockRoot);

  const pageLang = document.documentElement.lang || 'en';
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
      // Store answerBlockRoot locally in case it changes globally before async op finishes
      const currentAnswerBlockRoot = answerBlockRoot;
      if (!currentAnswerBlockRoot) {
           console.error("Gemini Export Enhancer: Cannot perform action, associated answer block is missing.");
           toast.error('操作失败', { description: '无法关联到对应的回答块。' });
           return;
      }
      try {
        await actionToPerform(currentAnswerBlockRoot);
      } catch (error) {
        console.error(`Gemini Export Enhancer: Error executing ${itemConfig.id}:`, error);
        toast.error('操作失败', { description: '执行操作时发生未知错误。' });
      }
      // Attempt to close menu
      setTimeout(() => {
          const menuPanelToClose = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel) as HTMLElement;
          if (menuPanelToClose && menuPanelToClose.offsetParent !== null) {
              try {
                  const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop');
                  if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) { cdkBackdrop.click(); return; }
                  document.body.click();
              } catch (closeError) { console.error("Error attempting to close menu panel:", closeError); }
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

// --- Global Click Listener to identify target answer block ---
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  // Check if the click originated from within our custom menu items - if so, ignore.
  if (target.closest('.gemini-enhancer-custom-item')) {
    return;
  }

  // Check if the clicked element *is* or *is inside* the original share button
  const shareButton = target.closest<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
  
  // First, clean up any lingering flags from other buttons
  document.querySelectorAll<HTMLButtonElement>(`${GEMINI_SELECTORS.answerContainer} ${GEMINI_SELECTORS.injectionPointInAnswer}`).forEach(btn => {
    if (btn !== shareButton) { // Don't remove from the currently clicked one if it's the one
        btn.removeAttribute('data-gemini-enhancer-triggered-menu');
    }
  });

  if (shareButton) {
    // Find the corresponding answer block root
    const answerBlock = shareButton.closest<HTMLElement>(GEMINI_SELECTORS.answerContainer);
    if (answerBlock) {
      console.log("Gemini Export Enhancer: Share button clicked, associated answer block:", answerBlock);
      shareButton.setAttribute('data-gemini-enhancer-triggered-menu', 'true'); // Mark this button
      lastClickedAnswerBlockRoot = answerBlock; // Store the reference
    } else {
        console.warn("Gemini Export Enhancer: Share button clicked, but couldn't find parent answer block.");
        lastClickedAnswerBlockRoot = null; // Reset if association failed
        // Ensure the flag is removed if we couldn't find an answer block for this share button
        shareButton.removeAttribute('data-gemini-enhancer-triggered-menu');
    }
  } else {
    // If the click was not on a share button, we don't necessarily clear the lastClickedAnswerBlockRoot
    // or flags immediately, as a menu might be appearing for a previously clicked valid share button.
    // The MutationObserver logic will handle validating the flag.
  }
}, true); // Use capture phase to catch the click early
console.log("Gemini Export Enhancer: Global click listener added.");
// ---

// --- Main Mutation Observer ---
const mainObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          let menuPanelToProcess: HTMLElement | null = null;

          // Check if the added node *is* the menu panel
          if (element.matches && typeof element.matches === 'function' && element.matches(GEMINI_SELECTORS.shareMenu.menuPanel)) {
            menuPanelToProcess = element;
            console.log("Gemini Export Enhancer: Share menu panel added directly:", element);
          }
          // Check if the added node *contains* the menu panel
          else if (element.querySelector) {
             const foundPanel = element.querySelector<HTMLElement>(GEMINI_SELECTORS.shareMenu.menuPanel);
             if (foundPanel) {
                menuPanelToProcess = foundPanel;
                console.log("Gemini Export Enhancer: Share menu panel added within node:", menuPanelToProcess);
             }
          }

          if (menuPanelToProcess && lastClickedAnswerBlockRoot) {
            const expectedTriggerButton = lastClickedAnswerBlockRoot.querySelector<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
            
            if (expectedTriggerButton && expectedTriggerButton.getAttribute('data-gemini-enhancer-triggered-menu') === 'true') {
              console.log("Gemini Export Enhancer: Valid trigger for menu panel confirmed.");
              addCustomMenuItems(menuPanelToProcess, lastClickedAnswerBlockRoot);
              expectedTriggerButton.removeAttribute('data-gemini-enhancer-triggered-menu'); // Clean up the flag
              // lastClickedAnswerBlockRoot = null; // Optionally reset to be stricter, uncomment if needed
            } else {
              console.warn("Gemini Export Enhancer: Share menu panel appeared, but the trigger button was not the one marked or no answer block associated.");
              // If the menu appeared but wasn't triggered by our marked button,
              // we should clear any lingering mark on a button that didn't open this menu.
              // This case is tricky; the click listener already tries to manage flags.
              // For now, primarily rely on the positive confirmation.
            }
          } else if (menuPanelToProcess) {
            // Menu panel appeared, but no lastClickedAnswerBlockRoot, or it was cleared.
            // This is expected if a menu is opened not by our target share buttons.
            console.log("Gemini Export Enhancer: Share menu panel appeared, but no recently clicked and marked answer block was recorded or it was already processed.");
          }

          // Optional: Keep logic to process added answer blocks if needed elsewhere,
          // but remove the old injection logic from here.
          // if (element.matches && typeof element.matches === 'function' && element.matches(GEMINI_SELECTORS.answerContainer)) {
          //   console.log("Gemini Export Enhancer: Detected new answer block:", element);
          //   // Potentially do something else with the new answer block here if needed
          // } else {
          //   const childAnswers = element.querySelectorAll<HTMLElement>(GEMINI_SELECTORS.answerContainer);
          //   if (childAnswers.length > 0) {
          //     childAnswers.forEach(answer => console.log("Gemini Export Enhancer: Detected new answer block (within node):", answer));
          //     // Potentially do something else
          //   }
          // }
        }
      });
    }
  }
});

// Observe document.body (same as before)
if (document.body) {
    mainObserver.observe(document.body, { childList: true, subtree: true });
    console.log("Gemini Export Enhancer: Main MutationObserver is now active on document.body (watching for menu panel).");
} else {
    document.addEventListener('DOMContentLoaded', () => {
        mainObserver.observe(document.body, { childList: true, subtree: true });
        console.log("Gemini Export Enhancer: Main MutationObserver is now active on document.body (DOMContentLoaded, watching for menu panel).");
    });
}

// Removed processAnswerElement function
// Removed handleShareButtonClick function

// 后续步骤：
// 1. 使用 MutationObserver 监听目标元素（如回答容器）的出现
// 2. 将 ExportMenu 注入到每个目标元素旁边，而不是body
// 3. 从 ExportMenu 传递回调以处理导出操作 