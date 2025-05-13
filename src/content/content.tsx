// import React from 'react'; // No longer directly rendering ExportMenu here
// import ReactDOM from 'react-dom/client'; // No longer directly rendering ExportMenu here
// import ExportMenu from './components/ExportMenu'; // Component might be used later, or its parts
import { GEMINI_SELECTORS } from './selectors';
import { htmlToMarkdown } from '../core/markdownConverter';
import { generateImageBlob } from '../core/imageGenerator';

console.log("Gemini Export Enhancer: Script start. Mode: Inject into Share Menu.");

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
    // console.log("Gemini Export Enhancer: Custom menu items already exist. Skipping injection.");
    return;
  }
  console.log("Gemini Export Enhancer: Share menu panel found, associating with answer block:", answerBlockRoot);

  const itemsToInject = [
    { 
      label: '复制为 MD (自定义)', 
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
          console.log('  Content HTML found for Copy MD. Length:', contentElement.innerHTML.length);
          try {
            const markdown = htmlToMarkdown(contentElement.innerHTML);
            console.log('  Markdown generated. Length:', markdown.length);
            console.log('  前50个字符预览:', markdown.substring(0, 50), '...');
            
            // 尝试使用异步剪贴板API
            try {
              await navigator.clipboard.writeText(markdown);
              console.log('Success: Markdown copied to clipboard (async API)!');
            } catch (clipboardError) {
              console.error('  异步剪贴板API失败，尝试备选方法:', clipboardError);
              
              // 备选：使用文档execCommand (已废弃但兼容性更好)
              const textArea = document.createElement('textarea');
              textArea.value = markdown;
              document.body.appendChild(textArea);
              textArea.select();
              
              const success = document.execCommand('copy');
              document.body.removeChild(textArea);
              
              if (success) {
                console.log('Success: Markdown copied to clipboard (execCommand)!');
              } else {
                console.error('  复制到剪贴板失败 (execCommand)');
                alert('无法复制到剪贴板。请检查浏览器权限或手动复制。');
              }
            }
            
            // TODO: Show success Toast notification
          } catch (error) {
            console.error('Error converting HTML to Markdown or copying to clipboard:', error);
            alert('转换或复制过程中出错：' + (error instanceof Error ? error.message : String(error)));
            // TODO: Show error Toast notification
          }
        } else {
          console.error('  Could not find content element for Copy MD using any selector');
          console.log('  Inspect blockRoot内部的HTML结构:', blockRoot.innerHTML.substring(0, 300), '...');
          alert('找不到内容元素，无法复制Markdown。请检查控制台获取详情。');
          // TODO: Show error Toast notification (content not found)
        }
      }
    },
    { 
      label: '下载为 MD (自定义)', 
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
            
            // TODO: Show success Toast notification
          } catch (error) {
            console.error('Error converting HTML to Markdown or downloading:', error);
            alert('转换或下载过程中出错：' + (error instanceof Error ? error.message : String(error)));
            // TODO: Show error Toast notification
          }
        } else {
          console.error('  Could not find content element for Download MD using any selector');
          console.log('  Inspect blockRoot内部的HTML结构:', blockRoot.innerHTML.substring(0, 300), '...');
          alert('找不到内容元素，无法下载Markdown。请检查控制台获取详情。');
          // TODO: Show error Toast notification (content not found)
        }
      }
    },
    { 
      label: '复制为图片 (自定义)',
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
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob })
                ]);
                console.log('Success: Image copied to clipboard!');
                // TODO: Show success Toast notification
              } catch (clipboardError) {
                console.error('Error writing image to clipboard:', clipboardError);
                alert('无法将图片复制到剪贴板：' + (clipboardError instanceof Error ? clipboardError.message : String(clipboardError)));
                // TODO: Show error Toast notification (clipboard write failed)
              }
            } else {
              console.error('  Image blob generation failed (returned null).');
              alert('图片生成失败。');
              // TODO: Show error Toast notification (image generation failed)
            }
          } catch (error) {
            console.error('Error during image generation or processing:', error);
            alert('图片处理过程中出错：' + (error instanceof Error ? error.message : String(error)));
            // TODO: Show error Toast notification (general image error)
          }
        } else {
          console.error('  Could not find content element for Copy Image using any selector');
          console.log('  Inspect blockRoot HTML:', blockRoot.innerHTML.substring(0, 300), '...');
          alert('找不到内容元素，无法复制图片。请检查控制台获取详情。');
          // TODO: Show error Toast notification (content not found)
        }
      }
    },
    { 
      label: '下载为图片 (自定义)',
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
              // TODO: Show success/download started Toast notification
              
            } else {
              console.error('  Image blob generation failed (returned null).');
              alert('图片生成失败。');
              // TODO: Show error Toast notification (image generation failed)
            }
          } catch (error) {
            console.error('Error during image generation or download triggering:', error);
            alert('图片处理或下载过程中出错：' + (error instanceof Error ? error.message : String(error)));
            // TODO: Show error Toast notification (general image error)
          }
        } else {
          console.error('  Could not find content element for Download Image using any selector');
          console.log('  Inspect blockRoot HTML:', blockRoot.innerHTML.substring(0, 300), '...');
          alert('找不到内容元素，无法下载图片。请检查控制台获取详情。');
          // TODO: Show error Toast notification (content not found)
        }
      }
    },
  ];

  const divider = shareMenuPanel.querySelector('mat-divider');

  itemsToInject.forEach(item => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.classList.add('gemini-enhancer-custom-item');
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.padding = '8px 16px';
    button.style.textAlign = 'left';
    button.style.border = 'none';
    button.style.background = 'none';
    button.style.cursor = 'pointer';
    button.onmouseenter = () => button.style.backgroundColor = '#f0f0f0'; // Basic hover
    button.onmouseleave = () => button.style.backgroundColor = 'transparent';

    button.onclick = (e) => {
      console.log(`Gemini Export Enhancer: Custom button '${item.label}' CLICKED.`); // Log click immediately
      e.stopPropagation(); 
      e.preventDefault(); // Try preventing default menu behavior as well
      
      // 尝试关闭菜单面板（如果有的话）
      const menuPanel = document.querySelector(GEMINI_SELECTORS.shareMenu.menuPanel) as HTMLElement;
      if (menuPanel) {
        // 添加一个很短的延迟以确保我们的操作先执行
        setTimeout(() => {
          try {
            // 尝试通过点击文档来关闭菜单
            document.body.click();
            console.log("尝试关闭菜单面板");
          } catch (error) {
            console.error("关闭菜单面板失败:", error);
          }
        }, 10);
      }
      
      try {
        console.log("Gemini Export Enhancer: Attempting to call action function...");
        item.action(answerBlockRoot);
        console.log("Gemini Export Enhancer: Action function called successfully.");
      } catch (error) {
        console.error("Gemini Export Enhancer: Error executing action function:", error);
      }
    };

    if (divider && divider.parentNode) {
      divider.parentNode.insertBefore(button, divider.nextSibling);
    } else {
      shareMenuPanel.appendChild(button);
    }
    console.log(`Gemini Export Enhancer: Injected '${item.label}'`);
  });
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