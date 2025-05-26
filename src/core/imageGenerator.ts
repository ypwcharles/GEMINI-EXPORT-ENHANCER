import html2canvas from 'html2canvas';

const PLACEHOLDER_SVG = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10px" fill="%23777">Image load error (CORS)</text></svg>';

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

function applyCanvasFriendlyCodeStyles(codeBlockElement: HTMLElement) {
  // Hide the header (language label, copy button)
  const header = codeBlockElement.querySelector<HTMLElement>('.code-block-decoration.header-formatted');
  if (header) {
    header.style.display = 'none';
  }

  // Remove the hidden code-editor container as it might interfere with height calculation
  const codeEditorContainer = codeBlockElement.querySelector<HTMLElement>('.code-editor-container');
  if (codeEditorContainer) {
    codeEditorContainer.remove();
  }

  // Style the main code block container
  codeBlockElement.style.backgroundColor = '#2d2d2d'; // Dark gray background
  codeBlockElement.style.color = '#cccccc';           // Light gray default text
  codeBlockElement.style.padding = '15px';
  codeBlockElement.style.borderRadius = '6px';
  codeBlockElement.style.fontFamily = '"Courier New", Courier, monospace';
  codeBlockElement.style.setProperty('line-height', '1.5', 'important'); // Ensure line height
  codeBlockElement.style.overflow = 'auto';          // Manage overflow

  // Explicitly reset padding/margin on the internal container if it exists
  const internalContainer = codeBlockElement.querySelector<HTMLElement>('.formatted-code-block-internal-container');
  if (internalContainer) {
      internalContainer.style.setProperty('padding', '0px', 'important');
      internalContainer.style.setProperty('margin', '0px', 'important');
  }

  // Style pre and code tags within this specific code block
  const preTag = codeBlockElement.querySelector('pre');
  if (preTag) {
    preTag.style.margin = '0px'; // Explicitly 0px
    preTag.style.padding = '0px'; // Explicitly 0px
    preTag.style.setProperty('margin-left', '0px', 'important');
    preTag.style.setProperty('padding-left', '0px', 'important');
    preTag.style.backgroundColor = 'transparent';
    preTag.style.color = 'inherit';
    preTag.style.setProperty('line-height', '1.5', 'important');
    preTag.style.whiteSpace = 'pre-wrap'; // Crucial for spacing and wrapping
    preTag.style.setProperty('text-indent', '0px', 'important'); // Reset text-indent
  }

  const codeTag = codeBlockElement.querySelector('code');
  if (codeTag) {
    codeTag.style.backgroundColor = 'transparent';
    codeTag.style.color = 'inherit';
    codeTag.style.fontFamily = 'inherit';
    codeTag.style.setProperty('line-height', '1.5', 'important');
    codeTag.style.whiteSpace = 'pre-wrap';
    codeTag.style.setProperty('margin', '0px', 'important'); // Reset margin for code tag
    codeTag.style.setProperty('padding', '0px', 'important'); // Reset padding for code tag
    codeTag.style.setProperty('text-indent', '0px', 'important'); // Reset text-indent

    // Attempt to trim leading/trailing whitespace/newlines from code content
    if (codeTag.firstChild && codeTag.firstChild.nodeType === Node.TEXT_NODE) {
      const replacedValue = codeTag.firstChild.nodeValue?.replace(/^\s*\n?/, '');
      codeTag.firstChild.nodeValue = replacedValue === undefined ? null : replacedValue;
    }

    let firstTextNodeTrimmed = false;
    for (let i = 0; i < codeTag.childNodes.length; i++) {
      const child = codeTag.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE && child.nodeValue) {
        if (!firstTextNodeTrimmed) {
          const originalLength = child.nodeValue.length;
          const replacedChildValue = child.nodeValue.replace(/^(\s*\n)+/, '');
          child.nodeValue = replacedChildValue; // nodeValue can accept string, it will handle null/empty if necessary
          if (child.nodeValue.length < originalLength) {
            firstTextNodeTrimmed = true;
          }
          if (child.nodeValue.trim().length > 0) { 
            firstTextNodeTrimmed = true; 
          }
        }
      }
      else if (child.nodeType !== Node.TEXT_NODE && !firstTextNodeTrimmed) {
        break; 
      }
    }
  }

  codeBlockElement.querySelectorAll<HTMLElement>('[class*="hljs"]').forEach(span => {
    span.style.backgroundColor = 'transparent'; 
  });

  // After all styling, try to set an explicit height to the codeBlockElement
  // to guide html2canvas and prevent excessive empty space.
  const preElement = codeBlockElement.querySelector('pre');
  let calculatedContentHeight = 0;

  if (preElement) {
    calculatedContentHeight = preElement.scrollHeight;
  }

  // If preElement's height is 0 or preElement doesn't exist, fallback to codeBlockElement's scrollHeight.
  if (calculatedContentHeight <= 0) {
    calculatedContentHeight = codeBlockElement.scrollHeight; 
  }

  if (calculatedContentHeight > 0) {
    let finalHeight = calculatedContentHeight;
    // If the height was derived from preElement, we need to add codeBlockElement's vertical padding.
    // codeBlockElement was styled with padding: '15px' earlier.
    if (preElement && preElement.scrollHeight > 0 && preElement.scrollHeight === calculatedContentHeight) { 
        const computedStyle = window.getComputedStyle(codeBlockElement);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
        if (!isNaN(paddingTop) && !isNaN(paddingBottom)) {
            finalHeight = calculatedContentHeight + paddingTop + paddingBottom;
        }
    } 
    // If calculatedContentHeight came from codeBlockElement.scrollHeight, 
    // it already includes its own padding, so no need to add it again.
    
    codeBlockElement.style.height = `${finalHeight}px`;
    codeBlockElement.style.maxHeight = `${finalHeight}px`;
    codeBlockElement.style.overflow = 'hidden'; // Ensure no scrollbars appear due to explicit height
  } else {
    // Fallback: If height calculation resulted in 0, do not set explicit height and remove overflow:hidden if set by mistake.
    // This case should be rare.
    codeBlockElement.style.removeProperty('height');
    codeBlockElement.style.removeProperty('max-height');
    codeBlockElement.style.removeProperty('overflow');
  }

  codeBlockElement.dataset.canvasStyledCodeblock = 'true';
}

// Modify forceStyles to more reliably skip these blocks
function forceStyles(
  element: HTMLElement,
  cardBackgroundColor: string,
  isRoot = true
) {
  // If it's a code block we've actively restyled, or inside one, stop.
  if (element.dataset.canvasStyledCodeblock === 'true' || element.closest('[data-canvas-styled-codeblock="true"]')) {
    return;
  }

  const genericCodeSelectors = 'code, [class*="hljs"]'; 

  if (!isRoot && element.matches(genericCodeSelectors) && !element.closest('[data-canvas-styled-codeblock="true"]')) {
      if (!element.style.backgroundColor) { 
          element.style.backgroundColor = 'rgba(0,0,0,0.05)'; 
      }
      return; 
  }

  if (isRoot) {
    element.style.backgroundColor = cardBackgroundColor;
  }

  const currentColor = window.getComputedStyle(element).color;
  if (!element.style.color &&
      (!currentColor || currentColor === 'rgba(0, 0, 0, 0)' || currentColor === 'transparent' || currentColor === 'rgb(255, 255, 255)')) {
     element.style.color = '#333333';
  }

  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    forceStyles(children[i] as HTMLElement, cardBackgroundColor, false);
  }
}

// Selector constants for removing interfering elements
const INTERFERING_ELEMENT_SELECTORS = [
  'source-footnote',          // Source footnote markers
  'sources-carousel-inline',  // Source carousel inline containers
  'sources-carousel',         // Source carousel components
  '.response-footer',         // Footer containing source list (distinct from our generated footer)
  '[hide-from-message-actions]', // General attribute used by Gemini for hidden interactive elements
  '.avatar-gutter',            // Remove the entire avatar area in normal chat
  '.response-container-header', // NEW: Remove the entire header of a response container (contains avatar, etc.)
  'model-thoughts .thoughts-header', // Remove the "Show thinking" button and its header
  'sensitive-memories-banner', // Remove sensitive content banners
  'tts-control',              // Remove text-to-speech controls
  'message-actions',          // Remove the entire message actions bar (thumbs up/down, share, etc.)
  '.gemini-enhancer-checkbox-wrapper', // Remove multi-select checkboxes
  // Add other selectors if needed
];

// NEW: Function to recursively transfer computed line-height
function transferComputedLineHeight(originalNode: Node, clonedNode: Node) {
    if (originalNode.nodeType === Node.ELEMENT_NODE && clonedNode.nodeType === Node.ELEMENT_NODE) {
        const originalElement = originalNode as HTMLElement;
        const clonedElement = clonedNode as HTMLElement;

        // Skip elements within code blocks or code blocks themselves, as they are handled separately
        if (originalElement.closest('div.code-block') || originalElement.matches('div.code-block')) {
             // Let applyCanvasFriendlyCodeStyles handle these later
        } else {
            try {
                const computedStyle = window.getComputedStyle(originalElement);
                const lineHeight = computedStyle.lineHeight;

                // Apply the computed line-height as an inline style to the clone
                // Only apply if it's a valid, non-zero value. 'normal' might be okay too.
                if (lineHeight && lineHeight !== '0px') {
                     clonedElement.style.lineHeight = lineHeight;
                }
            } catch (e) {
                // Getting computed style might fail for some elements (e.g., display: none)
                console.warn('Could not get computed style for', originalElement, e);
            }

            // Recurse for child nodes only if we processed this element
            const originalChildNodes = originalElement.childNodes;
            const clonedChildNodes = clonedElement.childNodes;
            // Ensure lengths match (cloneNode should guarantee this, but added safety)
            const numChildren = Math.min(originalChildNodes.length, clonedChildNodes.length);

            for (let i = 0; i < numChildren; i++) {
                transferComputedLineHeight(originalChildNodes[i], clonedChildNodes[i]);
            }
        }
    }
    // We don't need to handle text nodes specifically for line-height
}
// END NEW Function

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

  // 1. Clone the original element
  const cleanedClone = element.cloneNode(true) as HTMLElement;

  // --- NEW: Transfer computed line-height from original to clone ---
  try {
      console.log("Transferring computed line-height...");
      transferComputedLineHeight(element, cleanedClone);
      console.log("Finished transferring computed line-height.");
  } catch (e) {
      console.error("Error transferring computed line-height:", e);
      // Proceed anyway, but log the error
  }
  // --- END NEW ---

  // REMOVED manual display:none for avatar parts and thoughts-header as they should be handled by INTERFERING_ELEMENT_SELECTORS
  // const avatarSpinner = cleanedClone.querySelector<HTMLElement>('bard-avatar .avatar_spinner_animation');
  // if (avatarSpinner) { avatarSpinner.style.display = 'none'; }
  // const primaryAvatarAnimation = cleanedClone.querySelector<HTMLElement>('bard-avatar .avatar_primary_animation');
  // if (primaryAvatarAnimation) { primaryAvatarAnimation.style.display = 'none'; }
  // const bardAvatarElement = cleanedClone.querySelector<HTMLElement>('bard-avatar');
  // if (bardAvatarElement) { bardAvatarElement.style.display = 'none'; }
  // const thoughtsHeader = cleanedClone.querySelector<HTMLElement>('model-thoughts .thoughts-header');
  // if (thoughtsHeader) { thoughtsHeader.style.display = 'none'; }

  // 1.b Clean the clone by REMOVING interfering elements
  INTERFERING_ELEMENT_SELECTORS.forEach(selector => {
    cleanedClone.querySelectorAll(selector).forEach(el => {
      console.log('Removing interfering element for screenshot:', selector, el);
      el.remove();
    });
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

  // --- START: Modify Google User Content Image URLs to Full Size ---
  console.log('Searching for Google User Content images to resize...');
  const imagesInClone = cleanedClone.querySelectorAll('img');
  imagesInClone.forEach(img => {
    if (img.src && img.src.startsWith('https://lh3.googleusercontent.com/')) {
      try {
        let url = new URL(img.src);
        let pathSegments = url.pathname.split('/');
        let lastSegment = pathSegments[pathSegments.length - 1];

        if (lastSegment.includes('=')) {
          // If last segment already contains an image option, replace it with =d
          // Ensure not to create something like image.jpg=d if original was image.jpg
          if (!lastSegment.match(/\.[a-zA-Z]+$/) || lastSegment.includes('=')) { // Check if it's not just an extension or already has options
            lastSegment = lastSegment.substring(0, lastSegment.indexOf('=')) + '=d';
          } else if (!lastSegment.endsWith('=d')) { // It's like image.jpg, append =d
             lastSegment += '=d';
          }
        } else if (!lastSegment.endsWith('=d')) {
          // If no options, just append =d
          lastSegment += '=d';
        }
        
        // Only proceed if changes were made or it wasn't =d already
        if (!url.pathname.endsWith('/' + lastSegment) || url.search !== '') {
            pathSegments[pathSegments.length - 1] = lastSegment;
            url.pathname = pathSegments.join('/');
            url.search = ''; // Clear existing search parameters

            const newSrc = url.toString();
            if (img.src !== newSrc) {
                console.log('Original image URL:', img.src);
                img.src = newSrc;
                console.log('Modified image URL to full size:', img.src);
            }
        }
      } catch (e) {
        console.error('Error processing image URL for full size:', img.src, e);
      }
    }
  });
  console.log('Finished searching for Google User Content images.');
  // --- END: Modify Google User Content Image URLs to Full Size ---

  // --- START: Set crossOrigin and Pre-load Test for all images in cleanedClone ---
  const imageProcessingPromises = Array.from(imagesInClone).map(img => processImageElement(img));
  await Promise.allSettled(imageProcessingPromises);
  console.log('Finished setting crossOrigin and pre-loading tests for images in generateImageBlob.');
  // --- END: Set crossOrigin and Pre-load Test ---

  // The new function applyCanvasFriendlyCodeStyles handles line-height for code blocks,
  // so the loop below is no longer needed and might conflict.
  // const codeElements = cleanedClone.querySelectorAll('pre, code');
  // codeElements.forEach((codeEl: Element) => {
  //     if (codeEl instanceof HTMLElement) {
  //         codeEl.style.lineHeight = 'normal'; 
  //     }
  // });

  // --- Apply new canvas-friendly styles to ALL code blocks within the clone ---
  const allCodeBlocksInClone = cleanedClone.querySelectorAll<HTMLElement>('div.code-block');
  allCodeBlocksInClone.forEach(codeBlockEl => {
    applyCanvasFriendlyCodeStyles(codeBlockEl);
  });
  // --- End of new code block styling ---

  // Force general styles (like card background, default text color for non-code elements)
  // on the *cleaned* clone before appending it to the wrapper.
  // forceStyles will skip elements inside data-canvas-styled-codeblock="true"
  forceStyles(cleanedClone, mergedOptions.cardBackgroundColor, true);

  // --- BEGIN MODIFICATION: Add margin to H1 in deep research content for better spacing ---
  const isDeepResearchMessageContentRoot = cleanedClone.tagName === 'MESSAGE-CONTENT' && cleanedClone.id === 'extended-response-message-content';
  const isDeepResearchImmersiveEditorRoot = cleanedClone.tagName === 'IMMERSIVE-EDITOR' && cleanedClone.getAttribute('data-test-id') === 'immersive-editor';

  if (isDeepResearchMessageContentRoot || isDeepResearchImmersiveEditorRoot) {
    let h1Selector = '';
    if (isDeepResearchMessageContentRoot) {
      h1Selector = '.markdown h1:first-of-type'; 
    } else if (isDeepResearchImmersiveEditorRoot) {
      h1Selector = '.ProseMirror h1:first-of-type'; 
    }

    if (h1Selector) {
      const firstH1 = cleanedClone.querySelector<HTMLElement>(h1Selector);
      if (firstH1) {
        console.log("Found H1 in deep research content:", firstH1, "with selector:", h1Selector);
        // --- BEGIN MODIFICATION: Adjust H1 line-height if it's multiline ---
        // Check if the H1 is likely multiline by comparing its scrollHeight to its clientHeight or a typical single line height
        // Or, more simply, just apply a more generous line-height if it's a deep research H1.
        const originalLineHeight = window.getComputedStyle(firstH1).lineHeight;
        firstH1.style.setProperty('line-height', '1.5', 'important'); 
        console.log(`Applied line-height: 1.5 !important to H1 in deep research (mode: ${isDeepResearchMessageContentRoot ? 'message' : 'editor'}). Original line-height: ${originalLineHeight}`);
        // --- END MODIFICATION ---

        if (firstH1.nextElementSibling && firstH1.nextElementSibling.tagName === 'P') {
          firstH1.style.marginBottom = '24px'; // Keep existing margin adjustment
          console.log(`Applied 24px margin-bottom to H1 in deep research (mode: ${isDeepResearchMessageContentRoot ? 'message' : 'editor'}, next sibling is P).`);
        } else {
          console.log("H1 in deep research found, but next sibling is not a P or doesn't exist. Current H1 margin-bottom:", window.getComputedStyle(firstH1).marginBottom);
        }
      } else {
        console.log("Deep research H1 not found using selector:", h1Selector, "within cleanedClone:", cleanedClone);
      }
    }
  }
  // --- END MODIFICATION ---

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
  const cardMaxWidth = mergedOptions.cardMaxWidth;
  card.style.maxWidth = cardMaxWidth;
  card.style.boxSizing = 'border-box';
  card.style.overflow = 'hidden'; // Prevent content spillover affecting layout
  card.style.flexGrow = '1';
  card.style.display = 'flex'; // Use flex for internal alignment if needed
  card.style.flexDirection = 'column'; // Stack content vertically


  // Append the modified clone to the card content area
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

// Helper function to process individual image elements for CORS and fallback
async function processImageElement(img: HTMLImageElement): Promise<void> {
  const originalSrc = img.src;
  img.crossOrigin = 'anonymous';
  // console.log('Set crossOrigin="anonymous" for image:', originalSrc); // Log for every image

  if (originalSrc && originalSrc.startsWith('https://lh3.googleusercontent.com/')) {
    // console.log('Performing pre-load test for Google User Content image:', originalSrc);
    const testImage = new Image();
    testImage.crossOrigin = 'anonymous';
    testImage.src = originalSrc; // Use the (potentially =d modified) src

    try {
      await new Promise((resolve, reject) => {
        testImage.onload = resolve;
        testImage.onerror = (err) => {
          // Log the specific error object if needed, or just the event itself
          // console.error('Test image onerror event:', err); 
          reject(new Error(`Pre-load failed for ${originalSrc}`));
        };
      });
      // If loaded successfully, ensure the img.src reflects the final URL after any redirects.
      if (img.src !== testImage.src) {
        // console.log(`Redirect detected or src mismatch for ${originalSrc}. Updated src to: ${testImage.src}`);
        img.src = testImage.src;
      }
      // console.log('Pre-load test successful for:', testImage.src);
    } catch (e) {
      console.warn(`CORS pre-load check failed for image: ${originalSrc}. Replacing with placeholder. Error:`, e);
      img.src = PLACEHOLDER_SVG;
      img.alt = 'Image failed to load due to security restrictions (CORS or other error)';
      // Optionally set width/height to maintain layout if placeholder is a different aspect ratio
      // img.style.width = '100px'; 
      // img.style.height = '60px';
    }
  }
}


/**
 * Generates a single image Blob from multiple HTML elements, combining them into one vertical image.
 *
 * @param elements An array of HTML elements to capture and combine.
 * @param options Optional style and html2canvas options.
 * @returns A Promise that resolves with the image Blob, or null if an error occurs.
 */
export async function generateCombinedImageBlob(
  messages: Array<{ element: HTMLElement; type: 'user' | 'model' }>, // Updated signature
  options?: Partial<ImageStyleOptions>
): Promise<Blob | null> {
  if (!messages || messages.length === 0) { // Updated check
    console.error('No messages provided for combined image generation.');
    return null;
  }

  const mergedOptions = { ...DEFAULT_STYLES, ...options };

  // 1. Create the styled wrapper structure (page and main card)
  const captureWrapper = document.createElement('div');
  captureWrapper.style.position = 'fixed';
  captureWrapper.style.top = '0';
  captureWrapper.style.left = '0';
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

  const mainCard = document.createElement('div');
  mainCard.classList.add('capture-card-background');
  mainCard.style.backgroundColor = mergedOptions.cardBackgroundColor;
  mainCard.style.padding = typeof mergedOptions.cardPadding === 'number' ? `${mergedOptions.cardPadding}px` : mergedOptions.cardPadding;
  mainCard.style.borderRadius = typeof mergedOptions.cardBorderRadius === 'number' ? `${mergedOptions.cardBorderRadius}px` : mergedOptions.cardBorderRadius;
  mainCard.style.boxShadow = mergedOptions.cardBoxShadow;
  mainCard.style.width = '100%';
  mainCard.style.maxWidth = mergedOptions.cardMaxWidth;
  mainCard.style.boxSizing = 'border-box';
  mainCard.style.overflow = 'hidden';
  mainCard.style.flexGrow = '1';
  mainCard.style.display = 'flex';
  mainCard.style.flexDirection = 'column';

  // 2. Message Processing Loop
  for (let i = 0; i < messages.length; i++) { // Updated loop
    const item = messages[i];
    const originalElement = item.element;
    const messageType = item.type;
    const messageClone = originalElement.cloneNode(true) as HTMLElement;

    // 2a. Transfer computed line-height (optional, but good for consistency)
    try {
      transferComputedLineHeight(originalElement, messageClone); // No change here
    } catch (e) {
      console.warn("Error transferring computed line-height for a message clone:", e);
    }

    // 2b. Clean messageClone: remove interfering elements, scripts, iframes, event handlers
    INTERFERING_ELEMENT_SELECTORS.forEach(selector => {
      messageClone.querySelectorAll(selector).forEach(el => el.remove());
    });
    messageClone.querySelectorAll('script, iframe').forEach(el => el.remove());
    const allElementsInMessageClone = messageClone.querySelectorAll('*');
    allElementsInMessageClone.forEach(el => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      }
    });

    // 2c. Apply URL Transformation for Google User Content images & then process with pre-load test
    const imagesInMessageClone = Array.from(messageClone.querySelectorAll('img'));
    const currentMessageImageProcessingPromises: Promise<void>[] = [];

    for (const img of imagesInMessageClone) {
      if (img.src && img.src.startsWith('https://lh3.googleusercontent.com/')) {
        try {
          let url = new URL(img.src);
          let pathSegments = url.pathname.split('/');
          let lastSegment = pathSegments[pathSegments.length - 1];
          if (lastSegment.includes('=')) {
            if (!lastSegment.match(/\.[a-zA-Z]+$/) || lastSegment.includes('=')) {
              lastSegment = lastSegment.substring(0, lastSegment.indexOf('=')) + '=d';
            } else if (!lastSegment.endsWith('=d')) {
               lastSegment += '=d';
            }
          } else if (!lastSegment.endsWith('=d')) {
            lastSegment += '=d';
          }
          if (!url.pathname.endsWith('/' + lastSegment) || url.search !== '') {
              pathSegments[pathSegments.length - 1] = lastSegment;
              url.pathname = pathSegments.join('/');
              url.search = '';
              const newSrc = url.toString();
              if (img.src !== newSrc) {
                  // console.log('Original image URL (combined):', img.src);
                  img.src = newSrc;
                  // console.log('Modified image URL to full size (combined):', img.src);
              }
          }
        } catch (e) {
          console.error('Error processing image URL for full size in combined image message clone:', img.src, e);
        }
      }
      // Add the promise from processImageElement to the list for this message clone
      currentMessageImageProcessingPromises.push(processImageElement(img));
    }
    // Wait for all images in the current message clone to be processed (crossOrigin, pre-load)
    await Promise.allSettled(currentMessageImageProcessingPromises);
    // console.log(`Finished image processing for message clone ${i}`);

    // 2d. Style Code Blocks
    const codeBlocksInMessageClone = messageClone.querySelectorAll<HTMLElement>('div.code-block');
    codeBlocksInMessageClone.forEach(codeBlockEl => {
      applyCanvasFriendlyCodeStyles(codeBlockEl);
    });

    // 2e. Force General Styles (pass 'transparent' and isRoot=false)
    // This aims to style text, etc., without applying a background to the individual messageClone.
    forceStyles(messageClone, 'transparent', false);
    // Ensure the direct messageClone itself does not have a conflicting background from its original state initially.
    messageClone.style.backgroundColor = 'transparent';


    // 2f. Conditional Alignment and Styling & Append to mainCard
    if (messageType === 'user') {
      const alignWrapper = document.createElement('div');
      alignWrapper.style.display = 'flex';
      alignWrapper.style.justifyContent = 'flex-end';
      alignWrapper.style.width = '100%';
      alignWrapper.style.marginBottom = '10px'; // Spacing for the wrapper

      // Style the user message bubble
      messageClone.style.maxWidth = '85%';
      messageClone.style.backgroundColor = '#d1eaff'; // Light blue background
      messageClone.style.padding = '12px';
      messageClone.style.borderRadius = '16px';
      messageClone.style.color = '#1c1c1e'; // Darker text
      messageClone.style.boxSizing = 'border-box';
      // Ensure any direct text nodes in messageClone also get the user message text color
      // This is a bit of a heavy-handed way; ideally, text color is inherited or set on specific text elements.
      // However, user queries are often simple text.
      messageClone.style.color = '#1c1c1e';


      alignWrapper.appendChild(messageClone);
      mainCard.appendChild(alignWrapper);
    } else { // Model message
      // Style model message bubble (optional, or leave as is if it takes card background)
      messageClone.style.maxWidth = '100%';
      messageClone.style.marginBottom = '10px'; // Spacing for the block
      // messageClone.style.backgroundColor = '#f0f0f0'; // Optional distinct background for model messages
      // messageClone.style.padding = '12px'; // Optional padding
      // messageClone.style.borderRadius = '16px'; // Optional border radius
      mainCard.appendChild(messageClone);
    }

    // 2g. Add Separator (if not the last message)
    if (i < messages.length - 1) { // Updated loop condition
      const separator = document.createElement('hr');
      separator.style.cssText = 'border: none; border-top: 1px solid #e0e0e0; margin: 15px 0; width: 100%;';
      // The separator should be a direct child of mainCard, not inside alignWrapper
      mainCard.appendChild(separator);
    }
  }

  captureWrapper.appendChild(mainCard); // Append the main card containing all messages

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

  // 3. Iframe and html2canvas logic (similar to generateImageBlob)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = `${mergedOptions.pageWidth + 40}px`;
  iframe.style.height = '100px';
  iframe.style.border = 'none';
  iframe.sandbox.add('allow-same-origin');
  document.body.appendChild(iframe);

  return new Promise((resolvePromise, rejectPromise) => {
    iframe.onload = async () => {
      try {
        if (!iframe.contentWindow || !iframe.contentWindow.document) {
          console.error('iframe contentWindow or document not available for combined image.');
          rejectPromise(new Error('iframe content not available'));
          return;
        }

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.body.style.margin = '0';
        iframeDoc.body.innerHTML = captureWrapper.outerHTML;

        const elementToCaptureInIframe = iframeDoc.body.firstChild as HTMLElement;
        if (!elementToCaptureInIframe) {
          console.error('Could not find the capture element inside iframe for combined image.');
          rejectPromise(new Error('Could not find element in iframe'));
          return;
        }

        const contentHeight = elementToCaptureInIframe.scrollHeight;
        const contentWidth = elementToCaptureInIframe.scrollWidth;
        iframe.style.height = `${contentHeight}px`;
        iframe.style.width = `${contentWidth}px`;

        await new Promise(resolve => setTimeout(resolve, 100)); // Delay

        const canvasOptions = {
          useCORS: mergedOptions.useCORS,
          logging: mergedOptions.logging,
          backgroundColor: null,
          scale: mergedOptions.scale || (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1),
        };

        const canvas = await html2canvas(elementToCaptureInIframe, canvasOptions as any);
        canvas.toBlob((blob) => {
          if (blob) {
            resolvePromise(blob);
          } else {
            rejectPromise(new Error('Canvas to Blob conversion failed for combined image'));
          }
        }, 'image/png');

      } catch (error) {
        console.error('Error during html2canvas processing for combined image:', error);
        rejectPromise(error);
      } finally {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    };

    iframe.onerror = (err) => {
      console.error("Failed to load iframe srcdoc for combined image:", err);
      rejectPromise(new Error("iframe srcdoc loading failed"));
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
    iframe.srcdoc = `<!DOCTYPE html><html><head><style>body { margin: 0; }</style></head><body></body></html>`;
  });
}