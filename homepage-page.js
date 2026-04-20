import { fetchHomepageContent, getBootstrapHomepageContent } from './homepage-data.js';
import { renderHomepageInto } from './homepage-render.js';
import { typesetMath } from './publications-shared.js';

const root = document.getElementById('homepage-root');

async function initHomepage() {
  if (!root) return;

  try {
    const content = await fetchHomepageContent();
    document.title = content.siteTitle || content.name || 'Homepage';
    renderHomepageInto(root, content);
    await typesetMath(root);
  } catch (error) {
    console.error(error);
    const content = getBootstrapHomepageContent();
    document.title = content.siteTitle || content.name || 'Homepage';
    renderHomepageInto(root, content);
    await typesetMath(root);
  }
}

void initHomepage();
