/**
 * Client-Side Hash Router for CraveDash
 * Renders views dynamically, manages browser history, and scroll restoration.
 */

const Router = {
  routes: {},

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    const hash = window.location.hash || '#/';
    const [pathWithParams] = hash.split('?');
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');

    // Hide all view containers
    document.querySelectorAll('.view-container').forEach(el => {
      el.style.display = 'none';
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Match route
    if (pathWithParams === '#/' || pathWithParams === '') {
      this.renderLandingView();
    } else if (pathWithParams === '#/restaurants') {
      this.renderRestaurantsView(params);
    } else if (pathWithParams.startsWith('#/restaurant/')) {
      const restId = pathWithParams.replace('#/restaurant/', '');
      this.renderRestaurantDetailView(restId, params);
    } else if (pathWithParams === '#/cart') {
      this.renderCartView();
    } else if (pathWithParams === '#/checkout') {
      this.renderCheckoutView();
    } else if (pathWithParams.startsWith('#/track/')) {
      const orderId = pathWithParams.replace('#/track/', '');
      this.renderOrderTrackingView(orderId);
    } else if (pathWithParams === '#/profile') {
      this.renderProfileView();
    } else {
      this.renderLandingView();
    }

    this.updateActiveNavLinks(pathWithParams);
  },

  updateActiveNavLinks(path) {
    document.querySelectorAll('.nav-link, .mobile-dock-item').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === path || (href === '#/restaurants' && path.startsWith('#/restaurant/')))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  // ==========================================
  // VIEW: LANDING
  // ==========================================
  renderLandingView() {
    const view = document.getElementById('view-landing');
    if (!view) return;
    view.style.display = 'block';

    const restaurants = DataService.getAllRestaurants();
    const dishes = DataService.getAllDishes();

    // Render Featured Restaurants Carousel
    const featuredTrack = document.getElementById('landing-featured-track');
    if (featuredTrack) {
      const featured = restaurants.filter(r => r.isFeatured || r.rating >= 4.8);
      featuredTrack.innerHTML = featured.map(rest => `
        <div class="restaurant-card" onclick="location.hash='#/restaurant/${rest.id}'">
          <div class="restaurant-card-img-wrap">
            <img src="${rest.heroImage}" alt="${rest.name}" class="restaurant-card-img" loading="lazy">
            <span class="restaurant-card-badge">${rest.deliveryTime}</span>
            ${rest.offer ? `<span class="restaurant-card-offer">${rest.offer}</span>` : ''}
          </div>
          <div class="restaurant-card-body">
            <div class="restaurant-card-header">
              <h4 class="restaurant-card-title">${rest.name}</h4>
              <span class="rating-badge">⭐ ${rest.rating}</span>
            </div>
            <div class="restaurant-card-cuisines">${rest.cuisines.join(' • ')}</div>
            <div class="restaurant-card-meta">
              <span>📍 ${rest.distance}</span>
              <span>Min. $${rest.minOrder}</span>
              <span>${rest.priceRange}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Render Trending Dishes Carousel
    const dishesTrack = document.getElementById('landing-dishes-track');
    if (dishesTrack) {
      const trending = dishes.filter(d => d.isBestseller).slice(0, 6);
      dishesTrack.innerHTML = trending.map(dish => `
        <div class="dish-card" style="min-width: 290px;">
          <div class="dish-card-info">
            <div class="dish-diet-icon ${dish.isVeg ? 'veg' : 'nonveg'}"></div>
            <h4 class="dish-title">${dish.name}</h4>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">
              from <strong>${dish.restaurantName}</strong>
            </div>
            <div class="dish-price-wrap">
              <span class="dish-price">$${dish.price.toFixed(2)}</span>
              ${dish.originalPrice ? `<span class="dish-orig-price">$${dish.originalPrice.toFixed(2)}</span>` : ''}
            </div>
            <div class="dish-desc">${dish.description}</div>
            <button class="btn btn-primary btn-sm" style="align-self: flex-start; margin-top: auto;" onclick="UIService.openCustomizer('${dish.id}')">
              + Add to Cart
            </button>
          </div>
          <div class="dish-media">
            <img src="${dish.image}" alt="${dish.name}" class="dish-img" loading="lazy">
          </div>
        </div>
      `).join('');
    }
  },

  // ==========================================
  // VIEW: RESTAURANTS LISTING
  // ==========================================
  renderRestaurantsView(params) {
    const view = document.getElementById('view-restaurants');
    if (!view) return;
    view.style.display = 'block';

    const searchFromUrl = params.get('search') || '';
    if (searchFromUrl) {
      State.data.filters.searchQuery = searchFromUrl;
    }

    this.applyAndRenderRestaurantListing();
  },

  applyAndRenderRestaurantListing() {
    const container = document.getElementById('restaurants-grid-container');
    const countBadge = document.getElementById('restaurants-found-count');
    if (!container) return;

    const all = DataService.getAllRestaurants();
    const filtered = SearchService.filterRestaurants(all, State.data.filters);

    if (countBadge) {
      countBadge.textContent = `${filtered.length} restaurants open now`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="margin-bottom: 0.5rem;">No Restaurants Match Your Filter</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Try relaxing your filters or search keywords.</p>
          <button class="btn btn-primary btn-sm" onclick="Router.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(rest => `
      <div class="restaurant-card" onclick="location.hash='#/restaurant/${rest.id}'">
        <div class="restaurant-card-img-wrap">
          <img src="${rest.heroImage}" alt="${rest.name}" class="restaurant-card-img" loading="lazy">
          <span class="restaurant-card-badge">${rest.deliveryTime}</span>
          ${rest.offer ? `<span class="restaurant-card-offer">${rest.offer}</span>` : ''}
          <button class="restaurant-card-favorite-btn ${State.data.favoriteRestaurants.includes(rest.id) ? 'favorited' : ''}" onclick="event.stopPropagation(); Router.toggleFavoriteRestaurant('${rest.id}')">
            ♥
          </button>
        </div>
        <div class="restaurant-card-body">
          <div class="restaurant-card-header">
            <h4 class="restaurant-card-title">${rest.name}</h4>
            <span class="rating-badge">⭐ ${rest.rating}</span>
          </div>
          <div class="restaurant-card-cuisines">${rest.cuisines.join(' • ')}</div>
          <div class="restaurant-card-meta">
            <span>📍 ${rest.distance}</span>
            <span>Min $${rest.minOrder}</span>
            <span>${rest.priceRange}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  resetFilters() {
    State.data.filters = {
      searchQuery: "",
      cuisine: "all",
      minRating: 0,
      maxDeliveryTime: 60,
      priceRange: "all",
      dietary: "all",
      sortBy: "popular"
    };
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.filter-chip[data-filter-val="all"]')?.classList.add('active');
    this.applyAndRenderRestaurantListing();
  },

  toggleFavoriteRestaurant(restId) {
    const idx = State.data.favoriteRestaurants.indexOf(restId);
    if (idx > -1) {
      State.data.favoriteRestaurants.splice(idx, 1);
      UIService.showToast({ title: "Removed Favorite", message: "Restaurant removed from your favorites.", type: "info" });
    } else {
      State.data.favoriteRestaurants.push(restId);
      UIService.showToast({ title: "Saved to Favorites! ❤️", message: "Restaurant added to favorites.", type: "success" });
    }
    this.applyAndRenderRestaurantListing();
  },

  // ==========================================
  // VIEW: RESTAURANT MENU DETAIL
  // ==========================================
  renderRestaurantDetailView(restId, params) {
    const view = document.getElementById('view-restaurant-detail');
    if (!view) return;
    view.style.display = 'block';

    const rest = DataService.getRestaurantById(restId);
    if (!rest) {
      view.innerHTML = `<div class="container" style="padding: 4rem 0; text-align: center;"><h2>Restaurant Not Found</h2><a href="#/restaurants" class="btn btn-primary" style="margin-top:1rem;">Back to Restaurants</a></div>`;
      return;
    }

    // Hero banner
    const banner = document.getElementById('restaurant-detail-banner');
    if (banner) {
      banner.innerHTML = `
        <img src="${rest.heroImage}" alt="${rest.name}" class="restaurant-hero-img">
        <div class="restaurant-hero-overlay">
          <div>
            <h1 style="font-size: 2.2rem; margin-bottom: 0.35rem; color:#fff;">${rest.name}</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 0.95rem; margin-bottom: 0.75rem;">${rest.tagline}</p>
            <div style="display: flex; gap: 0.75rem; font-size: 0.85rem; font-weight: 600; flex-wrap: wrap;">
              <span class="rating-badge">⭐ ${rest.rating} (${rest.totalReviews}+ reviews)</span>
              <span style="background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: var(--radius-xs);">🕒 ${rest.deliveryTime}</span>
              <span style="background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: var(--radius-xs);">📍 ${rest.address}</span>
            </div>
          </div>
          ${rest.offer ? `
            <div style="background: var(--primary); color: #fff; padding: 0.6rem 1.25rem; border-radius: var(--radius-sm); font-weight: 800; font-size: 0.9rem;">
              🎟️ ${rest.offer}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Category navigation tabs
    const nav = document.getElementById('restaurant-menu-category-nav');
    const sectionsContainer = document.getElementById('restaurant-menu-sections');
    if (nav && sectionsContainer) {
      nav.innerHTML = rest.categories.map((cat, idx) => `
        <a href="#cat-${cat.id}" class="menu-category-link ${idx === 0 ? 'active' : ''}" onclick="event.preventDefault(); document.getElementById('section-${cat.id}').scrollIntoView({behavior:'smooth'});">
          ${cat.name} (${cat.items.length})
        </a>
      `).join('');

      sectionsContainer.innerHTML = rest.categories.map(cat => `
        <div id="section-${cat.id}" style="margin-bottom: 3rem; scroll-margin-top: 140px;">
          <h3 style="margin-bottom: 1.25rem; font-size: 1.4rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
            ${cat.name}
          </h3>
          <div class="menu-dishes-grid">
            ${cat.items.map(dish => `
              <div class="dish-card" id="dish-${dish.id}">
                <div class="dish-card-info">
                  <div class="dish-diet-icon ${dish.isVeg ? 'veg' : 'nonveg'}"></div>
                  <h4 class="dish-title">${dish.name}</h4>
                  <div class="dish-price-wrap">
                    <span class="dish-price">$${dish.price.toFixed(2)}</span>
                    ${dish.originalPrice ? `<span class="dish-orig-price">$${dish.originalPrice.toFixed(2)}</span>` : ''}
                  </div>
                  <div class="dish-desc">${dish.description}</div>
                  
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.5rem;">
                    <div class="star-rating-widget">
                      ${[1,2,3,4,5].map(star => `
                        <span class="star-icon ${star <= Math.round(dish.rating) ? 'filled' : ''}" onclick="UIService.rateDish('${dish.id}', ${star})">★</span>
                      `).join('')}
                      <small style="color: var(--text-muted); margin-left: 0.3rem;">(${dish.reviewsCount || 45})</small>
                    </div>

                    <button class="btn btn-primary btn-sm" onclick="UIService.openCustomizer('${dish.id}')">
                      + Add Item
                    </button>
                  </div>
                </div>
                <div class="dish-media">
                  <img src="${dish.image}" alt="${dish.name}" class="dish-img" loading="lazy">
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    // Auto highlight requested dish from query parameter
    const dishParam = params.get('dish');
    if (dishParam) {
      setTimeout(() => {
        const targetDish = document.getElementById(`dish-${dishParam}`);
        if (targetDish) {
          targetDish.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetDish.style.boxShadow = '0 0 0 3px var(--primary)';
        }
      }, 300);
    }
  },

  // ==========================================
  // VIEW: CART PAGE
  // ==========================================
  renderCartView() {
    const view = document.getElementById('view-cart');
    if (!view) return;
    view.style.display = 'block';

    const container = document.getElementById('full-cart-items-container');
    const summaryContainer = document.getElementById('full-cart-summary-container');
    const items = State.data.cart.items || [];
    const totals = CartService.getTotals();

    if (items.length === 0) {
      view.innerHTML = `
        <div class="container" style="padding: 5rem 0; text-align: center;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
          <h2 style="margin-bottom: 0.5rem;">Your Cart is Empty</h2>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">Delicious dishes are just a click away!</p>
          <a href="#/restaurants" class="btn btn-primary btn-lg">Explore Menu Now</a>
        </div>
      `;
      return;
    }

    if (container) {
      container.innerHTML = items.map(item => `
        <div class="dish-card" style="margin-bottom: 1rem;">
          <div class="dish-card-info">
            <h4 class="dish-title">${item.name}</h4>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.4rem;">from ${item.restaurantName}</div>
            ${item.selectedSize ? `<div style="font-size: 0.78rem; color: var(--text-muted);">Size: ${item.selectedSize.name}</div>` : ''}
            ${item.selectedAddons && item.selectedAddons.length > 0 ? `<div style="font-size: 0.78rem; color: var(--text-muted);">+ ${item.selectedAddons.map(a => a.name).join(', ')}</div>` : ''}
            ${item.selectedSpice ? `<div style="font-size: 0.78rem; color: var(--text-muted);">Spice: ${item.selectedSpice}</div>` : ''}
            ${item.specialNotes ? `<div style="font-size: 0.75rem; color: var(--accent); margin-top: 0.25rem;">Note: ${item.specialNotes}</div>` : ''}

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
              <span style="font-weight: 800; font-size: 1.15rem; color: var(--primary);">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
              <div class="qty-controller">
                <button class="qty-btn" onclick="CartService.updateQuantity('${item.cartItemId}', -1); Router.renderCartView();">-</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="CartService.updateQuantity('${item.cartItemId}', 1); Router.renderCartView();">+</button>
              </div>
            </div>
          </div>
          <div class="dish-media" style="width: 110px; height: 110px;">
            <img src="${item.image}" alt="${item.name}" class="dish-img">
          </div>
        </div>
      `).join('');
    }

    if (summaryContainer) {
      const coupon = State.data.cart.appliedCoupon;
      summaryContainer.innerHTML = `
        <div class="checkout-step-card" style="position: sticky; top: calc(var(--header-height) + 1.5rem);">
          <h3 style="margin-bottom: 1.25rem; font-size: 1.3rem;">Order Summary</h3>

          <div class="coupon-input-box">
            ${coupon ? `
              <div style="flex: 1; display: flex; align-items: center; justify-content: space-between; background: var(--success-light); padding: 0.5rem 0.85rem; border-radius: var(--radius-sm); border: 1px dashed var(--success);">
                <span style="font-weight: 800; font-size: 0.85rem; color: var(--success);">🎟️ ${coupon.code} (-$${totals.discount.toFixed(2)})</span>
                <button onclick="CartService.removeCoupon(); Router.renderCartView();" style="color: var(--danger); font-weight: 700;">Remove</button>
              </div>
            ` : `
              <input type="text" id="full-cart-coupon-input" class="coupon-input" placeholder="Promo code">
              <button class="btn btn-secondary btn-sm" onclick="Router.handleApplyCouponFromCart()">Apply</button>
            `}
          </div>

          <div class="price-breakdown" style="margin-top: 1.5rem;">
            <div class="price-row">
              <span>Items Total (${totals.itemCount})</span>
              <span>$${totals.subtotal.toFixed(2)}</span>
            </div>
            ${totals.discount > 0 ? `
              <div class="price-row" style="color: var(--success); font-weight: 700;">
                <span>Discount Savings</span>
                <span>-$${totals.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="price-row">
              <span>Delivery Fee</span>
              <span>${totals.deliveryFee === 0 ? '<span style="color:var(--success); font-weight:700;">FREE</span>' : '$' + totals.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="price-row">
              <span>Platform Fee</span>
              <span>$${totals.platformFee.toFixed(2)}</span>
            </div>
            <div class="price-row">
              <span>Taxes & GST (8.25%)</span>
              <span>$${totals.taxes.toFixed(2)}</span>
            </div>
            <div class="price-row total">
              <span>Grand Total</span>
              <span>$${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <a href="#/checkout" class="btn btn-primary btn-block btn-lg" style="margin-top: 1.5rem;">
            Proceed to Checkout ($${totals.total.toFixed(2)}) →
          </a>
        </div>
      `;
    }
  },

  handleApplyCouponFromCart() {
    const input = document.getElementById('full-cart-coupon-input');
    if (!input) return;
    const res = CartService.applyCoupon(input.value);
    UIService.showToast({
      title: res.success ? "Success" : "Error",
      message: res.message,
      type: res.success ? "success" : "danger"
    });
    this.renderCartView();
  },

  // ==========================================
  // VIEW: CHECKOUT
  // ==========================================
  renderCheckoutView() {
    const view = document.getElementById('view-checkout');
    if (!view) return;

    const items = State.data.cart.items || [];
    if (items.length === 0) {
      window.location.hash = '#/cart';
      return;
    }

    view.style.display = 'block';

    const totals = CartService.getTotals();
    const totalsEl = document.getElementById('checkout-total-display');
    if (totalsEl) totalsEl.textContent = `$${totals.total.toFixed(2)}`;

    // Populate user details if available
    const user = State.data.user;
    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    const phoneInput = document.getElementById('checkout-phone');
    if (nameInput && user.name) nameInput.value = user.name;
    if (emailInput && user.email) emailInput.value = user.email;
    if (phoneInput && user.phone) phoneInput.value = user.phone;

    // Populate address
    const selectedAddr = State.data.selectedAddress;
    const streetInput = document.getElementById('checkout-street');
    const cityInput = document.getElementById('checkout-city');
    const zipInput = document.getElementById('checkout-zip');
    if (selectedAddr) {
      if (streetInput) streetInput.value = selectedAddr.street || '';
      if (cityInput) cityInput.value = selectedAddr.city || '';
      if (zipInput) zipInput.value = selectedAddr.zip || '';
    }
  },

  // ==========================================
  // VIEW: LIVE ORDER TRACKING
  // ==========================================
  renderOrderTrackingView(orderId) {
    const view = document.getElementById('view-order-tracking');
    if (!view) return;
    view.style.display = 'block';

    let order = OrderService.getOrderById(orderId);
    if (!order && State.data.orders.length > 0) {
      order = State.data.orders[0];
    }

    if (!order) {
      view.innerHTML = `
        <div class="container" style="padding: 4rem 0; text-align: center;">
          <h2>No Active Order Found</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Place an order first to track it live!</p>
          <a href="#/restaurants" class="btn btn-primary">Browse Restaurants</a>
        </div>
      `;
      return;
    }

    // Set order metadata
    const idEl = document.getElementById('tracking-order-id');
    const riderNameEl = document.getElementById('tracking-rider-name');
    const riderPhoneEl = document.getElementById('tracking-rider-phone');
    const riderVehicleEl = document.getElementById('tracking-rider-vehicle');
    const etaEl = document.getElementById('tracking-eta-time');
    const itemsListEl = document.getElementById('tracking-order-items');

    if (idEl) idEl.textContent = `#${order.orderId}`;
    if (riderNameEl) riderNameEl.textContent = order.rider.name;
    if (riderPhoneEl) riderPhoneEl.textContent = order.rider.phone;
    if (riderVehicleEl) riderVehicleEl.textContent = order.rider.vehicle;
    if (etaEl) etaEl.textContent = "25-30 mins";

    if (itemsListEl) {
      itemsListEl.innerHTML = order.items.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed var(--border-color); font-size: 0.88rem;">
          <span>${item.quantity}x ${item.name}</span>
          <span style="font-weight: 700;">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
        </div>
      `).join('');
    }

    OrderService.updateTrackingUI(order);
  },

  // ==========================================
  // VIEW: USER PROFILE
  // ==========================================
  renderProfileView() {
    const view = document.getElementById('view-profile');
    if (!view) return;
    view.style.display = 'block';

    const user = State.data.user;
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const ordersCountEl = document.getElementById('profile-orders-count');
    const historyContainer = document.getElementById('profile-order-history');
    const favsContainer = document.getElementById('favorites-dnd-container');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (ordersCountEl) ordersCountEl.textContent = `${State.data.orders.length} Orders Placed`;

    // Render Order History
    if (historyContainer) {
      const orders = State.data.orders;
      if (orders.length === 0) {
        historyContainer.innerHTML = `<div style="color: var(--text-muted); padding: 1.5rem 0;">No past orders yet.</div>`;
      } else {
        historyContainer.innerHTML = orders.map(ord => `
          <div class="card" style="padding: 1.25rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <h4 style="font-size: 1.05rem;">Order #${ord.orderId}</h4>
                <small style="color: var(--text-muted);">${new Date(ord.createdAt).toLocaleDateString()} • ${ord.items.length} items</small>
              </div>
              <span class="badge-tag badge-success">${ord.status.toUpperCase()}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
              ${ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
              <span style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary);">$${ord.totals.total.toFixed(2)}</span>
              <div style="display: flex; gap: 0.5rem;">
                <a href="#/track/${ord.orderId}" class="btn btn-secondary btn-sm">Live Track</a>
                <button class="btn btn-primary btn-sm" onclick="Router.reorderItems('${ord.orderId}')">Re-order 🔁</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Favorite Dishes (with drag-and-drop handles)
    if (favsContainer) {
      const allDishes = DataService.getAllDishes();
      const favIds = State.data.favorites;
      const favDishes = favIds.map(id => allDishes.find(d => d.id === id)).filter(Boolean);

      favDishes.forEach(d => {
        if (!favDishes.find(f => f.id === d.id)) favDishes.push(d);
      });

      favsContainer.innerHTML = favDishes.map(dish => `
        <div class="dnd-favorite-item" draggable="true" data-dish-id="${dish.id}">
          <span class="dnd-handle" title="Drag to re-order">☰</span>
          <img src="${dish.image}" alt="${dish.name}" style="width: 50px; height: 50px; border-radius: var(--radius-xs); object-fit: cover;">
          <div style="flex: 1;">
            <h5 style="font-size: 0.95rem; margin-bottom: 0.15rem;">${dish.name}</h5>
            <small style="color: var(--text-muted);">$${dish.price.toFixed(2)} • ${dish.restaurantName}</small>
          </div>
          <button class="btn btn-primary btn-sm" onclick="UIService.openCustomizer('${dish.id}')">Order</button>
        </div>
      `).join('');

      UIService.initFavoritesDragAndDrop();
    }
  },

  reorderItems(orderId) {
    const order = OrderService.getOrderById(orderId);
    if (!order) return;
    order.items.forEach(item => {
      CartService.addItem(item);
    });
    UIService.showToast({
      title: "Items Added! 🛒",
      message: `Re-added ${order.items.length} items to your cart.`,
      type: "success"
    });
    UIService.openCartDrawer();
  }
};

window.Router = Router;
