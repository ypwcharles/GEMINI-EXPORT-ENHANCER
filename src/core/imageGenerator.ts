import html2canvas from 'html2canvas';

export interface ImageStyleOptions {
  // Page container options
  pageWidth?: number;
  pagePadding?: string | number; // e.g., '30px' or 30. Can be a single value or CSS shorthand.
  pageGradient?: string;

  // Title options
  pageTitle?: string;
  pageTitleColor?: string;
  pageTitleFontSize?: string;
  pageTitleFontWeight?: string;
  pageTitleMarginBottom?: string;

  // Card options
  cardBackgroundColor?: string;
  cardPadding?: string | number;
  cardBorderRadius?: string | number;
  cardBoxShadow?: string;
  cardMaxWidth?: string; // Ensures card doesn't exceed this if pageWidth is very large

  // Footer options
  footerText?: string;
  footerColor?: string;
  footerFontSize?: string;
  footerFontWeight?: string;
  footerMarginTop?: string;

  // html2canvas specific options (can be extended)
  scale?: number;
  useCORS?: boolean;
  logging?: boolean;
  backgroundColor?: string | null; // html2canvas option for canvas background, distinct from card/page
}

const DEFAULT_STYLES: Required<Omit<ImageStyleOptions, 'pageTitle' /* removed footerText from Omit */>> = {
  pageWidth: 680, // A bit wider for better layout with padding
  pagePadding: '40px 30px',
  pageGradient: 'linear-gradient(135deg, #6B21A8 0%, #2563EB 100%)', // Purple to blue

  pageTitleColor: '#FFFFFF',
  pageTitleFontSize: '32px',
  pageTitleFontWeight: 'bold',
  pageTitleMarginBottom: '25px',

  cardBackgroundColor: '#FFFFFF',
  cardPadding: '25px',
  cardBorderRadius: '12px',
  cardBoxShadow: '0 10px 25px rgb(255, 255, 255)', // Adjusted shadow for better visibility on gradient
  cardMaxWidth: '100%',

  // Default footer values
  footerText: 'Powered by Gemini Export Enhancer', // <-- Added default footer text
  footerColor: '#E0E0E0', // Lighter gray for better contrast on dark gradient
  footerFontSize: '12px',
  footerFontWeight: 'normal',
  footerMarginTop: '25px',

  // Default html2canvas options (subset)
  scale: 2, // Default scale, will be overridden by devicePixelRatio logic if not specified by user
  useCORS: true,
  logging: false,
  backgroundColor: null,
};

// Helper function to recursively set text color and apply a specific background color
function forceStyles(
  element: HTMLElement, // 这个参数将是 cleanedClone
  cardBackgroundColor: string
) {
  // 1. 为 cleanedClone 本身设置一个默认的文本颜色。
  // 这通常是安全的，有助于确保可读性。
  if (!element.style.color) {
    element.style.color = '#333333'; // 一个常用的深灰色
  }

  // 2. 将 cleanedClone 本身的背景色设置为卡片的背景色。
  // 这很关键，因为如果 cleanedClone 是透明的，html2canvas 可能会将其
  // 渲染为透明，直接透出 pageGradient，导致文字看不清。
  element.style.backgroundColor = cardBackgroundColor;

  // 3. 避免深度递归修改所有子孙元素的 display 属性或背景色。
  // 这是最可能破坏原始布局的地方。
  // 我们不再遍历 element.children 去修改它们的样式。
  // 如果 cleanedClone 内部确实有某些特定元素因为透明背景导致在卡片上不可见，
  // 那将需要更精确、更少的样式调整，而不是像之前那样"一刀切"。
  // 目前，我们假设 cleanedClone 内部的元素能正确继承颜色或有自己的样式。
}

// Selector constants for removing interfering elements
const INTERFERING_ELEMENT_SELECTORS = [
  'source-footnote',          // Source footnote markers
  'sources-carousel-inline',  // Source carousel inline containers
  'sources-carousel',         // Source carousel components
  '.response-footer',         // Footer containing source list (distinct from our generated footer)
  '[hide-from-message-actions]', // General attribute used by Gemini for hidden interactive elements
  // Add other selectors if needed
];


/**
 * Generates an image Blob from a given HTML element using html2canvas,
 * applying custom styles and using an iframe for isolation.
 *
 * @param element The HTML element to capture.
 * @param options Optional style and html2canvas options.
 * @returns A Promise that resolves with the image Blob, or null if an error occurs.
 */
export async function generateImageBlob(
  element: HTMLElement,
  options?: Partial<ImageStyleOptions>
): Promise<Blob | null> {

  if (!element) {
    console.error('Target element for image generation is null.');
    return null;
  }

  const mergedOptions = { ...DEFAULT_STYLES, ...options };

  // 1. Clone the original element AND clean it
  const cleanedClone = element.cloneNode(true) as HTMLElement;
  INTERFERING_ELEMENT_SELECTORS.forEach(selector => {
    cleanedClone.querySelectorAll(selector).forEach(el => el.remove());
  });
  // Also remove scripts and iframes just in case
  cleanedClone.querySelectorAll('script, iframe').forEach(el => el.remove());
  // Remove event handlers
   const allElementsInClone = cleanedClone.querySelectorAll('*');
   allElementsInClone.forEach(el => {
     for (const attr of Array.from(el.attributes)) {
       if (attr.name.startsWith('on')) {
         el.removeAttribute(attr.name);
       }
     }
   });

  // Increase line height for readability
  cleanedClone.style.lineHeight = '2';

  // Force styles on the *cleaned* clone before appending
  forceStyles(cleanedClone, mergedOptions.cardBackgroundColor);

  // 2. Create the styled wrapper structure
  const captureWrapper = document.createElement('div');
  captureWrapper.style.position = 'fixed'; // Use fixed position for iframe context
  captureWrapper.style.top = '0';
  captureWrapper.style.left = '0';
  captureWrapper.style.width = `${mergedOptions.pageWidth}px`;
  captureWrapper.style.padding = typeof mergedOptions.pagePadding === 'number' ? `${mergedOptions.pagePadding}px` : mergedOptions.pagePadding;
  captureWrapper.style.background = mergedOptions.pageGradient;
  captureWrapper.style.display = 'flex';
  captureWrapper.style.flexDirection = 'column';
  captureWrapper.style.alignItems = 'center';
  captureWrapper.style.boxSizing = 'border-box';
  captureWrapper.style.minHeight = 'auto'; // Let height be determined by content


  if (mergedOptions.pageTitle) {
    const titleElement = document.createElement('h1');
    titleElement.textContent = mergedOptions.pageTitle;
    titleElement.style.color = mergedOptions.pageTitleColor;
    titleElement.style.fontSize = mergedOptions.pageTitleFontSize;
    titleElement.style.fontWeight = mergedOptions.pageTitleFontWeight;
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = mergedOptions.pageTitleMarginBottom;
    titleElement.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    titleElement.style.flexShrink = '0';
    captureWrapper.appendChild(titleElement);
  }

  const card = document.createElement('div');
  card.classList.add('capture-card-background'); // Add class for forceStyles logic
  card.style.backgroundColor = mergedOptions.cardBackgroundColor;
  card.style.padding = typeof mergedOptions.cardPadding === 'number' ? `${mergedOptions.cardPadding}px` : mergedOptions.cardPadding;
  card.style.borderRadius = typeof mergedOptions.cardBorderRadius === 'number' ? `${mergedOptions.cardBorderRadius}px` : mergedOptions.cardBorderRadius;
  card.style.boxShadow = mergedOptions.cardBoxShadow;
  card.style.width = '100%';
  card.style.maxWidth = mergedOptions.cardMaxWidth;
  card.style.boxSizing = 'border-box';
  card.style.overflow = 'hidden'; // Prevent content spillover affecting layout
  card.style.flexGrow = '1';
  card.style.display = 'flex'; // Use flex for internal alignment if needed
  card.style.flexDirection = 'column'; // Stack content vertically


  // Append the cleaned clone to the card
  card.appendChild(cleanedClone);
  captureWrapper.appendChild(card);


  if (mergedOptions.footerText) {
    const footerElement = document.createElement('p');
    footerElement.textContent = mergedOptions.footerText;
    footerElement.style.color = mergedOptions.footerColor;
    footerElement.style.fontSize = mergedOptions.footerFontSize;
    footerElement.style.fontWeight = mergedOptions.footerFontWeight;
    footerElement.style.textAlign = 'center';
    footerElement.style.marginTop = mergedOptions.footerMarginTop;
    footerElement.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    footerElement.style.flexShrink = '0';
    captureWrapper.appendChild(footerElement);
  }

  // 3. Create and configure the iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px'; // Position off-screen
  iframe.style.left = '-9999px';
  iframe.style.width = `${mergedOptions.pageWidth + 40}px`; // Add buffer, adjust as needed
  iframe.style.height = '100px'; // Initial small height
  iframe.style.border = 'none';
  // IMPORTANT: Sandbox without allow-scripts prevents CSP issues from injected content
  iframe.sandbox.add('allow-same-origin'); // Needed to access contentWindow

  document.body.appendChild(iframe);

  return new Promise((resolvePromise, rejectPromise) => {
    iframe.onload = async () => {
      try {
        if (!iframe.contentWindow || !iframe.contentWindow.document) {
          console.error('iframe contentWindow or document not available');
          rejectPromise(new Error('iframe content not available'));
          return;
        }

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.body.style.margin = '0'; // Reset iframe body margin
        iframeDoc.body.innerHTML = captureWrapper.outerHTML; // Inject the fully styled wrapper

        const elementToCaptureInIframe = iframeDoc.body.firstChild as HTMLElement;

        if (!elementToCaptureInIframe) {
          console.error('Could not find the capture element inside iframe');
          rejectPromise(new Error('Could not find element in iframe'));
          return;
        }

        // Adjust iframe size to the content
        const contentHeight = elementToCaptureInIframe.scrollHeight;
        const contentWidth = elementToCaptureInIframe.scrollWidth;
        iframe.style.height = `${contentHeight}px`;
        iframe.style.width = `${contentWidth}px`;

        // ----> 新增延迟 <----
        await new Promise(resolve => setTimeout(resolve, 100)); // 增加 100ms 延迟

        // 4. Execute html2canvas within the iframe context
        const canvasOptions = {
          useCORS: mergedOptions.useCORS,
          logging: mergedOptions.logging,
          backgroundColor: null, // Let the wrapper's background show through
          scale: mergedOptions.scale || (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1),
          // ----> 移除显式宽高设置 <----
          // height: contentHeight,
          // width: contentWidth,
          // windowHeight: contentHeight,
          // windowWidth: contentWidth,
        };

        console.log('Capturing iframe content with html2canvas after delay...', canvasOptions);
        const canvas = await html2canvas(elementToCaptureInIframe, canvasOptions as any);

        // 5. Get Blob and resolve
        canvas.toBlob((blob) => {
          if (blob) {
            resolvePromise(blob);
          } else {
            rejectPromise(new Error('Canvas to Blob conversion failed'));
          }
        }, 'image/png');

      } catch (error) {
        console.error('Error during html2canvas processing with iframe:', error);
        rejectPromise(error);
      } finally {
        // 6. Cleanup: Remove iframe
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    };

    iframe.onerror = (err) => {
      console.error("Failed to load iframe srcdoc:", err);
      rejectPromise(new Error("iframe srcdoc loading failed"));
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    // Set srcdoc to trigger iframe onload. Content is injected in onload handler.
    iframe.srcdoc = `<!DOCTYPE html><html><head><style>body { margin: 0; }</style></head><body></body></html>`;

  });
} 