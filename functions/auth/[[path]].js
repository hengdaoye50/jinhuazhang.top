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

    return new Response(
      JSON.stringify({ url: githubURL, provider: "github" }),
      { headers: { "Content-Type": "application/json" } }
    );
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
