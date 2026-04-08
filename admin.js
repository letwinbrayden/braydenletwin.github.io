import { getSupabase } from './supabase-client.js';

const supabase = getSupabase();
const statusEl = document.getElementById('admin-status');
const appEl = document.getElementById('admin-app');
const infoEl = document.getElementById('admin-user-info');
const signOutButton = document.getElementById('admin-sign-out');

function escapeHtml(unsafe) {
  return String(unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderMessage(title, body) {
  statusEl.innerHTML = `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong><br />
      ${body}
    </div>
  `;
}

async function requireAdmin() {
  if (!supabase) {
    renderMessage(
      'Supabase not configured.',
      'Fill in <span class="code-inline">supabase-config.js</span> before using the protected editor page.'
    );
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    renderMessage('Could not verify session.', escapeHtml(sessionError.message));
    return;
  }

  const session = sessionData.session;
  if (!session) {
    renderMessage(
      'Please sign in.',
      'This page only loads for signed-in admins. You can sign in from any blog post page.'
    );
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, is_admin')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    renderMessage('Could not verify admin status.', escapeHtml(profileError.message));
    return;
  }

  if (!profile?.is_admin) {
    renderMessage(
      'Access denied.',
      'Your account is signed in, but it is not marked as an admin account.'
    );
    return;
  }

  statusEl.style.display = 'none';
  appEl.style.display = 'block';
  infoEl.innerHTML = `${escapeHtml(profile.display_name || 'Admin')}<br />${escapeHtml(session.user.email || '')}`;
}

signOutButton?.addEventListener('click', async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.reload();
});

supabase?.auth.onAuthStateChange(() => {
  window.location.reload();
});

requireAdmin();
