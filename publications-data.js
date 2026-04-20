import { getSupabase } from './supabase-client.js';
import { BOOTSTRAP_PUBLICATIONS } from './publications-bootstrap.js';
import { normalizePublication } from './publications-shared.js';

const supabase = getSupabase();
const SELECT_COLUMNS = 'id, slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published, created_at, updated_at';

function compareTimestampsDescending(a, b) {
  const timeA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
  const timeB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
  return timeB - timeA;
}

function usesNaturalPositionOrder(publications) {
  const values = (publications || [])
    .map((publication) => Number(publication?.sortOrder ?? publication?.sort_order ?? 0))
    .filter((value) => Number.isInteger(value) && value >= 1);

  if (values.length === 0) return true;

  const maxValue = Math.max(...values);
  return maxValue <= Math.max(values.length * 10, 20);
}

function sortPublicationsForDisplay(publications) {
  const normalized = (publications || []).map(normalizePublication);
  const naturalAscending = usesNaturalPositionOrder(normalized);

  return normalized.sort((a, b) => {
    const orderA = Number(a.sortOrder || 0);
    const orderB = Number(b.sortOrder || 0);

    if (orderA !== orderB) {
      return naturalAscending ? orderA - orderB : orderB - orderA;
    }

    return compareTimestampsDescending(a, b);
  });
}

function getBootstrapPublications() {
  return sortPublicationsForDisplay(BOOTSTRAP_PUBLICATIONS);
}

function toPayload(publication) {
  const normalized = normalizePublication(publication);

  return {
    slug: normalized.slug,
    title_html: normalized.titleHtml,
    meta_lines: normalized.metaLines,
    badges: normalized.badges,
    links: normalized.links,
    abstract_html: normalized.abstractHtml,
    sort_order: Math.max(1, Number(normalized.sortOrder || 1)),
    is_published: normalized.isPublished,
  };
}

export function isPublicationsConfigured() {
  return Boolean(supabase);
}

export async function fetchPublishedPublications({ fallbackToBootstrap = true } = {}) {
  if (!supabase) {
    return fallbackToBootstrap ? getBootstrapPublications() : [];
  }

  try {
    const { data, error } = await supabase
      .from('publications')
      .select(SELECT_COLUMNS)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const publications = sortPublicationsForDisplay(data || []);
    if (publications.length > 0 || !fallbackToBootstrap) {
      return publications;
    }

    const { count, error: countError } = await supabase
      .from('publications')
      .select('id', { count: 'exact', head: true });

    if (!countError && Number(count || 0) > 0) {
      return [];
    }

    return getBootstrapPublications();
  } catch (error) {
    console.warn('Could not load publications from Supabase.', error);
    if (fallbackToBootstrap) return getBootstrapPublications();
    throw error;
  }
}

export async function fetchAllPublicationsForAdmin() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('publications')
    .select(SELECT_COLUMNS)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return sortPublicationsForDisplay(data || []);
}

export async function savePublication(publication) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const payload = toPayload(publication);
  if (!payload.slug || !payload.title_html || !payload.abstract_html) {
    throw new Error('Slug, title, and abstract are required.');
  }

  if (publication.id) {
    const { data, error } = await supabase
      .from('publications')
      .update(payload)
      .eq('id', publication.id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return normalizePublication(data);
  }

  const { data, error } = await supabase
    .from('publications')
    .insert(payload)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return normalizePublication(data);
}

export async function setPublicationOrder(publicationsInDisplayOrder) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const ordered = (publicationsInDisplayOrder || [])
    .map(normalizePublication)
    .filter((publication) => publication.id);

  for (let index = 0; index < ordered.length; index += 1) {
    const publication = ordered[index];
    const { error } = await supabase
      .from('publications')
      .update({ sort_order: index + 1 })
      .eq('id', publication.id);

    if (error) throw error;
  }
}

export async function deletePublication(id) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from('publications').delete().eq('id', id);
  if (error) throw error;
}

export async function importBootstrapPublications() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const payloads = getBootstrapPublications().map(toPayload);
  const { data, error } = await supabase
    .from('publications')
    .upsert(payloads, { onConflict: 'slug' })
    .select(SELECT_COLUMNS);

  if (error) throw error;
  return sortPublicationsForDisplay(data || []);
}
