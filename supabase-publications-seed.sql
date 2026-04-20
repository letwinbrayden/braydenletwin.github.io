(slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published)
values (
  'on-the-number-of-real-valued-roots-of-littlewood-polynomials',
  'On the number of real-valued roots of Littlewood polynomials',
  '[]'::jsonb,
  '["In preparation"]'::jsonb,
  '[]'::jsonb,
  'Abstract to appear.',
  7,
  true
)
on conflict (slug) do update
set
  title_html = excluded.title_html,
  meta_lines = excluded.meta_lines,
  badges = excluded.badges,
  links = excluded.links,
  abstract_html = excluded.abstract_html,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.publications (slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published)
values (
  'brunn-minkowski-via-stochastic-localization',
  'Brunn-Minkowski via stochastic localization',
  '[]'::jsonb,
  '["In preparation"]'::jsonb,
  '[]'::jsonb,
  'Abstract to appear.',
  6,
  true
)
on conflict (slug) do update
set
  title_html = excluded.title_html,
  meta_lines = excluded.meta_lines,
  badges = excluded.badges,
  links = excluded.links,
  abstract_html = excluded.abstract_html,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.publications (slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published)
values (
  'on-the-number-of-roots-of-littlewood-polynomials-in-the-unit-disc',
  'On the number of roots of Littlewood polynomials in the unit disc',
  '[]'::jsonb,
  '["In preparation"]'::jsonb,
  '[]'::jsonb,
  'A Littlewood polynomial is a polynomial of the form
\[
f_n(z)=\sum_{k=0}^{n}\varepsilon_k z^k
\]
with $\varepsilon_k\in\{-1, 1\}$. Let $(\varepsilon_k)_{k \ge 0}$ be i.i.d. Rademacher coefficients and let $N_n(\mathbb{D})$ denote the number of zeros of $f_n$ in $\mathbb{D} = \{z \in \mathbb{C} : |z| < 1\}$. We show that almost surely,
\[
\lim_{n \to \infty}\frac{N_n(\mathbb{D})}{n} = \frac12.
\]',
  5,
  true
)
on conflict (slug) do update
set
  title_html = excluded.title_html,
  meta_lines = excluded.meta_lines,
  badges = excluded.badges,
  links = excluded.links,
  abstract_html = excluded.abstract_html,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.publications (slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published)
values (
  'how-anisotropic-can-the-sections-of-an-isotropic-convex-body-be',
  'How anisotropic can the sections of an isotropic convex body be?',
  '["with Colin Tang"]'::jsonb,
  '["In preparation"]'::jsonb,
  '[]'::jsonb,
  'Abstract to appear.',
  4,
  true
)
on conflict (slug) do update
set
  title_html = excluded.title_html,
  meta_lines = excluded.meta_lines,
  badges = excluded.badges,
  links = excluded.links,
  abstract_html = excluded.abstract_html,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.publications (slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published)
values (
  'a-lower-bound-for-the-smallest-singular-value-of-a-weighted-random-matrix',
  'A lower bound for the smallest singular value of a weighted random matrix',
  '["with Achintya Raya Polavarapu"]'::jsonb,
  '["To appear on arXiv"]'::jsonb,
  '[{"label": "Paper / notes", "url": "WeightedRandomMatrix.pdf"}]'::jsonb,
  'Let $A$ be a $n\times n$ random matrix with real-valued, independent, mean-zero,
variance-one entries satisfying $\mathbb{E}[a_{ij}^4]\le K$ for some $K>0$, and let
$M$ be a fixed invertible $n\times n$ matrix. Writing $\tau_M=\|M^{-1}\|_{\mathrm{HS}}^{-1}$,
we prove
\[
\mathbb{P}\!\bigl(s_{\min}(MA)\le \varepsilon\tau_M\bigr)
\ll \varepsilon+e^{-\Omega(n)}
\]
for all $\varepsilon\ge 0$, where the implied constants depend only on $K$.',
  3,
  true
)
on conflict (slug) do update
set
  title_html = excluded.title_html,
  meta_lines = excluded.meta_lines,
  badges = excluded.badges,
  links = excluded.links,
  abstract_html = excluded.abstract_html,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.publications (slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published)
values (
  'on-the-maxima-of-littlewood-polynomials-on-1-1',
  'On the maxima of Littlewood polynomials on [−1, 1]',
  '["with [Mehtaab Sawhney](https://www.math.columbia.edu/~msawhney/)"]'::jsonb,
  '["To appear on arXiv"]'::jsonb,
  '[{"label": "Paper / notes", "url": "NOTES__Erdos_Problem__524.pdf"}]'::jsonb,
  'A Littlewood polynomial is a polynomial of the form
\[
f_n(x)=\sum_{k=0}^n \varepsilon_k x^k
\]
with $\varepsilon_k\in\{-1, 1\}$. Let $(\varepsilon_k)_{k \ge 0}$ be i.i.d. Rademacher coefficients.
We show that the lower envelope of $\max_{x\in[-1,1]}|f_n(x)|$ is determined by the small-ball
probability of a certain Gaussian process. In particular, almost surely,
\[
\liminf_{n\to\infty} \frac{\log(\max_{x\in[-1,1]}|f_n(x)|/\sqrt n)}{(\log\log n)^{1/3}}
= -\Big(\frac{3\pi^2}{4}\Big)^{1/3}.
\]',
  2,
  true
)
on conflict (slug) do update
set
  title_html = excluded.title_html,
  meta_lines = excluded.meta_lines,
  badges = excluded.badges,
  links = excluded.links,
  abstract_html = excluded.abstract_html,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.publications (slug, title_html, meta_lines, badges, links, abstract_html, sort_order, is_published)
values (
  'a-generalization-of-grunbaums-inequality',
  'A generalization of Grünbaum’s inequality',
  '["with [Vlad Yaskin](https://www.math.ualberta.ca/~vladyaskin/)", "Israel Journal of Mathematics"]'::jsonb,
  '["Accepted"]'::jsonb,
  '[{"label": "arXiv", "url": "https://arxiv.org/abs/2410.04741"}]'::jsonb,
  'Grünbaum’s inequality gives sharp bounds between the volume of a convex body and its part cut off by a
hyperplane through the centroid of the body. We provide a generalization of this inequality for hyperplanes
that do not necessarily contain the centroid. As an application, we obtain a sharp inequality that compares
sections of a convex body to the maximal section parallel to it.',
  1,
  true
)
on conflict (slug) do update
set
  title_html = excluded.title_html,
  meta_lines = excluded.meta_lines,
  badges = excluded.badges,
  links = excluded.links,
  abstract_html = excluded.abstract_html,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;
