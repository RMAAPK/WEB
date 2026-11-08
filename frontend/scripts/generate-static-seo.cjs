'use strict';

const fs = require('node:fs');
const path = require('node:path');

const siteRoot = path.resolve(__dirname, '..');
const distRoot = path.join(siteRoot, 'dist');
const blogs = JSON.parse(fs.readFileSync(path.join(siteRoot, 'src/data/blogs.json'), 'utf8'));
const baseUrl = (process.env.SITE_URL || 'https://rmaa.pk').replace(/\/$/, '');
const indexPath = path.join(distRoot, 'index.html');

if (!fs.existsSync(indexPath)) {
  throw new Error(`Vite output not found at ${indexPath}; run vite build first.`);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[char]);
}

function cdata(value) {
  return `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function replaceMeta(html, pattern, value) {
  return html.replace(pattern, (_match, prefix, suffix) => `${prefix}${escapeHtml(value)}${suffix}`);
}

const today = new Date().toISOString().slice(0, 10);
const urlEntries = [
  { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
  { loc: `${baseUrl}/blog`, lastmod: today, changefreq: 'daily', priority: '0.9' },
  ...blogs.map((post) => ({
    loc: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
    lastmod: String(post.publishedAt || today).slice(0, 10),
    changefreq: 'weekly',
    priority: '0.8',
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.map((entry) => `  <url><loc>${escapeXml(entry.loc)}</loc><lastmod>${escapeXml(entry.lastmod)}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(distRoot, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(distRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);

const rssItems = blogs.map((post) => `    <item>\n      <title>${cdata(post.title)}</title>\n      <link>${escapeXml(`${baseUrl}/blog/${post.slug}`)}</link>\n      <guid isPermaLink="true">${escapeXml(`${baseUrl}/blog/${post.slug}`)}</guid>\n      <description>${cdata(post.description)}</description>\n      <category>${cdata(post.category)}</category>\n      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>\n      <author>say@rmaa.pk (Muhammad Ali)</author>\n    </item>`).join('\n');
const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n  <title>Muhammad Ali — Systems, CNC Machining &amp; Acoustic AI</title>\n  <link>${baseUrl}/blog</link>\n  <description>Technical essays, CNC machining physics, acoustic tool breakage AI, and founder philosophy by Muhammad Ali.</description>\n  <language>en-us</language>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n  <image><url>${baseUrl}/logo_final.svg</url><title>Muhammad Ali</title><link>${baseUrl}</link></image>\n${rssItems}\n</channel></rss>\n`;
fs.writeFileSync(path.join(distRoot, 'rss.xml'), rss);
fs.writeFileSync(path.join(distRoot, 'feed.xml'), rss);

const baseHtml = fs.readFileSync(indexPath, 'utf8');
let generated = 0;
for (const post of blogs) {
  if (!/^[a-z0-9-]+$/i.test(post.slug || '')) continue;

  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const title = `${post.title} — Muhammad Ali`;
  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, /(<meta name="title" content=")[^"]*("\s*\/?>)/i, title);
  html = replaceMeta(html, /(<meta name="description" content=")[^"]*("\s*\/?>)/i, post.description);
  html = replaceMeta(html, /(<meta property="og:title" content=")[^"]*("\s*\/?>)/i, title);
  html = replaceMeta(html, /(<meta property="og:description" content=")[^"]*("\s*\/?>)/i, post.description);
  html = replaceMeta(html, /(<meta property="og:url" content=")[^"]*("\s*\/?>)/i, postUrl);
  html = replaceMeta(html, /(<link rel="canonical" href=")[^"]*("\s*\/?>)/i, postUrl);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    headline: post.title,
    description: post.description,
    keywords: post.keywords,
    articleSection: post.category,
    author: { '@type': 'Person', name: 'Muhammad Ali', alternateName: 'Raja Muhammad Ali Asghar', url: baseUrl },
    publisher: { '@type': 'Organization', name: 'Ali CNC', url: 'https://alicnc.pk' },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
  };
  const structuredData = `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;
  const article = `<noscript><article style="max-width:800px;margin:40px auto;padding:20px;font-family:sans-serif;color:#F3F4F6;background:#090A0F"><p><a href="/blog" style="color:#38BDF8">← Back to All Articles</a></p><h1>${escapeHtml(post.title)}</h1><p style="color:#9CA3AF">Category: ${escapeHtml(post.category)} • Published: ${escapeHtml(post.publishedAt)} • By Muhammad Ali</p><div style="line-height:1.7;white-space:pre-wrap">${escapeHtml(post.content)}</div></article></noscript>`;
  html = html.replace('</head>', `${structuredData}\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root"></div>\n${article}`);

  const postDir = path.join(distRoot, 'blog', post.slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, 'index.html'), html);
  generated += 1;
}

console.log(`[SEO] Wrote sitemap, robots, RSS, and ${generated} static blog pages.`);
