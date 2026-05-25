# 个人网站项目规范

## 项目概览
- **站点名称**：张津华丨Jasper Zhang 个人学术主页
- **域名**：https://jinhuazhang.top/
- **技术栈**：Hugo v0.161+ (extended) + Blowfish 主题 + Cloudflare Pages 托管
- **版本管理**：GitHub (`hengdaoye50`)

---

## 目录结构
```
zhangjinhua.com/
├── QWEN.md                    # 本文件 — 开发文档
├── .gitignore
├── .gitmodules                # Blowfish 子模块
├── config/_default/           # Hugo 配置
│   ├── hugo.toml              #   站点基础、分页、taxonomies
│   ├── languages.zh-cn.toml   #   中文语言、个人信息、社交链接
│   ├── menus.zh-cn.toml       #   主导航 + 页脚菜单
│   ├── params.toml            #   主题参数（颜色、字体、排版）
│   └── markup.toml            #   Goldmark 解析 + 代码高亮
├── content/                   # 内容（Markdown）
│   ├── blog/                  #   博客文章
│   │   ├── _index.md          #     博客列表页标题/描述
│   │   └── YYYY-MM-DD_slug.md #   文章（命名格式）
│   ├── portfolio/             #   作品集
│   │   ├── _index.md          #     作品集列表页标题/描述
│   │   └── [标题].md          #   作品条目
│   └── about/                 #   关于页
│       └── _index.md
├── static/                    # 静态资源
│   ├── img/                   #   图片（avatar.jpg, logo.svg, avatar.svg等）
│   └── portfolio/             #   作品 HTML 文件（演化博弈论讲义等）
├── assets/
│   └── css/custom.css         #   全站自定义样式（~1700行）
├── layouts/                   # 自定义模板（覆盖 Blowfish 主题）
│   ├── blog/list.html         #   博客列表页模板
│   ├── portfolio/list.html    #   作品集列表页模板
│   ├── partials/
│   │   ├── home/
│   │   │   ├── custom.html    #     首页入口（引用 profile.html）
│   │   │   └── profile.html   #     首页核心布局（slogan、intro、近期更新、知识库）
│   │   ├── header/basic.html  #     自定义顶栏（sticky、紫色/金色、移动端）
│   │   ├── footer.html        #     自定义页脚
│   │   └── extend-footer.html #     页脚扩展（当前空）
│   └── shortcodes/            #   短代码（icon-ref, theme-switcher）
├── themes/blowfish/           # 主题（git submodule，不要直接修改）
└── public/                    # Hugo 构建输出（gitignore）
```

---

## 设计系统

### 配色
| 用途 | 颜色 | 色值 |
|------|------|------|
| 主色 (Purple) | 紫色系 | `#7E0C6E` / `#A83296` / `#5C084F` |
| 辅色 (Gold) | 金色系 | `#C4A265` / `#D4C08A` / `#D4AF37` / `#A68845` |
| 背景 | 奶油色 | `#FDF8F0` / `#FAF3EA` |
| 文字 | 墨色 | `#2C2C2C` / `#6b6b6b` |
| Dark 背景 | 深色 | `#1a1a1a` / `#1e121c` |

### 字体
- **品牌/展示**：Playfair Display — 用于英文 slogan、大标题
- **正文**：Noto Sans SC — 用于导航、描述、标签
- **衬线**：Noto Serif SC — 用于中文 slogan、文章标题、引用

### 卡片系统（统一规范）
所有卡片使用统一的 CSS 变量：
- `--card-radius: 12px`
- `--card-border: 1px solid rgba(196,162,101,0.18)`
- `--card-shadow: 0 2px 12px rgba(126,12,110,0.06), 0 1px 4px rgba(0,0,0,0.04)`
- `--card-shadow-hover: 0 4px 24px rgba(126,12,110,0.1), 0 2px 8px rgba(0,0,0,0.05)`
- 每张卡片顶部有 3-4px 渐变条（purple → gold），hover 时显现
- 所有卡片 `::before` 伪元素做顶部渐变装饰

---

## 自定义模板说明

### 首页 (`layouts/partials/home/profile.html`)
自顶向下四个区域：
1. **Slogan Banner** — 左右金色装饰线 + 中英双语座右铭卡片
2. **个人介绍** — 左侧头像（渐变边框环）+ 右侧基本情况/最近关注/座右铭
3. **近期更新** — 合并 `blog` + `portfolio` 最新 6 条，按日期降序；每条卡带类型标签（"博客"紫色 / "作品"金色）
4. **PPE 知识库** — 飞书链接卡片（📚 → 政治学·经济学·哲学课程笔记）

### 博客列表 (`layouts/blog/list.html`)
- 顶部 Hero 区域（深紫渐变背景 + 文章计数）
- `_index.md` 的正文作为介绍卡片
- 文章卡片列表：日期、阅读时间、标题、摘要、标签、阅读全文箭头
- 空状态提示：「暂无文章，敬请期待。」

### 作品集列表 (`layouts/portfolio/list.html`)
- 顶部 Hero 区域（深紫渐变背景）
- 网格布局（`minmax(340px, 1fr)`）
- 作品卡片：日期、标题、描述、标签、阅读全文

### 顶栏 (`layouts/partials/header/basic.html`)
- Sticky 定位 + backdrop-filter 毛玻璃
- 左侧 logo + 站点标题（紫色渐变文字）
- 右侧导航 + 明暗切换按钮
- 滚动时添加 `scrolled` 阴影
- 移动端汉堡菜单

---

## 内容 Frontmatter 约定

### 博客文章
```toml
+++
title = "文章标题"
date = 2026-06-01
description = "一句话摘要"
tags = ["标签1", "标签2"]
categories = ["分类"]  # 可选
+++
```

### 作品条目
```toml
+++
title = "作品标题"
date = 2026-06-01
description = "一句话描述"
categories = ["分类"]
tags = ["标签"]
showTableOfContents = false
showHero = false
+++
```

---

## 本地开发命令

```powershell
# PATH 刷新（PowerShell 必须）
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')

# 本地预览（含草稿）
hugo server -D

# 构建到 public/
hugo --gc --minify

# 新建文章
hugo new blog/YYYY-MM-DD-slug.md

# 检查 Hugo 版本
hugo version
```

---

## 内容更新流程

### 方式一：手动添加（推荐给常规更新）
1. 在 `content/blog/` 或 `content/portfolio/` 下新建 `.md` 文件（按命名约定）
2. 按 Frontmatter 约定填写元数据
3. 撰写正文（Markdown 格式）
4. 运行 `hugo server -D` 本地预览
5. `git add` → `git commit` → `git push`
6. Cloudflare Pages 自动部署

### 方式二：通过 AI 辅助
直接说 "写一篇关于 XXX 的博客" 或 "帮我新建一个作品条目"，AI 会生成完整 Markdown 并写入对应目录。

### 方式三：混合模式
自己写好正文粘贴给 AI → AI 补充 frontmatter、检查格式、运行构建验证。

### 图片处理
- 放 `static/img/`，引用路径为 `/img/xxx.ext`
- 可使用 `static/portfolio/` 存放作品 HTML 文件

---

## 部署配置 (Cloudflare Pages)
- **构建命令**：`hugo --gc --minify`
- **输出目录**：`public`
- **Hugo 版本**：`0.161.0`（通过 `HUGO_VERSION` 环境变量）
- **框架预设**：Hugo

---

## Git 工作流
```bash
# 查看状态
git status

# 添加所有更改并提交
git add -A
git commit -m "feat: 描述更改内容"

# 推送到 GitHub（触发 Cloudflare Pages 部署）
git push origin main
```

---

## 注意事项
- **不要直接修改 `themes/blowfish/`** 内的文件，所有自定义放 `layouts/` 或 `assets/`
- 升级主题用 `git submodule update --remote`
- 博客文章文件名必须 `YYYY-MM-DD_slug.md` 格式
- 所有自定义 CSS 集中在 `assets/css/custom.css`
- 首页"近期更新"栏目自动合并 blog 和 portfolio 两个 section，按日期排序
- 标签样式：博客紫标、作品金标
