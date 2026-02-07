// DEBUG SCRIPT: Detect Horizontal Overflow on Mobile
// Pour utiliser: Ajouter <script src="/debug-overflow.js"></script> dans index.html temporairement
// OU: Copier-coller ce code dans la console Safari iOS

(function() {
  console.log('🔍 DÉBUT DÉTECTION OVERFLOW HORIZONTAL');
  console.log('Viewport width:', window.innerWidth);
  console.log('Document width:', document.documentElement.scrollWidth);
  console.log('Body width:', document.body.scrollWidth);

  const problems = [];

  // Fonction pour vérifier un élément
  function checkElement(el) {
    if (!el || !el.getBoundingClientRect) return;

    const rect = el.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(el);
    const scrollWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;

    // Cas 1: scrollWidth > clientWidth (contenu déborde)
    if (scrollWidth > clientWidth + 1) {
      problems.push({
        element: el,
        type: 'scrollWidth',
        scrollWidth,
        clientWidth,
        diff: scrollWidth - clientWidth,
        tagName: el.tagName,
        classes: el.className,
        id: el.id
      });
    }

    // Cas 2: Element dépasse à droite du viewport
    if (rect.right > window.innerWidth + 1) {
      problems.push({
        element: el,
        type: 'rightOverflow',
        rectRight: rect.right,
        viewportWidth: window.innerWidth,
        diff: rect.right - window.innerWidth,
        tagName: el.tagName,
        classes: el.className,
        id: el.id
      });
    }

    // Cas 3: Element dépasse à gauche du viewport
    if (rect.left < -1) {
      problems.push({
        element: el,
        type: 'leftOverflow',
        rectLeft: rect.left,
        diff: Math.abs(rect.left),
        tagName: el.tagName,
        classes: el.className,
        id: el.id
      });
    }

    // Cas 4: Width en vw qui peut causer problème
    const width = computedStyle.width;
    if (width && width.includes('vw')) {
      problems.push({
        element: el,
        type: 'vwWidth',
        width,
        tagName: el.tagName,
        classes: el.className,
        id: el.id
      });
    }
  }

  // Scanner tous les éléments
  const allElements = document.querySelectorAll('*');
  console.log(`Scanning ${allElements.length} elements...`);

  allElements.forEach(checkElement);

  // Afficher les résultats
  console.log(`\n📊 RÉSULTATS: ${problems.length} problèmes détectés\n`);

  if (problems.length === 0) {
    console.log('✅ Aucun overflow détecté!');
  } else {
    // Grouper par type
    const byType = {};
    problems.forEach(p => {
      if (!byType[p.type]) byType[p.type] = [];
      byType[p.type].push(p);
    });

    Object.keys(byType).forEach(type => {
      console.log(`\n🔴 ${type.toUpperCase()} (${byType[type].length}):`);
      byType[type].forEach((p, i) => {
        console.log(`\n  [${i + 1}] ${p.tagName}${p.id ? '#' + p.id : ''}${p.classes ? '.' + p.classes.split(' ').join('.') : ''}`);
        if (p.diff) console.log(`     Dépassement: ${p.diff.toFixed(2)}px`);
        if (p.scrollWidth) console.log(`     scrollWidth: ${p.scrollWidth} | clientWidth: ${p.clientWidth}`);
        if (p.rectRight) console.log(`     rect.right: ${p.rectRight.toFixed(2)} | viewport: ${p.viewportWidth}`);
        if (p.width) console.log(`     width: ${p.width}`);
        console.log(`     Element:`, p.element);
      });
    });

    // Surligner en rouge les éléments problématiques
    console.log('\n🎨 Surlignage des éléments problématiques en rouge...');
    problems.forEach(p => {
      if (p.element && p.element.style) {
        p.element.style.outline = '3px solid red';
        p.element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';

        // Ajouter un badge
        const badge = document.createElement('div');
        badge.textContent = p.type;
        badge.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          background: red;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: bold;
          z-index: 999999;
          pointer-events: none;
        `;
        if (p.element.style.position !== 'relative' && p.element.style.position !== 'absolute') {
          p.element.style.position = 'relative';
        }
        p.element.appendChild(badge);
      }
    });

    console.log('\n✅ Éléments surlignés en rouge dans la page');
    console.log('💡 Astuce: Tapez "problems" dans la console pour voir la liste complète');

    // Rendre accessible dans la console
    window.debugOverflowProblems = problems;
  }

  // Info supplémentaire
  console.log('\n📱 INFO DEVICE:');
  console.log('Screen width:', window.screen.width);
  console.log('Screen height:', window.screen.height);
  console.log('Device pixel ratio:', window.devicePixelRatio);
  console.log('User agent:', navigator.userAgent);

  // Vérifier safe area
  if (CSS.supports('padding', 'env(safe-area-inset-left)')) {
    console.log('\n📐 SAFE AREA SUPPORT: OUI');
    const testDiv = document.createElement('div');
    testDiv.style.paddingLeft = 'env(safe-area-inset-left)';
    testDiv.style.paddingRight = 'env(safe-area-inset-right)';
    document.body.appendChild(testDiv);
    const computed = window.getComputedStyle(testDiv);
    console.log('Safe area left:', computed.paddingLeft);
    console.log('Safe area right:', computed.paddingRight);
    document.body.removeChild(testDiv);
  } else {
    console.log('\n📐 SAFE AREA SUPPORT: NON');
  }

  console.log('\n🔍 FIN DÉTECTION OVERFLOW');
  console.log('----------------------------\n');
})();
