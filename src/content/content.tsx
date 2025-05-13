import React from 'react'; // Import React
import ReactDOM from 'react-dom/client'; // Import ReactDOM
// import Toast from '../ui_components/Toast'; // No longer needed
import { Toaster } from '@/components/ui/sonner'; // Import shadcn/ui Toaster (Sonner wrapper)
import { toast } from 'sonner'; // Import toast function from Sonner
import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'; // Import necessary icons
import { GEMINI_SELECTORS } from './selectors';
import { htmlToMarkdown } from '../core/markdownConverter';
import { generateImageBlob } from '../core/imageGenerator';

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

function addCustomMenuItems(shareMenuPanel: HTMLElement, answerBlockRoot: HTMLElement) {
  if (shareMenuPanel.querySelector('.gemini-enhancer-custom-item')) {
    return;
  }
  console.log("Gemini Export Enhancer: Share menu panel found, associating with answer block:", answerBlockRoot);

  // Define menu items with updated labels and icons
  const itemsToInject = [
    {
      label: '复制为图片',
      icon: PhotoIcon,
      action: async (blockRoot: HTMLElement) => {
        console.log('Action started: Copy Image for block:', blockRoot);
        
        // Find content element using selectors
        let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
        if (!contentElement) {
          console.log('DEBUG: Copy Image - Main selector failed, trying fallbacks...');
          for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
            contentElement = blockRoot.querySelector(fallbackSelector);
            if (contentElement) {
              console.log('DEBUG: Copy Image - Fallback selector success:', fallbackSelector);
              break;
            }
          }
        }
        
        console.log('DEBUG: Copy Image - Final content element:', contentElement);

        if (contentElement) {
          console.log('  Content element found for Copy Image.');
          try {
            // Generate image blob
            const blob = await generateImageBlob(contentElement as HTMLElement);
            
            if (blob) {
              console.log('  Image blob generated successfully. Size:', blob.size);
              // Copy blob to clipboard
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              console.log('Success: Image copied to clipboard!');
              toast.success('图片已复制到剪贴板');
            } else {
              console.error('  Image blob generation failed (returned null).');
              toast.error('图片生成失败', { description: '无法复制图片，请检查控制台。' });
            }
          } catch (error: any) {
            console.error('Error during Image copy:', error);
            toast.error('复制图片时出错', { description: error?.message });
          }
        } else {
          console.error('  Could not find content element for Copy Image using any selector');
          console.log('  Inspect blockRoot HTML:', blockRoot.innerHTML.substring(0, 300), '...');
          toast.error('无法找到内容元素', { description: '无法复制图片，请检查控制台。' });
        }
      }
    },
    {
      label: '下载为图片',
      icon: ArrowDownTrayIcon,
      action: async (blockRoot: HTMLElement) => {
        console.log('Action started: Download Image for block:', blockRoot);
        
        // Find content element using selectors
        let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
        if (!contentElement) {
          console.log('DEBUG: Download Image - Main selector failed, trying fallbacks...');
          for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
            contentElement = blockRoot.querySelector(fallbackSelector);
            if (contentElement) {
              console.log('DEBUG: Download Image - Fallback selector success:', fallbackSelector);
              break;
            }
          }
        }
        
        console.log('DEBUG: Download Image - Final content element:', contentElement);

        if (contentElement) {
          console.log('  Content element found for Download Image.');
          try {
            // Generate image blob
            const blob = await generateImageBlob(contentElement as HTMLElement);
            
            if (blob) {
              console.log('  Image blob generated successfully. Size:', blob.size);
              // Trigger download
              const date = new Date();
              const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const formattedTime = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
              const filename = `Gemini-Export-${formattedDate}_${formattedTime}.png`;
              
              triggerDownload(blob, filename);
              console.log('Success: Image download initiated!');
              toast.info('图片文件下载已开始');
            } else {
              console.error('  Image blob generation failed (returned null).');
              toast.error('图片生成失败', { description: '无法下载图片，请检查控制台。' });
            }
          } catch (error: any) {
            console.error('Error during Image download:', error);
            toast.error('下载图片时出错', { description: error?.message });
          }
        } else {
          console.error('  Could not find content element for Download Image using any selector');
          console.log('  Inspect blockRoot HTML:', blockRoot.innerHTML.substring(0, 300), '...');
          toast.error('无法找到内容元素', { description: '无法下载图片，请检查控制台。' });
        }
      }
    },
    {
      label: '复制为 Markdown',
      icon: ClipboardDocumentIcon,
      action: async (blockRoot: HTMLElement) => {
        console.log('Action started: Copy MD for block:', blockRoot);
        console.log('DEBUG: 使用主选择器:', GEMINI_SELECTORS.answerContent);
        
        // 尝试使用主选择器
        let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
        
        // 如果主选择器失败，尝试备选选择器
        if (!contentElement) {
          console.log('DEBUG: 主选择器未找到元素，尝试备选选择器');
          
          for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
            console.log('DEBUG: 尝试备选选择器:', fallbackSelector);
            contentElement = blockRoot.querySelector(fallbackSelector);
            if (contentElement) {
              console.log('DEBUG: 备选选择器找到元素:', fallbackSelector);
              break;
            }
          }
        }
        
        // 最后检查是否找到了内容元素
        console.log('DEBUG: 最终内容元素:', contentElement);
        
        if (contentElement) {
          let markdown = ''; // Define markdown outside the try block
          try {
            markdown = htmlToMarkdown(contentElement.innerHTML); // Assign inside try
            await navigator.clipboard.writeText(markdown);
            console.log('Success: Markdown copied to clipboard!');
            toast.success('Markdown 已复制到剪贴板');
          } catch (clipboardError: any) {
            // Fallback using execCommand (less reliable)
            if (markdown) { // Check if markdown was successfully generated before fallback
              console.warn('Async clipboard write failed, trying execCommand fallback:', clipboardError);
              const textArea = document.createElement('textarea');
              textArea.value = markdown; // Now markdown is accessible
              textArea.style.position = 'fixed'; // Prevent scrolling to bottom
              textArea.style.top = '-9999px';
              textArea.style.left = '-9999px';
              document.body.appendChild(textArea);
              textArea.select();
              let success = false;
              try {
                success = document.execCommand('copy');
              } catch (execError) {
                console.error('execCommand failed:', execError);
                success = false;
              }
              document.body.removeChild(textArea);

              if (success) {
                console.log('Success: Markdown copied via execCommand!');
                toast.success('Markdown 已复制到剪贴板');
              } else {
                console.error('execCommand copy failed.');
                // Don't reference clipboardError here, just show generic error
                toast.error('无法复制 Markdown', { description: '请检查浏览器权限或手动复制。' });
              }
            } else {
              // Handle the case where htmlToMarkdown itself failed
              console.error('Failed to generate markdown before clipboard fallback attempt.');
              toast.error('无法处理内容以复制 Markdown');
            }
          }
        } else {
          console.error('  Could not find content element for Copy MD using any selector');
          console.log('  Inspect blockRoot内部的HTML结构:', blockRoot.innerHTML.substring(0, 300), '...');
          toast.error('无法找到内容元素', { description: '无法复制Markdown，请检查控制台。' });
        }
      }
    },
    {
      label: '下载为 Markdown',
      icon: ArrowDownTrayIcon,
      action: async (blockRoot: HTMLElement) => {
        console.log('Action started: Download MD for block:', blockRoot);
        
        // 尝试使用主选择器
        let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
        
        // 如果主选择器失败，尝试备选选择器
        if (!contentElement) {
          console.log('DEBUG: 主选择器未找到元素，尝试备选选择器');
          
          for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
            console.log('DEBUG: 尝试备选选择器:', fallbackSelector);
            contentElement = blockRoot.querySelector(fallbackSelector);
            if (contentElement) {
              console.log('DEBUG: 备选选择器找到元素:', fallbackSelector);
              break;
            }
          }
        }
        
        // 最后检查是否找到了内容元素
        console.log('DEBUG: 下载 MD - 最终内容元素:', contentElement);
        
        if (contentElement) {
          console.log('  Content HTML found for Download MD. Length:', contentElement.innerHTML.length);
          try {
            // 1. 转换 HTML 到 Markdown
            const markdown = htmlToMarkdown(contentElement.innerHTML);
            console.log('  Markdown generated. Length:', markdown.length);
            console.log('  前50个字符预览:', markdown.substring(0, 50), '...');
            
            // 2. 创建 Blob 对象
            const blob = new Blob([markdown], { type: 'text/markdown' });
            
            // 3. 创建下载链接
            const url = URL.createObjectURL(blob);
            
            // 4. 创建临时下载链接并触发点击
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            
            // 生成文件名：使用当前时间和 Gemini 作为前缀
            const date = new Date();
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const formattedTime = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
            downloadLink.download = `Gemini-Export-${formattedDate}_${formattedTime}.md`;
            
            // 设置更多属性，确保下载行为被明确触发
            downloadLink.type = 'text/markdown';
            downloadLink.target = '_blank'; // 在新标签页打开
            downloadLink.rel = 'noopener';
            downloadLink.setAttribute('data-downloadurl', ['text/markdown', downloadLink.download, downloadLink.href].join(':'));
            
            // 使下载链接可见，便于调试
            console.log('DEBUG: 创建的下载链接:', downloadLink);
            
            // 添加到 document，触发点击，然后移除
            document.body.appendChild(downloadLink);
            
            // 使用不同的点击方法，确保事件被触发
            try {
              console.log('尝试通过 click() 方法下载...');
              downloadLink.click();
            } catch (clickError) {
              console.error('click() 方法失败，尝试通过分发事件下载...', clickError);
              try {
                // 尝试使用 MouseEvent 方式触发
                const clickEvent = new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                });
                downloadLink.dispatchEvent(clickEvent);
                console.log('通过 MouseEvent 分发成功');
              } catch (dispatchError) {
                console.error('通过 MouseEvent 分发失败:', dispatchError);
                // 最后尝试直接提示用户手动下载
                alert('自动下载失败。请点击确定后，在新窗口中右键选择"另存为..."手动保存文件。');
                window.open(url, '_blank');
              }
            }
            
            // 延迟移除
            setTimeout(() => {
              document.body.removeChild(downloadLink);
              console.log('下载链接已从文档中移除');
            }, 1000);
            
            // 5. 清理 URL 对象
            setTimeout(() => {
              URL.revokeObjectURL(url);
              console.log('Object URL revoked.');
            }, 5000); // 延长回收时间
            
            console.log('Success: Markdown file download initiated!');
            toast.info('Markdown 文件下载已开始');
          } catch (error: any) {
            console.error('Error during Markdown download:', error);
            toast.error('下载 Markdown 时出错', { description: error?.message });
          }
        } else {
          console.error('  Could not find content element for Download MD using any selector');
          console.log('  Inspect blockRoot内部的HTML结构:', blockRoot.innerHTML.substring(0, 300), '...');
          toast.error('无法找到内容元素', { description: '无法下载Markdown，请检查控制台。' });
        }
      }
    },
  ];

  // Store the original first child (could be a native item or something else)
  const originalFirstChild = shareMenuPanel.firstChild;

  // Reverse the order so they appear correctly when prepended
  const reversedItems = [...itemsToInject]; // No need to reverse if prepending in order

  reversedItems.forEach(item => {
    const button = document.createElement('button');
    button.setAttribute('role', 'menuitem');
    button.classList.add('gemini-enhancer-custom-item');

    // --- Apply Styling for the main button (layout, color, fontFamily) ---
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.width = '100%';
    button.style.padding = '0px 16px';
    button.style.height = '48px';
    button.style.textAlign = 'left';
    button.style.border = 'none';
    button.style.background = 'none';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px'; // Keep consistent font size for the button context
    button.style.fontFamily = 'inherit'; // Button inherits font family

    const nativeMenuButton = shareMenuPanel.querySelector('button[mat-menu-item]');
    button.style.color = nativeMenuButton ? getComputedStyle(nativeMenuButton).color : 'rgb(32, 33, 36)';
    // fontWeight will be set on the textSpan directly, not the button.

    // --- Hover effect (remains the same) ---
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

    // --- Create and append Icon (remains the same) ---
    const iconContainer = document.createElement('span');
    iconContainer.style.marginRight = '16px';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    const iconRoot = ReactDOM.createRoot(iconContainer);
    iconRoot.render(React.createElement(item.icon, { style: { width: '20px', height: '20px' } }));
    button.appendChild(iconContainer);

    // --- Create and append Text (with specific fontWeight) ---
    const textSpan = document.createElement('span');
    textSpan.textContent = item.label;

    const nativeMenuItemText = shareMenuPanel.querySelector('button[mat-menu-item] span.mat-mdc-menu-item-text');
    if (nativeMenuItemText) {
      const computedWeight = getComputedStyle(nativeMenuItemText as HTMLElement).fontWeight;
      textSpan.style.fontWeight = computedWeight;
      // console.log("Applied fontWeight from native span.mat-mdc-menu-item-text:", computedWeight);
    } else {
      // Fallback if native text span is not found for style query.
      // '500' is a common "medium" weight, often used in Material Design menus.
      textSpan.style.fontWeight = '500';
      // console.log("Applied fallback fontWeight: 500 to textSpan");
    }
    button.appendChild(textSpan);

    // --- Onclick Handler (remains the same) ---
    button.onclick = async (e) => {
      console.log(`Gemini Export Enhancer: Custom button '${item.label}' CLICKED.`);
      e.stopPropagation();
      e.preventDefault();
      try {
        console.log("Gemini Export Enhancer: Attempting to call action function...");
        await item.action(answerBlockRoot);
        console.log("Gemini Export Enhancer: Action function called successfully.");
      } catch (error) {
        console.error("Gemini Export Enhancer: Error executing action function:", error);
      }
      // Attempt to close menu (remains the same)
      setTimeout(() => {
        const menuPanel = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel) as HTMLElement;
        if (menuPanel && menuPanel.offsetParent !== null) { // Check if menu is still visible/in DOM
            try {
                // Attempt 1: Click the CDK overlay backdrop (common for Angular Material menus)
                const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop');
                if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) {
                    cdkBackdrop.click();
                    console.log("Gemini Export Enhancer: Attempted to close menu by clicking .cdk-overlay-backdrop");
                    return; // Assume this worked
                }
                // Attempt 2: Fallback to clicking document.body (less reliable but worth a try)
                document.body.click();
                console.log("Gemini Export Enhancer: Attempted to close menu by clicking document.body (fallback)");
            } catch (error) {
                console.error("Gemini Export Enhancer: Error attempting to close menu panel:", error);
            }
        }
      }, 100);
    };

    // --- Use prepend for simpler insertion ---
    shareMenuPanel.prepend(button);

    console.log(`Gemini Export Enhancer: Prepended '${item.label}'`);
  });

  // --- Add Divider after all custom items ---
  // Check if a divider already exists right after our last prepended item (which is now the first child)
  const firstPrependedItem = shareMenuPanel.firstChild;
  // Find the last prepended custom item
  const customItems = shareMenuPanel.querySelectorAll('.gemini-enhancer-custom-item');
  const lastPrependedItem = customItems[customItems.length - 1]; // Last custom item added

  if (lastPrependedItem && lastPrependedItem.nextSibling) {
      // Check if the node immediately after our last item is NOT already a divider
      if (!(lastPrependedItem.nextSibling instanceof HTMLElement && lastPrependedItem.nextSibling.tagName.toLowerCase() === 'mat-divider')) {
            const newDivider = document.createElement('mat-divider');
            newDivider.setAttribute('role', 'separator');
            newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)'; // Basic styling
            newDivider.style.margin = '8px 0';
            // Insert the divider AFTER the last custom item
            shareMenuPanel.insertBefore(newDivider, lastPrependedItem.nextSibling);
            console.log("Gemini Export Enhancer: Added divider after custom items.");
      }
  } else if (lastPrependedItem && !lastPrependedItem.nextSibling && originalFirstChild) {
      // If our items are the only ones AND there were original items, add divider at the end
       const newDivider = document.createElement('mat-divider');
        newDivider.setAttribute('role', 'separator');
        newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)';
        newDivider.style.margin = '8px 0';
        shareMenuPanel.appendChild(newDivider); // Append divider
        console.log("Gemini Export Enhancer: Added divider at the end (custom items were last).");
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
      // console.log("Gemini Export Enhancer: Menu observer disconnected after finding panel.");
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

  // Don't query immediately. Instead, observe the element for the button to appear.
  const INTERNAL_OBSERVER_CONFIG = { childList: true, subtree: true };
  let buttonFound = false;

  const internalObserver = new MutationObserver((mutationsList, observer) => {
    const shareButton = answerBlockRootElement.querySelector<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
    
    if (shareButton) {
      buttonFound = true;
      console.log("Gemini Export Enhancer: Share button FOUND via internal observer within model-response:", shareButton);
      if (!(shareButton as any).__hasGeminiEnhancerListener) {
        shareButton.addEventListener('click', (event) => handleShareButtonClick.call(shareButton, event, answerBlockRootElement));
        (shareButton as any).__hasGeminiEnhancerListener = true;
        console.log("Gemini Export Enhancer: Click listener ADDED to share button via internal observer:", shareButton);
      } else {
        // console.log("Gemini Export Enhancer: Click listener already exists on share button (found by internal observer):", shareButton);
      }
      observer.disconnect(); // Stop observing once found
    }
    // else: Button not found yet, observer continues waiting for mutations
  });

  // Start observing the specific model-response element
  internalObserver.observe(answerBlockRootElement, INTERNAL_OBSERVER_CONFIG);

  // Also, try an initial check in case the button is already there
  const initialShareButton = answerBlockRootElement.querySelector<HTMLButtonElement>(GEMINI_SELECTORS.injectionPointInAnswer);
  if (initialShareButton) {
      buttonFound = true;
      console.log("Gemini Export Enhancer: Share button FOUND initially within model-response:", initialShareButton);
       if (!(initialShareButton as any).__hasGeminiEnhancerListener) {
        initialShareButton.addEventListener('click', (event) => handleShareButtonClick.call(initialShareButton, event, answerBlockRootElement));
        (initialShareButton as any).__hasGeminiEnhancerListener = true;
        console.log("Gemini Export Enhancer: Click listener ADDED to share button initially:", initialShareButton);
      }
      internalObserver.disconnect(); // No need to observe further
  } else {
       console.log("Gemini Export Enhancer: Share button not found initially, internal observer is active.");
  }

  // Disconnect observer after a safety timeout (e.g., 5 seconds) 
  // in case the button never appears for some reason, to prevent leaks.
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
            console.log("Gemini Export Enhancer: Direct match for new answerContainer (model-response):", element);
            processAnswerElement(element);
          } else {
            const childAnswers = element.querySelectorAll<HTMLElement>(GEMINI_SELECTORS.answerContainer);
            if (childAnswers.length > 0) {
              console.log(`Gemini Export Enhancer: Found ${childAnswers.length} answerContainer(s) (model-response) in children of:`, element);
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