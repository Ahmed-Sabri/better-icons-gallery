#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage:
  node better-icons-gallery.js <query> [outDir] [--limit=64] [--prefix=mdi] [--color=#111827] [--size=32]

Examples:
  node better-icons-gallery.js HVAC
  node better-icons-gallery.js mechanical ./mep-icons
  node better-icons-gallery.js electrical ./mep-icons --color=#111827 --size=40
  node better-icons-gallery.js plumb ./mep-icons --prefix=mdi
`);
  process.exit(1);
}

const query = args[0];
const outDirArg =
  args[1] && !args[1].startsWith("--")
    ? args[1]
    : `./icons-${slugify(query)}`;
const extraArgs = args.slice(
  args[1] && !args[1].startsWith("--") ? 2 : 1
);

const options = {
  limit: undefined,
  prefix: undefined,
  color: "#111827",
  size: undefined,
};

for (const a of extraArgs) {
  if (a.startsWith("--limit=")) options.limit = a.split("=")[1];
  else if (a.startsWith("--prefix=")) options.prefix = a.split("=")[1];
  else if (a.startsWith("--color=")) options.color = a.split("=")[1];
  else if (a.startsWith("--size=")) options.size = a.split("=")[1];
}

const outDir = path.resolve(outDirArg);
const svgDir = path.join(outDir, "svg");
fs.mkdirSync(svgDir, { recursive: true });

function slugify(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function safeName(iconId) {
  return iconId.replace(/[:/\\]+/g, "__").replace(/[^\w.-]+/g, "_");
}

function fileNameToIconId(fileName) {
  return fileName.replace(/\.svg$/i, "").replace(/__/g, ":");
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeSearchResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.icons)) return data.icons;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.matches)) return data.matches;
  return [];
}

function extractIconId(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return null;
  return item.id || item.icon || item.name || item.iconId || item.icon_id || null;
}

function listExistingSvgs() {
  if (!fs.existsSync(svgDir)) return [];

  const files = fs
    .readdirSync(svgDir)
    .filter((f) => f.toLowerCase().endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b));

  return files.map((fileName) => {
    const iconId = fileNameToIconId(fileName);
    return {
      id: iconId,
      fileName,
      relPath: `./svg/${fileName}`,
      prefix: iconId.includes(":") ? iconId.split(":")[0] : "",
    };
  });
}

function uniqueById(items) {
  const map = new Map();
  for (const item of items) {
    if (!item || !item.id) continue;
    map.set(item.id, item);
  }
  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

try {
  const searchParts = ["npx", "better-icons", "search", JSON.stringify(query)];

  if (options.prefix) {
    searchParts.push("--prefix", JSON.stringify(options.prefix));
  }

  if (options.limit) {
    searchParts.push("--limit", String(options.limit));
  }

  searchParts.push("--json");

  const searchCmd = searchParts.join(" ");

  console.log("Searching icons...");
  const raw = run(searchCmd);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Could not parse JSON from better-icons search output.");
  }

  const icons = normalizeSearchResults(data);

  if (!icons.length) {
    console.log("No icons found for this query.");
  } else {
    console.log(`Found ${icons.length} icons. Downloading...`);

    for (const item of icons) {
      const iconId = extractIconId(item);
      if (!iconId) continue;

      const fileBase = safeName(iconId);
      const fileName = `${fileBase}.svg`;
      const filePath = path.join(svgDir, fileName);

      if (fs.existsSync(filePath)) {
        console.log(`• Exists: ${iconId}`);
        continue;
      }

      const getParts = ["npx", "better-icons", "get", JSON.stringify(iconId)];

      if (options.color) {
        getParts.push("--color", JSON.stringify(options.color));
      }

      if (options.size) {
        getParts.push("--size", String(options.size));
      }

      try {
        const svg = run(getParts.join(" "));
        fs.writeFileSync(filePath, svg, "utf8");
        console.log(`✓ ${iconId}`);
      } catch {
        console.warn(`✗ Failed: ${iconId}`);
      }
    }
  }

  const allIcons = uniqueById(listExistingSvgs());

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>better-icons gallery</title>
  <style>
    :root {
      --bg: #f6f8fb;
      --bg-2: #eef3f8;
      --panel: #ffffff;
      --panel-2: #f8fafc;
      --text: #0f172a;
      --muted: #64748b;
      --border: #dbe3ee;
      --border-strong: #cbd5e1;
      --accent: #2563eb;
      --accent-soft: rgba(37, 99, 235, 0.10);
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-md: 0 10px 30px rgba(15, 23, 42, 0.06);
      --shadow-lg: 0 16px 36px rgba(15, 23, 42, 0.10);
      --radius: 18px;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color: var(--text);
      background: radial-gradient(circle at top left, #ffffff 0%, var(--bg) 38%, var(--bg-2) 100%);
    }

    .wrap {
      max-width: 1440px;
      margin: 0 auto;
      padding: 28px;
    }

    .header {
      margin-bottom: 20px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 32px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .sub {
      color: var(--muted);
      font-size: 18px;
      margin: 0;
    }

    .toolbar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      margin: 22px 0 22px;
    }

    .search {
      flex: 1 1 320px;
      min-width: 240px;
      background: #fff;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px 16px;
      outline: none;
      box-shadow: var(--shadow-sm);
      font-size: 15px;
    }

    .search::placeholder {
      color: #94a3b8;
    }

    .search:focus {
      border-color: #93c5fd;
      box-shadow: 0 0 0 4px var(--accent-soft);
    }

    .count {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px 16px;
      color: var(--muted);
      box-shadow: var(--shadow-sm);
      white-space: nowrap;
      font-size: 15px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 18px;
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      box-shadow: var(--shadow-md);
      transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
    }

    .card:hover {
      transform: translateY(-3px);
      border-color: var(--border-strong);
      box-shadow: var(--shadow-lg);
    }

    .preview {
      height: 132px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      margin-bottom: 12px;
      overflow: hidden;
      padding: 12px;
    }

    .preview img {
      width: 64px;
      height: 64px;
      display: block;
      object-fit: contain;
    }

    .id {
      font-size: 14px;
      line-height: 1.45;
      word-break: break-word;
      margin-bottom: 10px;
      color: var(--text);
      font-weight: 700;
      min-height: 40px;
    }

    .meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .chip,
    .btn {
      font-size: 12px;
      line-height: 1;
      color: var(--muted);
      border: 1px solid var(--border);
      background: var(--panel-2);
      border-radius: 999px;
      padding: 9px 11px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 34px;
    }

    .btn {
      color: var(--text);
      cursor: pointer;
      transition: background .12s ease, border-color .12s ease, transform .12s ease;
    }

    .btn:hover {
      border-color: var(--border-strong);
      background: #eef4ff;
      transform: translateY(-1px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .empty {
      color: var(--muted);
      padding: 34px 6px;
      display: none;
      font-size: 16px;
    }

    @media (max-width: 640px) {
      .wrap {
        padding: 18px;
      }

      h1 {
        font-size: 26px;
      }

      .sub {
        font-size: 16px;
      }

      .grid {
        grid-template-columns: 1fr;
      }

      .preview {
        height: 140px;
      }

      .preview img {
        width: 72px;
        height: 72px;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>better-icons gallery</h1>
      <p class="sub">
        Folder: <strong>${escapeHtml(path.basename(outDir))}</strong> · Total SVGs: ${allIcons.length}
      </p>
    </div>

    <div class="toolbar">
      <input
        id="filter"
        class="search"
        placeholder="Filter by icon id, e.g. mdi, hvac, mechanical, electrical, plumb"
        autocomplete="off"
      />
      <div class="count"><span id="visibleCount">${allIcons.length}</span> visible</div>
    </div>

    <div id="empty" class="empty">No icons match this filter.</div>

    <div id="grid" class="grid">
      ${allIcons.map((icon) => `
        <div class="card" data-id="${escapeHtml(icon.id).toLowerCase()}">
          <div class="preview">
            <img src="${escapeHtml(icon.relPath)}" alt="${escapeHtml(icon.id)}" loading="lazy" />
          </div>
          <div class="id">${escapeHtml(icon.id)}</div>
          <div class="meta">
            <span class="chip">${escapeHtml(icon.prefix)}</span>
            <a class="btn" href="${escapeHtml(icon.relPath)}" target="_blank" rel="noopener noreferrer">Open SVG</a>
            <button class="btn" data-copy="${escapeHtml(icon.id)}" type="button">Copy ID</button>
          </div>
        </div>
      `).join("")}
    </div>
  </div>

  <script>
    const input = document.getElementById("filter");
    const cards = Array.from(document.querySelectorAll(".card"));
    const visibleCount = document.getElementById("visibleCount");
    const empty = document.getElementById("empty");

    function applyFilter() {
      const q = input.value.trim().toLowerCase();
      let shown = 0;

      for (const card of cards) {
        const ok = !q || card.dataset.id.includes(q);
        card.style.display = ok ? "" : "none";
        if (ok) shown++;
      }

      visibleCount.textContent = String(shown);
      empty.style.display = shown ? "none" : "block";
    }

    input.addEventListener("input", applyFilter);
    applyFilter();

    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;

      const value = btn.getAttribute("data-copy");
      const old = btn.textContent;

      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.textContent = old;
        }, 1200);
      } catch {
        btn.textContent = "Failed";
        setTimeout(() => {
          btn.textContent = old;
        }, 1200);
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");

  const meta = {
    latestQuery: query,
    totalIcons: allIcons.length,
    generatedAt: new Date().toISOString(),
    options,
    icons: allIcons,
  };

  fs.writeFileSync(
    path.join(outDir, "icons.json"),
    JSON.stringify(meta, null, 2),
    "utf8"
  );

  console.log("\\nDone.");
  console.log("Gallery:", path.join(outDir, "index.html"));
  console.log("SVGs:   ", svgDir);
  console.log("Total rendered icons:", allIcons.length);
} catch (err) {
  console.error("\\nError:");
  console.error(err.message || err);
  process.exit(1);
}