/**
 * State Management Service for CraveDash
 * Manages reactive app state, LocalStorage persistence, and subscriber events.
 */

const State = {
  data: {
    cart: {
      items: [],
      appliedCoupon: null,
      deliveryFee: 2.99,
      platformFee: 0.99,
      taxRate: 0.0825 // 8.25%
    },
    user: {
      isAuth: true,
      name: "Ashay Kumar",
      email: "kumarashay072@gmail.com",
      phone: "+91 9142105270",
      avatar: "assets/ash-logo.jpg"
    },
    savedAddresses: [
      { id: "addr-1", tag: "Home", street: "Sanjay chawk Dumra", city: "Sitamarhi, Bihar", zip: "843302", isDefault: true },
      { id: "addr-2", tag: "Office", street: "Main Market Road", city: "Dumra, Sitamarhi", zip: "843302", isDefault: false }
    ],
    selectedAddress: null,
    favorites: ["item-101", "item-201", "item-301", "item-601"],
    favoriteRestaurants: ["rest-1", "rest-2"],
    orders: [],
    activeOrderId: null,
    theme: "light",
    filters: {
      searchQuery: "",
      cuisine: "all",
      minRating: 0,
      maxDeliveryTime: 60,
      priceRange: "all",
      dietary: "all",
      sortBy: "popular"
    }
  },

  listeners: {},

  init() {
    this.loadFromStorage();
    this.data.selectedAddress = this.data.savedAddresses[0] || null;
    this.applyTheme(this.data.theme);
  },

  loadFromStorage() {
    try {
      const storedCart = localStorage.getItem('ashfoods_cart') || localStorage.getItem('cravedash_cart');
      if (storedCart) this.data.cart = JSON.parse(storedCart);

      const storedTheme = localStorage.getItem('ashfoods_theme') || localStorage.getItem('cravedash_theme');
      if (storedTheme) this.data.theme = storedTheme;

      const storedFavs = localStorage.getItem('ashfoods_favorites') || localStorage.getItem('cravedash_favorites');
      if (storedFavs) this.data.favorites = JSON.parse(storedFavs);

      const storedOrders = localStorage.getItem('ashfoods_orders') || localStorage.getItem('cravedash_orders');
      if (storedOrders) this.data.orders = JSON.parse(storedOrders);

      const storedUser = localStorage.getItem('ashfoods_user');
      if (storedUser) this.data.user = JSON.parse(storedUser);

      const storedAddresses = localStorage.getItem('ashfoods_addresses');
      if (storedAddresses) this.data.savedAddresses = JSON.parse(storedAddresses);
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
  },

  saveCart() {
    try {
      localStorage.setItem('ashfoods_cart', JSON.stringify(this.data.cart));
      this.emit('cartUpdated', this.data.cart);
    } catch (e) {
      console.error(e);
    }
  },

  saveOrders() {
    try {
      localStorage.setItem('ashfoods_orders', JSON.stringify(this.data.orders));
      this.emit('ordersUpdated', this.data.orders);
    } catch (e) {
      console.error(e);
    }
  },

  saveFavorites() {
    try {
      localStorage.setItem('ashfoods_favorites', JSON.stringify(this.data.favorites));
      this.emit('favoritesUpdated', this.data.favorites);
    } catch (e) {
      console.error(e);
    }
  },

  saveUser() {
    try {
      localStorage.setItem('ashfoods_user', JSON.stringify(this.data.user));
      this.emit('userUpdated', this.data.user);
    } catch (e) {
      console.error(e);
    }
  },

  saveAddresses() {
    try {
      localStorage.setItem('ashfoods_addresses', JSON.stringify(this.data.savedAddresses));
      this.emit('addressesUpdated', this.data.savedAddresses);
    } catch (e) {
      console.error(e);
    }
  },

  setTheme(theme) {
    this.data.theme = theme;
    localStorage.setItem('ashfoods_theme', theme);
    this.applyTheme(theme);
    this.emit('themeChanged', theme);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme() {
    const nextTheme = this.data.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  },

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }
};

window.State = State;
