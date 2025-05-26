import { toast } from 'sonner';
import { GEMINI_SELECTORS } from './selectors';
import { htmlToMarkdown } from '../core/markdownConverter';
import { generateImageBlob, generateCombinedImageBlob } from '../core/imageGenerator'; // Added generateCombinedImageBlob

// Helper function to trigger download
export function triggerDownload(blob: Blob, filename: string) {
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
    alert('自动下载失败，请检查浏览器设置或手动操作。');
  }
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Action: Copy as Markdown
export async function handleCopyMarkdown(
  blockRoot: HTMLElement,
  contentSelectorOverride?: string
): Promise<void> {
  console.log('Action started: Copy MD for block:', blockRoot, 'Selector override:', contentSelectorOverride);
  let combinedHtml = '';
  const thoughtHtmlParts: string[] = [];

  // 1. Capture Thinking Process HTML
  const thoughtsContainer = blockRoot.querySelector('model-thoughts .thoughts-content-expanded');
  if (thoughtsContainer) {
    const thoughtMarkdownElements = thoughtsContainer.querySelectorAll('message-content > div.markdown');
    thoughtMarkdownElements.forEach(el => {
      thoughtHtmlParts.push(el.innerHTML);
    });
    if (thoughtHtmlParts.length > 0) {
      combinedHtml += thoughtHtmlParts.join('\n\n<hr />\n\n');
      console.log(`Captured ${thoughtHtmlParts.length} thinking parts for Markdown.`);
    }
  }

  // 2. Capture Main Answer HTML
  let mainAnswerHtml = '';
  let mainAnswerElement: Element | null = null;

  if (contentSelectorOverride) {
    mainAnswerElement = blockRoot.querySelector(contentSelectorOverride);
    if (mainAnswerElement) console.log('Using contentSelectorOverride for main answer.');
  } else {
    mainAnswerElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
    if (mainAnswerElement) {
      console.log('Using primary GEMINI_SELECTORS.answerContent for main answer.');
    } else {
      const idSelector = GEMINI_SELECTORS.answerContentFallbacks.find(s => s.startsWith('message-content[id^="message-content-id-"]'));
      if (idSelector) {
        mainAnswerElement = blockRoot.querySelector(idSelector);
        if (mainAnswerElement) console.log('Using ID-based fallback for main answer.');
      }
      // If still no main answer, try other fallbacks but be mindful of not re-selecting thoughts
      // For simplicity, we'll rely on the specificity of the primary and ID-based selectors here when thoughts are present.
      // If no thoughts were captured, the broader fallbacks below would be safer.
      if (!mainAnswerElement && thoughtHtmlParts.length === 0) {
         for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
            if (idSelector && fallbackSelector === idSelector) continue; // Already tried
            mainAnswerElement = blockRoot.querySelector(fallbackSelector);
            if (mainAnswerElement) {
                console.log('Found main answer with general fallback selector:', fallbackSelector);
                break;
            }
        }
      }
    }
  }

  if (mainAnswerElement) {
    mainAnswerHtml = mainAnswerElement.innerHTML;
  }

  // 3. Append Main Answer to Combined HTML
  if (mainAnswerHtml) {
    if (combinedHtml.length > 0 && mainAnswerHtml.trim().length > 0) {
      combinedHtml += '\n\n<hr />\n\n'; // Separator
    }
    combinedHtml += mainAnswerHtml;
  }

  // 4. Process combinedHtml
  if (combinedHtml.trim().length > 0) {
    let markdown = '';
    try {
      markdown = htmlToMarkdown(combinedHtml);
      await navigator.clipboard.writeText(markdown);
      toast.success('Markdown 已复制到剪贴板' + (thoughtHtmlParts.length > 0 ? ' (包含思考过程)' : ''));
    } catch (clipboardError: any) {
      if (markdown) {
        console.warn('Async clipboard write failed, trying execCommand fallback:', clipboardError);
        const textArea = document.createElement('textarea');
        textArea.value = markdown;
        textArea.style.position = 'fixed'; textArea.style.top = '-9999px'; textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        let success = false;
        try { success = document.execCommand('copy'); } catch (execError) { console.error('execCommand copy failed:', execError); success = false; }
        document.body.removeChild(textArea);
        if (success) {
          toast.success('Markdown 已复制到剪贴板' + (thoughtHtmlParts.length > 0 ? ' (包含思考过程)' : ''));
        } else {
          toast.error('无法复制 Markdown', { description: '请检查浏览器权限或手动复制。' });
        }
      } else {
        toast.error('无法处理内容以复制 Markdown');
      }
    }
  } else {
    console.error('Could not find any content (thinking or main answer) for Copy MD.');
    toast.error('无法找到可导出的内容', { description: '无法复制Markdown，请检查控制台。' });
  }
}

// Action: Download as Markdown
export async function handleDownloadMarkdown(
  blockRoot: HTMLElement,
  contentSelectorOverride?: string
): Promise<void> {
  console.log('Action started: Download MD for block:', blockRoot, 'Selector override:', contentSelectorOverride);
  let combinedHtml = '';
  const thoughtHtmlParts: string[] = [];

  // 1. Capture Thinking Process HTML
  const thoughtsContainer = blockRoot.querySelector('model-thoughts .thoughts-content-expanded');
  if (thoughtsContainer) {
    const thoughtMarkdownElements = thoughtsContainer.querySelectorAll('message-content > div.markdown');
    thoughtMarkdownElements.forEach(el => {
      thoughtHtmlParts.push(el.innerHTML);
    });
    if (thoughtHtmlParts.length > 0) {
      combinedHtml += thoughtHtmlParts.join('\n\n<hr />\n\n');
      console.log(`Captured ${thoughtHtmlParts.length} thinking parts for Markdown download.`);
    }
  }

  // 2. Capture Main Answer HTML
  let mainAnswerHtml = '';
  let mainAnswerElement: Element | null = null;

  if (contentSelectorOverride) {
    mainAnswerElement = blockRoot.querySelector(contentSelectorOverride);
     if (mainAnswerElement) console.log('Using contentSelectorOverride for main answer for download.');
  } else {
    mainAnswerElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
    if (mainAnswerElement) {
        console.log('Using primary GEMINI_SELECTORS.answerContent for main answer for download.');
    } else {
      const idSelector = GEMINI_SELECTORS.answerContentFallbacks.find(s => s.startsWith('message-content[id^="message-content-id-"]'));
      if (idSelector) {
        mainAnswerElement = blockRoot.querySelector(idSelector);
        if (mainAnswerElement) console.log('Using ID-based fallback for main answer for download.');
      }
      if (!mainAnswerElement && thoughtHtmlParts.length === 0) {
         for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
            if (idSelector && fallbackSelector === idSelector) continue;
            mainAnswerElement = blockRoot.querySelector(fallbackSelector);
            if (mainAnswerElement) {
                console.log('Found main answer for download with general fallback selector:', fallbackSelector);
                break;
            }
        }
      }
    }
  }

  if (mainAnswerElement) {
    mainAnswerHtml = mainAnswerElement.innerHTML;
  }

  // 3. Append Main Answer to Combined HTML
  if (mainAnswerHtml) {
    if (combinedHtml.length > 0 && mainAnswerHtml.trim().length > 0) {
      combinedHtml += '\n\n<hr />\n\n'; // Separator
    }
    combinedHtml += mainAnswerHtml;
  }

  // 4. Process combinedHtml for download
  if (combinedHtml.trim().length > 0) {
    try {
      const markdown = htmlToMarkdown(combinedHtml);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const formattedTime = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
      const filename = `Gemini-Export-${formattedDate}_${formattedTime}${thoughtHtmlParts.length > 0 ? '-with-thoughts' : ''}.md`;
      triggerDownload(blob, filename);
      toast.info('Markdown 文件下载已开始' + (thoughtHtmlParts.length > 0 ? ' (包含思考过程)' : ''));
    } catch (error: any) {
      console.error('Error during Markdown download:', error);
      toast.error('下载 Markdown 时出错', { description: error?.message });
    }
  } else {
    console.error('Could not find any content (thinking or main answer) for Download MD.');
    toast.error('无法找到可导出的内容', { description: '无法下载Markdown，请检查控制台。' });
  }
}

// Action: Copy as Image
export async function handleCopyImage(
  blockRoot: HTMLElement,
  contentSelectorOverride?: string
): Promise<void> {
  console.log('Action started: Copy Image for block:', blockRoot, 'Selector override (ignored for image element selection):', contentSelectorOverride);
  
  // For image generation, we use the entire blockRoot (model-response element)
  // The contentSelectorOverride is not used for selecting the image capture element.
  if (blockRoot) {
    try {
      if (contentSelectorOverride) {
        console.warn(
          'Image Export: contentSelectorOverride is provided but ignored. The entire blockRoot is used for image capture.'
        );
      }
      const blob = await generateImageBlob(blockRoot); // Use blockRoot directly
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('图片已复制到剪贴板');
      } else {
        toast.error('图片生成失败', { description: '无法复制图片，请检查控制台。' });
      }
    } catch (error: any) {
      console.error('Error during Image copy:', error);
      toast.error('复制图片时出错', { description: error?.message });
    }
  } else {
    // This case should ideally not be reached if blockRoot is always the model-response element.
    console.error('Could not find blockRoot for Copy Image.');
    toast.error('无法找到内容块', { description: '无法复制图片，请检查控制台。' });
  }
}

// Action: Download as Image
export async function handleDownloadImage(
  blockRoot: HTMLElement,
  contentSelectorOverride?: string
): Promise<void> {
  console.log('Action started: Download Image for block:', blockRoot, 'Selector override (ignored for image element selection):', contentSelectorOverride);

  // For image generation, we use the entire blockRoot (model-response element)
  // The contentSelectorOverride is not used for selecting the image capture element.
  if (blockRoot) {
    try {
      if (contentSelectorOverride) {
        console.warn(
          'Image Export: contentSelectorOverride is provided but ignored. The entire blockRoot is used for image capture.'
        );
      }
      const blob = await generateImageBlob(blockRoot); // Use blockRoot directly
      if (blob) {
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const formattedTime = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
        const filename = `Gemini-Export-${formattedDate}_${formattedTime}.png`;
        triggerDownload(blob, filename);
        toast.info('图片文件下载已开始');
      } else {
        toast.error('图片生成失败', { description: '无法下载图片，请检查控制台。' });
      }
    } catch (error: any) {
      console.error('Error during Image download:', error);
      toast.error('下载图片时出错', { description: error?.message });
    }
  } else {
    // This case should ideally not be reached if blockRoot is always the model-response element.
    console.error('Could not find blockRoot for Download Image.');
    toast.error('无法找到内容块', { description: '无法下载图片，请检查控制台。' });
  }
}

// Action: Copy Multiple Messages as a Single Image
export async function handleCopyMultipleImagesAsSingle(elements: HTMLElement[]): Promise<void> {
  if (!elements || elements.length === 0) {
    toast.info("未选择任何消息。");
    return;
  }

  console.log(`Action started: Copy ${elements.length} messages as a single image.`);
  const pageTitle = elements.length > 1 ? `Gemini Chat - ${elements.length} Messages` : `Gemini Chat`;


  try {
    // Pass a pageTitle to the generation function
    const blob = await generateCombinedImageBlob(elements, { pageTitle }); 

    if (blob) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success(`${elements.length} 条消息已作为单个图片复制到剪贴板。`);
    } else {
      toast.error('图片生成失败', { description: '无法生成合并图片。请检查控制台。' });
    }
  } catch (error: any) {
    console.error('Error during combined image copy:', error);
    toast.error('复制合并图片时出错', { description: error?.message || '未知错误。' });
  }
}