# Blog + accounts + comments for your site

This package keeps your site visually simple, but now adds a real Supabase-backed blog system:

- a blog landing page,
- individual blog post pages,
- a protected admin editor,
- email/password account creation,
- sign-in/sign-out,
- per-post comments,
- deletion of your own comments.

## Files

- `index.html` — updated home page with a blog section
- `blog.html` — blog archive page
- `post.html` — single post page with auth + comments
- `admin.html` — protected blog editor page
- `styles.css` — shared styling for all pages
- `blog-data.js` — reads and writes blog posts from Supabase
- `home.js`, `blog.js`, `post.js`, `admin.js` — page logic
- `supabase-config.js` — fill in your project URL and key
- `supabase-setup.sql` — database tables, trigger, and RLS policies

## What changed from the earlier version

Posts no longer live in `posts.js`.

They now live in the `public.posts` table in Supabase, and `admin.html` is a real browser-based editor for creating, editing, publishing, and deleting posts.

## Supabase setup

1. Create a Supabase project.
2. In the SQL Editor, run `supabase-setup.sql`.
3. Open `supabase-config.js` and replace the placeholders with your project URL and anon/publishable key.
4. In Auth settings, set your Site URL and allowed Redirect URLs to your deployed domain.
5. Deploy the site.

## Make yourself an admin

First create your account by signing up on any blog post page after the site is live, or create the user in Supabase Auth.

Then run:

```sql
update public.profiles
set is_admin = true
where id = 'YOUR-USER-UUID';
```

You can find your UUID in:

- Supabase Dashboard → Authentication → Users, or
- the `public.profiles` table.

After that, visit `admin.html`.

## How to create a post

1. Open `admin.html`.
2. Sign in with your admin account.
3. Click **New post**.
4. Fill in title, slug, excerpt, content HTML, and optionally read time.
5. Check **Publish this post** when ready.
6. Save.

Published posts appear automatically on:

- `index.html`
- `blog.html`
- `post.html?slug=your-post-slug`

## Notes about post content

The editor currently stores the body as HTML in `content_html`.

That means you can paste content like:

```html
<p>This is a paragraph.</p>
<blockquote>A quoted remark.</blockquote>
<ul><li>Point one</li><li>Point two</li></ul>
```

## Important note about slugs

Comments are tied to the post slug. Try not to change a slug after comments exist.

## Important note about email confirmations

If email confirmation is enabled, users usually need to confirm their email before they can sign in the first time.

## Local testing

Because this site uses JavaScript modules, test it through a local web server rather than opening files directly with `file://`.

Example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Existing files

Keep your own copies of:

- `image.jpeg`
- `CV.pdf`
- your existing publications page

This package removes publications links from the updated pages, since you said you already have that page handled separately.
