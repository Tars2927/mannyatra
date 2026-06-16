/**
 * Built-in email templates for Mannyatra campaigns.
 * Each template is a function that returns complete HTML.
 */

interface TemplateVars {
  subject?: string;
  previewText?: string;
  heroImage?: string;
  heading?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
}

/** Base wrapper — all templates share this chrome. */
function wrap(previewText: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>Mannyatra</title>
<style>
body{margin:0;padding:0;background:#f7f9fc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#191c1e;-webkit-font-smoothing:antialiased}
.wrapper{max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.06)}
.hero-img{width:100%;height:auto;display:block}
.content{padding:40px 32px}
.content h1{margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.3;color:#191c1e}
.content h2{margin:0 0 12px;font-size:20px;font-weight:600;line-height:1.4;color:#191c1e}
.content p{margin:0 0 16px;font-size:16px;line-height:1.7;color:#44474c}
.cta{display:inline-block;padding:14px 36px;background:#525f72;color:#ffffff!important;text-decoration:none;border-radius:999px;font-size:15px;font-weight:600;letter-spacing:0.02em}
.cta:hover{background:#3a4859}
.divider{border:none;height:1px;background:#e0e3e6;margin:28px 0}
.footer{padding:24px 32px;background:#f7f9fc;text-align:center;font-size:13px;color:#74777d;line-height:1.6}
.footer a{color:#525f72;text-decoration:underline}
@media(max-width:640px){.content{padding:28px 20px}.footer{padding:20px 16px}}
</style>
<!--[if mso]><style>body{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;padding:32px 16px">
<tr><td align="center">
<div class="wrapper">
${content}
<div class="footer">
  <p style="margin:0 0 8px;font-weight:600;font-size:15px;color:#525f72">✈️ Mannyatra</p>
  <p style="margin:0 0 4px">Dream. Plan. Do.</p>
  <p style="margin:0 0 12px"><a href="mailto:hello@mannyatra.in">hello@mannyatra.in</a></p>
  <p style="margin:0;font-size:11px;color:#a0a4aa"><a href="#" style="color:#a0a4aa">Unsubscribe</a> · <a href="https://mannyatra.in" style="color:#a0a4aa">mannyatra.in</a></p>
</div>
</div>
</td></tr>
</table>
</body>
</html>`;
}

function heroBlock(imageUrl?: string): string {
  if (!imageUrl) return "";
  return `<img src="${imageUrl}" alt="" class="hero-img" style="width:100%;height:auto;display:block"/>`;
}

function ctaBlock(text?: string, url?: string): string {
  if (!text || !url) return "";
  return `<div style="text-align:center;margin:28px 0"><a href="${url}" class="cta" target="_blank">${text}</a></div>`;
}

/* ── Template definitions ──────────────────────────────────────────────── */

export const TEMPLATES: Record<string, { name: string; description: string; build: (v: TemplateVars) => string }> = {
  welcome: {
    name: "Welcome to Mannyatra",
    description: "Onboarding email for new users",
    build: (v) => wrap(v.previewText ?? "Welcome aboard!", `
      ${heroBlock(v.heroImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop")}
      <div class="content">
        <h1>${v.heading ?? "Welcome to Mannyatra! ✈️"}</h1>
        <p>${v.body ?? "Your journey starts here. Mannyatra helps you dream, plan, and accomplish your bucket list — one destination at a time."}</p>
        <p>Start by adding your first dream destination, and watch your travel map come alive with pins from around the world.</p>
        ${ctaBlock(v.ctaText ?? "Start My Bucket List", v.ctaUrl ?? "https://mannyatra.in")}
        <hr class="divider"/>
        <p style="font-size:14px;color:#74777d">Have questions? Just reply to this email — we'd love to hear from you.</p>
      </div>
    `),
  },

  weekly: {
    name: "Weekly Travel Inspiration",
    description: "Curated travel ideas and destinations",
    build: (v) => wrap(v.previewText ?? "This week's travel picks ✨", `
      ${heroBlock(v.heroImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop")}
      <div class="content">
        <h1>${v.heading ?? "This Week's Travel Inspiration 🌍"}</h1>
        <p>${v.body ?? "We've handpicked destinations that are trending this week. From hidden gems to iconic landmarks — there's something for every type of traveler."}</p>
        ${ctaBlock(v.ctaText ?? "Explore Ideas", v.ctaUrl ?? "https://mannyatra.in/explore")}
      </div>
    `),
  },

  feature: {
    name: "New Feature Announcement",
    description: "Product update or feature launch",
    build: (v) => wrap(v.previewText ?? "Something new is here!", `
      ${heroBlock(v.heroImage)}
      <div class="content">
        <p style="font-size:13px;font-weight:600;color:#525f72;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">What's New</p>
        <h1>${v.heading ?? "We've been building something exciting"}</h1>
        <p>${v.body ?? "Check out the latest feature we've added to Mannyatra. We think you're going to love it."}</p>
        ${ctaBlock(v.ctaText ?? "See What's New", v.ctaUrl ?? "https://mannyatra.in")}
      </div>
    `),
  },

  reengagement: {
    name: "Your Bucket List Misses You",
    description: "Re-engagement for inactive users",
    build: (v) => wrap(v.previewText ?? "Your bucket list is waiting...", `
      ${heroBlock(v.heroImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=400&fit=crop")}
      <div class="content">
        <h1>${v.heading ?? "Your Bucket List Misses You 🗺️"}</h1>
        <p>${v.body ?? "It's been a while since you visited Mannyatra. Your destinations are still waiting — and the world hasn't stopped being amazing."}</p>
        <p>Come back and check off your next adventure. Life's too short for an empty bucket list.</p>
        ${ctaBlock(v.ctaText ?? "Open My Bucket List", v.ctaUrl ?? "https://mannyatra.in")}
      </div>
    `),
  },

  blank: {
    name: "Blank Template",
    description: "Empty canvas — build from scratch",
    build: (v) => wrap(v.previewText ?? "", `
      ${heroBlock(v.heroImage)}
      <div class="content">
        ${v.heading ? `<h1>${v.heading}</h1>` : ""}
        ${v.body ? `<p>${v.body}</p>` : "<p>Write your content here...</p>"}
        ${ctaBlock(v.ctaText, v.ctaUrl)}
      </div>
    `),
  },
};

/** Get a template list (without the build functions) for the frontend. */
export function getTemplateList() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({
    id,
    name: t.name,
    description: t.description,
  }));
}

/** Build HTML from a template + variables. */
export function buildTemplate(templateId: string, vars: TemplateVars): string {
  const template = TEMPLATES[templateId];
  if (!template) return TEMPLATES.blank.build(vars);
  return template.build(vars);
}

/** Build a Travel Poster email from minimal inputs. */
export function buildTravelPoster(opts: {
  heroImage: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
}): string {
  return wrap(opts.subtitle, `
    <img src="${opts.heroImage}" alt="" class="hero-img" style="width:100%;height:auto;display:block"/>
    <div class="content" style="text-align:center">
      <h1 style="font-size:32px;margin-bottom:8px">${opts.title}</h1>
      <p style="font-size:18px;color:#525f72;margin-bottom:28px">${opts.subtitle}</p>
      <a href="${opts.ctaUrl}" class="cta" target="_blank">${opts.ctaText}</a>
    </div>
  `);
}
