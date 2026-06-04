#!/usr/bin/env node
/**
 * Markdown → 微信公众号 / 知乎 / 小红书 格式转换工具
 *
 * 用法: node convert.js ../content/blog/2026-06-04_my-post.md
 * 输出: dist/output-wechat.html  dist/output-zhihu.md  dist/output-xiaohongshu.html
 */

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

// ─── 配置 ───────────────────────────────────────────
const SITE_URL = "https://jinhuazhang.top";
const DISPLAY_NAME = "张津华丨Jasper Zhang";

// ─── 命令行参数 ─────────────────────────────────────
const inputPath = process.argv[2];
if (!inputPath) {
  console.error("用法: node convert.js <markdown-file-path>");
  console.error("示例: node convert.js ../content/blog/2026-06-04_my-post.md");
  process.exit(1);
}

const fullInputPath = path.resolve(inputPath);
if (!fs.existsSync(fullInputPath)) {
  console.error(`文件不存在: ${fullInputPath}`);
  process.exit(1);
}

// ─── 读取并解析 Hugo Markdown ───────────────────────
const raw = fs.readFileSync(fullInputPath, "utf-8");

// 解析 TOML frontmatter（+++ 分隔符）
const fmMatch = raw.match(/^\+\+\+\s*\n([\s\S]*?)\n\+\+\+/);
if (!fmMatch) {
  console.error("未找到 Hugo TOML frontmatter");
  process.exit(1);
}

const frontmatterText = fmMatch[1];
const body = raw.slice(fmMatch[0].length).trim();

// 简易 TOML 解析（仅处理字符串、数组、布尔值）
function parseToml(text) {
  const result = {};
  const lines = text.split("\n");
  let currentArray = null;

  for (const line of lines) {
    // 跳过空行和注释
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // 内联数组: key = ["v1", "v2"]
    const inlineArrMatch = line.match(/^(\w+)\s*=\s*\[([^\]]*)\]\s*$/);
    if (inlineArrMatch) {
      const vals = inlineArrMatch[2]
        .split(",")
        .map(s => s.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
        .filter(s => s);
      result[inlineArrMatch[1]] = vals;
      currentArray = null;
      continue;
    }

    // 数组元素:   "value",
    const arrMatch = line.match(/^\s*"([^"]*)",?\s*$/);
    if (arrMatch && currentArray) {
      currentArray.push(arrMatch[1]);
      continue;
    }

    // 键值对: key = value
    const kvMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value = kvMatch[2].trim();

      // 数组开始: key = [
      if (value === "[") {
        currentArray = [];
        result[key] = currentArray;
        continue;
      }

      // 终止当前数组
      currentArray = null;

      // 字符串: "value"
      if (value.startsWith('"') && value.endsWith('"')) {
        result[key] = value.slice(1, -1);
      }
      // 单引号字符串: 'value'
      else if (value.startsWith("'") && value.endsWith("'")) {
        result[key] = value.slice(1, -1);
      }
      // 布尔值
      else if (value === "true" || value === "false") {
        result[key] = value === "true";
      }
      // 数字
      else if (/^\d+$/.test(value)) {
        result[key] = parseInt(value);
      }
      // 日期
      else {
        result[key] = value;
      }
    }
  }

  return result;
}

const fm = parseToml(frontmatterText);
const title = fm.title || "未命名";
const description = fm.description || "";
const tags = fm.tags || [];
const date = fm.date || new Date().toISOString().slice(0, 10);

console.log(`📄 标题: ${title}`);
console.log(`📅 日期: ${date}`);
console.log(`🏷  标签: ${tags.join(", ") || "无"}`);

// ─── 输出目录 ───────────────────────────────────────
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// ─── 清理 Hugo shortcodes ───────────────────────────
function cleanMarkdown(md) {
  return md
    .replace(/\{\{<[^>]*>\}\}/g, "")     // {{< shortcode >}}
    .replace(/\{\{%[^%]*%\}\}/g, "")      // {{% shortcode %}}
    .replace(/\{\{<[^>]*>\}\}/g, "");      // 再次清理可能残留的
}

const cleanedBody = cleanMarkdown(body);

// ─── 生成绝对图片 URL ──────────────────────────────
function absolutifyImages(html) {
  return html.replace(
    /src="(\/[^"]*)"/g,
    (_, src) => `src="${SITE_URL}${src}"`
  );
}

// ─── 输出 1: 微信公众号 HTML ────────────────────────
function generateWechatHTML() {
  const rawHTML = marked.parse(cleanedBody);
  const contentHTML = absolutifyImages(rawHTML);

  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(title)}</title>
</head>
<body style="margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#2c2c2c;line-height:1.85;font-size:16px;">

<!-- 公众号正文开始 — 复制此 body 内全部内容到微信编辑器 -->
<div style="max-width:680px;margin:0 auto;padding:20px 16px;">

<h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;line-height:1.4;text-align:center;">${escapeHTML(title)}</h1>

<p style="text-align:center;color:#999;font-size:13px;margin:0 0 24px 0;">
  ${escapeHTML(DISPLAY_NAME)} &nbsp;·&nbsp; ${date}
</p>

${contentHTML}

<hr style="border:none;border-top:1px solid #e8e8e8;margin:32px 0 16px 0;">

<p style="color:#999;font-size:13px;text-align:center;">
  原文链接：<a href="${SITE_URL}" style="color:#607fa6;text-decoration:none;">${escapeHTML(DISPLAY_NAME)}</a>
</p>

<p style="color:#bbb;font-size:12px;text-align:center;margin-top:8px;">
  标签：${tags.map(t => escapeHTML(t)).join(" · ")}
</p>

</div>
</body>
</html>`;

  return fullHTML;
}

// ─── 输出 2: 知乎 Markdown ──────────────────────────
function generateZhihuMarkdown() {
  // 知乎支持标准 Markdown，但图片需要绝对 URL
  let md = `# ${title}\n\n`;
  if (description) md += `> ${description}\n\n`;
  md += cleanedBody;
  // 将相对图片路径转为绝对
  md = md.replace(/\]\((\/[^)]+)\)/g, (_, p) => `](${SITE_URL}${p})`);
  md += `\n\n---\n*原文发布于 [${DISPLAY_NAME}](${SITE_URL})*`;
  return md;
}

// ─── 输出 3: 小红书卡片 HTML ────────────────────────
function generateXiaohongshuHTML() {
  // 小红书限制：正文最多 1000 字，提取前约 400 字的摘要
  let excerpt = cleanedBody
    .replace(/^#+\s+.*$/gm, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`>]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim()
    .slice(0, 400);

  // 在最后一个完整句子处截断
  const lastPeriod = Math.max(
    excerpt.lastIndexOf("。"),
    excerpt.lastIndexOf("，"),
    excerpt.lastIndexOf("；")
  );
  if (lastPeriod > 200) excerpt = excerpt.slice(0, lastPeriod + 1);

  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>小红书卡片 — ${escapeHTML(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh;
    background: #f0ebe3;
    font-family: 'Noto Sans SC', sans-serif;
  }

  .card {
    width: 540px;
    background: #FDF8F0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(126,12,110,0.12), 0 2px 8px rgba(0,0,0,0.04);
  }

  .card-top {
    height: 6px;
    background: linear-gradient(90deg, #7E0C6E 0%, #A83296 40%, #C4A265 100%);
  }

  .card-body {
    padding: 40px 36px 36px;
  }

  .card-avatar {
    display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
  }

  .card-avatar-img {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, #7E0C6E, #A83296);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 20px; font-weight: 600;
  }

  .card-avatar-name {
    font-size: 15px; font-weight: 600; color: #2c2c2c;
  }

  .card-avatar-date {
    font-size: 12px; color: #999; margin-top: 2px;
  }

  .card-title {
    font-family: 'Playfair Display', 'Noto Serif SC', serif;
    font-size: 22px; font-weight: 700; color: #1a1a1a;
    line-height: 1.5; margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(196,162,101,0.2);
  }

  .card-excerpt {
    font-size: 14.5px; color: #4a4a4a; line-height: 2;
    letter-spacing: 0.02em;
  }

  .card-footer {
    margin-top: 28px; padding-top: 20px;
    border-top: 1px solid rgba(196,162,101,0.15);
    display: flex; justify-content: space-between; align-items: center;
  }

  .card-tags {
    display: flex; gap: 8px; flex-wrap: wrap;
  }

  .card-tag {
    font-size: 11px; color: #7E0C6E;
    background: rgba(126,12,110,0.06);
    padding: 3px 10px; border-radius: 12px;
  }

  .card-url {
    font-size: 11px; color: #bbb;
  }

  /* 截图提示（截图后手动删除此元素） */
  .screenshot-hint {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    font-size: 12px; color: #999; background: rgba(0,0,0,0.05);
    padding: 6px 16px; border-radius: 20px;
  }
</style>
</head>
<body>

<div class="card">
  <div class="card-top"></div>
  <div class="card-body">
    <div class="card-avatar">
      <div class="card-avatar-img">张</div>
      <div>
        <div class="card-avatar-name">${escapeHTML(DISPLAY_NAME)}</div>
        <div class="card-avatar-date">${date}</div>
      </div>
    </div>

    <div class="card-title">${escapeHTML(title)}</div>

    <div class="card-excerpt">${escapeHTML(excerpt)}</div>

    <div class="card-footer">
      <div class="card-tags">
        ${tags.slice(0, 3).map(t => `<span class="card-tag">#${escapeHTML(t)}</span>`).join("")}
        ${tags.length > 3 ? `<span class="card-tag">+${tags.length - 3}更多</span>` : ""}
      </div>
      <div class="card-url">jinhuazhang.top</div>
    </div>
  </div>
</div>

<div class="screenshot-hint">📸 截图后发布到小红书（截图时请选中卡片）</div>

</body>
</html>`;

  return fullHTML;
}

// ─── 工具函数 ───────────────────────────────────────
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── 自定义 Markdown 渲染器（微信公众号适配）─────────
const renderer = new marked.Renderer();

// 标题：微信内 h1-h3 适配
renderer.heading = function ({ text, depth }) {
  const sizes = { 1: 20, 2: 18, 3: 17 };
  const margins = { 1: "28px 0 12px", 2: "24px 0 10px", 3: "20px 0 8px" };
  const size = sizes[depth] || 16;
  const margin = margins[depth] || "16px 0 6px";
  return `<h${depth} style="font-size:${size}px;font-weight:700;color:#1a1a1a;margin:${margin};line-height:1.5;">${text}</h${depth}>\n`;
};

// 段落
renderer.paragraph = function ({ text }) {
  return `<p style="margin:0 0 16px 0;line-height:1.85;color:#2c2c2c;">${text}</p>\n`;
};

// 链接
renderer.link = function ({ href, text }) {
  return `<a href="${href}" style="color:#607fa6;text-decoration:none;border-bottom:1px solid rgba(96,127,166,0.3);">${text}</a>`;
};

// 图片
renderer.image = function ({ href, text }) {
  return `<p style="text-align:center;margin:20px 0;"><img src="${href}" alt="${text}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto;"></p>\n`;
};

// 代码块
renderer.code = function ({ text, lang }) {
  return `<pre style="background:#f5f2ed;padding:14px 16px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.6;color:#5c4f3d;margin:0 0 16px 0;"><code>${text}</code></pre>\n`;
};

// 行内代码
renderer.codespan = function ({ text }) {
  return `<code style="background:rgba(126,12,110,0.06);color:#7E0C6E;padding:2px 6px;border-radius:4px;font-size:0.9em;font-family:'Fira Code',monospace;">${text}</code>`;
};

// 引用块
renderer.blockquote = function ({ text }) {
  return `<blockquote style="border-left:3px solid #C4A265;padding:8px 0 8px 16px;margin:0 0 16px 0;color:#6b6b6b;background:rgba(196,162,101,0.04);border-radius:0 6px 6px 0;">${text}</blockquote>\n`;
};

// 列表项
renderer.listitem = function ({ text }) {
  return `<li style="margin-bottom:6px;color:#2c2c2c;">${text}</li>\n`;
};

// 无序列表
renderer.list = function ({ items, ordered }) {
  const tag = ordered ? "ol" : "ul";
  const style = ordered
    ? "padding-left:24px;margin:0 0 16px 0;"
    : "padding-left:20px;margin:0 0 16px 0;";
  return `<${tag} style="${style}">\n${items.join("")}</${tag}>\n`;
};

// 水平线
renderer.hr = function () {
  return `<hr style="border:none;border-top:1px solid rgba(196,162,101,0.2);margin:24px 0;">\n`;
};

// 加粗
renderer.strong = function ({ text }) {
  return `<strong style="font-weight:700;color:#1a1a1a;">${text}</strong>`;
};

// 斜体
renderer.em = function ({ text }) {
  return `<em style="font-style:italic;">${text}</em>`;
};

marked.setOptions({ renderer });

// ─── 生成并写入 ──────────────────────────────────────
console.log("\n📦 生成中...\n");

// 微信公众号
const wechatHTML = generateWechatHTML();
const wechatPath = path.join(distDir, "output-wechat.html");
fs.writeFileSync(wechatPath, wechatHTML, "utf-8");
console.log(`✅ 微信公众号: ${wechatPath}`);
console.log("   用法: 用浏览器打开该文件 → 全选复制 → 粘贴到微信公众平台编辑器\n");

// 知乎
const zhihuMD = generateZhihuMarkdown();
const zhihuPath = path.join(distDir, "output-zhihu.md");
fs.writeFileSync(zhihuPath, zhihuMD, "utf-8");
console.log(`✅ 知乎: ${zhihuPath}`);
console.log("   用法: 打开文件 → 全选复制 → 粘贴到知乎写文章页面\n");

// 小红书
const xhsHTML = generateXiaohongshuHTML();
const xhsPath = path.join(distDir, "output-xiaohongshu.html");
fs.writeFileSync(xhsPath, xhsHTML, "utf-8");
console.log(`✅ 小红书: ${xhsPath}`);
console.log("   用法: 用浏览器打开 → 截图卡片 → 发布到小红书（正文粘贴 excerpt）\n");

console.log("🎉 完成！三个平台的输出文件在 dist/ 目录下。");
