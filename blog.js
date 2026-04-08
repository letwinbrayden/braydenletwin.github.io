import { BLOG_POSTS } from './posts.js';
import { createPostCard, sortPostsNewestFirst } from './site-utils.js';

const postList = document.getElementById('blog-post-list');

if (postList) {
  const posts = sortPostsNewestFirst(BLOG_POSTS);

  if (posts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent =
      'There are no posts yet. Add entries to posts.js and they will appear here automatically.';
    postList.appendChild(empty);
  } else {
    posts.forEach((post) => {
      postList.appendChild(createPostCard(post));
    });
  }
}
