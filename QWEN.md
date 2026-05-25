# 个人网站项目规范

## 技术栈
- **静态生成器**：Hugo v0.161+ (extended)
- **主题**：Blowfish (git submodule)
- **托管**：Netlify
- **版本管理**：GitHub

## 目录结构
```
zhangjinhua.com/
├── config/_default/      # Hugo 配置
│   ├── hugo.toml         #   站点基础配置
│   ├── languages.zh-cn.toml  # 中文语言和个人信息
│   ├── menus.zh-cn.toml  #   导航菜单
│   └── params.toml       #   主题参数
├── content/              # 内容（Markdown）
│   ├── blog/             #   博客文章
│   ├── portfolio/        #   作品集
│   └── about/            #   关于页
├── static/img/           # 静态资源（图片、SVG）
├── layouts/              # 自定义模板
├── themes/blowfish/      # 主题（git submodule，不要直接修改）
└── netlify.toml          # Netlify 部署配置
```

## 内容命名约定
- 博客文章：`YYYY-MM-DD_slug.md`
- 作品：`[序号]_[标题].md`
- 图片：`[类型]_[描述].[格式]`

## 工作流程
1. 本地编辑 Markdown 内容
2. `hugo server -D` 本地预览
3. Git commit + push 到 main 分支
4. Netlify 自动构建部署

## 本地开发命令
```bash
## 构建（全部 Powershell 命令需前置 PATH 刷新）
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')

hugo server -D          # 本地预览（含草稿）
hugo                    # 构建到 public/
hugo new blog/YYYY-MM-DD-slug.md  # 新建文章
```

## 部署配置
- Netlify build command: `hugo --gc --minify`
- Publish directory: `public`
- Hugo version: 0.161.0 (via Netlify env variable or netlify.toml)

## 注意事项
- Blowfish 主题通过 git submodule 管理，升级主题用 `git submodule update --remote`
- 不要在 themes/blowfish/ 内直接修改文件，自定义放 layouts/ 或 assets/
- 图片放 static/img/，引用路径为 `/img/xxx.svg`
- domain 配置：先本地用 localhost，域名审批通过后在 hugo.toml 中修改 baseURL
