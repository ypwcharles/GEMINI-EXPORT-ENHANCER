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
  cardBoxShadow: '0 10px 25px rgba(0,0,0,0.1)',
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

// Helper function to recursively set text color and transparent background
function forceStyles(element: HTMLElement) {
  element.style.color = '#000000'; // Force black text
  // Set background to transparent unless it's the card itself or a specific element we want to keep
  if (!element.classList.contains('capture-card-background')) { 
    element.style.backgroundColor = 'transparent';
  }

  // Handle specific elements like <code> blocks for better visibility if needed
  if (element.tagName === 'CODE' || element.tagName === 'PRE') {
    element.style.backgroundColor = '#f0f0f0'; // Light gray for code blocks
    element.style.padding = '2px 4px';
    element.style.borderRadius = '4px';
  }

  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    forceStyles(children[i] as HTMLElement);
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

  const captureWrapper = document.createElement('div');
  captureWrapper.style.position = 'fixed';
  captureWrapper.style.top = '-9999px'; 
  captureWrapper.style.left = '-9999px';
  captureWrapper.style.width = `${mergedOptions.pageWidth}px`;
  captureWrapper.style.padding = typeof mergedOptions.pagePadding === 'number' ? `${mergedOptions.pagePadding}px` : mergedOptions.pagePadding;
  captureWrapper.style.background = mergedOptions.pageGradient;
  captureWrapper.style.display = 'flex';
  captureWrapper.style.flexDirection = 'column';
  captureWrapper.style.alignItems = 'center'; 
  captureWrapper.style.boxSizing = 'border-box';
  captureWrapper.style.minHeight = 'auto'; // Let content determine height initially

  if (mergedOptions.pageTitle) {
    const titleElement = document.createElement('h1');
    titleElement.textContent = mergedOptions.pageTitle;
    titleElement.style.color = mergedOptions.pageTitleColor;
    titleElement.style.fontSize = mergedOptions.pageTitleFontSize;
    titleElement.style.fontWeight = mergedOptions.pageTitleFontWeight;
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = mergedOptions.pageTitleMarginBottom;
    titleElement.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    titleElement.style.flexShrink = '0'; // Prevent title from shrinking
    captureWrapper.appendChild(titleElement);
  }

  const card = document.createElement('div');
  card.classList.add('capture-card-background'); // Add class for forceStyles exclusion
  card.style.backgroundColor = mergedOptions.cardBackgroundColor;
  card.style.padding = typeof mergedOptions.cardPadding === 'number' ? `${mergedOptions.cardPadding}px` : mergedOptions.cardPadding;
  card.style.borderRadius = typeof mergedOptions.cardBorderRadius === 'number' ? `${mergedOptions.cardBorderRadius}px` : mergedOptions.cardBorderRadius;
  card.style.boxShadow = mergedOptions.cardBoxShadow;
  card.style.width = '100%'; 
  card.style.maxWidth = mergedOptions.cardMaxWidth;
  card.style.boxSizing = 'border-box';
  card.style.overflow = 'hidden'; 
  card.style.flexGrow = '1'; // Allow card to grow and fill available space
  card.style.display = 'flex'; // To help manage content flow if needed
  card.style.flexDirection = 'column'; // Content flows top to bottom
  
  const clone = elementToClone.cloneNode(true) as HTMLElement;
  forceStyles(clone); // Apply black text and transparent background recursively
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
    footerElement.style.flexShrink = '0'; // Prevent footer from shrinking
    captureWrapper.appendChild(footerElement);
  }

  document.body.appendChild(captureWrapper);
  // Force a reflow to ensure dimensions are calculated before capture
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = captureWrapper.offsetHeight; 

  try {
    // Prepare html2canvas options separately
    const canvasOptions = {
      useCORS: mergedOptions.useCORS !== undefined ? mergedOptions.useCORS : true,
      logging: mergedOptions.logging !== undefined ? mergedOptions.logging : false,
      backgroundColor: mergedOptions.backgroundColor !== undefined ? mergedOptions.backgroundColor : null,
      scale: mergedOptions.scale || (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1),
      // Ensure the entire captureWrapper is captured even if content is small
      height: captureWrapper.scrollHeight,
      width: captureWrapper.scrollWidth,
      windowHeight: captureWrapper.scrollHeight,
      windowWidth: captureWrapper.scrollWidth,
      // --- Add any other specific html2canvas options from mergedOptions here if needed ---
    };

    console.log('Capturing styled wrapper with html2canvas...', canvasOptions);
    // Pass the prepared options directly
    const canvas = await html2canvas(captureWrapper, canvasOptions as any); // Cast to any remains needed for flexibility

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  } catch (error) {
    console.error('Error generating image with styled wrapper:', error);
    return null;
  } finally {
    if (document.body.contains(captureWrapper)) {
      document.body.removeChild(captureWrapper);
    }
  }
} 