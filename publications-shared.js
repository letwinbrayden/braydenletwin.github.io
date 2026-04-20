function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function decodeHtmlEntities(value) {
  const html = String(value ?? '');

  if (typeof document === 'undefined') {
    return html
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#039;', "'")
      .replaceAll('&amp;', '&');
  }

  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

function htmlFragmentToText(value) {
  const html = String(value ?? '');

  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ');
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent || '';
}

function containsHtml(value) {
  return HTML_TAG_PATTERN.test(String(value ?? ''));
}

function linkifyMarkdown(value) {
  return String(value ?? '').replace(/\[(.*?)\]\((.*?)\)/g, (_match, label, url) => {
    const safeLabel = String(label || '').trim();
    const safeUrl = String(url || '').trim();
    if (!safeLabel || !safeUrl) return safeLabel || safeUrl;
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
  });
}

function collapseWhitespace(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sourceTextFromStoredValue(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (!containsHtml(raw)) {
    return collapseWhitespace(decodeHtmlEntities(raw));
  }

  let text = raw;
  text = text.replace(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_match, _quote, href, inner) => {
    const label = collapseWhitespace(htmlFragmentToText(inner));
    const url = collapseWhitespace(decodeHtmlEntities(href));
    return label && url ? `[${label}](${url})` : label || url;
  });

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<li[^>]*>\s*/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?(?:p|div|ul|ol)[^>]*>/gi, '');

  return collapseWhitespace(decodeHtmlEntities(htmlFragmentToText(text)));
}

export function stripHtml(value) {
  const source = sourceTextFromStoredValue(value);
  return source
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(value) {
  const plain = stripHtml(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  return plain
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return normalizeStringArray(parsed);
    } catch {
      // Ignore JSON parse errors and treat the value as a textarea payload.
    }

    return trimmed
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeLinkArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => ({
        label: String(entry?.label ?? '').trim(),
        url: String(entry?.url ?? '').trim(),
      }))
      .filter((entry) => entry.label && entry.url);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return normalizeLinkArray(parsed);
    } catch {
      // Ignore JSON parse errors and treat the value as textarea input.
    }

    return parseLinksTextarea(trimmed);
  }

  return [];
}

export function normalizePublication(value) {
  return {
    id: value?.id || null,
    slug: slugify(value?.slug || value?.titleHtml || value?.title_html || ''),
    titleHtml: String(value?.titleHtml ?? value?.title_html ?? '').trim(),
    metaLines: normalizeStringArray(value?.metaLines ?? value?.meta_lines),
    badges: normalizeStringArray(value?.badges),
    links: normalizeLinkArray(value?.links),
    abstractHtml: String(value?.abstractHtml ?? value?.abstract_html ?? '').trim(),
    sortOrder: Number.isFinite(Number(value?.sortOrder ?? value?.sort_order))
      ? Number(value?.sortOrder ?? value?.sort_order)
      : 0,
    isPublished: Boolean(value?.isPublished ?? value?.is_published),
    createdAt: value?.createdAt ?? value?.created_at ?? null,
    updatedAt: value?.updatedAt ?? value?.updated_at ?? null,
  };
}

export function parseLinesTextarea(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function formatLinesTextarea(lines) {
  return normalizeStringArray(lines).join('\n');
}

export function parseLinksTextarea(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, ...urlParts] = line.split('|');
      const label = String(labelPart ?? '').trim();
      const url = String(urlParts.join('|') || label).trim();
      return { label, url };
    })
    .filter((entry) => entry.label && entry.url);
}

export function formatLinksTextarea(links) {
  return normalizeLinkArray(links)
    .map((entry) => `${entry.label} | ${entry.url}`)
    .join('\n');
}

export function formatMonthYear(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

export function getLatestPublicationTimestamp(publications) {
  const timestamps = (publications || [])
    .map((publication) => publication.updatedAt || publication.createdAt || null)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

async function waitForMathJax(timeoutMs = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (window.MathJax?.startup?.promise || window.MathJax?.typesetPromise) {
      return window.MathJax;
    }

    await sleep(50);
  }

  return window.MathJax || null;
}

export async function typesetMath(target = document.body) {
  if (typeof window === 'undefined') return;

  const mathJax = await waitForMathJax();
  if (!mathJax) return;

  try {
    if (mathJax.startup?.promise) {
      await mathJax.startup.promise;
    }

    if (typeof mathJax.typesetPromise === 'function') {
      await mathJax.typesetPromise([target]);
    }
  } catch (error) {
    console.warn('MathJax typesetting failed.', error);
  }
}

export function renderInlineSource(value, { collapseNewlines = true } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (containsHtml(raw)) return raw;

  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  const escaped = escapeHtml(collapseNewlines ? normalized.replace(/\n+/g, ' ') : normalized);
  return linkifyMarkdown(escaped);
}

export function renderBlockSource(value, { blockClass = 'abstract-block' } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (containsHtml(raw)) return raw;

  const paragraphs = raw
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs
    .map((paragraph) => {
      const html = renderInlineSource(paragraph, { collapseNewlines: false }).replace(/\n/g, '<br />');
      return `<div class="${escapeHtml(blockClass)}">${html}</div>`;
    })
    .join('');
}

function appendHtmlLine(parent, className, html) {
  const line = document.createElement('div');
  if (className) line.className = className;
  line.innerHTML = html;
  parent.appendChild(line);
}

export function renderPublicationCard(publication, { expandAbstract = false } = {}) {
  const pub = normalizePublication(publication);

  const article = document.createElement('article');
  article.className = 'pub';
  if (pub.slug) article.id = pub.slug;

  const title = document.createElement('h3');
  title.className = 'pub-title';
  title.innerHTML = renderInlineSource(pub.titleHtml);
  article.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'pub-meta';
  pub.metaLines.forEach((line) => appendHtmlLine(meta, '', renderInlineSource(line)));
  article.appendChild(meta);

  if (pub.badges.length > 0) {
    const badges = document.createElement('div');
    badges.className = 'badges';

    pub.badges.forEach((badgeHtml) => {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.innerHTML = renderInlineSource(badgeHtml);
      badges.appendChild(badge);
    });

    article.appendChild(badges);
  }

  if (pub.links.length > 0) {
    const linkRow = document.createElement('div');
    linkRow.className = 'link-row';

    pub.links.forEach((entry) => {
      const link = document.createElement('a');
      link.className = 'link-pill';
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = entry.label;
      linkRow.appendChild(link);
    });

    article.appendChild(linkRow);
  }

  if (pub.abstractHtml) {
    const details = document.createElement('details');
    details.className = 'abstract';
    details.open = Boolean(expandAbstract);

    const summary = document.createElement('summary');
    summary.innerHTML = '<span class="chevron"></span>Read abstract';

    const body = document.createElement('div');
    body.className = 'abstract-body';
    body.innerHTML = renderBlockSource(pub.abstractHtml);

    let typedOnce = false;
    details.addEventListener('toggle', () => {
      if (details.open && !typedOnce) {
        typedOnce = true;
        void typesetMath(body);
      }
    });

    details.append(summary, body);
    article.appendChild(details);
  }

  return article;
}
