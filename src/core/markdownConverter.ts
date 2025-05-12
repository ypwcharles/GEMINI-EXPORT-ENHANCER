import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm'; // 导入 gfm 插件

/**
 * 将 HTML 字符串转换为 Markdown 字符串。
 * @param htmlString 要转换的 HTML 字符串。
 * @returns 转换后的 Markdown 字符串。
 */
export function htmlToMarkdown(htmlString: string): string {
  // 初始化 Turndown 服务
  const turndownService = new TurndownService({
    // gfm: true, // 移除此行，因为 gfm 是通过 use() 方法应用的
    codeBlockStyle: 'fenced', // 使用 ``` 作为代码块标记
    headingStyle: 'atx', // 使用 # 风格的标题
    bulletListMarker: '-', // 使用 - 作为无序列表标记
    linkStyle: 'inlined', // 内联链接样式
  });

  // 使用 GFM 插件
  turndownService.use(gfm);

  // (可选) 添加自定义规则，例如处理特定的 Gemini HTML 结构
  // turndownService.addRule('geminiCodeBlock', {
  //   filter: (node) => {
  //     // 示例：如果 Gemini 的代码块有特定类名或结构
  //     return node.nodeName === 'PRE' && node.classList.contains('gemini-code-block');
  //   },
  //   replacement: (content, node) => {
  //     // 自定义代码块的处理逻辑
  //     const language = (node as HTMLElement).getAttribute('data-language') || '';
  //     return `\`\`\`${language}\n${content}\n\`\`\``;
  //   }
  // });

  // 执行转换
  const markdown = turndownService.turndown(htmlString);

  return markdown;
} 