export const BLOG_POSTS = [
  {
    slug: 'template-welcome',
    title: 'Template post: Welcome to the blog',
    publishedAt: '2026-04-08',
    readTime: '2 min read',
    excerpt:
      'A starter post showing the blog layout, single-post page, and comment system.',
    contentHtml: `
      <p>
        This is a template post. Replace the title, date, excerpt, and HTML content in
        <span class="code-inline">posts.js</span> with your own writing.
      </p>
      <p>
        Each post appears automatically on the home page and on the main blog page.
        Readers can open the post, create an account, and leave comments underneath.
      </p>
      <p>
        The simplest workflow is to duplicate one of the objects in
        <span class="code-inline">BLOG_POSTS</span>, change the <span class="code-inline">slug</span>,
        and update the content.
      </p>
      <blockquote>
        The comment system is powered separately from the post content, so you can keep
        writing your posts as static site files while still letting readers interact.
      </blockquote>
      <p>
        When you are ready, delete these template posts and publish your own material.
      </p>
    `,
  },
  {
    slug: 'template-second-post',
    title: 'Template post: Another example entry',
    publishedAt: '2026-04-08',
    readTime: '3 min read',
    excerpt:
      'A second example so the listing page has more than one entry.',
    contentHtml: `
      <p>
        This second example exists mainly to demonstrate the archive page and the
        “latest posts” preview on the front page.
      </p>
      <p>
        A good post object usually includes:
      </p>
      <ul>
        <li>a unique slug,</li>
        <li>a readable title,</li>
        <li>a publication date,</li>
        <li>a short excerpt, and</li>
        <li>the main HTML body.</li>
      </ul>
      <p>
        You can keep the prose simple, or you can include richer HTML such as lists,
        links, blockquotes, or images.
      </p>
      <p>
        The comments for this post are stored under its slug, so changing a published
        slug later will break the connection to its existing comments. After a post is
        live, treat the slug as permanent.
      </p>
    `,
  },
];

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
