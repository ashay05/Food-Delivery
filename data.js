/**
 * Data Service for CraveDash
 * Loads restaurants, menus, coupons, and FAQs from JSON files
 * with inline fallback to guarantee 100% offline & local file protocol compatibility.
 */

const DataService = {
  restaurants: [],
  coupons: [],
  faq: null,
  isLoaded: false,

  async init() {
    try {
      const [resRestaurants, resCoupons, resFaq] = await Promise.all([
        fetch('data/restaurants.json'),
        fetch('data/coupons.json'),
        fetch('data/faq.json')
      ]);

      if (resRestaurants.ok && resCoupons.ok && resFaq.ok) {
        this.restaurants = await resRestaurants.json();
        this.coupons = await resCoupons.json();
        this.faq = await resFaq.json();
        this.isLoaded = true;
        console.log('✅ DataService: Loaded datasets successfully from JSON files.');
        return;
      }
    } catch (err) {
      console.warn('⚠️ Fetch error (likely CORS/file protocol), loading embedded fallback dataset.', err);
    }

    // Fallback data if fetch was blocked by local file:// restriction
    this.restaurants = this.getFallbackRestaurants();
    this.coupons = this.getFallbackCoupons();
    this.faq = this.getFallbackFaq();
    this.isLoaded = true;
  },

  getAllRestaurants() {
    return this.restaurants;
  },

  getRestaurantById(id) {
    return this.restaurants.find(r => r.id === id || r.slug === id) || null;
  },

  getAllDishes() {
    const dishes = [];
    this.restaurants.forEach(rest => {
      rest.categories.forEach(cat => {
        cat.items.forEach(item => {
          dishes.push({
            ...item,
            restaurantId: rest.id,
            restaurantName: rest.name,
            categoryName: cat.name
          });
        });
      });
    });
    return dishes;
  },

  getDishById(dishId) {
    for (const rest of this.restaurants) {
      for (const cat of rest.categories) {
        const item = cat.items.find(i => i.id === dishId);
        if (item) {
          return {
            ...item,
            restaurantId: rest.id,
            restaurantName: rest.name
          };
        }
      }
    }
    return null;
  },

  getCoupons() {
    return this.coupons;
  },

  getCouponByCode(code) {
    if (!code) return null;
    return this.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase()) || null;
  },

  getFallbackRestaurants() {
    return [
      {
        "id": "rest-1",
        "name": "Artisan Flame Burger Co.",
        "slug": "artisan-flame-burger",
        "tagline": "Smashed Angus patties, brioche buns & truffle parmesan fries",
        "heroImage": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
        "logo": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=200&q=80",
        "rating": 4.8,
        "totalReviews": 1420,
        "deliveryTime": "20-30 min",
        "deliveryTimeMin": 25,
        "minOrder": 15,
        "priceRange": "$$",
        "priceLevel": 2,
        "distance": "1.8 km",
        "cuisines": ["American", "Burgers", "Fast Food"],
        "isFeatured": true,
        "isPromoted": true,
        "offer": "50% OFF up to $10",
        "address": "452 Lexington Ave, Downtown",
        "categories": [
          {
            "id": "cat-burgers",
            "name": "Signature Burgers",
            "items": [
              {
                "id": "item-101",
                "name": "Truffle Umami Smash Burger",
                "description": "Double black angus beef, black truffle aioli, aged sharp cheddar, caramelized shallots, brioche bun.",
                "price": 14.99,
                "originalPrice": 17.99,
                "image": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
                "isVeg": false,
                "isBestseller": true,
                "isSpicy": false,
                "calories": 780,
                "rating": 4.9,
                "reviewsCount": 430,
                "customizations": {
                  "sizes": [
                    { "name": "Single Patty", "price": 0 },
                    { "name": "Double Smash (Recommended)", "price": 3.50 },
                    { "name": "Triple Beast", "price": 6.00 }
                  ],
                  "addons": [
                    { "name": "Applewood Smoked Bacon", "price": 2.50 },
                    { "name": "Extra Truffle Aioli", "price": 1.50 },
                    { "name": "Jalapeño Popper", "price": 1.75 },
                    { "name": "Gluten-Free Bun", "price": 2.00 }
                  ]
                }
              },
              {
                "id": "item-102",
                "name": "Fiery Diablo Crunch Burger",
                "description": "Crispy fried chicken breast drenched in ghost pepper glaze, chipotle slaw, dill pickles, pepper jack cheese.",
                "price": 13.50,
                "originalPrice": 15.00,
                "image": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
                "isVeg": false,
                "isBestseller": true,
                "isSpicy": true,
                "calories": 720,
                "rating": 4.7,
                "reviewsCount": 310,
                "customizations": {
                  "spiceLevels": ["Mild Kick", "Medium Hot", "Ghost Fiery (Caution)"],
                  "addons": [
                    { "name": "Extra Cheese Melt", "price": 1.50 },
                    { "name": "Fried Egg", "price": 2.00 }
                  ]
                }
              }
            ]
          },
          {
            "id": "cat-sides",
            "name": "Loaded Sides & Fries",
            "items": [
              {
                "id": "item-104",
                "name": "Parmesan Truffle Fries",
                "description": "Crispy shoestring fries tossed in white truffle oil, shaved parmesan, and fresh rosemary with garlic aioli.",
                "price": 6.99,
                "image": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
                "isVeg": true,
                "isBestseller": true,
                "calories": 420,
                "rating": 4.9,
                "reviewsCount": 540
              }
            ]
          }
        ]
      },
      {
        "id": "rest-2",
        "name": "Bella Napoli Woodfired Pizza",
        "slug": "bella-napoli-pizza",
        "tagline": "Authentic Neapolitan sourdough pizzas baked in 900°F stone ovens",
        "heroImage": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
        "logo": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=200&q=80",
        "rating": 4.9,
        "totalReviews": 2150,
        "deliveryTime": "25-35 min",
        "deliveryTimeMin": 30,
        "minOrder": 18,
        "priceRange": "$$",
        "priceLevel": 2,
        "distance": "2.4 km",
        "cuisines": ["Italian", "Pizza", "Pasta"],
        "isFeatured": true,
        "isPromoted": false,
        "offer": "Free Garlic Knots over $25",
        "address": "128 Mulberry St, Little Italy",
        "categories": [
          {
            "id": "cat-pizzas",
            "name": "Woodfired Pizzas",
            "items": [
              {
                "id": "item-201",
                "name": "Margherita D.O.P.",
                "description": "San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, extra virgin olive oil.",
                "price": 16.50,
                "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80",
                "isVeg": true,
                "isBestseller": true,
                "calories": 680,
                "rating": 4.9,
                "reviewsCount": 820
              }
            ]
          }
        ]
      }
    ];
  },

  getFallbackCoupons() {
    return [
      { "code": "FEAST50", "title": "50% OFF Super Feast", "type": "percentage", "discount": 50, "maxDiscount": 15, "minSubtotal": 25 },
      { "code": "WELCOME20", "title": "20% OFF Welcome Bonus", "type": "percentage", "discount": 20, "maxDiscount": 20, "minSubtotal": 15 },
      { "code": "FREESHIP", "title": "Free Instant Delivery", "type": "free_delivery", "discount": 0, "minSubtotal": 10 },
      { "code": "TASTY10", "title": "$10 Flat Discount", "type": "flat", "discount": 10, "minSubtotal": 40 }
    ];
  },

  getFallbackFaq() {
    return {
      quickSuggestions: [
        "🍔 Recommend best burgers",
        "🍕 Woodfired pizza specials",
        "🥗 Healthy & vegan options",
        "📦 How can I track my order?",
        "🎟️ What promo coupons are active?"
      ],
      intents: [
        {
          keywords: ["burger", "burgers", "smash"],
          reply: "Craving burgers? Check out **Artisan Flame Burger Co.**! Try the Truffle Umami Smash Burger."
        },
        {
          keywords: ["pizza", "margherita", "italian"],
          reply: "For pizzas, **Bella Napoli Woodfired Pizza** is legendary!"
        }
      ],
      defaultReply: "I'm your CraveDash Foodie AI Assistant! Ask me for food recommendations or coupon codes."
    };
  }
};

window.DataService = DataService;
