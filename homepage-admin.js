import { getSupabase } from './supabase-client.js';
import { fetchProfile } from './auth-data.js';
import {
  fetchHomepageContentForAdmin,
  getBootstrapHomepageContent,
  importBootstrapHomepage,
  saveHomepageContent,
} from './homepage-data.js';
import { renderHomepageInto } from './homepage-render.js';
import { escapeHtml, typesetMath } from './publications-shared.js';

const supabase = getSupabase();

const statusEl = document.getElementById('admin-status');
const appEl = document.getElementById('admin-app');
const infoEl = document.getElementById('admin-user-info');
const noticeEl = document.getElementById('admin-notices');
const refreshButton = document.getElementById('refresh-homepage-button');
const importButton = document.getElementById('import-bootstrap-button');
const signOutButton = document.getElementById('admin-sign-out');
const resetEditorButton = document.getElementById('reset-editor-button');
const saveButton = document.getElementById('save-homepage-button');
const previewLink = document.getElementById('preview-link');
const previewEl = document.getElementById('homepage-preview');
const form = document.getElementById('homepage-editor-form');

const inputs = {
  siteTitle: document.getElementById('homepage-site-title-input'),
  name: document.getElementById('homepage-name-input'),
  subtitle: document.getElementById('homepage-subtitle-input'),
  heroLine: document.getElementById('homepage-hero-line-input'),
  email: document.getElementById('homepage-email-input'),
  portraitSrc: document.getElementById('homepage-portrait-src-input'),
  portraitAlt: document.getElementById('homepage-portrait-alt-input'),
  primaryButtonLabel: document.getElementById('homepage-primary-label-input'),
  primaryButtonUrl: document.getElementById('homepage-primary-url-input'),
  primaryButtonNewTab: document.getElementById('homepage-primary-newtab-input'),
  secondaryButtonLabel: document.getElementById('homepage-secondary-label-input'),
  secondaryButtonUrl: document.getElementById('homepage-secondary-url-input'),
  secondaryButtonNewTab: document.getElementById('homepage-secondary-newtab-input'),
  aboutHeading: document.getElementById('homepage-about-heading-input'),
  aboutBody: document.getElementById('homepage-about-body-input'),
  collaborationHeading: document.getElementById('homepage-collaboration-heading-input'),
  collaborationBody: document.getElementById('homepage-collaboration-body-input'),
  footerText: document.getElementById('homepage-footer-text-input'),
};

const state = {
  session: null,
  profile: null,
  savedContent: getBootstrapHomepageContent(),
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

function updatePreviewLink() {
  previewLink.href = 'index.html';
  previewLink.textContent = 'Open homepage';
}

function getDraftHomepage() {
  return {
    siteTitle: inputs.siteTitle.value.trim(),
    name: inputs.name.value.trim(),
    subtitle: inputs.subtitle.value.trim(),
    heroLine: inputs.heroLine.value.trim(),
    email: inputs.email.value.trim(),
    portraitSrc: inputs.portraitSrc.value.trim(),
    portraitAlt: inputs.portraitAlt.value.trim(),
    primaryButtonLabel: inputs.primaryButtonLabel.value.trim(),
    primaryButtonUrl: inputs.primaryButtonUrl.value.trim(),
    primaryButtonNewTab: inputs.primaryButtonNewTab.checked,
    secondaryButtonLabel: inputs.secondaryButtonLabel.value.trim(),
    secondaryButtonUrl: inputs.secondaryButtonUrl.value.trim(),
    secondaryButtonNewTab: inputs.secondaryButtonNewTab.checked,
    aboutHeading: inputs.aboutHeading.value.trim(),
    aboutBody: inputs.aboutBody.value.trim(),
    collaborationHeading: inputs.collaborationHeading.value.trim(),
    collaborationBody: inputs.collaborationBody.value.trim(),
    footerText: inputs.footerText.value.trim(),
  };
}

function fillForm(content) {
  inputs.siteTitle.value = content.siteTitle || '';
  inputs.name.value = content.name || '';
  inputs.subtitle.value = content.subtitle || '';
  inputs.heroLine.value = content.heroLine || '';
  inputs.email.value = content.email || '';
  inputs.portraitSrc.value = content.portraitSrc || '';
  inputs.portraitAlt.value = content.portraitAlt || '';
  inputs.primaryButtonLabel.value = content.primaryButtonLabel || '';
  inputs.primaryButtonUrl.value = content.primaryButtonUrl || '';
  inputs.primaryButtonNewTab.checked = Boolean(content.primaryButtonNewTab);
  inputs.secondaryButtonLabel.value = content.secondaryButtonLabel || '';
  inputs.secondaryButtonUrl.value = content.secondaryButtonUrl || '';
  inputs.secondaryButtonNewTab.checked = Boolean(content.secondaryButtonNewTab);
  inputs.aboutHeading.value = content.aboutHeading || '';
  inputs.aboutBody.value = content.aboutBody || '';
  inputs.collaborationHeading.value = content.collaborationHeading || '';
  inputs.collaborationBody.value = content.collaborationBody || '';
  inputs.footerText.value = content.footerText || '';
  updatePreviewLink();
  schedulePreviewRender();
}

function resetForm() {
  fillForm(state.savedContent || getBootstrapHomepageContent());
}

function schedulePreviewRender() {
  window.clearTimeout(state.previewTimer);
  state.previewTimer = window.setTimeout(() => {
    void renderPreview();
  }, 120);
}

async function renderPreview() {
  if (!previewEl) return;
  const draft = getDraftHomepage();
  renderHomepageInto(previewEl, draft);
  await typesetMath(previewEl);
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

async function loadHomepage() {
  try {
    state.savedContent = await fetchHomepageContentForAdmin();
  } catch (error) {
    state.savedContent = getBootstrapHomepageContent();
    setNotice(
      formatError(error, 'Could not load homepage content from Supabase. Run the updated supabase-setup.sql before using this editor.'),
      'error',
    );
  }

  fillForm(state.savedContent);
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
  await loadHomepage();
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
    setInlineNotice('admin-signup-notice', 'Account created and signed in. Mark it as admin in Supabase and refresh.', 'success');
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

  scheduleSessionRender();
}

async function handleSaveHomepage(event) {
  event.preventDefault();
  setNotice('');

  const payload = getDraftHomepage();
  if (!payload.siteTitle || !payload.name) {
    setNotice('Please enter at least a browser title and main heading.', 'error');
    return;
  }

  setButtonBusy(saveButton, true, 'Save homepage', 'Saving…');

  try {
    state.savedContent = await saveHomepageContent(payload);
    fillForm(state.savedContent);
    setNotice('Homepage updated.', 'success');
  } catch (error) {
    setNotice(formatError(error, 'Could not save the homepage.'), 'error');
  } finally {
    setButtonBusy(saveButton, false, 'Save homepage', 'Saving…');
  }
}

async function handleImportBootstrap() {
  const confirmed = window.confirm(
    'Import the current homepage into Supabase? This will replace the stored homepage content with the current fallback version.',
  );
  if (!confirmed) return;

  setNotice('');
  setButtonBusy(importButton, true, 'Import current page', 'Importing…');

  try {
    state.savedContent = await importBootstrapHomepage();
    fillForm(state.savedContent);
    setNotice('Current homepage imported into Supabase.', 'success');
  } catch (error) {
    setNotice(formatError(error, 'Could not import the current homepage.'), 'error');
  } finally {
    setButtonBusy(importButton, false, 'Import current page', 'Importing…');
  }
}

Object.values(inputs).forEach((input) => {
  if (!input) return;
  const eventName = input.type === 'checkbox' ? 'change' : 'input';
  input.addEventListener(eventName, schedulePreviewRender);
});

form?.addEventListener('submit', handleSaveHomepage);
refreshButton?.addEventListener('click', async () => {
  setNotice('');
  await loadHomepage();
});
importButton?.addEventListener('click', handleImportBootstrap);
resetEditorButton?.addEventListener('click', () => {
  setNotice('');
  resetForm();
});
signOutButton?.addEventListener('click', handleSignOut);

supabase?.auth.onAuthStateChange(() => {
  window.setTimeout(() => {
    scheduleSessionRender();
  }, 0);
});

updatePreviewLink();
scheduleSessionRender();
