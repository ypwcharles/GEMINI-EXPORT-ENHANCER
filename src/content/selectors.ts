/**
 * DOM选择器，用于定位Gemini页面上的关键元素。
 * 注意：这些是占位符，你需要根据实际的Gemini页面DOM结构进行更新。
 */
export const GEMINI_SELECTORS = {
  /**
   * 选择器，用于定位每个回答（answer）的容器元素。
   * 修改为指向包裹了回答内容和底部操作栏的 <model-response> 元素
   */
  answerContainer: 'model-response',

  /**
   * 用于定位回答内容本身，以便提取HTML。
   * 使用多个候选选择器，按优先级排序。
   */
  answerContent: 'div.response-container-content message-content .markdown',

  // 备选选择器，在主选择器失败时尝试
  answerContentFallbacks: [
    'message-content .markdown',
    '.response-container-content .markdown',
    '.model-response-text .markdown',
    '.markdown.markdown-main-panel'
  ],

  /**
   * 选择器，用于定位每个回答中我们想要注入自定义按钮的区域。
   * 基于实际代码，我们选择使用分享按钮作为参考点
   */
  injectionPointInAnswer: 'button[data-test-id="share-and-export-menu-button"]',

  /**
   * 复制按钮选择器
   * 基于实际报告HTML代码
   */
  copyButton: 'button[data-test-id="copy-button"]',

  /**
   * 备用复制按钮选择器（基于组件类型）
   */
  copyButtonComponent: 'copy-button',

  /**
   * 备用复制按钮选择器（基于图标）
   */
  copyButtonByIcon: 'button mat-icon[fonticon="content_copy"]',

  /**
   * 备用选择器：使用aria-label定位分享按钮
   */
  shareButtonByAriaLabel: 'button[aria-label="分享和导出"]',

  /**
   * 备用选择器：使用包含特定图标的按钮
   */
  shareButtonByIcon: 'button mat-icon[fonticon="share"]',

  /**
   * 分享菜单相关选择器
   */
  shareMenu: {
    /**
     * 菜单面板
     */
    menuPanel: '.mat-mdc-menu-panel',
    
    /**
     * 分享对话内容按钮
     */
    shareButton: 'button[aria-label="分享对话内容"]',
    
    /**
     * 导出到Google文档按钮
     */
    exportToDocsButton: 'button[aria-label="导出到 Google 文档"]',
    
    /**
     * 导出为Gmail邮件草稿按钮
     */
    exportToGmailButton: 'button[aria-label="导出为 Gmail 邮件草稿"]',
    
    /**
     * 菜单中的分隔线，可作为我们自定义按钮的参考点
     */
    divider: 'mat-divider'
  },

  /**
   * 深度研究报告相关选择器，根据实际DOM结构组织
   */
  deepDiveReport: {
    /**
     * 深度研究面板的顶层标识元素
     */
    deepResearchPanel: 'deep-research-immersive-panel',

    /**
     * 深度研究报告的容器元素
     */
    container: '.toolbar.has-title',

    /**
     * 用于定位"深度研究"报告中我们想要注入自定义按钮的区域
     * 将会注入到 .action-buttons 中，此选择器指向作为参照的 "Export to Docs" 按钮
     */
    injectionPoint: 'export-to-docs-button[data-test-id="export-to-docs-button"]',

    /**
     * 用于定位深度研究报告内容本身，以便提取HTML
     */
    content: 'message-content[data-test-id="message-content"]',

    /**
     * 滚动容器元素
     */
    scrollContainer: 'div[data-test-id="scroll-container"]',

    /**
     * 响应容器，包含实际内容的最外层容器
     */
    responseContainer: 'div.response-container',

    /**
     * 响应内容区域层次结构
     */
    responseContent: {
      /**
       * 主要响应容器，包含flex布局
       */
      flexContainer: 'div.response-container.ng-star-inserted',

      /**
       * 带特殊功能的响应容器
       */
      containerWithGPI: 'div.response-container.response-container-with-gpi.tts-removed.ng-star-inserted',

      /**
       * 呈现的响应主容器
       */
      presentedContainer: 'div.presented-response-container',

      /**
       * 实际内容容器
       */
      contentContainer: 'div.response-container-content',

      /**
       * 底部区域
       */
      footer: 'div.response-container-footer'
    },

    /**
     * 深度研究报告工具栏相关选择器
     */
    toolbar: {
      /**
       * 工具栏容器
       */
      container: '.toolbar.has-title',

      /**
       * 左侧面板（包含标题和图标）
       */
      leftPanel: '.left-panel',

      /**
       * 报告标题
       */
      titleText: '.title-text',

      /**
       * 操作按钮区域
       */
      actionButtons: '.action-buttons',

      /**
       * 导出到Google文档按钮
       */
      exportToDocsButton: 'button[data-test-id="export-to-docs-button"]',

      /**
       * 音频概览按钮
       */
      audioOverviewButton: 'button[data-test-id="top-level-audio-overview-button"]',

      /**
       * 复制按钮
       */
      copyButton: 'button[data-test-id="copy-button"]',

      /**
       * 关闭按钮
       */
      closeButton: 'button[data-test-id="close-button"]'
    }
  },

  // 你可以根据需要添加更多选择器，例如：
  // - 用户头像
  // - 用户提问内容
  // - 回答的特定部分 (如代码块、表格等)
}; 