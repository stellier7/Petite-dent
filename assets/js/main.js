const tabs = document.querySelectorAll('.service-tab');
const panels = document.querySelectorAll('.service-panel');
const serviciosSection = document.getElementById('servicios');
const serviceViewport = document.querySelector('.service-panels-viewport');
const serviceTrack = document.querySelector('.service-panels-track');

const SERVICE_HOLD_MS = 4200;
const SERVICE_TRANSITION_MS = 750;

let currentTabIndex = 0;
let serviceAutoTimer = null;
let serviciosInView = false;
let serviceTransitionLocked = false;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getActiveTabIndex() {
  const active = Array.from(tabs).findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  return active >= 0 ? active : 0;
}

function syncPanelVisibility(index) {
  panels.forEach((panel, panelIndex) => {
    panel.setAttribute('aria-hidden', panelIndex === index ? 'false' : 'true');
  });
}

function updateServiceViewportHeight(index) {
  if (!serviceViewport || !panels[index]) return;
  serviceViewport.style.height = `${panels[index].offsetHeight}px`;
}

function activateTab(index, options = {}) {
  const { animate = true } = options;
  const tab = tabs[index];
  if (!tab || !serviceTrack) return;

  tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
  tab.setAttribute('aria-selected', 'true');
  syncPanelVisibility(index);

  if (!animate || reducedMotion) {
    serviceTrack.style.transition = 'none';
    if (serviceViewport) serviceViewport.style.transition = 'none';
  } else {
    serviceTrack.style.transition = '';
    if (serviceViewport) serviceViewport.style.transition = '';
  }

  serviceTrack.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
  currentTabIndex = index;

  requestAnimationFrame(() => {
    updateServiceViewportHeight(index);
  });

  if (!animate || reducedMotion) {
    serviceTrack.style.transition = '';
    if (serviceViewport) serviceViewport.style.transition = '';
  }
}

function advanceServiceTab() {
  if (serviceTransitionLocked) return;
  serviceTransitionLocked = true;

  activateTab((currentTabIndex + 1) % tabs.length);

  window.setTimeout(() => {
    serviceTransitionLocked = false;
    scheduleServiceAdvance();
  }, reducedMotion ? 0 : SERVICE_TRANSITION_MS);
}

function stopServiceAutoScroll() {
  if (serviceAutoTimer) {
    clearTimeout(serviceAutoTimer);
    serviceAutoTimer = null;
  }
}

function scheduleServiceAdvance() {
  stopServiceAutoScroll();
  if (!tabs.length || !serviciosInView || reducedMotion) return;

  serviceAutoTimer = window.setTimeout(() => {
    advanceServiceTab();
  }, SERVICE_HOLD_MS);
}

function startServiceAutoScroll() {
  scheduleServiceAdvance();
}

function resetServiceAutoScroll() {
  if (!serviciosInView || reducedMotion) return;
  scheduleServiceAdvance();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    if (index === currentTabIndex) return;

    stopServiceAutoScroll();
    serviceTransitionLocked = true;
    activateTab(index);
    window.setTimeout(() => {
      serviceTransitionLocked = false;
      resetServiceAutoScroll();
    }, reducedMotion ? 0 : SERVICE_TRANSITION_MS);
  });
});

if (tabs.length && serviceTrack) {
  currentTabIndex = getActiveTabIndex();
  activateTab(currentTabIndex, { animate: false });
  syncPanelVisibility(currentTabIndex);

  window.addEventListener('resize', () => {
    updateServiceViewportHeight(currentTabIndex);
  });

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
