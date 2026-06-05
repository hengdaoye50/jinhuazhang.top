/**
 * Decap CMS GitHub OAuth — 统合处理 /auth 和 /auth/callback
 * 路由: functions/auth/[[path]].js → /auth, /auth/callback
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const CLIENT_ID = env.GITHUB_OAUTH_CLIENT_ID;
  const CLIENT_SECRET = env.GITHUB_OAUTH_CLIENT_SECRET;
  const REDIRECT_URI = "https://jinhuazhang.top/auth/callback";

  // ── /auth —— Decap CMS 请求 GitHub 授权 URL ──
  if (path === "/auth") {
    if (!CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: "OAuth not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const githubURL =
      "https://github.com/login/oauth/authorize" +
      `?client_id=${CLIENT_ID}` +
      `&scope=${encodeURIComponent("repo,user")}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    // 同时支持两种协议：
    // 1. POST → 返回 JSON（Decap CMS v3 标准）
    // 2. GET  → 直接重定向（旧版兼容）
    if (request.method === "POST") {
      return new Response(
        JSON.stringify({ url: githubURL, provider: "github" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return Response.redirect(githubURL, 302);
  }

  // ── /auth/callback —— GitHub 回调，换 token ──
  if (path === "/auth/callback") {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return new Response("OAuth not configured", { status: 500 });
    }

    const code = url.searchParams.get("code");
    if (!code) {
      return new Response(
        '<p>授权失败：缺少 code 参数。<a href="/admin/">返回后台</a></p>',
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    try {
      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
          }),
        }
      );

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(
          `<p>GitHub 授权失败：${tokenData.error_description || tokenData.error}</p>`,
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      const accessToken = tokenData.access_token;

      return new Response(
        `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
  (function() {
    var data = { token: ${JSON.stringify(accessToken)}, provider: "github" };
    sessionStorage.setItem("gh_token", data.token);
    if (window.opener) {
      window.opener.postMessage(data, "*");
      // 延迟关闭，确保消息送达
      setTimeout(function() {
        window.opener.postMessage(data, "*");
        setTimeout(function() { window.close(); }, 300);
      }, 300);
    } else {
      window.location.href = "/admin/";
    }
  })();
</script></head>
<body style="text-align:center;padding-top:40px;font-family:sans-serif;">
  <p>✅ 登录成功，正在跳转...</p>
</body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    } catch (err) {
      return new Response(`<p>OAuth 服务异常：${err.message}</p>`, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  return new Response("Not Found", { status: 404 });
}
