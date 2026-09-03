/**
 * Cart Management Service for CraveDash
 * Handles adding/removing items, customizations, promo calculations, and localStorage synchronization.
 */

const CartService = {
  FREE_DELIVERY_THRESHOLD: 40.00,

  init() {
    State.subscribe('cartUpdated', () => {
      this.updateNavbarBadge();
      this.renderCartDrawer();
    });
    this.updateNavbarBadge();
  },

  addItem(itemData) {
    const {
      dishId,
      name,
      price,
      image,
      restaurantId,
      restaurantName,
      selectedSize = null,
      selectedAddons = [],
      selectedSpice = null,
      specialNotes = '',
      quantity = 1
    } = itemData;

    // Calculate individual unit price based on customizations
    let unitPrice = price;
    if (selectedSize && selectedSize.price) {
      unitPrice += selectedSize.price;
    }
    if (selectedAddons && selectedAddons.length > 0) {
      selectedAddons.forEach(addon => {
        unitPrice += (addon.price || 0);
      });
    }

    // Create unique key based on item configurations
    const configSignature = JSON.stringify({
      dishId,
      size: selectedSize ? selectedSize.name : '',
      addons: selectedAddons.map(a => a.name).sort(),
      spice: selectedSpice || '',
      notes: specialNotes.trim()
    });

    const existingIndex = State.data.cart.items.findIndex(
      item => item.configSignature === configSignature
    );

    if (existingIndex > -1) {
      State.data.cart.items[existingIndex].quantity += quantity;
    } else {
      const cartItem = {
        cartItemId: 'ci-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        dishId,
        name,
        basePrice: price,
        unitPrice: parseFloat(unitPrice.toFixed(2)),
        image,
        restaurantId,
        restaurantName,
        selectedSize,
        selectedAddons,
        selectedSpice,
        specialNotes,
        quantity,
        configSignature
      };
      State.data.cart.items.push(cartItem);
    }

    State.saveCart();

    if (window.UIService) {
      UIService.showToast({
        title: "Added to Cart!",
        message: `${quantity}x ${name} added successfully.`,
        type: "success",
        icon: "🛒"
      });
      UIService.bumpCartBadge();
    }
  },

  updateQuantity(cartItemId, delta) {
    const itemIndex = State.data.cart.items.findIndex(i => i.cartItemId === cartItemId);
    if (itemIndex === -1) return;

    const currentItem = State.data.cart.items[itemIndex];
    const newQty = currentItem.quantity + delta;

    if (newQty <= 0) {
      this.removeItem(cartItemId);
    } else {
      currentItem.quantity = newQty;
      State.saveCart();
    }
  },

  removeItem(cartItemId) {
    const itemIndex = State.data.cart.items.findIndex(i => i.cartItemId === cartItemId);
    if (itemIndex === -1) return;

    const removedItem = State.data.cart.items[itemIndex];
    State.data.cart.items.splice(itemIndex, 1);
    State.saveCart();

    if (window.UIService) {
      UIService.showToast({
        title: "Item Removed",
        message: `${removedItem.name} removed from your cart.`,
        type: "warning",
        icon: "🗑️"
      });
    }
  },

  clearCart() {
    State.data.cart.items = [];
    State.data.cart.appliedCoupon = null;
    State.saveCart();
  },

  getTotals() {
    const items = State.data.cart.items || [];
    let subtotal = 0;
    let itemCount = 0;

    items.forEach(item => {
      subtotal += item.unitPrice * item.quantity;
      itemCount += item.quantity;
    });

    let deliveryFee = subtotal > 0 ? (subtotal >= this.FREE_DELIVERY_THRESHOLD ? 0 : 2.99) : 0;
    const platformFee = subtotal > 0 ? 0.99 : 0;
    let discount = 0;

    const coupon = State.data.cart.appliedCoupon;
    if (coupon && subtotal > 0) {
      if (coupon.type === 'percentage') {
        const rawDiscount = (subtotal * coupon.discount) / 100;
        discount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
      } else if (coupon.type === 'flat') {
        discount = Math.min(coupon.discount, subtotal);
      } else if (coupon.type === 'free_delivery') {
        discount += deliveryFee;
        deliveryFee = 0;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const taxes = discountedSubtotal > 0 ? discountedSubtotal * State.data.cart.taxRate : 0;
    const total = discountedSubtotal + deliveryFee + platformFee + taxes;

    const freeDeliveryRemaining = Math.max(0, this.FREE_DELIVERY_THRESHOLD - subtotal);
    const freeDeliveryProgress = Math.min(100, (subtotal / this.FREE_DELIVERY_THRESHOLD) * 100);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount,
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      taxes: parseFloat(taxes.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      freeDeliveryRemaining: parseFloat(freeDeliveryRemaining.toFixed(2)),
      freeDeliveryProgress: Math.round(freeDeliveryProgress)
    };
  },

  applyCoupon(code) {
    if (!code) return { success: false, message: "Please enter a coupon code." };
    
    const coupon = DataService.getCouponByCode(code);
    if (!coupon) {
      return { success: false, message: "Invalid promo code." };
    }

    const { subtotal } = this.getTotals();
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return {
        success: false,
        message: `Min. order of $${coupon.minSubtotal.toFixed(2)} required for ${coupon.code}.`
      };
    }

    State.data.cart.appliedCoupon = coupon;
    State.saveCart();

    return {
      success: true,
      message: `Coupon "${coupon.code}" applied successfully! 🎉`
    };
  },

  removeCoupon() {
    State.data.cart.appliedCoupon = null;
    State.saveCart();
  },

  updateNavbarBadge() {
    const badge = document.getElementById('navbar-cart-badge');
    const mobileBadge = document.getElementById('mobile-cart-badge');
    const { itemCount } = this.getTotals();

    if (badge) {
      badge.textContent = itemCount;
      badge.style.display = itemCount > 0 ? 'flex' : 'none';
    }
    if (mobileBadge) {
      mobileBadge.textContent = itemCount;
      mobileBadge.style.display = itemCount > 0 ? 'flex' : 'none';
    }
  },

  renderCartDrawer() {
    const container = document.getElementById('cart-drawer-items');
    const footer = document.getElementById('cart-drawer-footer');
    if (!container || !footer) return;

    const items = State.data.cart.items || [];
    const totals = this.getTotals();

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🛍️</div>
          <h4 style="font-weight: 800; margin-bottom: 0.5rem;">Your Cart is Empty</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
            Explore top restaurants and fill your craving with gourmet delights!
          </p>
          <a href="#/restaurants" class="btn btn-primary btn-sm" onclick="UIService.closeCartDrawer()">
            Browse Restaurants
          </a>
        </div>
      `;
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'block';

    // Free delivery meter
    const freeDeliveryBanner = totals.deliveryFee === 0 
      ? `<div style="background: var(--success-light); color: var(--success); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1rem;">
           <span>🎉</span> You unlocked FREE Delivery!
         </div>`
      : `<div style="background: var(--primary-light); color: var(--primary); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.78rem; font-weight: 700; margin-bottom: 1rem;">
           Add $${totals.freeDeliveryRemaining.toFixed(2)} more for <strong>FREE Delivery</strong>
           <div style="height: 4px; background: rgba(0,0,0,0.08); border-radius: 4px; margin-top: 0.4rem; overflow: hidden;">
             <div style="height: 100%; width: ${totals.freeDeliveryProgress}%; background: var(--primary);"></div>
           </div>
         </div>`;

    container.innerHTML = freeDeliveryBanner + items.map(item => `
      <div class="cart-item-card">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          ${item.selectedSize ? `<div class="cart-item-addons">Size: ${item.selectedSize.name}</div>` : ''}
          ${item.selectedAddons && item.selectedAddons.length > 0 ? `
            <div class="cart-item-addons">+ ${item.selectedAddons.map(a => a.name).join(', ')}</div>
          ` : ''}
          ${item.selectedSpice ? `<div class="cart-item-addons">Spice: ${item.selectedSpice}</div>` : ''}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.4rem;">
            <span style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
            <div class="qty-controller" style="transform: scale(0.85); transform-origin: right;">
              <button class="qty-btn" onclick="CartService.updateQuantity('${item.cartItemId}', -1)">-</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn" onclick="CartService.updateQuantity('${item.cartItemId}', 1)">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Render footer calculations
    const coupon = State.data.cart.appliedCoupon;
    footer.innerHTML = `
      <div class="coupon-input-box">
        ${coupon ? `
          <div style="flex: 1; display: flex; align-items: center; justify-content: space-between; background: var(--success-light); padding: 0.45rem 0.75rem; border-radius: var(--radius-sm); border: 1px dashed var(--success);">
            <span style="font-weight: 800; font-size: 0.8rem; color: var(--success);">🎟️ ${coupon.code} Applied</span>
            <button onclick="CartService.removeCoupon()" style="color: var(--danger); font-size: 0.8rem; font-weight: 700;">Remove</button>
          </div>
        ` : `
          <input type="text" id="cart-drawer-coupon-input" class="coupon-input" placeholder="Promo code (e.g. FEAST50)">
          <button class="btn btn-secondary btn-sm" onclick="CartService.handleApplyCouponFromDrawer()">Apply</button>
        `}
      </div>

      <div class="price-breakdown">
        <div class="price-row">
          <span>Subtotal (${totals.itemCount} items)</span>
          <span>$${totals.subtotal.toFixed(2)}</span>
        </div>
        ${totals.discount > 0 ? `
          <div class="price-row" style="color: var(--success); font-weight: 700;">
            <span>Promo Discount</span>
            <span>-$${totals.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="price-row">
          <span>Delivery Fee</span>
          <span>${totals.deliveryFee === 0 ? '<span style="color: var(--success); font-weight:700;">FREE</span>' : '$' + totals.deliveryFee.toFixed(2)}</span>
        </div>
        <div class="price-row">
          <span>Platform Fee</span>
          <span>$${totals.platformFee.toFixed(2)}</span>
        </div>
        <div class="price-row">
          <span>Estimated Taxes & GST</span>
          <span>$${totals.taxes.toFixed(2)}</span>
        </div>
        <div class="price-row total">
          <span>To Pay</span>
          <span>$${totals.total.toFixed(2)}</span>
        </div>
      </div>

      <a href="#/checkout" class="btn btn-primary btn-block" onclick="UIService.closeCartDrawer()">
        Proceed to Checkout →
      </a>
    `;
  },

  handleApplyCouponFromDrawer() {
    const input = document.getElementById('cart-drawer-coupon-input');
    if (!input) return;
    const res = this.applyCoupon(input.value);
    if (window.UIService) {
      UIService.showToast({
        title: res.success ? "Coupon Applied" : "Coupon Error",
        message: res.message,
        type: res.success ? "success" : "danger"
      });
    }
  }
};

window.CartService = CartService;
