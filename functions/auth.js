/**
 * Decap CMS OAuth 入口 — 返回 GitHub 授权 URL
 * 路由: /auth
 *
 * Decap CMS 发送 POST { provider: "github" }
 * 本函数返回 { url: "https://github.com/..." }
 * Decap CMS 在弹出窗口中打开该 URL
 */
export async function onRequest(context) {
  const { env } = context;
  const CLIENT_ID = env.GITHUB_OAUTH_CLIENT_ID;
  const REDIRECT_URI = "https://jinhuazhang.top/auth/callback";
  const SCOPE = "repo,user";

  if (!CLIENT_ID) {
    return new Response(
      JSON.stringify({ error: "OAuth not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const githubURL =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${CLIENT_ID}` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  return new Response(
    JSON.stringify({ url: githubURL, provider: "github" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
