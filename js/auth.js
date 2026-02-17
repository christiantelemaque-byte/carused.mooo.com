// js/auth.js – Defines loadAuthForms at the very top
console.log('auth.js starting');

// Define the form loader immediately so it's available globally
window.loadAuthForms = function() {
    console.log('loadAuthForms executing');
    document.getElementById('authForms').innerHTML = `
        <div class="auth-container">
            <div class="auth-tabs">
                <button class="auth-tab active" id="loginTabBtn">Login</button>
                <button class="auth-tab" id="registerTabBtn">Register</button>
            </div>
            <div id="loginForm" class="auth-form active">
                <h3>Sign In</h3>
                <div class="form-group"><label>Email</label><input type="email" id="loginEmail" required placeholder="your@email.com"></div>
                <div class="form-group"><label>Password</label><input type="password" id="loginPassword" required placeholder="••••••••"></div>
                <button onclick="handleLogin()" class="btn-auth">Login</button>
                <div id="loginMsg" class="auth-message"></div>
            </div>
            <div id="registerForm" class="auth-form">
                <h3>Create Account</h3>
                <div class="form-group"><label>Username</label><input type="text" id="regUsername" required placeholder="Choose a username"></div>
                <div class="form-group"><label>Email</label><input type="email" id="regEmail" required placeholder="your@email.com"></div>
                <div class="form-group"><label>Password</label><input type="password" id="regPassword" required minlength="6" placeholder="At least 6 characters"></div>
                <button onclick="handleSignup()" class="btn-auth">Sign Up</button>
                <div id="regMsg" class="auth-message"></div>
            </div>
        </div>
    `;
    document.getElementById('loginTabBtn').addEventListener('click', () => switchTab('login'));
    document.getElementById('registerTabBtn').addEventListener('click', () => switchTab('register'));
};

// ========== Supabase Setup ==========
const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co';
const supabaseKey = 'sb_publishable__JgPVoaGArNDKXB2lF--mw_X4XsBUwH';

try {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client ready');
} catch (e) {
    console.error('Supabase client failed:', e);
}

// ========== Modal Functions ==========
window.openAuthModal = function() {
    document.getElementById('authModal').style.display = 'block';
    window.loadAuthForms(); // use the already defined loader
};
window.closeAuthModal = function() {
    document.getElementById('authModal').style.display = 'none';
};

window.switchTab = function(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('loginTabBtn').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerTabBtn').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
};

// ========== Auth Handlers ==========
window.handleSignup = async function() { /* ... (same as before) ... */ };
window.handleLogin = async function() { /* ... (same as before) ... */ };
window.handleLogout = async function() { /* ... (same as before) ... */ };

// ========== UI Update ==========
function updateAuthUI() {
    if (!window.supabase) return;
    window.supabase.auth.getUser().then(({ data }) => {
        const user = data?.user;
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;
        if (user) {
            navLinks.innerHTML = `
                <a href="index.html">Home</a>
                <a href="#vip">VIP Escorts</a>
                <a href="#regular">Regular Listings</a>
                <a href="dashboard.html" class="btn-login">Dashboard</a>
                <a href="profile.html" class="btn-login">Profile</a>
                <button onclick="handleLogout()" class="btn-primary">Logout</button>
            `;
        } else {
            navLinks.innerHTML = `
                <a href="index.html">Home</a>
                <a href="#vip">VIP Escorts</a>
                <a href="#regular">Regular Listings</a>
                <a href="#how-it-works">How It Works</a>
                <button onclick="openAuthModal()" class="btn-login">Login</button>
                <button onclick="openAuthModal()" class="btn-primary">Become a Companion</button>
            `;
        }
    });
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.close')?.addEventListener('click', closeAuthModal);
    window.addEventListener('click', e => { if (e.target.id === 'authModal') closeAuthModal(); });
    updateAuthUI();
    if (window.supabase) window.supabase.auth.onAuthStateChange(() => updateAuthUI());
});

// Signal that auth.js is fully loaded (turns the dot green)
document.getElementById('auth-status')?.classList.add('loaded');
console.log('auth.js fully loaded');
