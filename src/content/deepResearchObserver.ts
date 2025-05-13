import React from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from 'sonner';
import { GEMINI_SELECTORS } from './selectors';
import { MENU_ITEMS_CONFIG } from './menuConfig'; // Assuming menuConfig.ts is in the same directory
import { getLocalizedLabel } from './localization'; // Import from localization.ts
import { 
  handleCopyMarkdown,
  handleDownloadMarkdown,
  handleCopyImage,
  handleDownloadImage
} from './actions'; // Assuming actions.ts is in the same directory

// This function will be imported from content.tsx after modification
// For now, let's declare a type for it to avoid TS errors here.
type AddCustomMenuItemsFunc = (
  menuPanel: HTMLElement,
  answerBlockRoot: HTMLElement,
  contentSelectorForActions?: string,
  closeMenuCallback?: () => void
) => void;

let addCustomMenuItems: AddCustomMenuItemsFunc = () => {
    console.error("addCustomMenuItems not implemented or imported yet from content.tsx");
};

// Function to allow content.tsx to set the actual addCustomMenuItems function
export function setAddCustomMenuItemsUtility(fn: AddCustomMenuItemsFunc) {
    addCustomMenuItems = fn;
}

// --- State for Deep Research Panel ---
let injectedDeepResearchTriggerButton: HTMLElement | null = null;
let activeDeepResearchMenuPanel: HTMLElement | null = null;
let themeChangeObserver: MutationObserver | null = null; // Observer for theme changes

function updateInjectedButtonIconColor() {
  if (!injectedDeepResearchTriggerButton) return;

  const isDarkMode = document.documentElement.getAttribute('dark') === 'true' ||
    document.documentElement.classList.contains('dark') ||
    (window.getComputedStyle(document.body).backgroundColor &&
      parseInt(window.getComputedStyle(document.body).backgroundColor.split('(')[1]) < 128);

  const iconStrokeColor = isDarkMode ? 'rgb(232, 234, 237)' : 'rgb(32, 33, 36)';

  const svgElement = injectedDeepResearchTriggerButton.querySelector('svg');
  if (svgElement) {
    svgElement.style.stroke = iconStrokeColor;
    console.log("Gemini Export Enhancer: Deep Research trigger button icon color updated for theme change.");
  }
}

function closeDeepResearchMenu() {
  if (activeDeepResearchMenuPanel) {
    activeDeepResearchMenuPanel.remove();
    activeDeepResearchMenuPanel = null;
    // Clean up click-outside listener if it was specific to this menu instance
    document.removeEventListener('click', handleClickOutsideDeepResearchMenu, { capture: true });
    console.log("Gemini Export Enhancer: Deep Research custom menu closed.");
  }
}

function handleClickOutsideDeepResearchMenu(event: MouseEvent) {
  if (activeDeepResearchMenuPanel && 
      !activeDeepResearchMenuPanel.contains(event.target as Node) && 
      event.target !== injectedDeepResearchTriggerButton) {
    closeDeepResearchMenu();
  } else if (activeDeepResearchMenuPanel) {
    // If click was inside or on the trigger, re-add listener for next click outside
    // This ensures the listener is active as long as the menu is open
    document.addEventListener('click', handleClickOutsideDeepResearchMenu, { once: true, capture: true });
  }
}

function handleDeepResearchExportButtonClick(event: MouseEvent, triggerButton: HTMLElement) {
  event.stopPropagation();
  if (activeDeepResearchMenuPanel) {
    closeDeepResearchMenu();
    return;
  }

  const pseudoAnswerBlock = document.querySelector(GEMINI_SELECTORS.deepDiveReport.content);
  if (!pseudoAnswerBlock) {
    console.error("Gemini Export Enhancer: Deep research content area not found for menu.");
    toast.error("无法定位深度研究内容");
    return;
  }

  activeDeepResearchMenuPanel = document.createElement('div');
  activeDeepResearchMenuPanel.classList.add('gemini-enhancer-custom-menu-panel'); 
  activeDeepResearchMenuPanel.style.position = 'absolute';
  activeDeepResearchMenuPanel.style.zIndex = '2147483647'; 
  activeDeepResearchMenuPanel.style.background = 'var(--mat-menu-container-color, white)'; 
  activeDeepResearchMenuPanel.style.border = '1px solid var(--mat-menu-outline-color, rgba(0,0,0,0.12))'; // Adjusted border color
  activeDeepResearchMenuPanel.style.borderRadius = '4px'; // Added border radius
  // More Material-like shadow, you might need to adjust based on Gemini's specifics
  activeDeepResearchMenuPanel.style.boxShadow = '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)';
  activeDeepResearchMenuPanel.style.padding = '8px 0'; 
  activeDeepResearchMenuPanel.style.minWidth = '220px'; // Slightly wider for typical menu items
  activeDeepResearchMenuPanel.style.overflow = 'hidden'; // Prevent content spill

  const rect = triggerButton.getBoundingClientRect();
  activeDeepResearchMenuPanel.style.top = `${rect.bottom + window.scrollY + 2}px`; // Position below button with a small gap
  activeDeepResearchMenuPanel.style.left = `${rect.left + window.scrollX}px`;
  
  document.body.appendChild(activeDeepResearchMenuPanel);
  console.log("Gemini Export Enhancer: Deep Research custom menu panel created.");

  addCustomMenuItems(
    activeDeepResearchMenuPanel,
    pseudoAnswerBlock.parentElement || pseudoAnswerBlock as HTMLElement, 
    GEMINI_SELECTORS.deepDiveReport.content,
    closeDeepResearchMenu // Pass the specific close function for this menu
  );

  setTimeout(() => { 
    document.addEventListener('click', handleClickOutsideDeepResearchMenu, { once: true, capture: true });
  }, 0);
}

function injectDeepResearchMenu(toolbarActionButtons: HTMLElement) {
  if (injectedDeepResearchTriggerButton) {
    console.log("Gemini Export Enhancer: Deep Research trigger button already injected.");
    // Even if already injected, update its color in case the theme changed before it was re-observed
    updateInjectedButtonIconColor();
    return;
  }

  const exportButton = document.createElement('button');
  exportButton.setAttribute('aria-label', 'Export Options');
  exportButton.classList.add('gemini-enhancer-deep-research-export-trigger', 'mdc-icon-button', 'mat-mdc-icon-button', 'mat-unthemed');

  // Initial color set here, will be updated by updateInjectedButtonIconColor
  const initialIsDarkMode = document.documentElement.getAttribute('dark') === 'true' ||
    document.documentElement.classList.contains('dark') ||
    (window.getComputedStyle(document.body).backgroundColor &&
      parseInt(window.getComputedStyle(document.body).backgroundColor.split('(')[1]) < 128);
  const initialIconStrokeColor = initialIsDarkMode ? 'rgb(232, 234, 237)' : 'rgb(32, 33, 36)';

  exportButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${initialIconStrokeColor}" style="width:24px; height:24px; display: block; margin: auto;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>`;

  exportButton.style.padding = '8px';
  exportButton.style.marginRight = '8px';
  exportButton.style.border = 'none';
  exportButton.style.background = 'transparent';
  exportButton.style.cursor = 'pointer';
  exportButton.style.display = 'inline-flex';
  exportButton.style.alignItems = 'center';
  exportButton.style.justifyContent = 'center';

  exportButton.addEventListener('click', (e) => handleDeepResearchExportButtonClick(e, exportButton));

  toolbarActionButtons.prepend(exportButton);
  injectedDeepResearchTriggerButton = exportButton;
  console.log("Gemini Export Enhancer: Deep Research trigger button injected.");

  // Start observing theme changes if not already
  if (!themeChangeObserver && document.documentElement) {
    themeChangeObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'dark' || mutation.attributeName === 'style')) {
          // Check for class changes (common for theming) or specific 'dark' attribute, or style changes on body (less common for theme but possible)
          console.log("Gemini Export Enhancer: Detected theme attribute change on html/body.", mutation.attributeName);
          updateInjectedButtonIconColor();
          break; // Found a relevant mutation, no need to check others in this list for this event
        }
      }
    });
    themeChangeObserver.observe(document.documentElement, { attributes: true });
    // Also observe body for class changes, as some sites toggle theme classes on body
    themeChangeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    console.log("Gemini Export Enhancer: Theme change observer started.");
  }
}

function removeDeepResearchMenuAndTrigger() {
  closeDeepResearchMenu();
  if (injectedDeepResearchTriggerButton) {
    injectedDeepResearchTriggerButton.remove();
    injectedDeepResearchTriggerButton = null;
    console.log("Gemini Export Enhancer: Deep Research trigger button removed.");
  }
  // Stop observing theme changes when the main trigger is removed
  if (themeChangeObserver) {
    themeChangeObserver.disconnect();
    themeChangeObserver = null; // Clear it so it can be re-initialized if needed
    console.log("Gemini Export Enhancer: Theme change observer stopped.");
  }
}

const deepResearchObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      let panelFound = false;
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.matches(GEMINI_SELECTORS.deepDiveReport.deepResearchPanel) || element.querySelector(GEMINI_SELECTORS.deepDiveReport.deepResearchPanel)) {
            panelFound = true;
          }
        }
      });

      if (panelFound && !document.body.getAttribute('data-gemini-enhancer-deep-research-active')) {
        document.body.setAttribute('data-gemini-enhancer-deep-research-active', 'true');
        console.log("Gemini Export Enhancer: Deep Research Panel DETECTED & marked active.");
        setTimeout(() => { // Delay to ensure toolbar elements are ready
          const toolbar = document.querySelector(GEMINI_SELECTORS.deepDiveReport.toolbar.container);
          if (toolbar) {
            const actionButtons = toolbar.querySelector<HTMLElement>(GEMINI_SELECTORS.deepDiveReport.toolbar.actionButtons);
            if (actionButtons) {
              injectDeepResearchMenu(actionButtons);
            } else {
              console.warn("Gemini Export Enhancer: Deep Research .action-buttons not found.");
            }
          } else {
            console.warn("Gemini Export Enhancer: Deep Research toolbar container not found.");
          }
        }, 500);
      }

      let panelRemoved = false;
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.matches(GEMINI_SELECTORS.deepDiveReport.deepResearchPanel)) {
            panelRemoved = true;
          }
        }
      });
      // Check if the panel is truly gone from the document as a whole
      if (!document.querySelector(GEMINI_SELECTORS.deepDiveReport.deepResearchPanel) && document.body.getAttribute('data-gemini-enhancer-deep-research-active')) {
         panelRemoved = true; // Confirm removal
      }


      if (panelRemoved) {
        document.body.removeAttribute('data-gemini-enhancer-deep-research-active');
        console.log("Gemini Export Enhancer: Deep Research Panel REMOVED & marked inactive.");
        removeDeepResearchMenuAndTrigger();
      }
    }
  }
});

export function initializeDeepResearchObserver() {
  if (document.body) {
    deepResearchObserver.observe(document.body, { childList: true, subtree: true });
    console.log("Gemini Export Enhancer: Deep Research observer initialized.");
  } else {
    document.addEventListener('DOMContentLoaded', () => {
        deepResearchObserver.observe(document.body, { childList: true, subtree: true });
        console.log("Gemini Export Enhancer: Deep Research observer initialized (DOMContentLoaded).");
    });
  }
} 