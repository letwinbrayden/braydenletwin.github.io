# Blog + accounts + comments for your site

This package keeps your site mostly static, but adds:

- a blog landing page,
- individual blog post pages,
- email/password account creation,
- sign-in/sign-out,
- per-post comments,
- deletion of your own comments.

## Files

- `index.html` — updated home page with a blog section
- `blog.html` — blog archive page
- `post.html` — single post page with auth + comments
- `styles.css` — shared styling for all pages
- `posts.js` — your blog post data
- `home.js`, `blog.js`, `post.js` — page logic
- `supabase-config.js` — fill in your project URL and key
- `supabase-setup.sql` — database tables, trigger, RLS policies
- `admin.html`, `admin.js` — protected owner-only editor page

## How to publish posts

Open `posts.js` and edit the `BLOG_POSTS` array.

Each post has:

- `slug` — permanent identifier for the post
- `title`
- `publishedAt` — in `YYYY-MM-DD`
- `readTime`
- `excerpt`
- `contentHtml`

After a post is live, do not change its slug unless you are okay with losing the connection to its old comments.

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run `supabase-setup.sql`.
3. Open `supabase-config.js` and replace the placeholders with your project URL and anon/publishable key.
4. In Auth settings, set your Site URL and allowed Redirect URLs to your deployed domain.
5. Deploy the site.

## Important note about email confirmations

If email confirmation is enabled, users will usually need to confirm their email before they can sign in the first time.

## Local testing

Because this site uses JavaScript modules, test it through a local web server rather than opening the HTML files directly with `file://`.

One simple option is:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Replacing your current site

Copy these files into the same folder as your current site assets:

- keep your existing `image.jpeg`
- keep your existing `CV.pdf`
- keep your existing `publications.html`

If you already have custom pages, merge the new navigation links into them as needed.


## Hiding and protecting the admin page

The site now includes a protected page at `admin.html`.

- It is not linked from the public navigation.
- It uses `<meta name="robots" content="noindex,nofollow">`.
- It checks whether the signed-in user has `is_admin = true` in `public.profiles` before showing any admin content.

To make your own account an admin after signing up, run:

```sql
update public.profiles
set is_admin = true
where id = 'YOUR-USER-UUID';
```

You can find your user UUID in the Supabase Authentication users table or by querying `public.profiles`.

At the moment, blog posts still live in `posts.js`, so the admin page is a protected owner-only area rather than a full CMS.
