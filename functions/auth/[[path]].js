export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const CLIENT_ID = env.GITHUB_OAUTH_CLIENT_ID || "";
  const CLIENT_SECRET = env.GITHUB_OAUTH_CLIENT_SECRET || "";

  const REDIRECT_URI = "https://jinhuazhang.top/auth/callback";
  const OAUTH_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  // GET /auth — 302 重定向到 GitHub
  if (path === "/auth" && request.method === "GET") {
    return Response.redirect(OAUTH_URL, 302);
  }

  // POST /auth — Decap CMS v3 外部 OAuth 端点
  if (path === "/auth" && request.method === "POST") {
    return new Response(
      JSON.stringify({ url: OAUTH_URL, provider: "github" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // GET /auth/callback — GitHub OAuth 回调
  if (path === "/auth/callback" && request.method === "GET") {
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response("Missing code parameter.", { status: 400 });
    }

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        return new Response(
          `GitHub 授权失败：${tokenData.error_description || tokenData.error}`,
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      const accessToken = tokenData.access_token;

      return new Response(
        `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
  (function() {
    var data = { token: ${JSON.stringify(accessToken)}, provider: "github" };
    localStorage.setItem("gh_token", data.token);
    // 刷新主窗口，触发 admin 页重载后自动认证
    if (window.opener && !window.opener.closed) {
      window.opener.location.href = "/admin/";
    }
  })();
</script></head>
<body style="text-align:center;padding-top:40px;font-family:sans-serif;">
  <p>✅ 登录成功</p>
  <p style="color:#999;">窗口可关闭。<span id="timer">3</span> 秒后自动关闭…</p>
  <script>
    var s = 3;
    setInterval(function() {
      s--;
      document.getElementById('timer').textContent = s;
      if (s <= 0) window.close();
    }, 1000);
  </script>
</body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    } catch (err) {
      return new Response(`OAuth 服务异常：${err.message}`, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  return new Response("Not Found", { status: 404 });
}
