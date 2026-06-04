/**
 * Decap CMS GitHub OAuth 回调
 * 路由: /auth/callback
 *
 * GitHub 授权后 → 用 code 换 token → postMessage 回 Decap CMS
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const CLIENT_ID = env.GITHUB_OAUTH_CLIENT_ID;
  const CLIENT_SECRET = env.GITHUB_OAUTH_CLIENT_SECRET;
  const code = url.searchParams.get("code");

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response("OAuth not configured", { status: 500 });
  }

  if (!code) {
    return new Response(
      '<p>授权失败：缺少 code 参数。<a href="/admin/">返回后台</a></p>',
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
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
        code: code,
      }),
    });

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
