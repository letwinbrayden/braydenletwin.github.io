import { getSupabase } from './supabase-client.js';
import { HOMEPAGE_BOOTSTRAP } from './homepage-bootstrap.js';

const supabase = getSupabase();
const CONTENT_KEY = 'homepage';
const SELECT_COLUMNS = 'key, content, created_at, updated_at';

function getString(source, key, fallback = '') {
  if (!source || typeof source !== 'object') return fallback;
  if (source[key] === undefined || source[key] === null) return fallback;
  return String(source[key]);
}

function getBoolean(source, key, fallback = false) {
  if (!source || typeof source !== 'object') return fallback;
  if (source[key] === undefined || source[key] === null) return fallback;
  return Boolean(source[key]);
}

export function normalizeHomepageContent(value) {
  const source = value?.content && typeof value.content === 'object' ? value.content : (value || {});
  const defaults = HOMEPAGE_BOOTSTRAP;

  return {
    key: CONTENT_KEY,
    siteTitle: getString(source, 'siteTitle', defaults.siteTitle).trim() || defaults.siteTitle,
    name: getString(source, 'name', defaults.name).trim() || defaults.name,
    subtitle: getString(source, 'subtitle', defaults.subtitle).trim(),
    heroLine: getString(source, 'heroLine', defaults.heroLine).trim(),
    email: getString(source, 'email', defaults.email).trim(),
    portraitSrc: getString(source, 'portraitSrc', defaults.portraitSrc).trim() || defaults.portraitSrc,
    portraitAlt: getString(source, 'portraitAlt', defaults.portraitAlt).trim() || defaults.portraitAlt,
    primaryButtonLabel: getString(source, 'primaryButtonLabel', defaults.primaryButtonLabel).trim(),
    primaryButtonUrl: getString(source, 'primaryButtonUrl', defaults.primaryButtonUrl).trim(),
    primaryButtonNewTab: getBoolean(source, 'primaryButtonNewTab', defaults.primaryButtonNewTab),
    secondaryButtonLabel: getString(source, 'secondaryButtonLabel', defaults.secondaryButtonLabel).trim(),
    secondaryButtonUrl: getString(source, 'secondaryButtonUrl', defaults.secondaryButtonUrl).trim(),
    secondaryButtonNewTab: getBoolean(source, 'secondaryButtonNewTab', defaults.secondaryButtonNewTab),
    aboutHeading: getString(source, 'aboutHeading', defaults.aboutHeading).trim(),
    aboutBody: getString(source, 'aboutBody', defaults.aboutBody).trim(),
    collaborationHeading: getString(source, 'collaborationHeading', defaults.collaborationHeading).trim(),
    collaborationBody: getString(source, 'collaborationBody', defaults.collaborationBody).trim(),
    footerText: getString(source, 'footerText', defaults.footerText).trim(),
    createdAt: value?.createdAt ?? value?.created_at ?? null,
    updatedAt: value?.updatedAt ?? value?.updated_at ?? null,
  };
}

function toPayload(content) {
  const normalized = normalizeHomepageContent(content);

  return {
    key: CONTENT_KEY,
    content: {
      siteTitle: normalized.siteTitle,
      name: normalized.name,
      subtitle: normalized.subtitle,
      heroLine: normalized.heroLine,
      email: normalized.email,
      portraitSrc: normalized.portraitSrc,
      portraitAlt: normalized.portraitAlt,
      primaryButtonLabel: normalized.primaryButtonLabel,
      primaryButtonUrl: normalized.primaryButtonUrl,
      primaryButtonNewTab: normalized.primaryButtonNewTab,
      secondaryButtonLabel: normalized.secondaryButtonLabel,
      secondaryButtonUrl: normalized.secondaryButtonUrl,
      secondaryButtonNewTab: normalized.secondaryButtonNewTab,
      aboutHeading: normalized.aboutHeading,
      aboutBody: normalized.aboutBody,
      collaborationHeading: normalized.collaborationHeading,
      collaborationBody: normalized.collaborationBody,
      footerText: normalized.footerText,
    },
  };
}

export function getBootstrapHomepageContent() {
  return normalizeHomepageContent(HOMEPAGE_BOOTSTRAP);
}

export function isHomepageConfigured() {
  return Boolean(supabase);
}

export async function fetchHomepageContent({ fallbackToBootstrap = true } = {}) {
  if (!supabase) {
    return fallbackToBootstrap ? getBootstrapHomepageContent() : null;
  }

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select(SELECT_COLUMNS)
      .eq('key', CONTENT_KEY)
      .maybeSingle();

    if (error) throw error;
    if (data) return normalizeHomepageContent(data);
    return fallbackToBootstrap ? getBootstrapHomepageContent() : null;
  } catch (error) {
    console.warn('Could not load homepage content from Supabase.', error);
    if (fallbackToBootstrap) return getBootstrapHomepageContent();
    throw error;
  }
}

export async function fetchHomepageContentForAdmin() {
  if (!supabase) return getBootstrapHomepageContent();

  const { data, error } = await supabase
    .from('site_content')
    .select(SELECT_COLUMNS)
    .eq('key', CONTENT_KEY)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeHomepageContent(data) : getBootstrapHomepageContent();
}

export async function saveHomepageContent(content) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const payload = toPayload(content);
  const { data, error } = await supabase
    .from('site_content')
    .upsert(payload, { onConflict: 'key' })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return normalizeHomepageContent(data);
}

export async function importBootstrapHomepage() {
  return saveHomepageContent(getBootstrapHomepageContent());
}
