// Netlify Identity API mock — 接受任意凭证登录
// API ref: https://github.com/netlify/gotrue
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/.netlify/identity", "");

  const FAKE_TOKEN = crypto.randomUUID();

  // 注册/登录 — accept any credentials
  if (path === "/token" && request.method === "POST") {
    const body = await request.text().catch(() => "");
    const form = new URLSearchParams(body);
    const grantType = form.get("grant_type") || "password";

    if (grantType === "password") {
      return json({
        access_token: FAKE_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: crypto.randomUUID(),
      });
    }

    if (grantType === "refresh_token") {
      return json({
        access_token: FAKE_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: crypto.randomUUID(),
      });
    }

    return json({ error: "unsupported_grant_type" }, 400);
  }

  // 获取当前用户
  if (path === "/user" && request.method === "GET") {
    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    return json({
      id: "admin",
      email: "admin@jinhuazhang.top",
      user_metadata: { full_name: "张津华" },
      app_metadata: { provider: "email" },
      aud: "",
      role: "",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      confirmed_at: "2026-01-01T00:00:00Z",
    });
  }

  // 注册
  if (path === "/signup" && request.method === "POST") {
    const body = await request.text().catch(() => "");
    const form = new URLSearchParams(body);
    return json({
      id: "admin",
      email: form.get("email") || "admin@jinhuazhang.top",
      confirmation_sent_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: { provider: "email" },
    });
  }

  // 登出
  if (path === "/logout") return json({});

  // Settings
  if (path === "/settings") {
    return json({
      external: { bitbucket: false, github: false, gitlab: false, google: false },
      disable_signup: false,
      autoconfirm: true,
    });
  }

  return new Response("Not Found", { status: 404 });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
