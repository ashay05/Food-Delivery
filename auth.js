/**
 * Authentication & Form Validation Service for CraveDash
 * Manages user login, signup, password strength evaluation, and inline validation errors.
 */

const AuthService = {
  init() {
    this.bindAuthModal();
  },

  bindAuthModal() {
    const loginTab = document.getElementById('auth-tab-login');
    const signupTab = document.getElementById('auth-tab-signup');
    const loginForm = document.getElementById('auth-login-form');
    const signupForm = document.getElementById('auth-signup-form');

    if (loginTab && signupTab && loginForm && signupForm) {
      loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
      });

      signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
      });
    }

    // Password strength listener
    const signupPass = document.getElementById('signup-password');
    const strengthBar = document.getElementById('signup-strength-fill');
    if (signupPass && strengthBar) {
      signupPass.addEventListener('input', (e) => {
        const val = e.target.value;
        const score = this.calculatePasswordStrength(val);
        strengthBar.className = 'password-strength-fill';
        if (score > 0) {
          if (score <= 2) strengthBar.classList.add('strength-weak');
          else if (score <= 4) strengthBar.classList.add('strength-medium');
          else strengthBar.classList.add('strength-strong');
        }
      });
    }
  },

  calculatePasswordStrength(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  },

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');

    let isValid = true;

    if (!this.validateEmail(emailInput.value)) {
      emailInput.classList.add('error');
      isValid = false;
    } else {
      emailInput.classList.remove('error');
    }

    if (!passInput.value || passInput.value.length < 6) {
      passInput.classList.add('error');
      isValid = false;
    } else {
      passInput.classList.remove('error');
    }

    if (!isValid) return;

    // Mock successful login
    const userName = emailInput.value.split('@')[0];
    State.data.user = {
      isAuth: true,
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      email: emailInput.value,
      phone: "+1 (555) 234-8901",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    };
    State.saveUser();

    if (window.UIService) {
      UIService.closeModal('auth-modal');
      UIService.showToast({
        title: `Welcome back, ${State.data.user.name}! 👋`,
        message: "You are logged in.",
        type: "success"
      });
      UIService.updateUserUI();
    }
  },

  handleSignup(e) {
    e.preventDefault();
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm');

    let isValid = true;

    if (!nameInput.value.trim()) {
      nameInput.classList.add('error');
      isValid = false;
    } else {
      nameInput.classList.remove('error');
    }

    if (!this.validateEmail(emailInput.value)) {
      emailInput.classList.add('error');
      isValid = false;
    } else {
      emailInput.classList.remove('error');
    }

    if (!passInput.value || passInput.value.length < 6) {
      passInput.classList.add('error');
      isValid = false;
    } else {
      passInput.classList.remove('error');
    }

    if (passInput.value !== confirmInput.value) {
      confirmInput.classList.add('error');
      isValid = false;
    } else {
      confirmInput.classList.remove('error');
    }

    if (!isValid) return;

    State.data.user = {
      isAuth: true,
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: "+1 (555) 012-3456",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    };
    State.saveUser();

    if (window.UIService) {
      UIService.closeModal('auth-modal');
      UIService.showToast({
        title: "Account Created! 🎉",
        message: `Welcome to CraveDash, ${State.data.user.name}!`,
        type: "success"
      });
      UIService.updateUserUI();
    }
  },

  logout() {
    State.data.user = {
      isAuth: false,
      name: "Guest",
      email: "",
      phone: "",
      avatar: ""
    };
    State.saveUser();
    if (window.UIService) {
      UIService.showToast({
        title: "Signed Out",
        message: "You have signed out successfully.",
        type: "info"
      });
      UIService.updateUserUI();
    }
  }
};

window.AuthService = AuthService;
