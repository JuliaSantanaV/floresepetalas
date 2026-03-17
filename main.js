/* ═══════════════════════════════════════════
   Flores & Pétalas — JavaScript Compartilhado
   ═══════════════════════════════════════════ */

// ── CURSOR ──────────────────────────────────────
const cursor    = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
(function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
  requestAnimationFrame(animRing);
})();
document.querySelectorAll('a, button, .product-card, .filter-tab, .service-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform    = 'translate(-50%,-50%) scale(2)';
    cursorRing.style.transform = 'translate(-50%,-50%) scale(1.5)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform    = 'translate(-50%,-50%) scale(1)';
    cursorRing.style.transform = 'translate(-50%,-50%) scale(1)';
  });
});

// ── NAVBAR SCROLL ──────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// ── ACTIVE NAV LINK ────────────────────────────
(function markActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ── MOBILE MENU ────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });
}

// ── SCROLL REVEAL ──────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), 80 * (i % 5));
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── FLOATING PETALS ────────────────────────────
const petalArt = document.getElementById('petalArt');
if (petalArt) {
  const colors = ['#c0675a','#e8c4b0','#8a9e7e','#c9a84c'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 8 + Math.random() * 16;
    p.style.cssText = `
      width:${size}px; height:${size * 1.3}px;
      left:${Math.random() * 100}%;
      bottom:${-20 - Math.random() * 10}%;
      animation-duration:${14 + Math.random() * 16}s;
      animation-delay:${Math.random() * 14}s;
      background:${colors[Math.floor(Math.random() * colors.length)]};
    `;
    petalArt.appendChild(p);
  }
}

// ── CART TOAST ─────────────────────────────────
const cartToast = document.getElementById('cartToast');
function addToCart(name, price) {
  if (!cartToast) return;
  cartToast.innerHTML = `<strong>Adicionado! 🌸</strong><br>${name}<br><span style="color:var(--blush)">R$ ${price}</span>`;
  cartToast.style.transform = 'translateX(0)';
  setTimeout(() => cartToast.style.transform = 'translateX(120%)', 3000);
}

// ── SMOOTH ANCHOR ──────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});
