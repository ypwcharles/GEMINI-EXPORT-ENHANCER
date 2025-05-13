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
  cardBoxShadow: '0 10px 25px rgb(255, 255, 255)',
  cardMaxWidth: '100%',

  // Default footer values
  footerText: 'Powered by Gemini Export Enhancer', // <-- Added default footer text
  footerColor: '#E0E0E0', // Lighter gray for better contrast on dark gradient
  footerFontSize: '12px',
  footerFontWeight: 'normal',
  footerMarginTop: '25px',
  
  // Default html2canvas options (subset)
  scale: 1, // Default scale, will be overridden by devicePixelRatio logic if not specified by user
  useCORS: true,
  logging: false,
  backgroundColor: null, 
};

// Helper function to recursively set text color and apply a specific background color
function forceStyles(element: HTMLElement, targetBackgroundColor: string) {
  element.style.color = '#000000'; // Force black text

  // Apply the target background unless it's the card wrapper itself (which has its own background)
  if (!element.classList.contains('capture-card-background')) {
    // Apply the target background (white) to all elements inside the card
    element.style.backgroundColor = targetBackgroundColor;
  }

  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    // Recursively call with the same target background color
    forceStyles(children[i] as HTMLElement, targetBackgroundColor);
  }
}

/**
 * Generates an image Blob from a given HTML element using html2canvas,
 * optimized for mobile sharing with fixed width, padding, and background.
 *
 * @param element The HTML element to capture.
 * @param options Optional html2canvas options, plus custom options like `width`, `padding`, `backgroundColor`.
 * @returns A Promise that resolves with the image Blob, or null if an error occurs.
 */
export async function generateImageBlob(
  elementToClone: HTMLElement,
  options?: Partial<ImageStyleOptions>
): Promise<Blob | null> {
  const mergedOptions = { ...DEFAULT_STYLES, ...options };

  // 1. Prepare the captureWrapper HTML content (similar to before)
  const captureWrapper = document.createElement('div');
  captureWrapper.style.position = 'fixed';
  captureWrapper.style.top = '0'; // Can be 0 as it's inside an offscreen iframe
  captureWrapper.style.left = '0'; // Can be 0
  captureWrapper.style.width = `${mergedOptions.pageWidth}px`;
  captureWrapper.style.padding = typeof mergedOptions.pagePadding === 'number' ? `${mergedOptions.pagePadding}px` : mergedOptions.pagePadding;
  captureWrapper.style.background = mergedOptions.pageGradient;
  captureWrapper.style.display = 'flex';
  captureWrapper.style.flexDirection = 'column';
  captureWrapper.style.alignItems = 'center'; 
  captureWrapper.style.boxSizing = 'border-box';
  captureWrapper.style.minHeight = 'auto'; 

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
  card.classList.add('capture-card-background');
  card.style.backgroundColor = mergedOptions.cardBackgroundColor;
  card.style.padding = typeof mergedOptions.cardPadding === 'number' ? `${mergedOptions.cardPadding}px` : mergedOptions.cardPadding;
  card.style.borderRadius = typeof mergedOptions.cardBorderRadius === 'number' ? `${mergedOptions.cardBorderRadius}px` : mergedOptions.cardBorderRadius;
  card.style.boxShadow = mergedOptions.cardBoxShadow;
  card.style.width = '100%'; 
  card.style.maxWidth = mergedOptions.cardMaxWidth;
  card.style.boxSizing = 'border-box';
  card.style.overflow = 'hidden'; 
  card.style.flexGrow = '1';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  
  const clone = elementToClone.cloneNode(true) as HTMLElement;

  const scripts = clone.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  const iframes = clone.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.remove());
  const allElements = clone.querySelectorAll('*');
  allElements.forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  forceStyles(clone, card.style.backgroundColor);

  card.appendChild(clone);
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

  // 2. Create an iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px'; // Position off-screen
  iframe.style.left = '-9999px';
  iframe.style.width = `${mergedOptions.pageWidth + 20}px`; // Add some buffer for scrollbars if any
  iframe.style.height = '100px'; // Initial small height, will be adjusted
  iframe.style.border = 'none';
  iframe.sandbox.add('allow-same-origin'); // IMPORTANT: Allow same origin to access content, but NO allow-scripts

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
        iframeDoc.body.innerHTML = captureWrapper.outerHTML; // Inject the styled wrapper

        // Find the injected wrapper within the iframe
        const elementToCaptureInIframe = iframeDoc.body.firstChild as HTMLElement;

        if (!elementToCaptureInIframe) {
            console.error('Could not find the capture element inside iframe');
            rejectPromise(new Error('Could not find element in iframe'));
            return;
        }
        
        // Adjust iframe height to content
        iframe.style.height = `${elementToCaptureInIframe.scrollHeight}px`;
        iframe.style.width = `${elementToCaptureInIframe.scrollWidth}px`; // Ensure width matches content too

        const canvasOptions = {
          useCORS: mergedOptions.useCORS !== undefined ? mergedOptions.useCORS : true,
          logging: mergedOptions.logging !== undefined ? mergedOptions.logging : false,
          backgroundColor: mergedOptions.backgroundColor !== undefined ? mergedOptions.backgroundColor : null, 
          scale: mergedOptions.scale || (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1),
          // Capture the specific element from iframe
          height: elementToCaptureInIframe.scrollHeight,
          width: elementToCaptureInIframe.scrollWidth,
          windowHeight: elementToCaptureInIframe.scrollHeight, // Use element's scrollHeight for windowHeight
          windowWidth: elementToCaptureInIframe.scrollWidth,  // Use element's scrollWidth for windowWidth
        };
        
        console.log('Capturing iframe content with html2canvas...', canvasOptions);
        const canvas = await html2canvas(elementToCaptureInIframe, canvasOptions as any);

        canvas.toBlob((blob) => {
          resolvePromise(blob);
        }, 'image/png');

      } catch (error) {
        console.error('Error during html2canvas processing with iframe:', error);
        rejectPromise(error);
      } finally {
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
    
    // Setting srcdoc will trigger onload. Ensure the body exists.
    if (iframe.contentDocument && iframe.contentDocument.body) {
        iframe.contentDocument.body.innerHTML = ''; // Clear previous content just in case
    }
    iframe.srcdoc = `<!DOCTYPE html><html><head><style>body { margin: 0; }</style></head><body></body></html>`; // Basic HTML structure for srcdoc
    // The actual content is injected in iframe.onload

  });
} 