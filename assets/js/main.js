const tabs = document.querySelectorAll('.service-tab');
const panels = document.querySelectorAll('.service-panel');
const serviciosSection = document.getElementById('servicios');
const serviceTabList = document.querySelector('.service-tabs');
const serviceTabIndicator = document.querySelector('.service-tab-indicator');
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

function getTabMetrics(index) {
  const tab = tabs[index];
  if (!tab) return null;

  return {
    x: tab.offsetLeft,
    y: tab.offsetTop,
    w: tab.offsetWidth,
    h: tab.offsetHeight,
  };
}

function applyTabIndicatorMetrics(metrics, animate = true) {
  if (!serviceTabIndicator || !metrics) return;

  if (!animate || reducedMotion) {
    serviceTabIndicator.style.transition = 'none';
  } else {
    serviceTabIndicator.style.transition = '';
  }

  serviceTabIndicator.style.width = `${metrics.w}px`;
  serviceTabIndicator.style.height = `${metrics.h}px`;
  serviceTabIndicator.style.transform = `translate3d(${metrics.x}px, ${metrics.y}px, 0)`;

  if (serviceTabList) {
    serviceTabList.classList.add('is-indicator-ready');
  }

  if (!animate || reducedMotion) {
    requestAnimationFrame(() => {
      if (serviceTabIndicator) serviceTabIndicator.style.transition = '';
    });
  }
}

function updateTabIndicator(index, animate = true) {
  applyTabIndicatorMetrics(getTabMetrics(index), animate);
}

function updateTabIndicatorFromDrag(index, dragPx) {
  if (!serviceViewport || !serviceTabIndicator) return;

  const width = serviceViewport.offsetWidth || 1;
  const progress = Math.max(-1, Math.min(1, -dragPx / width));
  const from = getTabMetrics(index);
  if (!from) return;

  let targetIndex = index;
  if (progress > 0 && index > 0) targetIndex = index - 1;
  else if (progress < 0 && index < tabs.length - 1) targetIndex = index + 1;

  if (targetIndex === index) {
    applyTabIndicatorMetrics({
      ...from,
      x: from.x + dragPx * 0.06,
    }, false);
    return;
  }

  const to = getTabMetrics(targetIndex);
  if (!to) return;

  const t = Math.abs(progress);
  applyTabIndicatorMetrics({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    w: from.w + (to.w - from.w) * t,
    h: from.h + (to.h - from.h) * t,
  }, false);
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

  if (dragPx !== 0) {
    updateTabIndicatorFromDrag(index, dragPx);
  }
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
  updateTabIndicator(index, animate);

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
    updateTabIndicator(currentTabIndex, false);
  });

  if (serviceTabList && window.ResizeObserver) {
    const tabListObserver = new ResizeObserver(() => {
      updateTabIndicator(currentTabIndex, false);
    });
    tabListObserver.observe(serviceTabList);
  }

  window.addEventListener('load', () => {
    updateTabIndicator(currentTabIndex, false);
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

function initGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const closeButton = lightbox?.querySelector('.gallery-lightbox-close');
  const galleryMarquee = document.querySelector('.gallery-marquee');
  const slides = document.querySelectorAll('.gallery-slide:not([aria-hidden="true"])');

  if (!lightbox || !lightboxImage || !closeButton || !slides.length) return;

  const openLightbox = (src, alt) => {
    lightboxImage.src = src;
    lightboxImage.alt = alt;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    galleryMarquee?.classList.add('is-paused');
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImage.src = '';
    lightboxImage.alt = '';
    document.body.style.overflow = '';
    galleryMarquee?.classList.remove('is-paused');
  };

  slides.forEach((slide) => {
    slide.addEventListener('click', () => {
      const img = slide.querySelector('img');
      if (!img) return;
      openLightbox(img.src, img.alt);
    });
  });

  closeButton.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
}

initGalleryLightbox();
