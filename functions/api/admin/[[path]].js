// 自建管理后台 API — 密码登录 + GitHub 文件操作
const REPO = "hengdaoye50/jinhuazhang.top";
const BRANCH = "main";
const GITHUB_API = "https://api.github.com";

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
  const GITHUB_PAT = env.GITHUB_PAT || "";

  if (!ADMIN_PASSWORD || !GITHUB_PAT) {
    return json({ error: "server not configured" }, 500);
  }

  // ========== 登录 ==========
  if (url.pathname === "/api/admin/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (body.password === ADMIN_PASSWORD) {
      // 生成简单 token（HMAC: sha256(password + timestamp)）
      const ts = Date.now().toString();
      const data = new TextEncoder().encode(ADMIN_PASSWORD + ts);
      const hash = await crypto.subtle.digest("SHA-256", data);
      const token = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return json({ token, ts });
    }
    return json({ error: "密码错误" }, 403);
  }

  // ========== 身份验证 ==========
  if (url.pathname !== "/api/admin/login") {
    const token = getToken(request);
    if (!token) return unauthorized();

    // 验证 token: 重新计算，时间戳在 24h 内有效
    const parts = request.headers.get("X-Token-Ts") || "";
    const ts = parseInt(parts, 10);
    if (!ts || Date.now() - ts > 86400000) return unauthorized();

    const data = new TextEncoder().encode(ADMIN_PASSWORD + ts.toString());
    const hash = await crypto.subtle.digest("SHA-256", data);
    const expected = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (token !== expected) return unauthorized();
  }

  // ========== 列出文件 ==========
  if (url.pathname === "/api/admin/files" && method === "GET") {
    const dir = url.searchParams.get("dir") || "content/blog";
    const ghUrl = `${GITHUB_API}/repos/${REPO}/contents/${dir}?ref=${BRANCH}`;
    const res = await fetch(ghUrl, {
      headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" },
    });
    const data = await res.json();
    if (!Array.isArray(data)) return json({ error: data.message || "读取失败" }, res.status);
    const files = data
      .filter((f) => f.name.endsWith(".md") || f.name === "_index.md")
      .map((f) => ({
        name: f.name,
        path: f.path,
        sha: f.sha,
        size: f.size,
      }));
    return json(files);
  }

  // ========== 读取文件 ==========
  if (url.pathname === "/api/admin/file" && method === "GET") {
    const filePath = url.searchParams.get("path");
    if (!filePath) return json({ error: "missing path" }, 400);
    const ghUrl = `${GITHUB_API}/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`;
    const res = await fetch(ghUrl, {
      headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" },
    });
    const data = await res.json();
    if (data.message) return json({ error: data.message }, res.status);
    return json({
      path: data.path,
      sha: data.sha,
      content: atob(data.content),
      encoding: "utf-8",
    });
  }

  // ========== 保存文件 ==========
  if (url.pathname === "/api/admin/file" && method === "PUT") {
    const { path: filePath, content, sha, message } = await request.json();
    if (!filePath || content === undefined) return json({ error: "missing fields" }, 400);

    const body = {
      message: message || `更新 ${filePath}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    const ghUrl = `${GITHUB_API}/repos/${REPO}/contents/${filePath}`;
    const res = await fetch(ghUrl, {
      method: "PUT",
      headers: { Authorization: `token ${GITHUB_PAT}`, "Content-Type": "application/json", Accept: "application/vnd.github.v3+json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.message && data.message !== "success") {
      return json({ error: data.message }, res.status);
    }
    return json({ ok: true, sha: data.content?.sha });
  }

  return new Response("Not Found", { status: 404 });
}
