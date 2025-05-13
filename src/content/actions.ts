import { toast } from 'sonner';
import { GEMINI_SELECTORS } from './selectors';
import { htmlToMarkdown } from '../core/markdownConverter';
import { generateImageBlob } from '../core/imageGenerator';

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
export async function handleCopyMarkdown(blockRoot: HTMLElement): Promise<void> {
  console.log('Action started: Copy MD for block:', blockRoot);
  let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
  if (!contentElement) {
    for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
      contentElement = blockRoot.querySelector(fallbackSelector);
      if (contentElement) break;
    }
  }

  if (contentElement) {
    let markdown = '';
    try {
      markdown = htmlToMarkdown(contentElement.innerHTML);
      await navigator.clipboard.writeText(markdown);
      toast.success('Markdown 已复制到剪贴板');
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
          toast.success('Markdown 已复制到剪贴板');
        } else {
          toast.error('无法复制 Markdown', { description: '请检查浏览器权限或手动复制。' });
        }
      } else {
        toast.error('无法处理内容以复制 Markdown');
      }
    }
  } else {
    console.error('Could not find content element for Copy MD using any selector');
    toast.error('无法找到内容元素', { description: '无法复制Markdown，请检查控制台。' });
  }
}

// Action: Download as Markdown
export async function handleDownloadMarkdown(blockRoot: HTMLElement): Promise<void> {
  console.log('Action started: Download MD for block:', blockRoot);
  let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
  if (!contentElement) {
    for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
      contentElement = blockRoot.querySelector(fallbackSelector);
      if (contentElement) break;
    }
  }

  if (contentElement) {
    try {
      const markdown = htmlToMarkdown(contentElement.innerHTML);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const formattedTime = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
      const filename = `Gemini-Export-${formattedDate}_${formattedTime}.md`;
      triggerDownload(blob, filename);
      toast.info('Markdown 文件下载已开始');
    } catch (error: any) {
      console.error('Error during Markdown download:', error);
      toast.error('下载 Markdown 时出错', { description: error?.message });
    }
  } else {
    console.error('Could not find content element for Download MD');
    toast.error('无法找到内容元素', { description: '无法下载Markdown，请检查控制台。' });
  }
}

// Action: Copy as Image
export async function handleCopyImage(blockRoot: HTMLElement): Promise<void> {
  console.log('Action started: Copy Image for block:', blockRoot);
  let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
  if (!contentElement) {
    for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
      contentElement = blockRoot.querySelector(fallbackSelector);
      if (contentElement) break;
    }
  }

  if (contentElement) {
    try {
      const blob = await generateImageBlob(contentElement as HTMLElement);
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
    console.error('Could not find content element for Copy Image');
    toast.error('无法找到内容元素', { description: '无法复制图片，请检查控制台。' });
  }
}

// Action: Download as Image
export async function handleDownloadImage(blockRoot: HTMLElement): Promise<void> {
  console.log('Action started: Download Image for block:', blockRoot);
  let contentElement = blockRoot.querySelector(GEMINI_SELECTORS.answerContent);
  if (!contentElement) {
    for (const fallbackSelector of GEMINI_SELECTORS.answerContentFallbacks) {
      contentElement = blockRoot.querySelector(fallbackSelector);
      if (contentElement) break;
    }
  }

  if (contentElement) {
    try {
      const blob = await generateImageBlob(contentElement as HTMLElement);
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
    console.error('Could not find content element for Download Image');
    toast.error('无法找到内容元素', { description: '无法下载图片，请检查控制台。' });
  }
} 