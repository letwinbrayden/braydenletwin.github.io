import { getPostBySlug } from './posts.js';
import { formatLongDate } from './site-utils.js';
import { getSupabase } from './supabase-client.js';

const postTitle = document.getElementById('post-title');
const postMeta = document.getElementById('post-meta');
const postBody = document.getElementById('post-body');
const authNotices = document.getElementById('auth-notices');
const authPanel = document.getElementById('auth-panel');
const commentFormWrap = document.getElementById('comment-form-wrap');
const commentsWrap = document.getElementById('comments-wrap');

const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');
const post = getPostBySlug(slug);
const supabase = getSupabase();

const state = {
  user: null,
  comments: [],
  profilesById: new Map(),
};

function setNotice(message, type = '') {
  authNotices.innerHTML = '';

  if (!message) return;

  const notice = document.createElement('div');
  notice.className = `notice ${type}`.trim();
  notice.textContent = message;
  authNotices.appendChild(notice);
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getCurrentDisplayName() {
  if (!state.user) return '';

  return (
    state.user.user_metadata?.display_name ||
    state.user.email?.split('@')[0] ||
    'Signed-in reader'
  );
}

function getCommentAuthorName(comment) {
  if (comment.user_id === state.user?.id) {
    return getCurrentDisplayName();
  }

  return state.profilesById.get(comment.user_id) || 'Reader';
}

function renderMissingPost() {
  document.title = 'Post not found | Brayden Letwin';
  postTitle.textContent = 'Post not found';
  postMeta.innerHTML = '';
  postBody.innerHTML = `
    <div class="empty-state">
      The post you requested does not exist. Return to the <a href="blog.html">blog index</a>.
    </div>
  `;
  authPanel.innerHTML = '';
  commentFormWrap.innerHTML = '';
  commentsWrap.innerHTML = '';
}

function renderPost() {
  document.title = `${post.title} | Brayden Letwin`;
  postTitle.textContent = post.title;

  postMeta.innerHTML = '';
  const items = [formatLongDate(post.publishedAt), post.readTime];
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    postMeta.appendChild(li);
  });

  postBody.innerHTML = post.contentHtml;
}

function renderAuthPanel() {
  if (!post) return;

  if (!supabase) {
    authPanel.innerHTML = `
      <div class="auth-box">
        <p class="muted" style="margin: 0;">
          Comments are disabled until <span class="code-inline">supabase-config.js</span>
          is filled in and the SQL setup script is run.
        </p>
      </div>
    `;
    return;
  }

  if (state.user) {
    authPanel.innerHTML = `
      <div class="auth-box">
        <h3>Signed in</h3>
        <p class="muted" style="margin-top: 0;">
          ${escapeHtml(getCurrentDisplayName())}<br />
          ${escapeHtml(state.user.email || '')}
        </p>
        <button class="secondary" id="sign-out-button" type="button">Sign out</button>
      </div>
    `;

    document
      .getElementById('sign-out-button')
      ?.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          setNotice(error.message, 'error');
        }
      });

    return;
  }

  authPanel.innerHTML = `
    <div class="auth-box">
      <h3>Create account</h3>
      <form id="sign-up-form">
        <div class="form-row">
          <label for="signup-name">Display name</label>
          <input id="signup-name" name="displayName" type="text" maxlength="60" required />
        </div>
        <div class="form-row">
          <label for="signup-email">Email</label>
          <input id="signup-email" name="email" type="email" required />
        </div>
        <div class="form-row">
          <label for="signup-password">Password</label>
          <input id="signup-password" name="password" type="password" minlength="8" required />
        </div>
        <button class="primary" type="submit">Create account</button>
      </form>
    </div>

    <div class="auth-box">
      <h3>Sign in</h3>
      <form id="sign-in-form">
        <div class="form-row">
          <label for="signin-email">Email</label>
          <input id="signin-email" name="email" type="email" required />
        </div>
        <div class="form-row">
          <label for="signin-password">Password</label>
          <input id="signin-password" name="password" type="password" required />
        </div>
        <button type="submit">Sign in</button>
      </form>
    </div>
  `;

  document
    .getElementById('sign-up-form')
    ?.addEventListener('submit', handleSignUp);
  document
    .getElementById('sign-in-form')
    ?.addEventListener('submit', handleSignIn);
}

function renderCommentComposer() {
  if (!post) return;

  if (!supabase) {
    commentFormWrap.innerHTML = '';
    return;
  }

  if (!state.user) {
    commentFormWrap.innerHTML = `
      <div class="auth-box">
        <p class="muted" style="margin: 0;">
          Sign in above to leave a comment on this post.
        </p>
      </div>
    `;
    return;
  }

  commentFormWrap.innerHTML = `
    <form id="comment-form" class="comment-form">
      <h3>Leave a comment</h3>
      <div class="form-row">
        <label for="comment-content">Comment</label>
        <textarea id="comment-content" name="content" maxlength="2000" required></textarea>
      </div>
      <button class="primary" type="submit">Post comment</button>
    </form>
  `;

  document
    .getElementById('comment-form')
    ?.addEventListener('submit', handleCommentSubmit);
}

function renderComments() {
  if (!post) return;

  commentsWrap.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'comments-header';

  const title = document.createElement('h3');
  title.textContent = state.comments.length === 1 ? '1 comment' : `${state.comments.length} comments`;

  const helper = document.createElement('div');
  helper.className = 'small muted';
  helper.textContent = 'Newest first';

  header.append(title, helper);
  commentsWrap.appendChild(header);

  if (state.comments.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No comments yet.';
    commentsWrap.appendChild(empty);
    return;
  }

  state.comments.forEach((comment) => {
    const card = document.createElement('div');
    card.className = 'comment-card';

    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    meta.textContent = `${getCommentAuthorName(comment)} • ${new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(comment.created_at))}`;

    const body = document.createElement('p');
    body.textContent = comment.content;

    card.append(meta, body);

    if (state.user?.id === comment.user_id) {
      const actions = document.createElement('div');
      actions.className = 'comment-actions';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'danger';
      button.textContent = 'Delete';
      button.addEventListener('click', () => handleDeleteComment(comment.id));

      actions.appendChild(button);
      card.appendChild(actions);
    }

    commentsWrap.appendChild(card);
  });
}

async function loadSession() {
  if (!supabase) return;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setNotice(error.message, 'error');
    return;
  }

  state.user = data.session?.user || null;
}

async function loadProfiles(userIds) {
  state.profilesById = new Map();

  if (!supabase || userIds.length === 0) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((profile) => {
    state.profilesById.set(profile.id, profile.display_name);
  });
}

async function loadComments() {
  if (!supabase || !post) return;

  commentsWrap.innerHTML = '<div class="empty-state">Loading comments…</div>';

  const { data, error } = await supabase
    .from('comments')
    .select('id, user_id, content, created_at')
    .eq('post_slug', post.slug)
    .order('created_at', { ascending: false });

  if (error) {
    commentsWrap.innerHTML = '<div class="empty-state">Could not load comments.</div>';
    console.error(error);
    return;
  }

  state.comments = data || [];
  const userIds = [...new Set(state.comments.map((comment) => comment.user_id))];
  await loadProfiles(userIds);
  renderComments();
}

async function handleSignUp(event) {
  event.preventDefault();
  setNotice('');

  const form = new FormData(event.currentTarget);
  const displayName = String(form.get('displayName') || '').trim();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  const redirectUrl = window.location.protocol === 'http:' || window.location.protocol === 'https:'
    ? window.location.href
    : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      ...(redirectUrl ? { emailRedirectTo: redirectUrl } : {}),
    },
  });

  if (error) {
    setNotice(error.message, 'error');
    return;
  }

  if (!data.session) {
    setNotice('Account created. Check your email to confirm your address, then sign in.', 'success');
  } else {
    setNotice('Account created and signed in.', 'success');
  }
}

async function handleSignIn(event) {
  event.preventDefault();
  setNotice('');

  const form = new FormData(event.currentTarget);
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setNotice(error.message, 'error');
    return;
  }

  setNotice('Signed in successfully.', 'success');
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  setNotice('');

  const form = new FormData(event.currentTarget);
  const content = String(form.get('content') || '').trim();

  if (!content) {
    setNotice('Write a comment before posting.', 'error');
    return;
  }

  const { error } = await supabase.from('comments').insert({
    post_slug: post.slug,
    user_id: state.user.id,
    content,
  });

  if (error) {
    setNotice(error.message, 'error');
    return;
  }

  event.currentTarget.reset();
  setNotice('Comment posted.', 'success');
  await loadComments();
}

async function handleDeleteComment(commentId) {
  const confirmed = window.confirm('Delete this comment?');
  if (!confirmed) return;

  const { error } = await supabase.from('comments').delete().eq('id', commentId);

  if (error) {
    setNotice(error.message, 'error');
    return;
  }

  setNotice('Comment deleted.', 'success');
  await loadComments();
}

async function initialize() {
  if (!post) {
    renderMissingPost();
    return;
  }

  renderPost();
  renderAuthPanel();
  renderCommentComposer();

  if (!supabase) {
    commentsWrap.innerHTML = `
      <div class="empty-state">
        Once Supabase is configured, comments will appear here.
      </div>
    `;
    return;
  }

  await loadSession();
  renderAuthPanel();
  renderCommentComposer();
  await loadComments();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    renderAuthPanel();
    renderCommentComposer();
    await loadComments();
  });
}

initialize();
