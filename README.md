# Brayden Letwin site starter with blog, accounts, and comments

This bundle keeps your site mostly static HTML/CSS, then adds:

- a public blog listing page (`blog.html`)
- individual post pages (`post.html?slug=...`)
- account creation and sign-in using Supabase Auth
- authenticated comments tied to user profiles
- an admin page (`admin.html`) for creating and publishing posts

## Files

- `index.html` — your homepage, now with a blog section
- `blog.html` — all public posts + account panel
- `post.html` — single post + comments
- `admin.html` — admin-only post editor
- `site.css` — shared styling
- `js/config.js` — put your Supabase project values here
- `supabase/schema.sql` — database schema, triggers, and RLS policies

## Setup

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. In `js/config.js`, replace the placeholder values with your project URL and publishable key (or legacy anon key).
4. In Supabase Auth settings, set your Site URL to your real site URL. During development, also add your local URL (for example `http://127.0.0.1:5500` or whatever your local server uses).
5. Open `blog.html`, create your account, then make yourself an admin in the SQL Editor with:

```sql
insert into public.site_admins (user_id)
select id
from auth.users
where email = 'your-email@example.com'
on conflict do nothing;
```

6. Visit `admin.html`, sign in, and create your first post.

## Notes

- The post editor stores trusted HTML in `content_html`.
- Comments are public to read, but only signed-in users can create them.
- Only accounts listed in `site_admins` can create, edit, publish, or delete posts.
- The browser code should use only the publishable/anon key. Never put a service-role key in `js/config.js`.

## Local preview

Any static file server is fine. For example, from this folder:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`
- `http://localhost:8000/blog.html`
- `http://localhost:8000/admin.html`
