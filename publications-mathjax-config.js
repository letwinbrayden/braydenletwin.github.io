(function () {
  const extraPackages = [
    'amscd',
    'bbox',
    'bbm',
    'bboldx',
    'boldsymbol',
    'braket',
    'bussproofs',
    'cancel',
    'cases',
    'centernot',
    'color',
    'colorv2',
    'dsfont',
    'empheq',
    'enclose',
    'extpfeil',
    'gensymb',
    'html',
    'mathtools',
    'mhchem',
    'physics',
    'tagformat',
    'textcomp',
    'unicode',
    'units',
    'upgreek',
    'verb'
  ];

  const defaultMacros = {
    le: '\\leqslant',
    leq: '\\leqslant',
    ge: '\\geqslant',
    geq: '\\geqslant',
    eps: '\\varepsilon',
    vphi: '\\varphi',
    R: '{\\mathbb{R}}',
    C: '{\\mathbb{C}}',
    N: '{\\mathbb{N}}',
    Z: '{\\mathbb{Z}}',
    Q: '{\\mathbb{Q}}',
    F: '{\\mathbb{F}}',
    E: '{\\mathbb{E}}',
    PP: '{\\mathbb{P}}',
    Var: '{\\operatorname{Var}}',
    Cov: '{\\operatorname{Cov}}',
    Corr: '{\\operatorname{Corr}}',
    tr: '{\\operatorname{tr}}',
    rank: '{\\operatorname{rank}}',
    supp: '{\\operatorname{supp}}',
    diag: '{\\operatorname{diag}}',
    vol: '{\\operatorname{vol}}',
    conv: '{\\operatorname{conv}}',
    diam: '{\\operatorname{diam}}',
    sgn: '{\\operatorname{sgn}}',
    argmax: '{\\operatorname*{arg\\,max}}',
    argmin: '{\\operatorname*{arg\\,min}}',
    abs: ['\\left\\lvert #1 \\right\\rvert', 1],
    norm: ['\\left\\lVert #1 \\right\\rVert', 1],
    ip: ['\\left\\langle #1, #2 \\right\\rangle', 2],
    set: ['\\left\\{ #1 \\right\\}', 1],
    paren: ['\\left( #1 \\right)', 1],
    brac: ['\\left[ #1 \\right]', 1],
    ceil: ['\\left\\lceil #1 \\right\\rceil', 1],
    floor: ['\\left\\lfloor #1 \\right\\rfloor', 1],
    ind: ['\\mathbf{1}_{\\left\\{#1\\right\\}}', 1],
    one: '\\mathbf{1}'
  };

  const customMacros =
    window.PUBLICATION_MATH_MACROS && typeof window.PUBLICATION_MATH_MACROS === 'object'
      ? window.PUBLICATION_MATH_MACROS
      : {};

  window.MathJax = {
    loader: {
      load: extraPackages.map((name) => `[tex]/${name}`),
    },
    tex: {
      inlineMath: { '[+]': [['$', '$']] },
      displayMath: [['\\[', '\\]'], ['$$', '$$']],
      processEscapes: true,
      processEnvironments: true,
      packages: { '[+]': extraPackages },
      macros: { ...defaultMacros, ...customMacros },
      tags: 'ams',
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    },
    chtml: {
      matchFontHeight: false,
    },
  };
})();
