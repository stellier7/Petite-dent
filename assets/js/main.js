const tabs = document.querySelectorAll('.service-tab');
const panels = document.querySelectorAll('.service-panel');
const serviciosSection = document.getElementById('servicios');
const SERVICE_INTERVAL_MS = 4500;

let currentTabIndex = 0;
let serviceAutoTimer = null;
let serviciosInView = false;

function getActiveTabIndex() {
  const active = Array.from(tabs).findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  return active >= 0 ? active : 0;
}

function activateTab(index) {
  const tab = tabs[index];
  if (!tab) return;

  tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
  panels.forEach((p) => p.classList.remove('active'));
  tab.setAttribute('aria-selected', 'true');
  document.getElementById(tab.dataset.target).classList.add('active');
  currentTabIndex = index;
}

function advanceServiceTab() {
  activateTab((currentTabIndex + 1) % tabs.length);
}

function stopServiceAutoScroll() {
  if (serviceAutoTimer) {
    clearInterval(serviceAutoTimer);
    serviceAutoTimer = null;
  }
}

function startServiceAutoScroll() {
  stopServiceAutoScroll();
  if (!tabs.length || !serviciosInView) return;
  serviceAutoTimer = setInterval(advanceServiceTab, SERVICE_INTERVAL_MS);
}

function resetServiceAutoScroll() {
  if (!serviciosInView) return;
  startServiceAutoScroll();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    activateTab(index);
    resetServiceAutoScroll();
  });
});

if (tabs.length) {
  currentTabIndex = getActiveTabIndex();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion && serviciosSection) {
    const serviciosObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        serviciosInView = entry.isIntersecting;
        if (serviciosInView) {
          startServiceAutoScroll();
        } else {
          stopServiceAutoScroll();
        }
      });
    }, { threshold: 0.2 });

    serviciosObserver.observe(serviciosSection);

    serviciosSection.addEventListener('mouseenter', stopServiceAutoScroll);
    serviciosSection.addEventListener('mouseleave', startServiceAutoScroll);
    serviciosSection.addEventListener('focusin', stopServiceAutoScroll);
    serviciosSection.addEventListener('focusout', () => {
      if (!serviciosSection.contains(document.activeElement)) {
        startServiceAutoScroll();
      }
    });
    serviciosSection.addEventListener('touchstart', stopServiceAutoScroll, { passive: true });
    serviciosSection.addEventListener('touchend', () => {
      window.setTimeout(resetServiceAutoScroll, 8000);
    }, { passive: true });
  }
}

document.querySelectorAll('.site-photo img').forEach((img) => {
  img.addEventListener('error', () => {
    const frame = img.closest('.site-photo');
    const fallback = frame?.dataset.placeholder;
    if (frame && fallback) {
      frame.classList.add('is-placeholder');
      frame.innerHTML = fallback;
    }
  });
});

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const reason = document.getElementById('reason').value.trim();

    const message = [
      'Hola, quisiera agendar una cita en Petite Dent.',
      name ? `Nombre: ${name}` : null,
      phone ? `Teléfono: ${phone}` : null,
      reason ? `Motivo: ${reason}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/50498172777?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    contactForm.reset();
  });
}
