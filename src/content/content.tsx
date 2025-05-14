import React from 'react'; // Import React
import ReactDOM from 'react-dom/client'; // Import ReactDOM
import '../index.css'; // Added import for the main CSS file
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

import MessageCheckbox from './components/MessageCheckbox';
import SelectionActionBar from './components/SelectionActionBar';
import { RectangleStackIcon } from '@heroicons/react/24/outline'; // Ensure this is imported if not already

console.log("Gemini Export Enhancer: Script start. Mode: Inject into Share Menu & Deep Research Toolbar.");

// --- Global State for Multi-Select Mode ---
let isMultiSelectModeActive = false;
let selectedMessageIds: Set<string> = new Set();
let actionBarRoot: ReactDOM.Root | null = null;
let actionBarContainer: HTMLElement | null = null; // Container for the action bar
// Map to store React roots for checkboxes, to properly unmount them
const checkboxRoots = new Map<string, ReactDOM.Root>(); 
// ---

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

// Define localized strings for menu items (used locally in this file for getLocalizedLabel)
const S_MENU_ITEM_LABELS_CONTENT_SCRIPT = {
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
  selectMultipleMessages: { // Added for multi-select
    zh: '选择多条信息分享',
    en: 'Select Multiple Messages',
  },
  cancelSelection: { // New label for cancelling multi-select
    zh: '取消多选',
    en: 'Cancel Selection',
  },
} as const;

// Helper function to get the localized label - EXPORT this function
export function getLocalizedLabel(actionKey: keyof typeof S_MENU_ITEM_LABELS_CONTENT_SCRIPT, pageLang: string): string {
  const lang = pageLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const labels = S_MENU_ITEM_LABELS_CONTENT_SCRIPT[actionKey];
  return labels[lang] || labels['en']; 
}

// --- Global State for associating click with share menu ---
let lastClickedAnswerBlockRoot: HTMLElement | null = null;
// ---

// --- Debounce helper function ---
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>; // Ensure correct typing
}

// Function to render or update the SelectionActionBar
function renderOrUpdateSelectionActionBar() {
  const inputArea = document.querySelector(GEMINI_SELECTORS.inputAreaContainer);

  // Show the action bar if multi-select mode is active.
  // The selectedCount inside the bar will correctly show 0 if nothing is selected.
  if (!isMultiSelectModeActive) {
    if (actionBarContainer) {
      actionBarRoot?.unmount();
      actionBarContainer.remove();
      actionBarContainer = null;
      actionBarRoot = null;
      console.log('SelectionActionBar removed from DOM and unmounted because multi-select is off.');
    }
    return;
  }

  // If mode is active, ensure the bar is present and injected correctly.
  if (!inputArea) {
    console.warn('Gemini Enhancer: Input area container not found. Cannot display SelectionActionBar.');
    if (actionBarContainer) { // If it was visible but now input area is gone, remove it.
        actionBarRoot?.unmount();
        actionBarContainer.remove();
        actionBarContainer = null;
        actionBarRoot = null;
        console.log('SelectionActionBar removed because input area disappeared.');
    }
    return;
  }

  if (!actionBarContainer) {
    actionBarContainer = document.createElement('div');
    actionBarContainer.id = 'gemini-enhancer-selection-action-bar-container-wrapper';
    
    actionBarContainer.style.position = 'fixed'; 
    actionBarContainer.style.zIndex = '2147483640'; 
    actionBarContainer.style.display = 'flex'; 
    actionBarContainer.style.justifyContent = 'center';

    // Initial positioning based on inputAreaContainer if available
    const inputAreaElForInitialSetup = document.querySelector(GEMINI_SELECTORS.inputAreaContainer) as HTMLElement;
    if (inputAreaElForInitialSetup) {
      const inputRect = inputAreaElForInitialSetup.getBoundingClientRect();
      actionBarContainer.style.left = `${inputRect.left}px`;
      actionBarContainer.style.width = `${inputRect.width}px`;
      console.log(`SelectionActionBar initial position based on input area: left=${inputRect.left}px, width=${inputRect.width}px`);
    } else {
      // Fallback if input area is not immediately available (e.g., try chat history or viewport)
      const chatHistoryEl = document.querySelector(GEMINI_SELECTORS.chatHistoryContainer) as HTMLElement;
      if (chatHistoryEl) {
        const chatRect = chatHistoryEl.getBoundingClientRect();
        actionBarContainer.style.left = `${chatRect.left}px`;
        actionBarContainer.style.width = `${chatRect.width}px`;
        console.warn('Gemini Enhancer: Input area not found for initial setup. Using chat history for action bar width/left.');
      } else {
        actionBarContainer.style.left = '50%';
        actionBarContainer.style.transform = 'translateX(-50%)';
        actionBarContainer.style.width = '100vw'; 
        console.warn('Gemini Enhancer: Input area AND chat history not found for initial setup. Falling back to viewport centering.');
      }
    }
    document.body.appendChild(actionBarContainer); 
    
    // --- POSITIONING STYLES (will be dynamically updated) ---
    actionBarContainer.style.position = 'fixed';
    actionBarContainer.style.left = '50%';
    actionBarContainer.style.transform = 'translateX(-50%)';
    actionBarContainer.style.width = '100vw'; // Ensure it spans viewport width for centering
    actionBarContainer.style.zIndex = '2147483640'; // Keep high z-index
    
    actionBarContainer.style.display = 'flex'; 
    actionBarContainer.style.justifyContent = 'center';
    // No explicit width: '100%' needed here, as SelectionActionBar has max-width and will be centered by justify-content.

    document.body.appendChild(actionBarContainer); // Append to body
    // --- END INITIAL CONTAINER SETUP ---
    
    // --- 同步主题 CSS 变量到 Shadow Host (Ensure actionBarContainer is not null here) ---
    const rootStyles = getComputedStyle(document.documentElement);
    const themeVars = [
      '--card', '--foreground', '--background', '--primary', '--primary-foreground',
      '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--border', '--input', '--ring',
      '--card-foreground', '--popover', '--popover-foreground', '--radius', '--radius-lg', '--radius-md', '--radius-sm', '--radius-xl'
      // 如有更多变量可补充
    ];
    themeVars.forEach(varName => {
      const value = rootStyles.getPropertyValue(varName);
      if (value) {
        actionBarContainer!.style.setProperty(varName, value);
      }
    });

    // --- SHADOW DOM SETUP ---
    const shadowRoot = actionBarContainer.attachShadow({ mode: 'open' });
    const reactMountPoint = document.createElement('div');
    reactMountPoint.id = 'gemini-enhancer-action-bar-shadow-mount'; // ID for the mount point within shadow DOM
    shadowRoot.appendChild(reactMountPoint);

    // Link the extension's CSS file (containing Tailwind styles) into the shadow DOM
    // This 'assets/content.css' is specified in manifest.json and built by Vite.
    // It needs to be in web_accessible_resources.
    try {
      const stylesUrl = chrome.runtime.getURL('assets/content.css');
      const styleLink = document.createElement('link');
      styleLink.setAttribute('rel', 'stylesheet');
      styleLink.setAttribute('href', stylesUrl);
      shadowRoot.appendChild(styleLink); // Link content.css first
    } catch (e) {
      console.error("Gemini Enhancer: Error getting URL for 'assets/content.css'. Ensure it's in web_accessible_resources.", e);
    }

    // Create a style element for :host specific base styles and box-sizing
    const hostSetupStyles = document.createElement('style');
    hostSetupStyles.textContent = `
      :host {
        /* Apply card background and text color to the host, using variables FROM content.css */
        /* This makes the entire floating area (including margins of inner component) use the card color */
        background-color: var(--card);
        color: var(--foreground); /* Text color for host if any direct text, though unlikely here */

        /* Ensure box-sizing for the host, Tailwind relies on this */
        box-sizing: border-box;
        display: block; /* Ensures the host takes up space and can be sized */
      }
      /* Apply box-sizing to all elements within the shadow DOM */
      *, *:before, *:after {
        box-sizing: inherit;
      }
    `;
    shadowRoot.prepend(hostSetupStyles); // Prepend to apply before reactMountPoint is styled by components

    // Propagate dark mode class and other relevant theme classes to the shadow host (actionBarContainer)
    // This allows .dark specific rules and other theme rules in content.css to apply within the shadow DOM
    const mainDocElement = document.documentElement;
    actionBarContainer.className = ''; // Clear existing classes on the host first
    if (mainDocElement.classList.contains('dark')) {
      actionBarContainer.classList.add('dark');
    }
    // Add other classes from body or html that might be relevant for shadcn theming if necessary
    // For example, Gemini might use a specific class on <body> for its theming.
    // const bodyClasses = document.body.classList;
    // bodyClasses.forEach(cls => {
    //   if (cls.startsWith('theme-') || cls === 'light' || cls === 'dark') { // Example: copy theme-related classes
    //     actionBarContainer.classList.add(cls);
    //   }
    // });

    // Style the reactMountPoint to fill the host, allowing SelectionActionBar to layout correctly
    reactMountPoint.style.display = 'block'; 
    reactMountPoint.style.width = '100%'; // Make reactMountPoint take full width of actionBarContainer
    reactMountPoint.style.maxWidth = '48rem'; // Apply maxWidth here
    // reactMountPoint.style.width = 'auto'; // Removed
    // reactMountPoint.style.margin = '0 auto'; // Removed, parent actionBarContainer handles centering of this block

    reactMountPoint.style.height = 'auto'; // Let content determine height
    
    actionBarRoot = ReactDOM.createRoot(reactMountPoint); // Mount React into the div inside the shadow root
    console.log('SelectionActionBar container created with Shadow DOM, host styles, and dark mode propagation.');

    // --- DYNAMIC POSITION UPDATE (Bottom position and re-evaluate horizontal if needed) ---
    if (actionBarContainer) { 
      // Update bottom position
      const inputAreaElForUpdate = document.querySelector(GEMINI_SELECTORS.inputAreaContainer) as HTMLElement;
      const desiredGapAboveInput = 0; // Set gap to 0
      if (inputAreaElForUpdate) {
        const inputAreaRect = inputAreaElForUpdate.getBoundingClientRect();
        const calculatedBottom = window.innerHeight - inputAreaRect.top + desiredGapAboveInput;
        actionBarContainer.style.bottom = `${calculatedBottom}px`;

        // Update horizontal position and width to match inputAreaElForUpdate
        if (actionBarContainer.style.left !== `${inputAreaRect.left}px` || actionBarContainer.style.width !== `${inputAreaRect.width}px`) {
          actionBarContainer.style.left = `${inputAreaRect.left}px`;
          actionBarContainer.style.width = `${inputAreaRect.width}px`;
          actionBarContainer.style.transform = 'none'; // Ensure no leftover transform from fallback
          console.log(`SelectionActionBar horizontal position updated to match input area: left=${inputAreaRect.left}px, width=${inputAreaRect.width}px`);
        }
      } else {
        actionBarContainer.style.bottom = '168px'; 
        console.warn('Gemini Enhancer: Input area not found for dynamic bottom positioning, using fallback.');
        // If input area is lost, what should horizontal be? Maybe keep last known or fallback to chat history/viewport?
        // For now, it will retain its last set left/width if inputArea disappears after being present.
        // If it was never present, the initial fallback (chat history / viewport) applies.
      }
    }
    // --- END DYNAMIC POSITION UPDATE ---
  }
  
  const allMessageElements = getAllMessageElements();
  // Disable action buttons if selectedCount is 0, but the bar itself is visible.
  const areAllSelected = selectedMessageIds.size > 0 && allMessageElements.length > 0 && allMessageElements.every(el => selectedMessageIds.has(el.id));

  const placeholderAction = (actionName: string) => {
    console.log(`Action bar: ${actionName} clicked for ${selectedMessageIds.size} items.`);
    toast.info(`Action: ${actionName} for ${selectedMessageIds.size} items (Not implemented yet).`);
  };

  // Ensure the component is rendered or updated
  actionBarRoot?.render(
    <React.StrictMode>
      <SelectionActionBar
        selectedCount={selectedMessageIds.size}
        onCopyImage={() => placeholderAction('Copy Image')}
        onDownloadImage={() => placeholderAction('Download Image')}
        onCopyMarkdown={() => placeholderAction('Copy Markdown')}
        onDownloadMarkdown={() => placeholderAction('Download Markdown')}
        onToggleSelectAll={() => handleSelectAll(!areAllSelected)}
        areAllSelected={areAllSelected}
        onClose={toggleMultiSelectMode} 
      />
    </React.StrictMode>
  );
  console.log('SelectionActionBar rendered/updated above input area.');
}

function getUniqueBlockId(block: Element, index: number): string {
  if (block.id) {
    return block.id;
  }
  const parentConversationContainer = block.closest('div.conversation-container');
  const parentId = parentConversationContainer?.id || 'unknown_parent';
  // Using tagName and index to differentiate blocks within the same parent container
  return `${parentId}_${block.tagName.toLowerCase()}_${index}`;
}

// Function to inject or remove checkboxes from messages
function injectOrRemoveCheckboxes(inject: boolean) {
  const selectorString = `${GEMINI_SELECTORS.userQuery}, ${GEMINI_SELECTORS.answerContainer}`; // Use new selectors
  const messageBlocks = document.querySelectorAll(selectorString);

  // Keep track of previously managed roots to remove any that are no longer associated with a block
  const currentBlockIds = new Set<string>();

  messageBlocks.forEach((block, index) => {
    // const conversationContainer = block.closest('div.conversation-container'); // May not be needed if block has own ID or we use index
    // const messageId = conversationContainer?.id; // Old way, using parent ID

    const uniqueBlockId = getUniqueBlockId(block, index);
    currentBlockIds.add(uniqueBlockId);

    if (!uniqueBlockId) { // Should not happen with the fallback in getUniqueBlockId
        console.warn('Message block found without a usable ID, skipping checkbox for:', block);
        return;
    }
    
    // Ensure block is an HTMLElement to access style property
    if (!(block instanceof HTMLElement)) {
        console.warn('Encountered a message block that is not an HTMLElement, skipping checkbox injection:', block);
        return;
    }

    let checkboxContainer = block.querySelector<HTMLElement>('.gemini-enhancer-checkbox-wrapper');
    // More robustly associate wrapper with the block itself, e.g., by prepending to the block or a known child
    // For absolute positioning, the block itself or a direct parent needs position:relative.

    if (inject && isMultiSelectModeActive) {
      if (!checkboxContainer) {
        checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'gemini-enhancer-checkbox-wrapper';
        // block.style.position = 'relative'; // Ensure the block can be an anchor for absolute positioning
        // checkboxContainer.style.position = 'absolute';
        // checkboxContainer.style.left = '-30px'; // Adjust as needed
        // checkboxContainer.style.top = '10px';   // Adjust as needed
        // checkboxContainer.style.zIndex = '100'; 
        // Prepend to the block itself to keep it contained
        // block.insertBefore(checkboxContainer, block.firstChild);

        // Alternative: Let's try to make the checkbox wrapper a sibling *before* the block,
        // and style the block's parent (e.g., conversation-container or a new wrapper) to align them.
        // This requires the parent (e.g., `block.parentElement`) to handle layout (e.g., flex).
        // For now, continuing with the previous approach of prepending to parent, but this needs review for styling.
        const parentForCheckbox = block.parentElement;
        if (parentForCheckbox) {
            // Ensure parent is relative for absolute positioning of checkbox
            // This might make all items in conversation-container relative, which might be an issue.
            // (parentForCheckbox as HTMLElement).style.position = 'relative'; 
            // Let's try a simpler prepend directly into the block, assuming block can handle it or we style it later.
            block.style.display = 'flex'; // Make block a flex container for easy prepend alignment
            block.style.alignItems = 'flex-start'; // Align items to the start (top)
            checkboxContainer.style.marginRight = '8px'; // Add some space between checkbox and content
            checkboxContainer.style.marginTop = '8px'; // Align with typical content start

            block.insertBefore(checkboxContainer, block.firstChild);
            console.log(`Checkbox container prepended into block for uniqueBlockId: ${uniqueBlockId}`);
        } else {
            console.warn('Could not find suitable parent to prepend checkbox container for block:', block);
            return;
        }
      }
      
      if (!checkboxRoots.has(uniqueBlockId)) {
        const root = ReactDOM.createRoot(checkboxContainer);
        checkboxRoots.set(uniqueBlockId, root);
      }
      
      checkboxRoots.get(uniqueBlockId)?.render(
        <MessageCheckbox
          messageId={uniqueBlockId} // Use the new uniqueBlockId
          isChecked={selectedMessageIds.has(uniqueBlockId)}
          onChange={handleMessageSelection}
        />
      );
    } else {
      // Cleanup when not injecting or multi-select is off
      if (checkboxRoots.has(uniqueBlockId)) {
        checkboxRoots.get(uniqueBlockId)?.unmount();
        checkboxRoots.delete(uniqueBlockId);
        console.log(`Checkbox unmounted for uniqueBlockId: ${uniqueBlockId}`);
      }
      if (checkboxContainer) {
        checkboxContainer.remove();
        console.log(`Checkbox container removed for uniqueBlockId: ${uniqueBlockId}`);
      }
    }
  });

  // Clean up any checkbox roots that are no longer associated with a current block
  if (!inject || !isMultiSelectModeActive) { // Full cleanup if mode is off or not injecting
    checkboxRoots.forEach((root, id) => {
        root.unmount();
        const checkboxWrapper = document.querySelector(`.gemini-enhancer-checkbox-wrapper[data-block-id='${id}']`); // Needs data-attr if querying globally
        // Or find it relative to the block if we still had a reference to the block by ID
        checkboxWrapper?.remove(); // This is less reliable without a solid way to find the wrapper
    });
    checkboxRoots.clear();
  } else { // Partial cleanup: remove roots for blocks that disappeared
    checkboxRoots.forEach((root, id) => {
        if (!currentBlockIds.has(id)) {
            root.unmount();
            checkboxRoots.delete(id);
            // Also attempt to remove its DOM wrapper if possible (tricky without direct reference)
            console.log(`Stale checkbox unmounted and root deleted for ID: ${id}`);
        }
    });
  }

  console.log(`injectOrRemoveCheckboxes called with inject: ${inject}. Active roots: ${checkboxRoots.size}`);
}

// Toggle Multi-Select Mode
function toggleMultiSelectMode() {
  isMultiSelectModeActive = !isMultiSelectModeActive;
  console.log(`Multi-select mode toggled. Active: ${isMultiSelectModeActive}`);
  if (!isMultiSelectModeActive) {
    selectedMessageIds.clear();
    // Checkboxes and their roots are now cleaned up more dynamically by injectOrRemoveCheckboxes(false)
    console.log('Selected messages cleared.');
  }
  injectOrRemoveCheckboxes(isMultiSelectModeActive);
  renderOrUpdateSelectionActionBar();
}

// Handle individual message selection
function handleMessageSelection(messageId: string, isSelected: boolean) { // messageId is now uniqueBlockId
  if (isSelected) {
    selectedMessageIds.add(messageId);
  } else {
    selectedMessageIds.delete(messageId);
  }
  console.log(`Message selection changed for uniqueBlockId: ${messageId}, isSelected: ${isSelected}. Count: ${selectedMessageIds.size}`);
  renderOrUpdateSelectionActionBar(); 

  // Force re-render of the checkboxes to ensure UI updates.
  // Calling injectOrRemoveCheckboxes(true) will re-evaluate all checkboxes.
  if (isMultiSelectModeActive) { // Only re-inject if mode is still active
    injectOrRemoveCheckboxes(true);
  } else {
    // If mode became inactive, injectOrRemoveCheckboxes(false) should have been called by toggleMultiSelectMode
    // But to be safe, if a selection change somehow happens while mode is off, ensure cleanup.
    injectOrRemoveCheckboxes(false);
  }
}

// Placeholder for getting all selectable message elements
function getAllMessageElements(): { id: string, element: HTMLElement }[] { // id should be uniqueBlockId
    const elements: { id: string, element: HTMLElement }[] = [];
    const selectorString = `${GEMINI_SELECTORS.userQuery}, ${GEMINI_SELECTORS.answerContainer}`;
    document.querySelectorAll(selectorString).forEach((block, index) => {
        const uniqueBlockId = getUniqueBlockId(block, index);
        if (uniqueBlockId) {
            elements.push({ id: uniqueBlockId, element: block as HTMLElement });
        }
    });
    return elements;
}


// Handle Select All / Deselect All
function handleSelectAll(selectAll: boolean) {
  const allMessages = getAllMessageElements(); // Gets elements with their uniqueBlockIds
  if (selectAll) {
    allMessages.forEach(msg => selectedMessageIds.add(msg.id)); // msg.id is uniqueBlockId
    console.log('All messages selected.');
  } else {
    selectedMessageIds.clear();
    console.log('All messages deselected.');
  }
  // Re-render checkboxes to reflect new selection state
  if (isMultiSelectModeActive) {
    injectOrRemoveCheckboxes(true); 
  }
  renderOrUpdateSelectionActionBar();
}

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

  console.log("Gemini Export Enhancer: MENU_ITEMS_CONFIG received:", JSON.stringify(MENU_ITEMS_CONFIG.map(c => c.id))); // DIAGNOSTIC LOG

  const pageLang = document.documentElement.lang || 'en';

  // Define a more specific type for action handler keys
  // Exclude 'selectMultipleMessages' and 'cancelSelection' as they don't have direct async actions
  type ActionHandlerKey = Exclude<keyof typeof S_MENU_ITEM_LABELS_CONTENT_SCRIPT, 'selectMultipleMessages' | 'cancelSelection'>;

  const actionHandlers: { [K in ActionHandlerKey]: (blockRoot: HTMLElement, contentSelector?: string) => Promise<void> } = {
    copyImage: handleCopyImage,
    downloadImage: handleDownloadImage,
    copyMarkdown: handleCopyMarkdown,
    downloadMarkdown: handleDownloadMarkdown,
  };
  const originalFirstChild = menuPanel.firstChild;

  MENU_ITEMS_CONFIG.forEach(itemConfig => {
    console.log("Gemini Export Enhancer: Processing itemConfig.id:", itemConfig.id); // DIAGNOSTIC LOG

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
    let label: string;
    if (itemConfig.id === 'selectMultipleMessages') {
      const labelKey = isMultiSelectModeActive ? 'cancelSelection' : 'selectMultipleMessages';
      label = getLocalizedLabel(labelKey as keyof typeof S_MENU_ITEM_LABELS_CONTENT_SCRIPT, pageLang);
    } else {
      label = getLocalizedLabel(itemConfig.id as keyof typeof S_MENU_ITEM_LABELS_CONTENT_SCRIPT, pageLang);
    }
    console.log(`Gemini Export Enhancer: Label for ${itemConfig.id}: ${label}`); // DIAGNOSTIC LOG
    textSpan.textContent = label;
    const nativeMenuItemText = menuPanel.querySelector('button[mat-menu-item] span.mat-mdc-menu-item-text');
    if (nativeMenuItemText) {
      textSpan.style.fontWeight = getComputedStyle(nativeMenuItemText as HTMLElement).fontWeight;
    } else {
      textSpan.style.fontWeight = '500';
    }
    button.appendChild(textSpan);

    button.onclick = async (e) => {
      console.log(`Gemini Export Enhancer: Custom button '${textSpan.textContent}' CLICKED. Selector for action: ${contentSelectorForActions}`);
      e.stopPropagation();
      e.preventDefault();

      if (itemConfig.id === 'selectMultipleMessages') {
        toggleMultiSelectMode(); // Call the global toggle function
        
        toast.info(`多选模式已${isMultiSelectModeActive ? '开启' : '关闭'}`);

        if (closeMenuCallback) {
          setTimeout(closeMenuCallback, 100);
        } else {
          // Default close logic for native share menu
          setTimeout(() => {
            const nativeMenuPanelToClose = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel) as HTMLElement;
            if (nativeMenuPanelToClose && nativeMenuPanelToClose === menuPanel && nativeMenuPanelToClose.offsetParent !== null) {
              try {
                const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop');
                if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) { cdkBackdrop.click(); return; }
                document.body.click();
              } catch (closeError) { console.error("Error attempting to close native menu panel:", closeError); }
            }
          }, 100);
        }
      } else {
        // At this point, itemConfig.id is one of the ActionHandlerKey types
        const actionKey = itemConfig.id as ActionHandlerKey;
        const actionToPerform = actionHandlers[actionKey];
        
        if (!actionToPerform) {
          console.error(`Gemini Export Enhancer: No action handler found for ID (this should not happen): ${itemConfig.id}`);
          toast.error('操作失败', { description: `内部错误：未找到操作 ${itemConfig.id} 的处理器。` });
          return;
        }

        const currentAnswerBlockRoot = answerBlockRoot;
        if (!currentAnswerBlockRoot) {
          console.error("Gemini Export Enhancer: Cannot perform action, associated answer block is missing.");
          toast.error('操作失败', { description: '无法关联到对应的回答块。' });
          return;
        }
        try {
          await actionToPerform(currentAnswerBlockRoot, contentSelectorForActions);
        } catch (error) {
          console.error(`Gemini Export Enhancer: Error executing ${itemConfig.id}:`, error);
          toast.error('操作失败', { description: '执行操作时发生未知错误。' });
        }

        if (closeMenuCallback) {
          setTimeout(closeMenuCallback, 100);
        } else {
          // Default close logic for native share menu
          setTimeout(() => {
            const nativeMenuPanelToClose = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel) as HTMLElement;
            if (nativeMenuPanelToClose && nativeMenuPanelToClose === menuPanel && nativeMenuPanelToClose.offsetParent !== null) {
              try {
                const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop');
                if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) { cdkBackdrop.click(); return; }
                document.body.click();
              } catch (closeError) { console.error("Error attempting to close native menu panel:", closeError); }
            }
          }, 100);
        }
      }
    };

    menuPanel.prepend(button);
  });

  // Add Divider after all custom items
  const customItems = menuPanel.querySelectorAll('.gemini-enhancer-custom-item');
  const lastPrependedItem = customItems[customItems.length - 1]; // This should be correct after removing the extra button
  if (lastPrependedItem && lastPrependedItem.nextSibling) {
      if (!(lastPrependedItem.nextSibling instanceof HTMLElement && lastPrependedItem.nextSibling.tagName.toLowerCase() === 'mat-divider')) {
            const newDivider = document.createElement('mat-divider');
            newDivider.setAttribute('role', 'separator');
            newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)'; // TODO: Use theme variable
            newDivider.style.margin = '8px 0';
            menuPanel.insertBefore(newDivider, lastPrependedItem.nextSibling);
      }
  } else if (lastPrependedItem && !lastPrependedItem.nextSibling && originalFirstChild) { // If custom items are the only ones
       const newDivider = document.createElement('mat-divider');
        newDivider.setAttribute('role', 'separator');
        newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)'; // TODO: Use theme variable
        newDivider.style.margin = '8px 0';
        menuPanel.appendChild(newDivider); // Append if no original items followed
  }

  // REMOVE THE REDUNDANT STANDALONE "Select Multiple Messages" button logic from here
  // const multiSelectButton = document.createElement('button'); ...
  // ... all the way to ...
  // console.log("Gemini Export Enhancer: 'Select Multiple' button added to menu panel.");
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

// Modify the chatObserver to use the new multi-select logic
// This is a conceptual change, the actual chatObserver logic is more complex
// and likely in `src/content/observers/chatObserver.ts`

// Example of how chatObserver might call injectOrRemoveCheckboxes
// if (isMultiSelectModeActive && newNodesAddedToChat) {
//   injectOrRemoveCheckboxes(true);
// }

// Initial setup calls
initializeDeepResearchObserver(); // Keep this if it's managing its own menu injections

// Ensure chatObserver knows about multi-select mode and can trigger checkbox updates
// For instance, the MutationObserver in chatObserver should call injectOrRemoveCheckboxes(true)
// when new messages appear AND isMultiSelectModeActive is true.

// Also, when toggling multi-select mode, an update to existing menus might be needed
// to change the "Select Multiple" button text. This is tricky if menus are not persistent.
// The current approach re-evaluates the label on click or when menu is rebuilt.

console.log('Gemini Export Enhancer: Content script fully initialized with multi-select stubs.');
// Make sure to connect toggleMultiSelectMode to the actual ExportMenu component's prop.
// This connection will happen where ExportMenu is rendered, likely in chatObserver.ts
// by passing `isMultiSelectModeActive` and `toggleMultiSelectMode` as props.

// Add a listener for page changes if needed, e.g., if Gemini uses SPA navigation
// that might clear the action bar or checkboxes.
// window.addEventListener('popstate', () => {
//   if (isMultiSelectModeActive) {
//      injectOrRemoveCheckboxes(true);
//      renderOrUpdateSelectionActionBar();
//   }
// });
// window.addEventListener('visibilitychange', () => {
//    if (document.visibilityState === 'visible' && isMultiSelectModeActive) {
//        injectOrRemoveCheckboxes(true);
//        renderOrUpdateSelectionActionBar();
//    }
// });

// Placeholder for observer that calls injectOrRemoveCheckboxes on new messages
const chatMutationObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            if (isMultiSelectModeActive) {
                // Check if added nodes are actual messages or containers
                let newMessagesAdded = false;
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        if (element.matches('div.conversation-container') || element.querySelector('div.conversation-container')) {
                            newMessagesAdded = true;
                        }
                    }
                });
                if (newMessagesAdded) {
                    console.log("ChatObserver: New messages detected, re-injecting checkboxes.");
                    injectOrRemoveCheckboxes(true); // Re-run to catch new messages
                }
            }
        }
    }
});

// Start observing the chat container for new messages
// The target node for this observer needs to be the scrollable chat history.
const chatHistoryTargetNode = document.querySelector(GEMINI_SELECTORS.chatHistoryContainer); 
if (chatHistoryTargetNode) {
    chatMutationObserver.observe(chatHistoryTargetNode, { childList: true, subtree: true });
    console.log("ChatObserver: Observing chat history for new messages to inject checkboxes in multi-select mode.");
} else {
    console.warn("ChatObserver: Could not find chat history container to observe for new messages.");
    const fallbackObserver = new MutationObserver(() => {
        const chatHistContainer = document.querySelector(GEMINI_SELECTORS.chatHistoryContainer); // Ensure correct selector is used here too
        if (chatHistContainer) {
            chatMutationObserver.observe(chatHistContainer, { childList: true, subtree: true });
            console.log("ChatObserver: Observing chat history (found on fallback) for new messages.");
            fallbackObserver.disconnect();
        }
    });
    fallbackObserver.observe(document.body, { childList: true, subtree: true });
} 

// --- Resize Handler for Responsive ActionBar Positioning ---
const handleWindowResize = debounce(() => {
  console.log("Gemini Enhancer: Window resize detected, re-evaluating ActionBar position.");
  if (isMultiSelectModeActive && actionBarContainer) { // Only run if relevant
    // Directly call the update part of renderOrUpdateSelectionActionBar or a dedicated update function
    // For simplicity, we can re-run the part that updates position/size.
    // The full renderOrUpdateSelectionActionBar also handles creation if it was removed, which is fine.
    renderOrUpdateSelectionActionBar(); 
  }
}, 250); // Debounce for 250ms

window.addEventListener('resize', handleWindowResize);

console.log('Gemini Export Enhancer: Content script fully initialized with multi-select and resize handling.'); 