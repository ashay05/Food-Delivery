/**
 * Search & Filter Engine for CraveDash
 * Provides debounced real-time search suggestions and multi-attribute restaurant filtering.
 */

const SearchService = {
  debounceTimer: null,

  init() {
    this.bindHeaderSearch();
    this.bindHeroSearch();
  },

  bindHeaderSearch() {
    const input = document.getElementById('header-search-input');
    const dropdown = document.getElementById('header-search-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      this.debounceTimer = setTimeout(() => {
        this.renderSuggestions(query, dropdown);
      }, 200);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = input.value.trim();
        dropdown.classList.remove('active');
        if (query) {
          State.data.filters.searchQuery = query;
          window.location.hash = `#/restaurants?search=${encodeURIComponent(query)}`;
        }
      }
    });
  },

  bindHeroSearch() {
    const input = document.getElementById('hero-search-input');
    const btn = document.getElementById('hero-search-btn');
    if (!input) return;

    const performSearch = () => {
      const query = input.value.trim();
      if (query) {
        State.data.filters.searchQuery = query;
        window.location.hash = `#/restaurants?search=${encodeURIComponent(query)}`;
      } else {
        window.location.hash = '#/restaurants';
      }
    };

    if (btn) btn.addEventListener('click', performSearch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  },

  renderSuggestions(query, container) {
    const lower = query.toLowerCase();
    const allRestaurants = DataService.getAllRestaurants();
    const allDishes = DataService.getAllDishes();

    // Match restaurants
    const matchedRestaurants = allRestaurants.filter(r => 
      r.name.toLowerCase().includes(lower) ||
      r.cuisines.some(c => c.toLowerCase().includes(lower)) ||
      r.tagline.toLowerCase().includes(lower)
    ).slice(0, 3);

    // Match dishes
    const matchedDishes = allDishes.filter(d => 
      d.name.toLowerCase().includes(lower) ||
      d.description.toLowerCase().includes(lower)
    ).slice(0, 4);

    if (matchedRestaurants.length === 0 && matchedDishes.length === 0) {
      container.innerHTML = `
        <div style="padding: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No matching restaurants or dishes found for "<strong>${query}</strong>"
        </div>
      `;
      container.classList.add('active');
      return;
    }

    let html = '';

    if (matchedRestaurants.length > 0) {
      html += `<div style="padding: 0.5rem 1rem 0.25rem; font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Restaurants</div>`;
      matchedRestaurants.forEach(rest => {
        html += `
          <div class="suggestion-item" onclick="SearchService.selectRestaurantSuggestion('${rest.id}')">
            <img src="${rest.logo || rest.heroImage}" alt="${rest.name}" class="suggestion-thumb">
            <div class="suggestion-text">
              <h5>${this.highlightMatch(rest.name, query)}</h5>
              <span>${rest.cuisines.join(' • ')} • ⭐ ${rest.rating}</span>
            </div>
          </div>
        `;
      });
    }

    if (matchedDishes.length > 0) {
      html += `<div style="padding: 0.5rem 1rem 0.25rem; font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Dishes</div>`;
      matchedDishes.forEach(dish => {
        html += `
          <div class="suggestion-item" onclick="SearchService.selectDishSuggestion('${dish.restaurantId}', '${dish.id}')">
            <img src="${dish.image}" alt="${dish.name}" class="suggestion-thumb">
            <div class="suggestion-text">
              <h5>${this.highlightMatch(dish.name, query)}</h5>
              <span>$${dish.price.toFixed(2)} in ${dish.restaurantName}</span>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
    container.classList.add('active');
  },

  highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span style="color: var(--primary); font-weight: 800;">$1</span>');
  },

  selectRestaurantSuggestion(restaurantId) {
    const dropdown = document.getElementById('header-search-dropdown');
    if (dropdown) dropdown.classList.remove('active');
    window.location.hash = `#/restaurant/${restaurantId}`;
  },

  selectDishSuggestion(restaurantId, dishId) {
    const dropdown = document.getElementById('header-search-dropdown');
    if (dropdown) dropdown.classList.remove('active');
    window.location.hash = `#/restaurant/${restaurantId}?dish=${dishId}`;
  },

  filterRestaurants(restaurants, filters) {
    let result = [...restaurants];

    // Search query filter
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.cuisines.some(c => c.toLowerCase().includes(q)) ||
        r.tagline.toLowerCase().includes(q) ||
        r.categories.some(cat => cat.items.some(item => item.name.toLowerCase().includes(q)))
      );
    }

    // Cuisine filter
    if (filters.cuisine && filters.cuisine !== 'all') {
      result = result.filter(r => 
        r.cuisines.some(c => c.toLowerCase() === filters.cuisine.toLowerCase())
      );
    }

    // Min rating filter
    if (filters.minRating > 0) {
      result = result.filter(r => r.rating >= filters.minRating);
    }

    // Delivery time filter
    if (filters.maxDeliveryTime < 60) {
      result = result.filter(r => r.deliveryTimeMin <= filters.maxDeliveryTime);
    }

    // Price range filter
    if (filters.priceRange && filters.priceRange !== 'all') {
      result = result.filter(r => r.priceRange === filters.priceRange);
    }

    // Dietary filter
    if (filters.dietary && filters.dietary !== 'all') {
      if (filters.dietary === 'veg') {
        result = result.filter(r => r.categories.some(c => c.items.some(i => i.isVeg)));
      } else if (filters.dietary === 'vegan') {
        result = result.filter(r => r.categories.some(c => c.items.some(i => i.isVegan)));
      }
    }

    // Sort order
    if (filters.sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'delivery_time') {
      result.sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin);
    } else if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => a.priceLevel - b.priceLevel);
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => b.priceLevel - a.priceLevel);
    }

    return result;
  }
};

window.SearchService = SearchService;
