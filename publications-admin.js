import { getSupabase } from './supabase-client.js';
import { fetchProfile } from './auth-data.js';
import {
  deletePublication,
  fetchAllPublicationsForAdmin,
  importBootstrapPublications,
  savePublication,
  setPublicationOrder,
} from './publications-data.js';
import {
  escapeHtml,
  formatLinksTextarea,
  formatLinesTextarea,
  formatMonthYear,
  parseLinksTextarea,
  parseLinesTextarea,
  renderPublicationCard,
  slugify,
  sourceTextFromStoredValue,
  stripHtml,
  typesetMath,
} from './publications-shared.js';

const supabase = getSupabase();

const statusEl = document.getElementById('admin-status');
const appEl = document.getElementById('admin-app');
const infoEl = document.getElementById('admin-user-info');
const noticeEl = document.getElementById('admin-notices');
const publicationListEl = document.getElementById('admin-publication-list');
const refreshButton = document.getElementById('refresh-publications-button');
const importButton = document.getElementById('import-bootstrap-button');
const newPublicationButton = document.getElementById('new-publication-button');
const signOutButton = document.getElementById('admin-sign-out');
const resetEditorButton = document.getElementById('reset-editor-button');
const savePublicationButton = document.getElementById('save-publication-button');
const generateSlugButton = document.getElementById('generate-slug-button');
const editorHeading = document.getElementById('editor-heading');
const previewLink = document.getElementById('preview-link');
const previewEl = document.getElementById('publication-preview');
const form = document.getElementById('publication-editor-form');

const inputs = {
  id: document.getElementById('publication-id'),
  titleHtml: document.getElementById('publication-title-input'),
  slug: document.getElementById('publication-slug-input'),
  sortOrder: document.getElementById('publication-order-input'),
  metaLines: document.getElementById('publication-meta-input'),
  badges: document.getElementById('publication-badges-input'),
  links: document.getElementById('publication-links-input'),
  abstractHtml: document.getElementById('publication-abstract-input'),
  isPublished: document.getElementById('publication-published-input'),
};

const state = {
  session: null,
  profile: null,
  publications: [],
  editingId: null,
  slugTouched: false,
  previewTimer: null,
  renderScheduled: false,
};

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

function getDisplayOrderValue(publication) {
  const value = Number(publication?.sortOrder ?? 0);
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.round(value));
}

function clampRequestedPosition(value, totalCount) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.max(totalCount, 1);
  const rounded = Math.round(parsed);
  return Math.min(Math.max(rounded, 1), Math.max(totalCount, 1));
}

function getNextSortOrder() {
  return state.publications.length + 1;
}

function getRequestedPosition() {
  const totalCount = state.publications.length + (state.editingId ? 0 : 1);
  return clampRequestedPosition(inputs.sortOrder.value || getNextSortOrder(), totalCount);
}

function buildOrderedPublicationList(savedPublication, requestedPosition) {
  const remaining = state.publications.filter((publication) => publication.id !== savedPublication.id);
  const ordered = [...remaining];
  const totalCount = ordered.length + 1;
  const insertionIndex = Math.min(Math.max(totalCount - requestedPosition, 0), ordered.length);
  ordered.splice(insertionIndex, 0, savedPublication);
  return ordered;
}

function updatePreviewLink() {
  const slug = slugify(inputs.slug.value || inputs.titleHtml.value);
  if (slug && inputs.isPublished.checked) {
    previewLink.href = `publications.html#${encodeURIComponent(slug)}`;
    previewLink.textContent = 'Open published entry';
    return;
  }

  previewLink.href = 'publications.html';
  previewLink.textContent = 'Open publications page';
}

function maybeAutofillSlug() {
  if (state.slugTouched && inputs.slug.value.trim()) return;
  inputs.slug.value = slugify(inputs.titleHtml.value);
  updatePreviewLink();
}

function schedulePreviewRender() {
  window.clearTimeout(state.previewTimer);
  state.previewTimer = window.setTimeout(() => {
    void renderPreview();
  }, 120);
}

function getDraftPublication() {
  const slug = slugify(inputs.slug.value || inputs.titleHtml.value);

  return {
    id: inputs.id.value || null,
    titleHtml: inputs.titleHtml.value.trim(),
    slug,
    sortOrder: getRequestedPosition(),
    metaLines: parseLinesTextarea(inputs.metaLines.value),
    badges: parseLinesTextarea(inputs.badges.value),
    links: parseLinksTextarea(inputs.links.value),
    abstractHtml: inputs.abstractHtml.value.trim(),
    isPublished: inputs.isPublished.checked,
  };
}

async function renderPreview() {
  if (!previewEl) return;
  const draft = getDraftPublication();

  previewEl.innerHTML = '';
  if (!draft.titleHtml && !draft.abstractHtml) {
    previewEl.innerHTML = '<div class="empty-state">Start typing to preview the template publication card.</div>';
    return;
  }

  previewEl.appendChild(renderPublicationCard(draft, { expandAbstract: true }));
  await typesetMath(previewEl);
}

function resetForm() {
  state.editingId = null;
  state.slugTouched = false;
  form.reset();
  inputs.id.value = '';
  inputs.sortOrder.value = String(getNextSortOrder());
  inputs.isPublished.checked = true;
  editorHeading.textContent = 'Create publication';
  updatePreviewLink();
  schedulePreviewRender();
}

function fillForm(publication) {
  state.editingId = publication.id;
  state.slugTouched = true;
  inputs.id.value = publication.id || '';
  inputs.titleHtml.value = sourceTextFromStoredValue(publication.titleHtml);
  inputs.slug.value = publication.slug || '';
  inputs.sortOrder.value = String(getDisplayOrderValue(publication));
  inputs.metaLines.value = formatLinesTextarea(publication.metaLines.map(sourceTextFromStoredValue));
  inputs.badges.value = formatLinesTextarea(publication.badges.map(sourceTextFromStoredValue));
  inputs.links.value = formatLinksTextarea(publication.links);
  inputs.abstractHtml.value = sourceTextFromStoredValue(publication.abstractHtml);
  inputs.isPublished.checked = Boolean(publication.isPublished);
  editorHeading.textContent = 'Edit publication';
  updatePreviewLink();
  schedulePreviewRender();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPublicationList() {
  publicationListEl.innerHTML = '';

  if (state.publications.length === 0) {
    publicationListEl.innerHTML = '<div class="empty-state">No publications in Supabase yet. Use “Import current page” or create one here.</div>';
    return;
  }

  state.publications.forEach((publication, index) => {
    const position = index + 1;
    const card = document.createElement('article');
    card.className = 'admin-publication-card';

    const meta = document.createElement('div');
    meta.className = 'admin-publication-meta';
    const updatedLabel = publication.updatedAt ? formatMonthYear(publication.updatedAt) : 'No update timestamp';
    meta.textContent = `${publication.isPublished ? 'Published' : 'Draft'} • Position ${position} • ${updatedLabel}`;

    const title = document.createElement('h4');
    title.textContent = stripHtml(publication.titleHtml) || '(Untitled publication)';

    const slug = document.createElement('div');
    slug.className = 'small muted';
    slug.textContent = `#${publication.slug}`;

    const summary = document.createElement('p');
    const pieces = [];
    if (publication.metaLines[0]) pieces.push(stripHtml(publication.metaLines[0]));
    if (publication.badges[0]) pieces.push(stripHtml(publication.badges[0]));
    if (publication.links[0]) pieces.push(publication.links[0].label);
    summary.textContent = pieces.join(' • ') || 'No metadata yet.';

    const actions = document.createElement('div');
    actions.className = 'admin-publication-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      fillForm(publication, position);
      setNotice('');
    });

    const openLink = document.createElement('a');
    openLink.className = 'button secondary';
    openLink.textContent = publication.isPublished ? 'Open' : 'Publications';
    openLink.href = publication.isPublished ? `publications.html#${encodeURIComponent(publication.slug)}` : 'publications.html';
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
      const confirmed = window.confirm(`Delete “${stripHtml(publication.titleHtml)}”? This cannot be undone.`);
      if (!confirmed) return;

      try {
        await deletePublication(publication.id);
        if (state.editingId === publication.id) resetForm();
        setNotice('Publication deleted.', 'success');
        await loadPublications();
      } catch (error) {
        setNotice(formatError(error, 'Could not delete the publication.'), 'error');
      }
    });

    actions.append(editButton, openLink, deleteButton);
    card.append(meta, title, slug, summary, actions);
    publicationListEl.appendChild(card);
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

function scheduleSessionRender(delay = 0) {
  if (state.renderScheduled) return;
  state.renderScheduled = true;

  window.setTimeout(async () => {
    try {
      await renderForCurrentSession();
    } catch (error) {
      renderSetupMessage('Could not load editor.', escapeHtml(formatError(error, 'Unknown error.')));
    } finally {
      state.renderScheduled = false;
    }
  }, delay);
}

async function loadPublications() {
  try {
    state.publications = await fetchAllPublicationsForAdmin();
    renderPublicationList();

    if (!state.editingId) {
      inputs.sortOrder.value = String(getNextSortOrder());
    }
  } catch (error) {
    state.publications = [];
    renderPublicationList();
    setNotice(
      formatError(error, 'Could not load publications. Run the updated supabase-setup.sql before using this editor.'),
      'error',
    );
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
  await loadPublications();
  await renderPreview();
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
    scheduleSessionRender();
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

  scheduleSessionRender();
}

async function handleSignOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    setNotice(formatError(error, 'Could not sign out.'), 'error');
    return;
  }
  state.editingId = null;
  scheduleSessionRender();
}

async function handleSavePublication(event) {
  event.preventDefault();
  setNotice('');

  const payload = getDraftPublication();
  const requestedPosition = payload.sortOrder;

  if (!payload.slug) {
    setNotice('Please enter a title or slug.', 'error');
    inputs.slug.focus();
    return;
  }

  if (!payload.abstractHtml) {
    setNotice('Please enter an abstract or placeholder text.', 'error');
    inputs.abstractHtml.focus();
    return;
  }

  inputs.slug.value = payload.slug;
  inputs.sortOrder.value = String(requestedPosition);
  setButtonBusy(savePublicationButton, true, 'Save publication', 'Saving…');

  try {
    const saved = await savePublication(payload);
    await setPublicationOrder(buildOrderedPublicationList(saved, requestedPosition));
    await loadPublications();

    const refreshed = state.publications.find((publication) => publication.id === saved.id) || saved;
    fillForm(refreshed);
    setNotice(payload.id ? 'Publication updated.' : 'Publication created.', 'success');
  } catch (error) {
    setNotice(formatError(error, 'Could not save the publication.'), 'error');
  } finally {
    setButtonBusy(savePublicationButton, false, 'Save publication', 'Saving…');
  }
}

async function handleImportBootstrap() {
  const confirmed = window.confirm(
    'Import the current hard-coded publications into Supabase? Existing entries with the same slug will be updated.',
  );
  if (!confirmed) return;

  setNotice('');
  setButtonBusy(importButton, true, 'Import current page', 'Importing…');

  try {
    await importBootstrapPublications();
    await loadPublications();
    if (!state.editingId) resetForm();
    setNotice('Current publications imported into Supabase.', 'success');
  } catch (error) {
    setNotice(formatError(error, 'Could not import the current publications.'), 'error');
  } finally {
    setButtonBusy(importButton, false, 'Import current page', 'Importing…');
  }
}

inputs.titleHtml?.addEventListener('input', () => {
  maybeAutofillSlug();
  schedulePreviewRender();
});

inputs.slug?.addEventListener('input', () => {
  state.slugTouched = true;
  inputs.slug.value = slugify(inputs.slug.value);
  updatePreviewLink();
  schedulePreviewRender();
});

inputs.sortOrder?.addEventListener('input', () => {
  inputs.sortOrder.value = String(getRequestedPosition());
  schedulePreviewRender();
});

['metaLines', 'badges', 'links', 'abstractHtml'].forEach((key) => {
  inputs[key]?.addEventListener('input', schedulePreviewRender);
});

inputs.isPublished?.addEventListener('change', () => {
  updatePreviewLink();
  schedulePreviewRender();
});

generateSlugButton?.addEventListener('click', () => {
  inputs.slug.value = slugify(inputs.slug.value || inputs.titleHtml.value);
  state.slugTouched = true;
  updatePreviewLink();
  schedulePreviewRender();
});

form?.addEventListener('submit', handleSavePublication);

newPublicationButton?.addEventListener('click', () => {
  resetForm();
  setNotice('');
});

resetEditorButton?.addEventListener('click', () => {
  resetForm();
  setNotice('');
});

refreshButton?.addEventListener('click', async () => {
  setNotice('');
  await loadPublications();
});

importButton?.addEventListener('click', handleImportBootstrap);
signOutButton?.addEventListener('click', handleSignOut);

supabase?.auth.onAuthStateChange(() => {
  window.setTimeout(() => {
    scheduleSessionRender();
  }, 0);
});

scheduleSessionRender();
