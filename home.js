import { createPostCard } from './site-utils.js';
import { fetchPublishedPosts, isBlogConfigured } from './blog-data.js';

const latestPostsContainer = document.getElementById('latest-posts');

async function initHome() {
  if (!latestPostsContainer) return;

  if (!isBlogConfigured()) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Blog posts will appear here once Supabase is configured.';
    latestPostsContainer.appendChild(empty);
    return;
  }

  try {
    const posts = (await fetchPublishedPosts()).slice(0, 3);

    if (posts.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No blog posts have been published yet.';
      latestPostsContainer.appendChild(empty);
      return;
    }

    posts.forEach((post) => {
      latestPostsContainer.appendChild(createPostCard(post, { compact: true }));
    });
  } catch (error) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Could not load blog posts right now.';
    latestPostsContainer.appendChild(empty);
    console.error(error);
  }
}

initHome();
