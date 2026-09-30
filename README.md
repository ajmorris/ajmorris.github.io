# Blue layout

Astro site with [EmDash](https://emdashcms.com). The public pages follow the same layouts as a simple marketing blog: home, newsletter, articles, article, about, and privacy. Body copy is lorem ipsum so it can be replaced in the admin.

The accent color is `#2667ff`. Other accents use that same hue.

## Run

Node.js 22.16 or newer.

```bash
cp .env.example .env
# Set EMDASH_ENCRYPTION_KEY in .env. EmDash prints a key when you scaffold, or use any long random string.
npm install
npm run dev
```

Open the site at `http://localhost:4321/`. The first time, finish setup at `http://localhost:4321/_emdash/admin/` and keep sample content selected. That loads the placeholder pages and posts.

Edit copy under **Site copy**, **Pages**, and **Posts**. Homepage lists use the post field **Homepage list** (`start-here` or `most-read`).

## HTML templates

`npm run export:html` writes standalone HTML files to `wordpress-html/`. Each page keeps Bootstrap and the theme CSS in a `<style>` block in the document, with images in `wordpress-html/images/`. The same folder is zipped at `public/blue-layout-templates.zip` for download from `/blue-layout-templates.zip`. The dev server needs to be running first.

## Pages

- `/` home
- `/email-newsletter/` newsletter
- `/blog/` and `/blog/page/2/` articles
- `/about/`
- `/privacy-policy/`
- `/[slug]/` articles
