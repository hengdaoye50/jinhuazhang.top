/**
 * Decap CMS GitHub OAuth 回调处理
 * 路由: /auth/callback
 *
 * 流程:
 * 1. Decap CMS 弹出窗口 → /auth（重定向到 GitHub）
 * 2. GitHub 授权 → /auth/callback?code=xxx
 * 3. 本函数用 code 换 token → postMessage 回 Decap CMS
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const GITHUB_CLIENT_ID = env.GITHUB_OAUTH_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = env.GITHUB_OAUTH_CLIENT_SECRET;
  const SITE_URL = "https://jinhuazhang.top";
  const OAUTH_ORIGIN = "https://oauth.jinhuazhang.top";

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return new Response("OAuth not configured", { status: 500 });
  }

  // ── Step 1: 发起 OAuth 授权 ──
  if (path === "/auth") {
    const githubAuthURL =
      "https://github.com/login/oauth/authorize" +
      `?client_id=${GITHUB_CLIENT_ID}` +
      `&scope=repo,user` +
      `&redirect_uri=${encodeURIComponent(SITE_URL + "/auth/callback")}`;

    return Response.redirect(githubAuthURL, 302);
  }

  // ── Step 2: 处理回调，用 code 换 token ──
  if (path === "/auth/callback") {
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response(
        "<p>授权失败：缺少 code 参数。<a href='/admin/'>返回后台</a></p>",
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    try {
      // 用 code 向 GitHub 换取 access_token
      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
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

      // 将 token 通过 postMessage 传回 Decap CMS 弹出窗口
      return new Response(
        `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
  (function() {
    var token = ${JSON.stringify(accessToken)};
    var data = { token: token, provider: "github" };
    window.opener.postMessage(data, "*");
    window.close();
  })();
</script></head>
<body style="text-align:center;padding-top:40px;font-family:sans-serif;">
  <p>✅ 登录成功，窗口即将关闭...</p>
  <p style="color:#999;font-size:14px;">如未自动关闭，请<a href="/admin/">点击进入后台</a></p>
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
