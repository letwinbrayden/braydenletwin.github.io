import { BLOG_POSTS } from './posts.js';
import { createPostCard, sortPostsNewestFirst } from './site-utils.js';

const latestPostsContainer = document.getElementById('latest-posts');

if (latestPostsContainer) {
  const posts = sortPostsNewestFirst(BLOG_POSTS).slice(0, 3);

  if (posts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No blog posts have been published yet.';
    latestPostsContainer.appendChild(empty);
  } else {
    posts.forEach((post) => {
      latestPostsContainer.appendChild(createPostCard(post, { compact: true }));
    });
  }
}
