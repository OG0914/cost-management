import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * 渲染 Markdown 为安全的 HTML
 * @param {string} markdown - Markdown 文本
 * @returns {string} - 安全的 HTML
 */
export const renderMarkdown = (markdown) => {
  if (!markdown) return ''

  try {
    // 使用默认 marked 渲染，不自定义 renderer
    const rawHtml = marked.parse(markdown, {
      gfm: true,
      breaks: true,
      async: false
    })

    // 使用 DOMPurify 净化
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
        'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre',
        'a', 'img', 'blockquote', 'table', 'thead', 'tbody',
        'tr', 'th', 'td', 'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'id', 'class', 'target', 'rel']
    })
  } catch (err) {
    console.error('Markdown 渲染错误:', err)
    return `<p class="text-red-500">内容渲染失败: ${err.message}</p>`
  }
}

export default renderMarkdown
