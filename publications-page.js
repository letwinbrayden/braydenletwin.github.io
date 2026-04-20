import { fetchPublishedPublications } from './publications-data.js';
import {
  formatMonthYear,
  getLatestPublicationTimestamp,
  renderPublicationCard,
  typesetMath,
} from './publications-shared.js';

const listEl = document.getElementById('publications-list');
const footerEl = document.getElementById('publications-last-updated');

function renderEmptyState(message) {
  if (!listEl) return;
  listEl.innerHTML = '';

  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = message;
  listEl.appendChild(empty);
}

function highlightHashTarget() {
  const rawHash = window.location.hash.replace(/^#/, '').trim();
  if (!rawHash) return;

  const target = document.getElementById(decodeURIComponent(rawHash));
  if (!target) return;

  target.classList.add('pub-target');
  const details = target.querySelector('details.abstract');
  if (details) details.open = true;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function renderPage() {
  try {
    const publications = await fetchPublishedPublications();

    if (!publications.length) {
      renderEmptyState('No publications to show yet.');
      if (footerEl) footerEl.textContent = '';
      return;
    }

    listEl.innerHTML = '';
    publications.forEach((publication) => {
      listEl.appendChild(renderPublicationCard(publication));
    });

    await typesetMath(listEl);
    highlightHashTarget();

    if (footerEl) {
      const latest = getLatestPublicationTimestamp(publications);
      footerEl.textContent = latest ? `Last updated ${formatMonthYear(latest)}` : '';
    }
  } catch (error) {
    console.error(error);
    renderEmptyState('Could not load publications right now.');
    if (footerEl) footerEl.textContent = '';
  }
}

void renderPage();
window.addEventListener('hashchange', highlightHashTarget);
