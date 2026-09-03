/**
 * Main Application Coordinator for CraveDash
 * Bootstraps all subsystems, binds UI listeners, countdown timers, and registers service workers.
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 CraveDash Food Delivery: Initializing Application...');

  // 1. Initialize State & Data
  State.init();
  await DataService.init();

  // 2. Initialize Subsystem Services
  UIService.init();
  CartService.init();
  SearchService.init();
  AuthService.init();
  ChatbotService.init();
  Router.init();

  // 3. Initialize UI Features
  initCountdownTimer();
  initCarousels();
  bindFilterChips();
  bindCheckoutForm();
  registerServiceWorker();

  console.log('✨ CraveDash initialized successfully!');
});

// ===== LIMITED-TIME DEAL COUNTDOWN TIMER =====
function initCountdownTimer() {
  const hoursEl = document.getElementById('deal-hours');
  const minsEl = document.getElementById('deal-mins');
  const secsEl = document.getElementById('deal-secs');
  if (!hoursEl || !minsEl || !secsEl) return;

  let totalSeconds = 5 * 3600 + 43 * 60 + 19; // 05h 43m 19s

  setInterval(() => {
    if (totalSeconds > 0) totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// ===== HORIZONTAL CAROUSEL CONTROLS =====
function initCarousels() {
  const setupCarousel = (prevBtnId, nextBtnId, trackId) => {
    const prev = document.getElementById(prevBtnId);
    const next = document.getElementById(nextBtnId);
    const track = document.getElementById(trackId);

    if (prev && track) {
      prev.addEventListener('click', () => {
        track.scrollBy({ left: -360, behavior: 'smooth' });
      });
    }

    if (next && track) {
      next.addEventListener('click', () => {
        track.scrollBy({ left: 360, behavior: 'smooth' });
      });
    }
  };

  setupCarousel('featured-prev-btn', 'featured-next-btn', 'landing-featured-track');
  setupCarousel('dishes-prev-btn', 'dishes-next-btn', 'landing-dishes-track');
}

// ===== FILTER CHIPS & SORT LISTENER =====
function bindFilterChips() {
  // Cuisine chips
  document.querySelectorAll('[data-filter-cuisine]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('[data-filter-cuisine]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      State.data.filters.cuisine = chip.getAttribute('data-filter-cuisine');
      Router.applyAndRenderRestaurantListing();
    });
  });

  // Rating filter
  const ratingFilter = document.getElementById('filter-rating-select');
  if (ratingFilter) {
    ratingFilter.addEventListener('change', (e) => {
      State.data.filters.minRating = parseFloat(e.target.value) || 0;
      Router.applyAndRenderRestaurantListing();
    });
  }

  // Delivery time filter
  const deliveryFilter = document.getElementById('filter-delivery-select');
  if (deliveryFilter) {
    deliveryFilter.addEventListener('change', (e) => {
      State.data.filters.maxDeliveryTime = parseInt(e.target.value, 10) || 60;
      Router.applyAndRenderRestaurantListing();
    });
  }

  // Sort by select
  const sortSelect = document.getElementById('filter-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      State.data.filters.sortBy = e.target.value;
      Router.applyAndRenderRestaurantListing();
    });
  }

  // Dietary filter pills
  document.querySelectorAll('[data-filter-dietary]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-dietary]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      State.data.filters.dietary = pill.getAttribute('data-filter-dietary');
      Router.applyAndRenderRestaurantListing();
    });
  });
}

// ===== CHECKOUT FORM & PAYMENT SUBMISSION =====
function bindCheckoutForm() {
  const form = document.getElementById('checkout-order-form');
  if (!form) return;

  // Payment method selection cards
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const method = card.getAttribute('data-payment-method');
      
      const cardPreview = document.getElementById('credit-card-fields');
      if (cardPreview) {
        cardPreview.style.display = method === 'card' ? 'block' : 'none';
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const street = document.getElementById('checkout-street').value.trim();
    const city = document.getElementById('checkout-city').value.trim();
    const zip = document.getElementById('checkout-zip').value.trim();
    const instructions = document.getElementById('checkout-notes') ? document.getElementById('checkout-notes').value : '';

    let isValid = true;
    if (!name) { document.getElementById('checkout-name').classList.add('error'); isValid = false; }
    else document.getElementById('checkout-name').classList.remove('error');

    if (!phone) { document.getElementById('checkout-phone').classList.add('error'); isValid = false; }
    else document.getElementById('checkout-phone').classList.remove('error');

    if (!street) { document.getElementById('checkout-street').classList.add('error'); isValid = false; }
    else document.getElementById('checkout-street').classList.remove('error');

    if (!isValid) {
      UIService.showToast({
        title: "Missing Fields",
        message: "Please fill in all required delivery details.",
        type: "danger"
      });
      return;
    }

    const activePaymentCard = document.querySelector('.payment-method-card.active');
    const paymentMethod = activePaymentCard ? activePaymentCard.getAttribute('data-payment-method') : 'card';

    // Show simulated payment processing animation
    const submitBtn = document.getElementById('checkout-submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span>⏳ Processing Payment...</span>`;
    submitBtn.disabled = true;

    setTimeout(() => {
      const order = OrderService.createOrder({
        name,
        phone,
        address: `${street}, ${city} ${zip}`,
        paymentMethod,
        instructions
      });

      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;

      UIService.showToast({
        title: "Order Placed Successfully! 🎉",
        message: `Order #${order.orderId} confirmed. Connecting with kitchen.`,
        type: "success",
        icon: "🍕"
      });

      // Redirect to live order tracking
      window.location.hash = `#/track/${order.orderId}`;
    }, 1200);
  });
}

// ===== PWA SERVICE WORKER REGISTRATION =====
function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ ServiceWorker registered with scope:', reg.scope);
        // Force update on load to ensure live edits show immediately
        reg.update();
      })
      .catch(err => console.log('ℹ️ ServiceWorker registration note:', err.message));
  }
}
