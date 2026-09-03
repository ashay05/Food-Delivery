/**
 * Geolocation Service for CraveDash
 * Detects user position using HTML5 Geolocation API with simulated reverse geocoding fallback.
 */

const GeoService = {
  mockAddresses: [
    { street: "Sanjay chawk Dumra", city: "Sitamarhi", zip: "843302", state: "Bihar" },
    { street: "Main Road Dumra", city: "Sitamarhi", zip: "843302", state: "Bihar" },
    { street: "Court Campus", city: "Dumra, Sitamarhi", zip: "843302", state: "Bihar" },
    { street: "Gandhi Maidan", city: "Sitamarhi", zip: "843302", state: "Bihar" }
  ],

  async detectLocation() {
    return new Promise((resolve) => {
      if (window.UIService) {
        UIService.showToast({
          title: "Detecting Location...",
          message: "Requesting GPS coordinates from browser.",
          type: "info",
          icon: "📍"
        });
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const simulated = this.getSimulatedAddress(lat, lng);
            
            State.data.selectedAddress = simulated;
            this.updateHeaderLocationDisplay(simulated.street);
            
            if (window.UIService) {
              UIService.showToast({
                title: "Location Detected! 📍",
                message: `Set delivery to: ${simulated.street}`,
                type: "success"
              });
            }
            resolve(simulated);
          },
          (error) => {
            console.warn("Geolocation permission denied/timeout, using simulated fallback.", error);
            const fallback = this.mockAddresses[1];
            State.data.selectedAddress = fallback;
            this.updateHeaderLocationDisplay(fallback.street);
            if (window.UIService) {
              UIService.showToast({
                title: "Location Set 📍",
                message: `Delivering to: ${fallback.street}`,
                type: "info"
              });
            }
            resolve(fallback);
          },
          { timeout: 6000 }
        );
      } else {
        const fallback = this.mockAddresses[0];
        State.data.selectedAddress = fallback;
        this.updateHeaderLocationDisplay(fallback.street);
        resolve(fallback);
      }
    });
  },

  getSimulatedAddress(lat, lng) {
    const randomIndex = Math.floor(Math.random() * this.mockAddresses.length);
    const base = this.mockAddresses[randomIndex];
    return {
      ...base,
      lat: lat ? parseFloat(lat.toFixed(4)) : 40.7128,
      lng: lng ? parseFloat(lng.toFixed(4)) : -74.0060
    };
  },

  updateHeaderLocationDisplay(addressText) {
    const btnText = document.getElementById('header-location-text');
    if (btnText) {
      btnText.textContent = addressText;
    }
  }
};

window.GeoService = GeoService;
