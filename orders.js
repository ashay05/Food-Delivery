/**
 * Orders & Live Tracking Simulation Service for CraveDash
 * Simulates checkout processing, mock payment, order placement,
 * and realistic 4-stage real-time delivery tracking with driver movement.
 */

const OrderService = {
  trackingTimer: null,
  etaInterval: null,

  createOrder(checkoutData) {
    const { items, appliedCoupon } = State.data.cart;
    const totals = CartService.getTotals();

    const orderId = 'CRV-' + Math.floor(100000 + Math.random() * 900000);
    const estimatedMinutes = 28;
    const estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60000);

    const order = {
      orderId,
      createdAt: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(items)),
      totals: { ...totals },
      coupon: appliedCoupon ? appliedCoupon.code : null,
      address: checkoutData.address,
      paymentMethod: checkoutData.paymentMethod,
      customerName: checkoutData.name,
      customerPhone: checkoutData.phone,
      instructions: checkoutData.instructions || '',
      status: 'placed', // placed -> preparing -> on_the_way -> delivered
      statusStep: 0,
      estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
      remainingSeconds: estimatedMinutes * 60,
      rider: {
        name: "Marcus Vance",
        phone: "+1 (555) 890-4321",
        rating: 4.95,
        trips: 1840,
        vehicle: "Yamaha E-Bike (Black)",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
      }
    };

    State.data.orders.unshift(order);
    State.data.activeOrderId = order.orderId;
    State.saveOrders();
    CartService.clearCart();

    // Start simulation
    this.startTrackingSimulation(order.orderId);

    return order;
  },

  startTrackingSimulation(orderId) {
    const order = State.data.orders.find(o => o.orderId === orderId);
    if (!order) return;

    clearInterval(this.trackingTimer);

    // Timeline steps:
    // Step 0: Placed (immediately)
    // Step 1: Preparing (after 10s)
    // Step 2: On The Way (after 25s)
    // Step 3: Delivered (after 45s)

    const scheduleStep = (step, delayMs, statusName, toastTitle, toastMsg) => {
      setTimeout(() => {
        const liveOrder = State.data.orders.find(o => o.orderId === orderId);
        if (liveOrder && liveOrder.statusStep < step) {
          liveOrder.statusStep = step;
          liveOrder.status = statusName;
          State.saveOrders();
          
          if (window.UIService) {
            UIService.showToast({
              title: toastTitle,
              message: toastMsg,
              type: "info",
              icon: "🛵"
            });
            this.updateTrackingUI(liveOrder);
          }
        }
      }, delayMs);
    };

    scheduleStep(1, 10000, 'preparing', 'Kitchen Cooking 🍳', 'The chef has started preparing your order!');
    scheduleStep(2, 24000, 'on_the_way', 'Rider on the Move 🛵', 'Marcus has picked up your food and is heading your way!');
    scheduleStep(3, 44000, 'delivered', 'Order Delivered! 🎉', 'Your gourmet meal has arrived. Enjoy your feast!');
  },

  updateTrackingUI(order) {
    const trackingView = document.getElementById('view-order-tracking');
    if (!trackingView || trackingView.style.display === 'none') return;

    const progressFill = document.getElementById('tracking-progress-fill');
    const steps = [
      document.getElementById('step-placed'),
      document.getElementById('step-preparing'),
      document.getElementById('step-ontheway'),
      document.getElementById('step-delivered')
    ];

    const stepIndex = order.statusStep || 0;
    const progressPercents = [0, 33, 66, 100];

    if (progressFill) {
      progressFill.style.width = `${progressPercents[stepIndex]}%`;
    }

    steps.forEach((stepEl, idx) => {
      if (!stepEl) return;
      stepEl.classList.remove('completed', 'current');
      if (idx < stepIndex) {
        stepEl.classList.add('completed');
      } else if (idx === stepIndex) {
        stepEl.classList.add('current');
      }
    });

    // Move rider marker along map route
    const marker = document.getElementById('map-rider-marker');
    if (marker) {
      const positions = [
        { left: '15%', top: '75%' }, // restaurant
        { left: '20%', top: '70%' },
        { left: '55%', top: '40%' }, // in transit
        { left: '85%', top: '25%' }  // destination
      ];
      const pos = positions[stepIndex] || positions[0];
      marker.style.left = pos.left;
      marker.style.top = pos.top;
    }

    const statusBannerText = document.getElementById('tracking-status-headline');
    if (statusBannerText) {
      const headlines = [
        "Order Confirmed & Sent to Kitchen",
        "Your Food is Sizzling in the Kitchen",
        "Driver Marcus is En Route to You",
        "Delivered & Completed!"
      ];
      statusBannerText.textContent = headlines[stepIndex] || headlines[0];
    }
  },

  getOrderById(orderId) {
    return State.data.orders.find(o => o.orderId === orderId) || null;
  }
};

window.OrderService = OrderService;
