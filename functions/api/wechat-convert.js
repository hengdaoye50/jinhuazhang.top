// Markdown → 微信公众号 HTML 转换器
function mdToWechat(md) {
  // 去除 TOML frontmatter
  md = md.replace(/^\+\+\+[\s\S]*?\+\+\+\s*/g, '');

  // 转义 HTML
  md = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 代码块 ``` ... ```
  md = md.replace(/```(\w*)\n([\s\S]*?)```/g, function(_, lang, code) {
    return '<pre style="background:#2d2d2d;color:#f8f8f2;padding:16px;border-radius:6px;overflow-x:auto;font-size:13px;line-height:1.6;margin:16px 0;"><code>' + code.trim() + '</code></pre>';
  });

  // 行内代码 `code`
  md = md.replace(/`([^`]+)`/g, '<code style="background:#f0e8d8;color:#c7254e;padding:2px 6px;border-radius:3px;font-size:13px;">$1</code>');

  // 图片 ![alt](url)
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<p style="text-align:center;margin:16px 0;"><img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:6px;"></p>');

  // 链接 [text](url)
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#576b95;text-decoration:none;">$1</a>');

  // 标题
  md = md.replace(/^#### (.+)$/gm, '<h4 style="font-size:16px;margin:20px 0 10px;color:#333;">$1</h4>');
  md = md.replace(/^### (.+)$/gm, '<h3 style="font-size:18px;margin:24px 0 10px;color:#333;">$1</h3>');
  md = md.replace(/^## (.+)$/gm, '<h2 style="font-size:20px;margin:28px 0 12px;color:#222;border-left:4px solid #7E0C6E;padding-left:12px;">$1</h2>');
  md = md.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;margin:32px 0 16px;color:#111;text-align:center;">$1</h1>');

  // 粗体 **text**
  md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 斜体 *text*
  md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 引用 > text
  md = md.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #7E0C6E;padding:8px 16px;margin:16px 0;background:#f9f4f5;color:#666;font-size:14px;">$1</blockquote>');

  // 分割线 ---
  md = md.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e0d8cc;margin:24px 0;">');

  // 列表 - item
  md = md.replace(/^- (.+)$/gm, '<li style="margin:4px 0;color:#333;">$1</li>');
  // 包装连续的 li
  md = md.replace(/(<li[^>]*>.*?<\/li>)\n(?=<li)/g, '$1');
  md = md.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul style="padding-left:24px;margin:12px 0;">$1</ul>');

  // 段落：剩余的非空行
  md = md.replace(/^(?!<[a-z\/])(.+)$/gm, '<p style="margin:10px 0;line-height:1.9;color:#333;font-size:15px;text-align:justify;">$1</p>');

  // 清理多余空行和 HTML 标签内的换行
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.replace(/<\/p>\s*<p/g, '</p><p');

  return md.trim();
}

export async function onRequest({ request }) {
  if (request.method !== 'POST') {
    return new Response('POST only', { status: 405 });
  }

  const body = await request.json().catch(() => ({}));
  const html = mdToWechat(body.content || '');

  const fullPage = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>微信公众号文章</title>
</head>
<body style="max-width:680px;margin:0 auto;padding:20px 16px;font-family:-apple-system,'Noto Sans SC',sans-serif;">
${html}
</body>
</html>`;

  return new Response(JSON.stringify({ html: fullPage }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
