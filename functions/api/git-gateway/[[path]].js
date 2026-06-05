export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/git-gateway", "");

  const PAT = env.GITHUB_PAT;
  if (!PAT) {
    return new Response(
      JSON.stringify({ error: "GITHUB_PAT environment variable is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 认证端点：直接返回成功
  if (path === "/github/authenticate" && request.method === "POST") {
    return new Response(
      JSON.stringify({ token: PAT, provider: "github" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 所有其他请求代理到 GitHub API
  const githubURL = `https://api.github.com${path}`;
  const headers = new Headers(request.headers);
  headers.set("Authorization", `token ${PAT}`);
  headers.delete("Host");
  headers.delete("Origin");

  const githubRequest = new Request(githubURL, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.clone().arrayBuffer() : null,
  });

  try {
    const res = await fetch(githubRequest);
    const resHeaders = new Headers(res.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "GitHub API proxy failed", detail: err.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
