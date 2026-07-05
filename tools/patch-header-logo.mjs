import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const RE =
  /<div class="logo logo--split">\s*<a class="logo__mark"[^>]+>[\s\S]*?<\/a>\s*<a href="https:\/\/g\.page[^"]*"[^>]*>[\s\S]*?<\/a>\s*<\/div>/g;

function headerLogoHtml(filePath) {
  const rel = path.relative(ROOT, filePath).split(path.sep).join("/");
  const inBlogArticle = rel.startsWith("blog/") && !rel.endsWith("blog.html");
  const home = inBlogArticle ? "../index.html" : "index.html";
  const src = inBlogArticle ? "../assets/from-site/Logo.png" : "assets/from-site/Logo.png";
  return `<div class="logo logo--header-brand">
        <a class="logo__home" href="${home}" aria-label="Green Logistics home">
          <img class="logo-img logo-img--header" src="${src}" width="220" height="60" alt="Green Logistics">
        </a>
      </div>`;
}

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

for (const fp of walk(ROOT)) {
  let raw = fs.readFileSync(fp, "utf8");
  const before = raw;
  raw = raw.replace(RE, () => headerLogoHtml(fp));
  if (raw !== before) {
    fs.writeFileSync(fp, raw, "utf8");
    console.log("patched", path.relative(ROOT, fp));
  }
}
