import { renderBlockSource, renderInlineSource } from './publications-shared.js';
import { normalizeHomepageContent } from './homepage-data.js';

function createButton({ label, url, newTab, primary = false }) {
  if (!String(label || '').trim() || !String(url || '').trim()) return null;

  const link = document.createElement('a');
  link.className = primary ? 'button primary' : 'button';
  link.href = url;
  link.textContent = label;

  if (newTab) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  return link;
}

function createSection({ heading, body }) {
  const safeHeading = String(heading || '').trim();
  const safeBody = String(body || '').trim();
  if (!safeHeading && !safeBody) return null;

  const section = document.createElement('section');
  section.className = 'card section';

  if (safeHeading) {
    const title = document.createElement('h2');
    title.innerHTML = renderInlineSource(safeHeading);
    section.appendChild(title);
  }

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'rich-text';
  bodyWrap.innerHTML = renderBlockSource(safeBody || '', { blockClass: 'home-block' });
  section.appendChild(bodyWrap);

  return section;
}

export function renderHomepageInto(target, value) {
  if (!target) return null;

  const content = normalizeHomepageContent(value);
  target.innerHTML = '';

  const hero = document.createElement('section');
  hero.className = 'card hero';

  const portrait = document.createElement('img');
  portrait.className = 'portrait';
  portrait.src = content.portraitSrc;
  portrait.alt = content.portraitAlt || content.name || 'Homepage portrait';
  hero.appendChild(portrait);

  const copy = document.createElement('div');

  const name = document.createElement('h1');
  name.innerHTML = renderInlineSource(content.name);
  copy.appendChild(name);

  if (content.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.innerHTML = renderInlineSource(content.subtitle);
    copy.appendChild(subtitle);
  }

  if (content.heroLine || content.email) {
    const meta = document.createElement('div');
    meta.className = 'meta';

    if (content.heroLine) {
      const line = document.createElement('div');
      line.innerHTML = renderInlineSource(content.heroLine);
      meta.appendChild(line);
    }

    if (content.email) {
      const emailLine = document.createElement('div');
      const emailLink = document.createElement('a');
      emailLink.href = `mailto:${content.email}`;
      emailLink.textContent = content.email;
      emailLine.appendChild(emailLink);
      meta.appendChild(emailLine);
    }

    copy.appendChild(meta);
  }

  const buttons = document.createElement('div');
  buttons.className = 'buttons';
  const primaryButton = createButton({
    label: content.primaryButtonLabel,
    url: content.primaryButtonUrl,
    newTab: content.primaryButtonNewTab,
    primary: true,
  });
  const secondaryButton = createButton({
    label: content.secondaryButtonLabel,
    url: content.secondaryButtonUrl,
    newTab: content.secondaryButtonNewTab,
    primary: false,
  });

  if (primaryButton) buttons.appendChild(primaryButton);
  if (secondaryButton) buttons.appendChild(secondaryButton);
  if (buttons.children.length > 0) copy.appendChild(buttons);

  hero.appendChild(copy);
  target.appendChild(hero);

  const aboutSection = createSection({ heading: content.aboutHeading, body: content.aboutBody });
  if (aboutSection) target.appendChild(aboutSection);

  const collaborationSection = createSection({
    heading: content.collaborationHeading,
    body: content.collaborationBody,
  });
  if (collaborationSection) target.appendChild(collaborationSection);

  if (content.footerText) {
    const footer = document.createElement('div');
    footer.className = 'footer';
    footer.innerHTML = renderInlineSource(content.footerText);
    target.appendChild(footer);
  }

  return content;
}
