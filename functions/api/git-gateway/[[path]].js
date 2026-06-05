// Git Gateway — GitHub API 代理，使用 GITHUB_PAT
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/git-gateway", "");
  const PAT = env.GITHUB_PAT;

  if (!PAT) {
    return new Response(JSON.stringify({ error: "GITHUB_PAT not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  // 认证端点
  if (path === "/github/authenticate" && request.method === "POST") {
    return new Response(
      JSON.stringify({ token: PAT, provider: "github" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 设置端点
  if (path === "/settings" && request.method === "GET") {
    return new Response(
      JSON.stringify({
        services: ["github"],
        roles: ["admin", "editor"],
        identity: { url: "/.netlify/identity" },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 代理到 GitHub API
  const gh = await fetch(`https://api.github.com${path}`, {
    method: request.method,
    headers: {
      Authorization: `token ${PAT}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: request.method !== "GET" ? await request.text() : null,
  });

  const resHeaders = new Headers(gh.headers);
  resHeaders.set("Access-Control-Allow-Origin", "*");
  return new Response(gh.body, { status: gh.status, headers: resHeaders });
}
