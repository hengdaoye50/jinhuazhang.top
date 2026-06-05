// 最小 Netlify Identity mock — 接受任意凭证
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/.netlify/identity", "");

  if (path === "/settings") {
    return json({ external: {}, disable_signup: false, autoconfirm: true });
  }

  if (path === "/token" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    return json({
      id: "admin",
      email: body.email || "admin@jinhuazhang.top",
      user_metadata: { full_name: "张津华" },
      app_metadata: { provider: "email" },
      token: { access_token: crypto.randomUUID(), token_type: "bearer", expires_in: 3600 },
    });
  }

  if (path === "/user") return json({ id: "admin", email: "admin@jinhuazhang.top" });

  return new Response("Not Found", { status: 404 });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
