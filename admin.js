import { getSupabase } from './supabase-client.js';
import { deletePost, fetchAllPostsForAdmin, fetchProfile, savePost } from './blog-data.js';
import { formatLongDate } from './site-utils.js';

const supabase = getSupabase();

const statusEl = document.getElementById('admin-status');
const appEl = document.getElementById('admin-app');
const infoEl = document.getElementById('admin-user-info');
const noticeEl = document.getElementById('admin-notices');
const postListEl = document.getElementById('admin-post-list');
const refreshPostsButton = document.getElementById('refresh-posts-button');
const newPostButton = document.getElementById('new-post-button');
const signOutButton = document.getElementById('admin-sign-out');
const resetEditorButton = document.getElementById('reset-editor-button');
const savePostButton = document.getElementById('save-post-button');
const generateSlugButton = document.getElementById('generate-slug-button');
const editorHeading = document.getElementById('editor-heading');
const previewLink = document.getElementById('preview-link');
const form = document.getElementById('post-editor-form');

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
  slugTouched: false,
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function formatError(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
}

function setNotice(message, type = '') {
  noticeEl.innerHTML = '';
  if (!message) return;
  const notice = document.createElement('div');
  notice.className = `notice ${type}`.trim();
  notice.textContent = message;
  noticeEl.appendChild(notice);
}

function setInlineNotice(targetId, message, type = '') {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = message ? `<div class="notice ${type}">${escapeHtml(message)}</div>` : '';
}

function showStatus(html) {
  statusEl.innerHTML = html;
  statusEl.hidden = false;
  appEl.hidden = true;
}

function showApp() {
  statusEl.hidden = true;
  appEl.hidden = false;
}

function setButtonBusy(button, busy, labelWhenIdle, labelWhenBusy) {
  if (!button) return;
  button.disabled = busy;
  button.textContent = busy ? labelWhenBusy : labelWhenIdle;
}

function updatePreviewLink() {
  const slug = slugify(inputs.slug.value);
  if (slug && inputs.isPublished.checked) {
    previewLink.href = `post.html?slug=${encodeURIComponent(slug)}`;
    previewLink.textContent = 'Open post';
    return;
  }

  previewLink.href = 'blog.html';
  previewLink.textContent = 'Open blog';
}

function maybeAutofillSlug() {
  if (state.slugTouched && inputs.slug.value.trim()) return;
  inputs.slug.value = slugify(inputs.title.value);
  updatePreviewLink();
}

function resetForm() {
  state.editingId = null;
  state.slugTouched = false;
  form.reset();
  inputs.id.value = '';
  inputs.publishedAt.value = '';
  inputs.readTime.value = '';
  editorHeading.textContent = 'Create post';
  updatePreviewLink();
}

function fillForm(post) {
  state.editingId = post.id;
  state.slugTouched = true;
  inputs.id.value = post.id || '';
  inputs.title.value = post.title || '';
  inputs.slug.value = post.slug || '';
  inputs.publishedAt.value = post.publishedAt || '';
  inputs.readTime.value = post.readTime || '';
  inputs.excerpt.value = post.excerpt || '';
  inputs.contentHtml.value = post.contentHtml || '';
  inputs.isPublished.checked = Boolean(post.isPublished);
  editorHeading.textContent = 'Edit post';
  updatePreviewLink();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPostList() {
  postListEl.innerHTML = '';

  if (state.posts.length === 0) {
    postListEl.innerHTML = '<div class="empty-state">No posts yet. Use the form to create your first one.</div>';
    return;
  }

  state.posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'admin-post-card';

    const meta = document.createElement('div');
    meta.className = 'admin-post-meta';
    meta.textContent = `${post.isPublished ? 'Published' : 'Draft'} • ${post.publishedAt ? formatLongDate(post.publishedAt) : 'No publish date'}`;

    const title = document.createElement('h4');
    title.textContent = post.title;

    const slug = document.createElement('div');
    slug.className = 'small muted';
    slug.textContent = `/${post.slug}`;

    const excerpt = document.createElement('p');
    excerpt.textContent = post.excerpt;

    const actions = document.createElement('div');
    actions.className = 'admin-post-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      fillForm(post);
      setNotice('');
    });

    const openLink = document.createElement('a');
    openLink.className = 'button secondary';
    openLink.textContent = post.isPublished ? 'Open' : 'Blog';
    openLink.href = post.isPublished ? `post.html?slug=${encodeURIComponent(post.slug)}` : 'blog.html';
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
      const confirmed = window.confirm(`Delete “${post.title}”? This cannot be undone.`);
      if (!confirmed) return;

      try {
        await deletePost(post.id);
        if (state.editingId === post.id) resetForm();
        setNotice('Post deleted.', 'success');
        await loadPosts();
      } catch (error) {
        setNotice(formatError(error, 'Could not delete the post.'), 'error');
      }
    });

    actions.append(editButton, openLink, deleteButton);
    card.append(meta, title, slug, excerpt, actions);
    postListEl.appendChild(card);
  });
}

function renderLoggedOut(message = 'Create an account or sign in with your admin account.') {
  showStatus(`
    <div class="admin-status-grid">
      <div class="auth-box">
        <h3 style="margin-top:0;">Create account</h3>
        <p class="muted">You only need to do this once.</p>
        <form id="admin-sign-up-form">
          <div class="form-row">
            <label for="admin-signup-name">Display name</label>
            <input id="admin-signup-name" name="displayName" type="text" maxlength="60" required />
          </div>
          <div class="form-row">
            <label for="admin-signup-email">Email</label>
            <input id="admin-signup-email" name="email" type="email" required />
          </div>
          <div class="form-row">
            <label for="admin-signup-password">Password</label>
            <input id="admin-signup-password" name="password" type="password" minlength="8" required />
          </div>
          <button class="primary" id="admin-sign-up-button" type="submit">Create account</button>
        </form>
        <div id="admin-signup-notice" style="margin-top:14px;"></div>
      </div>

      <div class="auth-box">
        <h3 style="margin-top:0;">Sign in</h3>
        <p class="muted">${escapeHtml(message)}</p>
        <form id="admin-sign-in-form">
          <div class="form-row">
            <label for="admin-email">Email</label>
            <input id="admin-email" name="email" type="email" required />
          </div>
          <div class="form-row">
            <label for="admin-password">Password</label>
            <input id="admin-password" name="password" type="password" required />
          </div>
          <button class="primary" id="admin-sign-in-button" type="submit">Sign in</button>
        </form>
        <div id="admin-signin-notice" style="margin-top:14px;"></div>
      </div>

      <div class="auth-box admin-status-message">
        <strong>One-time admin setup</strong>
        <p class="muted">After you create the account, mark it as an admin in Supabase:</p>
        <div class="admin-code-card">
          <pre>update public.profiles
set is_admin = true
where id = 'YOUR-USER-UUID';</pre>
        </div>
        <div class="admin-inline-note">If email confirmation is enabled, confirm the email first, then sign in here.</div>
      </div>
    </div>
  `);

  document.getElementById('admin-sign-up-form')?.addEventListener('submit', handleSignUp);
  document.getElementById('admin-sign-in-form')?.addEventListener('submit', handleSignIn);
}

function renderNeedsAdmin(messageTitle, messageBody, user, { includeProfileFix = false } = {}) {
  const safeDisplay = escapeHtml(user?.user_metadata?.display_name || user?.email || 'Signed-in user');
  const safeEmail = escapeHtml(user?.email || '');
  const safeUserId = escapeHtml(user?.id || 'YOUR-USER-UUID');

  const extra = includeProfileFix
    ? `
      <div class="admin-code-card" style="margin-top:14px;">
        <div class="muted">If the profile row is missing, run:</div>
        <pre>insert into public.profiles (id, display_name, is_admin)
values ('${safeUserId}', '${safeDisplay.replaceAll("'", '&#039;')}', true)
on conflict (id) do update
set is_admin = true;</pre>
      </div>
    `
    : `
      <div class="admin-code-card" style="margin-top:14px;">
        <div class="muted">To grant admin access, run:</div>
        <pre>update public.profiles
set is_admin = true
where id = '${safeUserId}';</pre>
      </div>
    `;

  showStatus(`
    <div class="auth-box admin-status-message">
      <strong>${escapeHtml(messageTitle)}</strong>
      <p class="muted">${escapeHtml(messageBody)}</p>
      <div class="admin-inline-note">Signed in as ${safeDisplay}${safeEmail ? ` (${safeEmail})` : ''}.</div>
      ${extra}
      <div class="admin-auth-actions">
        <button class="secondary" id="status-sign-out" type="button">Sign out</button>
      </div>
    </div>
  `);

  document.getElementById('status-sign-out')?.addEventListener('click', handleSignOut);
}

function renderSetupMessage(title, body) {
  showStatus(`
    <div class="empty-state admin-status-message">
      <strong>${escapeHtml(title)}</strong>
      <div>${body}</div>
    </div>
  `);
}

async function loadPosts() {
  try {
    state.posts = await fetchAllPostsForAdmin();
    renderPostList();
  } catch (error) {
    state.posts = [];
    renderPostList();
    setNotice(formatError(error, 'Could not load posts.'), 'error');
  }
}

async function renderForCurrentSession() {
  if (!supabase) {
    renderSetupMessage(
      'Supabase not configured.',
      'Fill in <span class="code-inline">supabase-config.js</span> and run <span class="code-inline">supabase-setup.sql</span> before using the editor.',
    );
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    renderSetupMessage('Could not verify session.', escapeHtml(formatError(error, 'Unknown error.')));
    return;
  }

  state.session = data.session || null;
  state.profile = null;

  if (!state.session?.user) {
    renderLoggedOut();
    return;
  }

  try {
    state.profile = await fetchProfile(state.session.user.id);
  } catch (profileError) {
    renderSetupMessage('Could not verify admin status.', escapeHtml(formatError(profileError, 'Unknown error.')));
    return;
  }

  if (!state.profile) {
    renderNeedsAdmin(
      'No profile row found.',
      'Your auth account exists, but there is no matching row in public.profiles yet.',
      state.session.user,
      { includeProfileFix: true },
    );
    return;
  }

  if (!state.profile.is_admin) {
    renderNeedsAdmin(
      'Access denied.',
      'This account is signed in, but it is not marked as an admin yet.',
      state.session.user,
    );
    return;
  }

  infoEl.innerHTML = `${escapeHtml(state.profile.display_name || 'Admin')}<br />${escapeHtml(state.session.user.email || '')}`;
  showApp();
  setNotice('');
  if (!state.editingId) resetForm();
  await loadPosts();
}

async function handleSignUp(event) {
  event.preventDefault();
  if (!supabase) return;

  setInlineNotice('admin-signup-notice', '');
  const button = document.getElementById('admin-sign-up-button');
  setButtonBusy(button, true, 'Create account', 'Creating…');

  const formData = new FormData(event.currentTarget);
  const displayName = String(formData.get('displayName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const redirectUrl = /^https?:/.test(window.location.href) ? window.location.href : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      ...(redirectUrl ? { emailRedirectTo: redirectUrl } : {}),
    },
  });

  setButtonBusy(button, false, 'Create account', 'Creating…');

  if (error) {
    setInlineNotice('admin-signup-notice', formatError(error, 'Could not create the account.'), 'error');
    return;
  }

  if (data.session) {
    setInlineNotice('admin-signup-notice', 'Account created and signed in. If this is your editor account, mark it as admin in Supabase and refresh.', 'success');
    await renderForCurrentSession();
    return;
  }

  setInlineNotice('admin-signup-notice', 'Account created. If email confirmation is enabled, confirm the email, then sign in here.', 'success');
  event.currentTarget.reset();
}

async function handleSignIn(event) {
  event.preventDefault();
  if (!supabase) return;

  setInlineNotice('admin-signin-notice', '');
  const button = document.getElementById('admin-sign-in-button');
  setButtonBusy(button, true, 'Sign in', 'Signing in…');

  const formData = new FormData(event.currentTarget);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setButtonBusy(button, false, 'Sign in', 'Signing in…');

  if (error) {
    setInlineNotice('admin-signin-notice', formatError(error, 'Could not sign in.'), 'error');
    return;
  }

  await renderForCurrentSession();
}

async function handleSignOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    setNotice(formatError(error, 'Could not sign out.'), 'error');
    return;
  }
  state.editingId = null;
  await renderForCurrentSession();
}

async function handleSavePost(event) {
  event.preventDefault();
  setNotice('');

  const slug = slugify(inputs.slug.value || inputs.title.value);
  if (!slug) {
    setNotice('Please enter a title or slug.', 'error');
    inputs.slug.focus();
    return;
  }

  const payload = {
    id: inputs.id.value || null,
    title: inputs.title.value.trim(),
    slug,
    publishedAt: inputs.publishedAt.value || null,
    readTime: inputs.readTime.value.trim(),
    excerpt: inputs.excerpt.value.trim(),
    contentHtml: inputs.contentHtml.value.trim(),
    isPublished: inputs.isPublished.checked,
  };

  if (payload.isPublished && !payload.publishedAt) {
    payload.publishedAt = new Date().toISOString().slice(0, 10);
    inputs.publishedAt.value = payload.publishedAt;
  }

  inputs.slug.value = slug;
  setButtonBusy(savePostButton, true, 'Save post', 'Saving…');

  try {
    const saved = await savePost(payload);
    await loadPosts();
    fillForm(saved);
    setNotice(payload.id ? 'Post updated.' : 'Post created.', 'success');
  } catch (error) {
    setNotice(formatError(error, 'Could not save the post.'), 'error');
  } finally {
    setButtonBusy(savePostButton, false, 'Save post', 'Saving…');
  }
}

inputs.title?.addEventListener('input', maybeAutofillSlug);
inputs.slug?.addEventListener('input', () => {
  state.slugTouched = true;
  inputs.slug.value = slugify(inputs.slug.value);
  updatePreviewLink();
});
inputs.isPublished?.addEventListener('change', updatePreviewLink);

generateSlugButton?.addEventListener('click', () => {
  inputs.slug.value = slugify(inputs.slug.value || inputs.title.value);
  state.slugTouched = true;
  updatePreviewLink();
});

form?.addEventListener('submit', handleSavePost);

newPostButton?.addEventListener('click', () => {
  resetForm();
  setNotice('');
});

resetEditorButton?.addEventListener('click', () => {
  resetForm();
  setNotice('');
});

refreshPostsButton?.addEventListener('click', async () => {
  setNotice('');
  await loadPosts();
});

signOutButton?.addEventListener('click', handleSignOut);

supabase?.auth.onAuthStateChange(async () => {
  await renderForCurrentSession();
});

await renderForCurrentSession();
