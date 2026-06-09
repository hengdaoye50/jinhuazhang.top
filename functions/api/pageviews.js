/**
 * jinhuazhang.top — Page View Counter
 * Cloudflare Pages Function (replaces standalone Worker)
 * GET  /api/pageviews?slug=/blog/xxx/  → 返回浏览量
 * POST /api/pageviews?slug=/blog/xxx/  → 浏览量 +1 并返回新值
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  // Normalize: strip .html extension, ensure trailing slash
  if (/\.html$/i.test(slug)) {
    slug = slug.replace(/\.html$/i, "");
  }
  if (slug !== "/" && !slug.endsWith("/")) {
    slug += "/";
  }

  if (!/^\/[\w\-\.\/~]+$/.test(slug)) {
    return new Response("Invalid slug", { status: 400 });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === "GET") {
    const count = (await env.PAGEVIEWS.get(slug)) || "0";
    return new Response(count, {
      headers: { ...corsHeaders, "Content-Type": "text/plain", "Cache-Control": "public, max-age=30" },
    });
  }

  if (request.method === "POST") {
    const count = (parseInt((await env.PAGEVIEWS.get(slug)) || "0") + 1).toString();
    await env.PAGEVIEWS.put(slug, count);
    return new Response(count, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
}
