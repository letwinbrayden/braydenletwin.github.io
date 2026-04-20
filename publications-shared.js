function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function stripHtml(value) {
  const html = String(value ?? '');

  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent?.replace(/\s+/g, ' ').trim() || '';
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
    slug: slugify(value?.slug || value?.titleHtml || ''),
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
  title.innerHTML = pub.titleHtml;
  article.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'pub-meta';
  pub.metaLines.forEach((line) => appendHtmlLine(meta, '', line));
  article.appendChild(meta);

  if (pub.badges.length > 0) {
    const badges = document.createElement('div');
    badges.className = 'badges';

    pub.badges.forEach((badgeHtml) => {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.innerHTML = badgeHtml;
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
    body.innerHTML = pub.abstractHtml;

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
