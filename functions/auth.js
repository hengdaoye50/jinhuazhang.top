/**
 * Decap CMS OAuth 入口 — 重定向到 GitHub 授权
 * 路由: /auth
 */
export async function onRequest(context) {
  const { env } = context;
  const CLIENT_ID = env.GITHUB_OAUTH_CLIENT_ID;
  const REDIRECT_URI = "https://jinhuazhang.top/auth/callback";
  const SCOPE = "repo,user";

  if (!CLIENT_ID) {
    return new Response("OAuth not configured: missing GITHUB_OAUTH_CLIENT_ID", { status: 500 });
  }

  const githubURL =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${CLIENT_ID}` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  return Response.redirect(githubURL, 302);
}
