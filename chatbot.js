/**
 * CraveBot - Foodie Assistant & FAQ Chatbot
 * Smart intent matcher, dish recommendations, order status helper, and coupon applicator.
 */

const ChatbotService = {
  isOpen: false,

  init() {
    this.bindEvents();
    this.renderQuickChips();
  },

  bindEvents() {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const chatWindow = document.getElementById('chatbot-window');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');

    if (toggleBtn && chatWindow) {
      toggleBtn.addEventListener('click', () => {
        this.isOpen = !this.isOpen;
        chatWindow.classList.toggle('active', this.isOpen);
        if (this.isOpen && input) input.focus();
      });
    }

    if (closeBtn && chatWindow) {
      closeBtn.addEventListener('click', () => {
        this.isOpen = false;
        chatWindow.classList.remove('active');
      });
    }

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        this.sendMessage(text, 'user');
        input.value = '';
        this.handleBotResponse(text);
      });
    }
  },

  renderQuickChips() {
    const chipsContainer = document.getElementById('chatbot-quick-chips');
    if (!chipsContainer) return;

    const faqData = DataService.faq;
    const chips = faqData ? faqData.quickSuggestions : [
      "🍔 Best burgers",
      "🍕 Pizza specials",
      "🥗 Vegan choices",
      "🎟️ Promo coupons"
    ];

    chipsContainer.innerHTML = chips.map(chip => `
      <button class="chat-chip" onclick="ChatbotService.handleChipClick('${chip.replace(/'/g, "\\'")}')">
        ${chip}
      </button>
    `).join('');
  },

  handleChipClick(text) {
    this.sendMessage(text, 'user');
    this.handleBotResponse(text);
  },

  sendMessage(text, sender = 'user') {
    const msgList = document.getElementById('chatbot-messages');
    if (!msgList) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender} animate-fade`;
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    msgList.appendChild(bubble);
    msgList.scrollTop = msgList.scrollHeight;
  },

  handleBotResponse(userQuery) {
    const msgList = document.getElementById('chatbot-messages');
    if (!msgList) return;

    // Show typing dots
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble bot animate-fade';
    typingBubble.innerHTML = `<em>Thinking... 💭</em>`;
    msgList.appendChild(typingBubble);
    msgList.scrollTop = msgList.scrollHeight;

    setTimeout(() => {
      typingBubble.remove();

      const faq = DataService.faq;
      const lower = userQuery.toLowerCase();
      let matchedIntent = null;

      if (faq && faq.intents) {
        matchedIntent = faq.intents.find(intent => 
          intent.keywords.some(kw => lower.includes(kw.toLowerCase()))
        );
      }

      if (matchedIntent) {
        let replyHtml = matchedIntent.reply;
        if (matchedIntent.action) {
          if (matchedIntent.action.type === 'navigate') {
            replyHtml += `<br><br><a href="${matchedIntent.action.route}" onclick="ChatbotService.closeChat()" class="btn btn-primary btn-sm" style="margin-top:0.4rem; display:inline-flex;">${matchedIntent.action.label} →</a>`;
          } else if (matchedIntent.action.type === 'apply_coupon') {
            replyHtml += `<br><br><button onclick="CartService.applyCoupon('${matchedIntent.action.coupon}'); UIService.showToast({title:'Applied!', message:'Coupon ${matchedIntent.action.coupon} added.', type:'success'});" class="btn btn-accent btn-sm" style="margin-top:0.4rem;">${matchedIntent.action.label}</button>`;
          }
        }
        this.sendMessage(replyHtml, 'bot');
      } else {
        const defaultReply = faq ? faq.defaultReply : "I'm here to help you find the tastiest food, track deliveries, or get active discount codes!";
        this.sendMessage(defaultReply, 'bot');
      }
    }, 450);
  },

  closeChat() {
    this.isOpen = false;
    const chatWindow = document.getElementById('chatbot-window');
    if (chatWindow) chatWindow.classList.remove('active');
  }
};

window.ChatbotService = ChatbotService;
