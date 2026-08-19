const tabs = document.querySelectorAll('.service-tab');
const panels = document.querySelectorAll('.service-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
    panels.forEach((p) => p.classList.remove('active'));
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(tab.dataset.target).classList.add('active');
  });
});

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
