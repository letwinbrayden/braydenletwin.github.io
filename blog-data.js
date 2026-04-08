import { getSupabase } from './supabase-client.js';

const supabase = getSupabase();

function computeReadTimeFromText(text) {
  const words = String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function normalizePost(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentHtml: row.content_html,
    publishedAt: row.published_at,
    readTime: row.read_time || computeReadTimeFromText(row.content_html),
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isBlogConfigured() {
  return Boolean(supabase);
}

export async function fetchPublishedPosts() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, content_html, published_at, read_time, is_published, created_at, updated_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizePost);
}

export async function fetchPublishedPostBySlug(slug) {
  if (!supabase || !slug) return null;

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, content_html, published_at, read_time, is_published, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) throw error;
  return normalizePost(data);
}

export async function fetchAllPostsForAdmin() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, content_html, published_at, read_time, is_published, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizePost);
}

export async function savePost(post) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload = {
    slug: String(post.slug || '').trim(),
    title: String(post.title || '').trim(),
    excerpt: String(post.excerpt || '').trim(),
    content_html: String(post.contentHtml || '').trim(),
    published_at: post.publishedAt || null,
    read_time: String(post.readTime || '').trim() || computeReadTimeFromText(post.contentHtml || ''),
    is_published: Boolean(post.isPublished),
  };

  if (!payload.slug || !payload.title || !payload.excerpt || !payload.content_html) {
    throw new Error('Slug, title, excerpt, and content are required.');
  }

  if (post.id) {
    const { data, error } = await supabase
      .from('posts')
      .update(payload)
      .eq('id', post.id)
      .select('id, slug, title, excerpt, content_html, published_at, read_time, is_published, created_at, updated_at')
      .single();

    if (error) throw error;
    return normalizePost(data);
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select('id, slug, title, excerpt, content_html, published_at, read_time, is_published, created_at, updated_at')
    .single();

  if (error) throw error;
  return normalizePost(data);
}

export async function deletePost(id) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
