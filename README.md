# Publications-managed site

This version removes the blog and keeps the site focused on your homepage plus a Supabase-backed publications page.

## Main files

- `index.html` — homepage
- `publications.html` — public publications page
- `publications-admin.html` — protected publications editor
- `admin.html` — shortcut that redirects to `publications-admin.html`
- `publications-data.js` / `publications-page.js` / `publications-shared.js` — publications data + rendering
- `publications-bootstrap.js` — bootstrap copy of your current publications page
- `auth-data.js` — admin profile lookup helper
- `supabase-config.js` — fill in your project URL and anon/publishable key
- `supabase-setup.sql` — database tables, trigger, and RLS policies for profiles + publications
- `supabase-publications-seed.sql` — optional one-shot seed for the publications table

## Supabase setup

1. Create a Supabase project.
2. In the SQL Editor, run `supabase-setup.sql`.
3. Open `supabase-config.js` and replace the placeholders with your project URL and anon/publishable key.
4. In Auth settings, set your Site URL and allowed Redirect URLs to your deployed domain.
5. Deploy the site.

## Make yourself an admin

First create your account from `publications-admin.html`, or create the user in Supabase Auth.

Then run:

```sql
update public.profiles
set is_admin = true
where id = 'YOUR-USER-UUID';
```

You can find your UUID in:

- Supabase Dashboard → Authentication → Users, or
- the `public.profiles` table.

## Publications editor

The publications page is Supabase-backed.

1. Open `publications-admin.html`.
2. Sign in with your admin account.
3. Either:
   - click **Import current page** once to copy the existing hard-coded publications into Supabase, or
   - run `supabase-publications-seed.sql` in Supabase SQL Editor.
4. After that, add and edit publications from the browser.

The editor now lets you type plain text and LaTeX only; the publication card HTML is generated automatically. It supports:

- **Title text / LaTeX**
- **Metadata lines** (one line per row; optional link syntax like `[Name](https://...)`)
- **Badges** (one per line)
- **Links** in the format `Label | URL`
- **Abstract text / LaTeX**
- **Display order** so you can keep entries in the order you want

Math is rendered on the public page and in the admin preview through MathJax.

## Notes

- The homepage no longer links to a blog.
- `admin.html` now serves only as a shortcut to the publications editor.
- `blog.html` and `post.html` now redirect to the homepage so old links do not break badly.
- If you previously used the blog-enabled version, the old blog tables in Supabase are simply no longer used by this site.

## Local testing

Because this site uses JavaScript modules, test it through a local web server rather than opening files directly with `file://`.

Example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.


## Math support

The publications page and admin preview use MathJax with a broader TeX package set preloaded (including AMS, mathtools, physics, mhchem, upgreek, units, and related packages). Common analysis/probability macros are pre-defined, and `\le` / `\ge` are mapped to the slanted variants.
