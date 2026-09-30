/**
 * Save each public layout as a standalone HTML file.
 * CSS lives in a <style> block so the files can be adapted into a WordPress theme.
 *
 * Requires the dev server at http://127.0.0.1:4321/.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "wordpress-html");
const origin = process.env.EXPORT_ORIGIN || "http://127.0.0.1:4321";

const pages = [
	{ route: "/", file: "index.html", name: "Home", wordpress: "front-page.php" },
	{ route: "/email-newsletter/", file: "newsletter.html", name: "Newsletter", wordpress: "page-newsletter.php" },
	{ route: "/blog/", file: "archive.html", name: "Articles", wordpress: "home.php" },
	{ route: "/blog/page/2/", file: "archive-page-2.html", name: "Articles, page 2", wordpress: "home.php" },
	{ route: "/about/", file: "about.html", name: "About", wordpress: "page-about.php" },
	{ route: "/privacy-policy/", file: "page.html", name: "Default page", wordpress: "page.php" },
	{ route: "/lorem-primis/", file: "article.html", name: "Article", wordpress: "single.php" },
	{ route: "/missing-page-xyz/", file: "404.html", name: "Not found", wordpress: "404.php" },
];

const routeMap = new Map([
	["/", "index.html"],
	["/email-newsletter", "newsletter.html"],
	["/email-newsletter/", "newsletter.html"],
	["/blog", "archive.html"],
	["/blog/", "archive.html"],
	["/blog/page/2", "archive-page-2.html"],
	["/blog/page/2/", "archive-page-2.html"],
	["/about", "about.html"],
	["/about/", "about.html"],
	["/privacy-policy", "page.html"],
	["/privacy-policy/", "page.html"],
]);

const behavior = `<script>
document.querySelectorAll("[data-nav-toggle]").forEach((toggle) => {
	const menu = document.querySelector("#navbarNav");
	toggle.addEventListener("click", () => {
		const open = menu && menu.classList.toggle("show");
		toggle.setAttribute("aria-expanded", open ? "true" : "false");
	});
});

document.querySelectorAll("[data-signup]").forEach((form) => {
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const input = form.querySelector('input[type="email"]');
		if (!input || !input.checkValidity()) {
			if (input) input.reportValidity();
			return;
		}
		const fields = form.querySelector("[data-signup-fields]");
		const thanks = form.querySelector("[data-signup-thanks]");
		if (fields) fields.setAttribute("hidden", "");
		if (thanks) thanks.removeAttribute("hidden");
		sessionStorage.setItem("signup-popup-closed", "1");
		const popup = document.querySelector("[data-popup]");
		if (popup) popup.hidden = true;
	});
});

const popup = document.querySelector("[data-popup]");
if (popup && sessionStorage.getItem("signup-popup-closed") !== "1") {
	window.setTimeout(() => {
		if (sessionStorage.getItem("signup-popup-closed") === "1") return;
		popup.hidden = false;
	}, 2500);
}
if (popup) {
	const closePopup = () => {
		popup.hidden = true;
		sessionStorage.setItem("signup-popup-closed", "1");
	};
	const closeButton = popup.querySelector("[data-popup-close]");
	if (closeButton) closeButton.addEventListener("click", closePopup);
	popup.addEventListener("click", (event) => {
		if (event.target === popup) closePopup();
	});
}
</script>`;

function rewriteUrl(url) {
	if (!url || /^(?:https?:|mailto:|tel:|#|data:)/i.test(url)) return url;
	if (url.startsWith("/images/")) return `images/${url.slice("/images/".length)}`;
	if (url === "/favicon.svg") return "favicon.svg";
	const hashIndex = url.indexOf("#");
	const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
	const pathOnly = hashIndex === -1 ? url : url.slice(0, hashIndex);
	if (routeMap.has(pathOnly)) return routeMap.get(pathOnly) + hash;
	const parts = pathOnly.split("/").filter(Boolean);
	if (pathOnly.startsWith("/") && parts.length === 1) return `article.html${hash}`;
	return url;
}

function stripDevMarkup(html) {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<link\b[^>]*>/gi, "")
		.replace(/\sdata-astro(?:-[a-z0-9-]+)?(?:="[^"]*")?/gi, "");
}

function rewriteAttributes(html) {
	return html.replace(/\s(href|src)="([^"]*)"/g, (match, attr, url) => ` ${attr}="${rewriteUrl(url)}"`);
}

function buildCss() {
	const bootstrap = readFileSync(path.join(root, "node_modules/bootstrap/dist/css/bootstrap.min.css"), "utf8").trim();
	const theme = readFileSync(path.join(root, "src/styles/site.css"), "utf8").trim();
	return [
		`@import url("https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap");`,
		`:root { --font-body: "Figtree", sans-serif; }`,
		"/* Bootstrap 5.3.3 */",
		bootstrap,
		"/* Theme */",
		theme,
	].join("\n");
}

function prettyHtml(html) {
	const preserved = [];
	const marked = html.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, (block) => {
		preserved.push(block);
		return `\n%%PRESERVE${preserved.length - 1}%%\n`;
	});
	const lines = marked.replace(/>\s*</g, ">\n<").split("\n");
	const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
	let depth = 0;
	const out = [];
	for (const raw of lines) {
		const trimmed = raw.trim();
		if (!trimmed) continue;
		const preserve = trimmed.match(/^%%PRESERVE(\d+)%%$/);
		if (preserve) {
			const block = preserved[Number(preserve[1])];
			const indented = block
				.split("\n")
				.map((line, index) => (index === 0 ? `${"  ".repeat(depth)}${line}` : line))
				.join("\n");
			out.push(indented);
			continue;
		}
		const open = /^<([a-zA-Z0-9]+)/.exec(trimmed);
		const name = open?.[1]?.toLowerCase();
		const closing = trimmed.startsWith("</");
		const closedOnLine = trimmed.includes("</");
		const selfClosing = /\/>$/.test(trimmed) || (name && voidTags.has(name) && !closedOnLine);
		if (closing) depth = Math.max(0, depth - 1);
		out.push(`${"  ".repeat(depth)}${trimmed}`);
		if (open && !closing && !selfClosing && !closedOnLine) depth += 1;
	}
	return `${out.join("\n")}\n`;
}

function stamp(html, page) {
	const comment = `<!--\nTemplate: ${page.name}\nWordPress file: ${page.wordpress}\nRoute: ${page.route}\nStyles are in the style element in the head. Shared images are in ./images/.\n-->`;
	const headAssets = `<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<style>\n${buildCss()}\n</style>`;
	let next = html.replace(/<!doctype html>/i, (tag) => `${tag}\n${comment}`);
	if (!next.includes(comment)) next = `${comment}\n${next}`;
	next = next.replace(/<\/head>/i, `${headAssets}\n</head>`);
	next = next.replace(/<\/body>/i, `${behavior}\n</body>`);
	return prettyHtml(next);
}

const css = buildCss();
rmSync(outDir, { recursive: true, force: true });
mkdirSync(path.join(outDir, "images"), { recursive: true });
cpSync(path.join(root, "public/images"), path.join(outDir, "images"), { recursive: true });
cpSync(path.join(root, "public/favicon.svg"), path.join(outDir, "favicon.svg"));

const readme = `# HTML templates

Each file is one page layout with Bootstrap and the theme CSS inside a \`<style>\` block. Open \`index.html\` from this folder. Image paths are relative to this folder.

| File | Layout | WordPress template |
| --- | --- | --- |
| index.html | Home | front-page.php |
| newsletter.html | Newsletter landing page | page-newsletter.php |
| archive.html | Articles, first page | home.php |
| archive-page-2.html | Articles, older page | home.php |
| article.html | Single article | single.php |
| about.html | About | page-about.php |
| page.html | Default page (privacy) | page.php |
| 404.html | Not found | 404.php |

Figtree is loaded with an \`@import\` at the top of that style block. Copy is lorem ipsum. Signup forms only show the on-page confirmation.
`;
writeFileSync(path.join(outDir, "README.md"), readme);

for (const page of pages) {
	const response = await fetch(`${origin}${page.route}`);
	if (!response.ok && response.status !== 404) {
		throw new Error(`${page.route} returned ${response.status}`);
	}
	const raw = await response.text();
	if (!raw.includes("<html")) throw new Error(`${page.route} did not return HTML`);
	const html = stamp(rewriteAttributes(stripDevMarkup(raw)), page);
	if (!html.includes("--accent: #2667ff") || !html.includes("<style>")) {
		throw new Error(`${page.file} is missing inlined CSS`);
	}
	if (/<script\b[^>]*\bsrc=/i.test(html) || /<link\b[^>]*stylesheet/i.test(html)) {
		throw new Error(`${page.file} still references an external script or stylesheet`);
	}
	writeFileSync(path.join(outDir, page.file), html);
	console.log(`${page.file} ${response.status} ${html.length} bytes`);
}

const zipPath = path.join(root, "public/blue-layout-templates.zip");
execFileSync("zip", ["-r", "-q", zipPath, "."], { cwd: outDir });
console.log(`wrote ${zipPath}`);
console.log(`css block ${css.length} bytes`);
