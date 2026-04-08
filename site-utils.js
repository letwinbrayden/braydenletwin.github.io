export function formatLongDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function sortPostsNewestFirst(posts) {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function createPostCard(post, { compact = false } = {}) {
  const article = document.createElement('article');
  article.className = 'card blog-card';

  const title = document.createElement('h3');
  const link = document.createElement('a');
  link.href = `post.html?slug=${encodeURIComponent(post.slug)}`;
  link.textContent = post.title;
  title.appendChild(link);

  const meta = document.createElement('div');
  meta.className = 'post-date';
  meta.textContent = `${formatLongDate(post.publishedAt)} • ${post.readTime}`;

  const excerpt = document.createElement('p');
  excerpt.textContent = post.excerpt;

  const readMore = document.createElement('a');
  readMore.href = `post.html?slug=${encodeURIComponent(post.slug)}`;
  readMore.textContent = compact ? 'Open post' : 'Read post';

  article.append(title, meta, excerpt, readMore);
  return article;
}
