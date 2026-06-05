// Netlify Identity mock — 允许任意凭证登录
const FAKE_USER = {
  id: "admin",
  email: "admin@jinhuazhang.top",
  user_metadata: { full_name: "张津华" },
  app_metadata: { provider: "email" },
  confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace("/.netlify/identity", "");

  // Settings
  if (path === "/settings" && request.method === "GET") {
    return json({
      external: { bitbucket: false, github: false, gitlab: false, google: false },
      external_labels: {},
      identity_services: {},
      disable_signup: true,
      autoconfirm: true,
    });
  }

  // Login — accept any credentials
  if (path === "/token" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = body.email || "admin@jinhuazhang.top";
    const user = {
      ...FAKE_USER,
      email,
      token: {
        access_token: crypto.randomUUID(),
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: crypto.randomUUID(),
      },
    };
    return json(user);
  }

  // Get current user
  if (path === "/user" && request.method === "GET") {
    const auth = request.headers.get("Authorization");
    if (!auth) return json({ error: "not authenticated" }, 401);
    return json(FAKE_USER);
  }

  // Signup — auto-confirm
  if (path === "/signup" && request.method === "POST") {
    return json(FAKE_USER);
  }

  // Logout
  if (path === "/logout" && request.method === "POST") {
    return json({});
  }

  // Verify
  if (path === "/verify" && request.method === "POST") {
    return json(FAKE_USER);
  }

  // Recover
  if (path === "/recover" && request.method === "POST") {
    return json({});
  }

  return new Response("Not Found", { status: 404 });
}
