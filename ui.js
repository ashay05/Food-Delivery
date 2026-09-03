/**
 * UI Service for CraveDash
 * Manages toast alerts, modal dialogs, dish customizer, interactive star ratings,
 * and drag-and-drop favorite reordering.
 */

const UIService = {
  activeCustomizingDish: null,

  init() {
    this.bindGlobalModals();
    this.updateUserUI();
  },

  showToast({ title, message, type = 'info', icon = '🔔', duration = 3500 }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-close" onclick="this.parentElement.remove()">✕</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  },

  bumpCartBadge() {
    const badge = document.getElementById('navbar-cart-badge');
    const mobileBadge = document.getElementById('mobile-cart-badge');
    if (badge) {
      badge.classList.remove('bump');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('bump');
    }
    if (mobileBadge) {
      mobileBadge.classList.remove('bump');
      void mobileBadge.offsetWidth;
      mobileBadge.classList.add('bump');
    }
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    CartService.renderCartDrawer();
  },

  closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  bindGlobalModals() {
    // ESC key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        this.closeCartDrawer();
        document.body.style.overflow = '';
      }
    });

    // Close on clicking backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  },

  // ===== DISH CUSTOMIZATION MODAL =====
  openCustomizer(dishId) {
    const dish = DataService.getDishById(dishId);
    if (!dish) return;

    this.activeCustomizingDish = dish;
    const modal = document.getElementById('dish-customizer-modal');
    const content = document.getElementById('dish-customizer-body');
    if (!modal || !content) return;

    const cust = dish.customizations || {};

    content.innerHTML = `
      <div style="display: flex; gap: 1.25rem; margin-bottom: 1.5rem;">
        <img src="${dish.image}" alt="${dish.name}" style="width: 110px; height: 110px; border-radius: var(--radius-sm); object-fit: cover;">
        <div>
          <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">${dish.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${dish.description}</p>
          <div style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">$${dish.price.toFixed(2)}</div>
        </div>
      </div>

      <form id="customizer-form" onsubmit="UIService.handleAddToCartFromCustomizer(event)">
        ${cust.sizes && cust.sizes.length > 0 ? `
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="margin-bottom: 0.5rem;">Choose Size</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${cust.sizes.map((s, idx) => `
                <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.85rem; background: var(--bg-surface); border-radius: var(--radius-sm); cursor: pointer;">
                  <span style="font-size: 0.9rem; font-weight: 600;">
                    <input type="radio" name="custom-size" value="${idx}" ${idx === 0 ? 'checked' : ''} onchange="UIService.updateCustomizerTotal()">
                    ${s.name}
                  </span>
                  <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">
                    ${s.price > 0 ? '+$' + s.price.toFixed(2) : 'Free'}
                  </span>
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${cust.addons && cust.addons.length > 0 ? `
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="margin-bottom: 0.5rem;">Extra Add-ons</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${cust.addons.map((a, idx) => `
                <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.85rem; background: var(--bg-surface); border-radius: var(--radius-sm); cursor: pointer;">
                  <span style="font-size: 0.9rem; font-weight: 600;">
                    <input type="checkbox" name="custom-addon" value="${idx}" onchange="UIService.updateCustomizerTotal()">
                    ${a.name}
                  </span>
                  <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">+$${a.price.toFixed(2)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${cust.spiceLevels && cust.spiceLevels.length > 0 ? `
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="margin-bottom: 0.5rem;">Spice Level</label>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              ${cust.spiceLevels.map((lvl, idx) => `
                <label style="padding: 0.5rem 0.85rem; background: var(--bg-surface); border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                  <input type="radio" name="custom-spice" value="${lvl}" ${idx === 0 ? 'checked' : ''}>
                  🌶️ ${lvl}
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label">Special Cooking Instructions</label>
          <textarea id="custom-notes" class="form-input" rows="2" placeholder="e.g. Less salt, dressing on the side, extra napkins..."></textarea>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
          <div class="qty-controller">
            <button type="button" class="qty-btn" onclick="UIService.changeCustomizerQty(-1)">-</button>
            <span id="customizer-qty-display" class="qty-display">1</span>
            <button type="button" class="qty-btn" onclick="UIService.changeCustomizerQty(1)">+</button>
          </div>

          <button type="submit" class="btn btn-primary" id="customizer-submit-btn">
            Add to Cart • $<span id="customizer-total-price">${dish.price.toFixed(2)}</span>
          </button>
        </div>
      </form>
    `;

    this.openModal('dish-customizer-modal');
  },

  changeCustomizerQty(delta) {
    const qtyDisplay = document.getElementById('customizer-qty-display');
    if (!qtyDisplay) return;
    let qty = parseInt(qtyDisplay.textContent, 10) + delta;
    if (qty < 1) qty = 1;
    qtyDisplay.textContent = qty;
    this.updateCustomizerTotal();
  },

  updateCustomizerTotal() {
    if (!this.activeCustomizingDish) return;
    const dish = this.activeCustomizingDish;
    const cust = dish.customizations || {};

    let unit = dish.price;

    // Check size
    const sizeRadios = document.getElementsByName('custom-size');
    for (const r of sizeRadios) {
      if (r.checked && cust.sizes) {
        const s = cust.sizes[parseInt(r.value, 10)];
        if (s && s.price) unit += s.price;
      }
    }

    // Check addons
    const addonChecks = document.getElementsByName('custom-addon');
    for (const a of addonChecks) {
      if (a.checked && cust.addons) {
        const item = cust.addons[parseInt(a.value, 10)];
        if (item && item.price) unit += item.price;
      }
    }

    const qtyDisplay = document.getElementById('customizer-qty-display');
    const qty = qtyDisplay ? parseInt(qtyDisplay.textContent, 10) : 1;
    const total = (unit * qty).toFixed(2);

    const priceSpan = document.getElementById('customizer-total-price');
    if (priceSpan) priceSpan.textContent = total;
  },

  handleAddToCartFromCustomizer(e) {
    e.preventDefault();
    if (!this.activeCustomizingDish) return;
    const dish = this.activeCustomizingDish;
    const cust = dish.customizations || {};

    let selectedSize = null;
    const sizeRadios = document.getElementsByName('custom-size');
    for (const r of sizeRadios) {
      if (r.checked && cust.sizes) {
        selectedSize = cust.sizes[parseInt(r.value, 10)];
      }
    }

    const selectedAddons = [];
    const addonChecks = document.getElementsByName('custom-addon');
    for (const a of addonChecks) {
      if (a.checked && cust.addons) {
        selectedAddons.push(cust.addons[parseInt(a.value, 10)]);
      }
    }

    let selectedSpice = null;
    const spiceRadios = document.getElementsByName('custom-spice');
    for (const s of spiceRadios) {
      if (s.checked) selectedSpice = s.value;
    }

    const notes = document.getElementById('custom-notes') ? document.getElementById('custom-notes').value : '';
    const qtyDisplay = document.getElementById('customizer-qty-display');
    const quantity = qtyDisplay ? parseInt(qtyDisplay.textContent, 10) : 1;

    CartService.addItem({
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      restaurantId: dish.restaurantId,
      restaurantName: dish.restaurantName,
      selectedSize,
      selectedAddons,
      selectedSpice,
      specialNotes: notes,
      quantity
    });

    this.closeModal('dish-customizer-modal');
  },

  // ===== INTERACTIVE STAR RATINGS =====
  rateDish(dishId, rating) {
    this.showToast({
      title: "Rating Submitted! ⭐",
      message: `Thank you! You rated this dish ${rating} out of 5 stars.`,
      type: "success"
    });
  },

  // ===== DRAG AND DROP FAVORITES =====
  initFavoritesDragAndDrop() {
    const list = document.getElementById('favorites-dnd-container');
    if (!list) return;

    let draggedItem = null;

    list.querySelectorAll('.dnd-favorite-item').forEach(item => {
      item.addEventListener('dragstart', () => {
        draggedItem = item;
        setTimeout(() => item.classList.add('dragging'), 0);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
        this.saveReorderedFavorites();
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
          list.appendChild(draggedItem);
        } else {
          list.insertBefore(draggedItem, afterElement);
        }
      });
    });
  },

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.dnd-favorite-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  },

  saveReorderedFavorites() {
    const list = document.getElementById('favorites-dnd-container');
    if (!list) return;
    const newOrder = [...list.querySelectorAll('.dnd-favorite-item')].map(el => el.dataset.dishId);
    State.data.favorites = newOrder;
    State.saveFavorites();
    this.showToast({
      title: "Favorites Updated 📌",
      message: "Your favorite order preferences have been saved.",
      type: "info"
    });
  },

  updateUserUI() {
    const user = State.data.user;
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn) {
      if (user.isAuth) {
        authBtn.innerHTML = `👤 ${user.name.split(' ')[0]}`;
        authBtn.setAttribute('href', '#/profile');
        authBtn.onclick = null;
      } else {
        authBtn.innerHTML = `Sign In`;
        authBtn.setAttribute('href', 'javascript:void(0)');
        authBtn.onclick = () => UIService.openModal('auth-modal');
      }
    }
  }
};

window.UIService = UIService;
