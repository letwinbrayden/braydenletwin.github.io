import { getSupabase } from './supabase-client.js';
import { deletePost, fetchAllPostsForAdmin, fetchProfile, savePost } from './blog-data.js';
import { formatLongDate } from './site-utils.js';

const supabase = getSupabase();
const statusEl = document.getElementById('admin-status');
const appEl = document.getElementById('admin-app');
const infoEl = document.getElementById('admin-user-info');
const signOutButton = document.getElementById('admin-sign-out');
const noticeEl = document.getElementById('admin-notices');
const postListEl = document.getElementById('admin-post-list');
const newPostButton = document.getElementById('new-post-button');
const resetEditorButton = document.getElementById('reset-editor-button');
const editorHeading = document.getElementById('editor-heading');
const form = document.getElementById('post-editor-form');
const previewLink = document.getElementById('preview-link');

const inputs = {
  id: document.getElementById('post-id'),
  title: document.getElementById('post-title-input'),
  slug: document.getElementById('post-slug-input'),
  publishedAt: document.getElementById('post-date-input'),
  readTime: document.getElementById('post-readtime-input'),
  excerpt: document.getElementById('post-excerpt-input'),
  contentHtml: document.getElementById('post-content-input'),
  isPublished: document.getElementById('post-published-input'),
};

const state = {
  session: null,
  profile: null,
  posts: [],
  editingId: null,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setNotice(message, type = '') {
  noticeEl.innerHTML = '';
  if (!message) return;
  const notice = document.createElement('div');
  notice.className = `notice ${type}`.trim();
  notice.textContent = message;
  noticeEl.appendChild(notice);
}

function renderMessage(title, body) {
  statusEl.innerHTML = `<div class="empty-state"><strong>${escapeHtml(title)}</strong><br />${body}</div>`;
}

function resetForm() {
  state.editingId = null;
  form.reset();
  inputs.id.value = '';
  inputs.publishedAt.value = new Date().toISOString().slice(0, 10);
  editorHeading.textContent = 'Create post';
  previewLink.href = 'blog.html';
}

function fillForm(post) {
  state.editingId = post.id;
  inputs.id.value = post.id;
  inputs.title.value = post.title || '';
  inputs.slug.value = post.slug || '';
  inputs.publishedAt.value = post.publishedAt || '';
  inputs.readTime.value = post.readTime || '';
  inputs.excerpt.value = post.excerpt || '';
  inputs.contentHtml.value = post.contentHtml || '';
  inputs.isPublished.checked = Boolean(post.isPublished);
  editorHeading.textContent = 'Edit post';
  previewLink.href = post.slug ? `post.html?slug=${encodeURIComponent(post.slug)}` : 'blog.html';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPostList() {
  postListEl.innerHTML = '';

  if (state.posts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No posts yet. Create your first one using the form.';
    postListEl.appendChild(empty);
    return;
  }

  state.posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'comment-card';

    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    const status = post.isPublished ? 'Published' : 'Draft';
    const when = post.publishedAt ? formatLongDate(post.publishedAt) : 'No publish date';
    meta.textContent = `${status} • ${when}`;

    const title = document.createElement('h3');
    title.style.margin = '0';
    title.textContent = post.title;

    const excerpt = document.createElement('p');
    excerpt.textContent = post.excerpt;

    const slug = document.createElement('div');
    slug.className = 'small muted';
    slug.textContent = `/${post.slug}`;

    const actions = document.createElement('div');
    actions.className = 'buttons';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => fillForm(post));

    const openLink = document.createElement('a');
    openLink.className = 'button';
    openLink.href = post.isPublished ? `post.html?slug=${encodeURIComponent(post.slug)}` : '#';
    openLink.textContent = 'Open';
    if (!post.isPublished) {
      openLink.setAttribute('aria-disabled', 'true');
      openLink.style.pointerEvents = 'none';
      openLink.style.opacity = '0.55';
    }

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
      if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
      try {
        await deletePost(post.id);
        setNotice('Post deleted.', 'success');
        if (state.editingId === post.id) resetForm();
        await loadPosts();
      } catch (error) {
        setNotice(error.message || 'Could not delete the post.', 'error');
      }
    });

    actions.append(editButton, openLink, deleteButton);
    card.append(meta, title, excerpt, slug, actions);
    postListEl.appendChild(card);
  });
}

async function loadPosts() {
  state.posts = await fetchAllPostsForAdmin();
  renderPostList();
}

async function requireAdmin() {
  if (!supabase) {
    renderMessage('Supabase not configured.', 'Fill in <span class="code-inline">supabase-config.js</span> before using the protected editor page.');
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    renderMessage('Could not verify session.', escapeHtml(sessionError.message));
    return;
  }

  state.session = sessionData.session;
  if (!state.session) {
    renderMessage('Please sign in.', 'This page only loads for signed-in admins. Sign in on any blog post page first.');
    return;
  }

  try {
    state.profile = await fetchProfile(state.session.user.id);
  } catch (error) {
    renderMessage('Could not verify admin status.', escapeHtml(error.message || 'Unknown error.'));
    return;
  }

  if (!state.profile?.is_admin) {
    renderMessage('Access denied.', 'Your account is signed in, but it is not marked as an admin account.');
    return;
  }

  statusEl.style.display = 'none';
  appEl.style.display = 'block';
  infoEl.innerHTML = `${escapeHtml(state.profile.display_name || 'Admin')}<br />${escapeHtml(state.session.user.email || '')}`;
  resetForm();
  await loadPosts();
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setNotice('');

  const payload = {
    id: inputs.id.value || null,
    title: inputs.title.value,
    slug: inputs.slug.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''),
    publishedAt: inputs.publishedAt.value || null,
    readTime: inputs.readTime.value,
    excerpt: inputs.excerpt.value,
    contentHtml: inputs.contentHtml.value,
    isPublished: inputs.isPublished.checked,
  };

  if (payload.isPublished && !payload.publishedAt) {
    payload.publishedAt = new Date().toISOString().slice(0, 10);
  }

  try {
    const saved = await savePost(payload);
    setNotice(payload.id ? 'Post updated.' : 'Post created.', 'success');
    await loadPosts();
    fillForm(saved);
  } catch (error) {
    setNotice(error.message || 'Could not save the post.', 'error');
  }
});

newPostButton?.addEventListener('click', () => {
  resetForm();
  setNotice('');
});

resetEditorButton?.addEventListener('click', () => {
  resetForm();
  setNotice('');
});

signOutButton?.addEventListener('click', async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.reload();
});

supabase?.auth.onAuthStateChange(() => {
  window.location.reload();
});

requireAdmin();
