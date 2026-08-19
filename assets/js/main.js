const tabs = document.querySelectorAll('.service-tab');
const panels = document.querySelectorAll('.service-panel');
const serviciosSection = document.getElementById('servicios');
const serviceViewport = document.querySelector('.service-panels-viewport');
const serviceTrack = document.querySelector('.service-panels-track');

const SERVICE_HOLD_MS = 4200;
const SERVICE_TRANSITION_MS = 750;
const SWIPE_THRESHOLD_PX = 48;
const SWIPE_THRESHOLD_RATIO = 0.16;

let currentTabIndex = 0;
let serviceAutoTimer = null;
let serviciosInView = false;
let serviceTransitionLocked = false;

let dragStartX = 0;
let dragStartY = 0;
let dragCurrentX = 0;
let isDragging = false;
let dragAxis = null;

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

function setTrackTransform(index, dragPx = 0, animate = true) {
  if (!serviceTrack || !serviceViewport) return;

  const width = serviceViewport.offsetWidth || 1;
  const basePercent = -index * 100;
  const dragPercent = (dragPx / width) * 100;

  if (!animate || reducedMotion) {
    serviceTrack.style.transition = 'none';
    if (serviceViewport) serviceViewport.style.transition = 'none';
  } else {
    serviceTrack.style.transition = '';
    if (serviceViewport) serviceViewport.style.transition = '';
  }

  serviceTrack.style.transform = `translate3d(${basePercent + dragPercent}%, 0, 0)`;
}

function activateTab(index, options = {}) {
  const { animate = true } = options;
  const tab = tabs[index];
  if (!tab || !serviceTrack) return;

  tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
  tab.setAttribute('aria-selected', 'true');
  syncPanelVisibility(index);
  setTrackTransform(index, 0, animate);
  currentTabIndex = index;

  requestAnimationFrame(() => {
    updateServiceViewportHeight(index);
  });

  if (!animate || reducedMotion) {
    serviceTrack.style.transition = '';
    if (serviceViewport) serviceViewport.style.transition = '';
  }
}

function completeTabChange(index) {
  serviceTransitionLocked = true;
  activateTab(index);
  window.setTimeout(() => {
    serviceTransitionLocked = false;
    resetServiceAutoScroll();
  }, reducedMotion ? 0 : SERVICE_TRANSITION_MS);
}

function advanceServiceTab() {
  if (serviceTransitionLocked) return;
  completeTabChange((currentTabIndex + 1) % tabs.length);
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

function resolveSwipeTarget(deltaX) {
  if (!serviceViewport) return currentTabIndex;

  const threshold = Math.max(SWIPE_THRESHOLD_PX, serviceViewport.offsetWidth * SWIPE_THRESHOLD_RATIO);

  if (deltaX <= -threshold && currentTabIndex < tabs.length - 1) {
    return currentTabIndex + 1;
  }

  if (deltaX >= threshold && currentTabIndex > 0) {
    return currentTabIndex - 1;
  }

  return currentTabIndex;
}

function initServiceSwipe() {
  if (!serviceViewport || !serviceTrack) return;

  const onPointerDown = (event) => {
    if (serviceTransitionLocked || event.pointerType === 'mouse') return;

    isDragging = true;
    dragAxis = null;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragCurrentX = event.clientX;

    stopServiceAutoScroll();
    serviceTrack.style.transition = 'none';
    serviceViewport.classList.add('is-dragging');

    if (serviceViewport.setPointerCapture) {
      serviceViewport.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event) => {
    if (!isDragging) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    if (!dragAxis) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      dragAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';

      if (dragAxis === 'y') {
        isDragging = false;
        dragAxis = null;
        serviceViewport.classList.remove('is-dragging');
        resetServiceAutoScroll();
        return;
      }
    }

    if (dragAxis !== 'x') return;

    event.preventDefault();
    dragCurrentX = event.clientX;

    let dragPx = dragCurrentX - dragStartX;
    if ((currentTabIndex === 0 && dragPx > 0) || (currentTabIndex === tabs.length - 1 && dragPx < 0)) {
      dragPx *= 0.35;
    }

    setTrackTransform(currentTabIndex, dragPx, false);
  };

  const onPointerEnd = (event) => {
    if (!isDragging) return;

    isDragging = false;
    serviceViewport.classList.remove('is-dragging');

    if (serviceViewport.releasePointerCapture && serviceViewport.hasPointerCapture(event.pointerId)) {
      serviceViewport.releasePointerCapture(event.pointerId);
    }

    if (dragAxis === 'x') {
      const nextIndex = resolveSwipeTarget(dragCurrentX - dragStartX);
      stopServiceAutoScroll();
      completeTabChange(nextIndex);
    } else {
      resetServiceAutoScroll();
    }

    dragAxis = null;
  };

  serviceViewport.addEventListener('pointerdown', onPointerDown);
  serviceViewport.addEventListener('pointermove', onPointerMove, { passive: false });
  serviceViewport.addEventListener('pointerup', onPointerEnd);
  serviceViewport.addEventListener('pointercancel', onPointerEnd);
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    if (index === currentTabIndex) return;

    stopServiceAutoScroll();
    completeTabChange(index);
  });
});

if (tabs.length && serviceTrack) {
  currentTabIndex = getActiveTabIndex();
  activateTab(currentTabIndex, { animate: false });
  syncPanelVisibility(currentTabIndex);
  initServiceSwipe();

  window.addEventListener('resize', () => {
    updateServiceViewportHeight(currentTabIndex);
    setTrackTransform(currentTabIndex, 0, false);
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
