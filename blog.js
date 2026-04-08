import { createPostCard } from './site-utils.js';
import { fetchPublishedPosts, isBlogConfigured } from './blog-data.js';

const postList = document.getElementById('blog-post-list');

async function initBlog() {
  if (!postList) return;

  if (!isBlogConfigured()) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'The blog will appear here once Supabase is configured.';
    postList.appendChild(empty);
    return;
  }

  try {
    const posts = await fetchPublishedPosts();

    if (posts.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'There are no published posts yet.';
      postList.appendChild(empty);
      return;
    }

    posts.forEach((post) => {
      postList.appendChild(createPostCard(post));
    });
  } catch (error) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Could not load the blog right now.';
    postList.appendChild(empty);
    console.error(error);
  }
}

initBlog();
