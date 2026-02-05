// Authentication and User Management
const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co';
const supabaseKey = 'process.env.SUPABASE_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);








// ====================
// AUTH MODAL FUNCTIONS
// ====================
function openAuthModal() {
    loadAuthForms();
    document.getElementById('authModal').style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function loadAuthForms() {
    document.getElementById('authForms').innerHTML = `
        <div class="auth-container">
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="switchAuthTab('login')">Login</button>
                <button class="auth-tab" onclick="switchAuthTab('register')">Register</button>
            </div>
            <div id="loginForm" class="auth-form active">
                <h3>Sign In</h3>
                <form id="loginFormElement" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit" class="btn-auth">Login</button>
                </form>
                <div id="authMessage" class="auth-message"></div>
            </div>
            <div id="registerForm" class="auth-form">
                <h3>Create Account</h3>
                <form id="registerFormElement" onsubmit="handleSignup(event)">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="registerUsername" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="registerPassword" required minlength="6">
                    </div>
                    <button type="submit" class="btn-auth">Sign Up</button>
                </form>
                <div id="authMessage" class="auth-message"></div>
            </div>
        </div>
    `;
}

function switchAuthTab(tabName) {
    // Switch tabs in the modal
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Form').classList.add('active');
}

// ====================
// AUTH HANDLERS
// ====================
async function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerUsername').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username: username }
        }
    });

    if (error) {
        showAuthMessage('Error: ' + error.message, 'error');
    } else {
        showAuthMessage('Registration successful! Please check your email to confirm.', 'success');
        // Create a profile entry
        await createUserProfile(data.user.id, username);
        setTimeout(() => {
            closeAuthModal();
            updateAuthUI();
        }, 2000);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showAuthMessage('Error: ' + error.message, 'error');
    } else {
        showAuthMessage('Login successful!', 'success');
        setTimeout(() => {
            closeAuthModal();
            updateAuthUI();
            // Redirect to dashboard or refresh listings
            window.location.href = 'dashboard.html';
        }, 1000);
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    updateAuthUI();
    window.location.href = 'index.html';
}

// ====================
// PROFILE MANAGEMENT
// ====================
async function createUserProfile(userId, username) {
    // Insert a new row into the 'profiles' table
    const { error } = await supabase
        .from('profiles')
        .insert([
            { 
                id: userId, 
                username: username,
                subscription_type: 'none', // Default subscription
                subscription_expires_at: null
            }
        ]);

    if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error creating profile:', error);
    }
}

// ====================
// UI UPDATES
// ====================
function updateAuthUI() {
    supabase.auth.getUser().then(({ data }) => {
        const user = data.user;
        const authButtons = document.querySelector('.nav-links');
        
        if (user) {
            // User is logged in
            authButtons.innerHTML = `
                <a href="#home">Home</a>
                <a href="#vip">VIP Escorts</a>
                <a href="#regular">Regular Listings</a>
                <a href="dashboard.html" class="btn-login">Dashboard</a>
                <button onclick="handleLogout()" class="btn-primary">Logout</button>
            `;
        } else {
            // User is logged out
            authButtons.innerHTML = `
                <a href="#home">Home</a>
                <a href="#vip">VIP Escorts</a>
                <a href="#regular">Regular Listings</a>
                <a href="#how-it-works">How It Works</a>
                <button onclick="openAuthModal()" class="btn-login">Login</button>
                <button onclick="openAuthModal()" class="btn-primary">Become a Companion</button>
            `;
        }
    });
}

function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('authMessage');
    messageDiv.textContent = message;
    messageDiv.className = 'auth-message ' + type;
    messageDiv.style.display = 'block';
}

// ====================
// INITIALIZE
// ====================
document.addEventListener('DOMContentLoaded', function() {
    // Set up modal close button
    document.querySelector('.close').addEventListener('click', closeAuthModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('authModal');
        if (event.target === modal) {
            closeAuthModal();
        }
    });
    
    // Update UI based on auth state
    updateAuthUI();
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        updateAuthUI();
    });
});









class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('luxeUsers')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        this.updateAuthUI();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    register() {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validation
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (this.users.find(u => u.email === email)) {
            this.showError('Email already registered');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            subscription: 'none',
            subscriptionExpiry: null,
            posts: [],
            createdAt: new Date().toISOString(),
            role: 'companion'
        };

        this.users.push(newUser);
        this.saveUsers();
        
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.showSuccess('Registration successful!');
        this.updateAuthUI();
        this.closeModal();
        
        // Redirect to subscription page
        setTimeout(() => {
            window.location.href = 'subscription.html';
        }, 1500);
    }

    login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const hashedPassword = this.hashPassword(password);

        const user = this.users.find(u => u.email === email && u.password === hashedPassword);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.showSuccess('Login successful!');
            this.updateAuthUI();
            this.closeModal();
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            this.showError('Invalid email or password');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateAuthUI();
        window.location.href = 'index.html';
    }

    hashPassword(password) {
        // Simple hash for demo - in production use proper hashing like bcrypt
        return btoa(password);
    }

    updateSubscription(subscriptionType) {
        if (!this.currentUser) return false;
        
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) return false;
        
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        
        this.users[userIndex].subscription = subscriptionType;
        this.users[userIndex].subscriptionExpiry = expiryDate.toISOString();
        
        this.currentUser = this.users[userIndex];
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.saveUsers();
        
        return true;
    }

    hasActiveSubscription() {
        if (!this.currentUser || this.currentUser.subscription === 'none') {
            return false;
        }
        
        const expiry = new Date(this.currentUser.subscriptionExpiry);
        return new Date() < expiry;
    }

    getSubscriptionType() {
        return this.currentUser?.subscription || 'none';
    }

    saveUsers() {
        localStorage.setItem('luxeUsers', JSON.stringify(this.users));
    }

    showError(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('authSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
    }

    closeModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        
        if (this.currentUser) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userName) userName.textContent = this.currentUser.username;
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }
}

// Initialize auth system
const auth = new AuthSystem();

// Modal functionality
const modal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const closeBtn = document.querySelector('.close');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (modal) {
            modal.style.display = 'block';
            loadAuthForms();
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

function loadAuthForms() {
    const authForms = document.getElementById('authForms');
    if (!authForms) return;
    
    authForms.innerHTML = `
        <div class="auth-container">
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="switchTab('login')">Login</button>
                <button class="auth-tab" onclick="switchTab('register')">Register</button>
            </div>
            
            <div id="loginForm" class="auth-form active">
                <form id="loginFormElement">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit" class="btn-auth">Login</button>
                </form>
                <div id="authError" class="error-message" style="display: none;"></div>
                <div id="authSuccess" class="success-message" style="display: none;"></div>
            </div>
            
            <div id="registerForm" class="auth-form">
                <form id="registerFormElement">
                    <div class="form-group">
                        <label for="regUsername">Username</label>
                        <input type="text" id="regUsername" required>
                    </div>
                    <div class="form-group">
                        <label for="regEmail">Email</label>
                        <input type="email" id="regEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="regPassword">Password</label>
                        <input type="password" id="regPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="regConfirmPassword">Confirm Password</label>
                        <input type="password" id="regConfirmPassword" required>
                    </div>
                    <button type="submit" class="btn-auth">Register</button>
                </form>
                <div id="authError" class="error-message" style="display: none;"></div>
                <div id="authSuccess" class="success-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    // Re-attach event listeners
    document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
        e.preventDefault();
        auth.login();
    });
    
    document.getElementById('registerFormElement')?.addEventListener('submit', (e) => {
        e.preventDefault();
        auth.register();
    });
}

function switchTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
          }
