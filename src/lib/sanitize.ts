/**
 * Sanitize HTML trước khi lưu (CLAUDE.md Mục 1.5 & 12.B). Áp cho nội dung bài viết
 * (kể cả import từ Word/.docx). Allowlist an toàn — chặn script/style/iframe/sự kiện.
 */
import sanitizeHtml from 'sanitize-html';

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr', 'blockquote', 'pre', 'code',
      'strong', 'b', 'em', 'i', 'u', 's',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'figure', 'figcaption', 'span', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    // Ép link ngoài an toàn.
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
    // Chỉ cho phép một số thuộc tính style vô hại.
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'font-weight': [/^bold$/, /^\d+$/],
        'font-style': [/^italic$/],
      },
    },
  });
}
