// js/auth.js – FINAL VERSION with global loadAuthForms and authLoaded flag
console.log('auth.js loading...');

// YOUR SUPABASE CREDENTIALS (verify these are correct)
const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co';
const supabaseKey = 'sb_publishable__JgPVoaGArNDKXB2lF--mw_X4XsBUwH'; // <-- double-check this!

try {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client ready');
} catch (e) {
    console.error('❌ Supabase client failed:', e);
}

// ========== MODAL FUNCTIONS ==========
window.openAuthModal = function() {
    document.getElementById('authModal').style.display = 'block';
    loadAuthForms(); // calls the internal function
};

window.closeAuthModal = function() {
    document.getElementById('authModal').style.display = 'none';
};

// Make loadAuthForms globally accessible (so fallback in index.html can call it)
function loadAuthForms() {
    console.log('loadAuthForms called');
    document.getElementById('authForms').innerHTML = `
        <div class="auth-container">
            <div class="auth-tabs">
                <button class="auth-tab active" id="loginTabBtn">Login</button>
                <button class="auth-tab" id="registerTabBtn">Register</button>
            </div>
            <div id="loginForm" class="auth-form active">
                <h3>Sign In</h3>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" required placeholder="••••••••">
                </div>
                <button onclick="handleLogin()" class="btn-auth">Login</button>
                <div id="loginMsg" class="auth-message"></div>
            </div>
            <div id="registerForm" class="auth-form">
                <h3>Create Account</h3>
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="regUsername" required placeholder="Choose a username">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="regEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="regPassword" required minlength="6" placeholder="At least 6 characters">
                </div>
                <button onclick="handleSignup()" class="btn-auth">Sign Up</button>
                <div id="regMsg" class="auth-message"></div>
            </div>
        </div>
    `;
    
    document.getElementById('loginTabBtn').addEventListener('click', () => switchTab('login'));
    document.getElementById('registerTabBtn').addEventListener('click', () => switchTab('register'));
}

// Attach to window for fallback access
window.loadAuthForms = loadAuthForms;

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

// ========== AUTH HANDLERS ==========
window.handleSignup = async function() {
    const msg = document.getElementById('regMsg');
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const username = document.getElementById('regUsername').value;
    
    if (!window.supabase) {
        msg.textContent = 'Database connection error';
        msg.className = 'auth-message error';
        msg.style.display = 'block';
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signUp({
            email, password,
            options: { data: { username } }
        });
        if (error) throw error;
        
        // Create profile
        await window.supabase.from('profiles').insert([{
            id: data.user.id,
            username,
            subscription_type: 'none',
            subscription_expires_at: null
        }]);
        
        msg.textContent = '✅ Account created! You can now log in.';
        msg.className = 'auth-message success';
        msg.style.display = 'block';
        
        setTimeout(() => {
            switchTab('login');
            document.getElementById('loginEmail').value = email;
        }, 2000);
    } catch (err) {
        msg.textContent = 'Error: ' + err.message;
        msg.className = 'auth-message error';
        msg.style.display = 'block';
    }
};

window.handleLogin = async function() {
    const msg = document.getElementById('loginMsg');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!window.supabase) {
        msg.textContent = 'Database connection error';
        msg.className = 'auth-message error';
        msg.style.display = 'block';
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        msg.textContent = '✅ Login successful! Redirecting...';
        msg.className = 'auth-message success';
        msg.style.display = 'block';
        
        // After login, immediately fetch and cache user profile
        setTimeout(async () => {
            const { data: profile } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            if (profile) setUserProfile(profile);
            
            closeAuthModal();
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (err) {
        msg.textContent = 'Error: ' + err.message;
        msg.className = 'auth-message error';
        msg.style.display = 'block';
    }
};

window.handleLogout = async function() {
    if (window.supabase) await window.supabase.auth.signOut();
    clearAllCaches();
    window.location.href = 'index.html';
};

// ========== UI UPDATE ==========
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

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.close')?.addEventListener('click', closeAuthModal);
    window.addEventListener('click', e => {
        if (e.target.id === 'authModal') closeAuthModal();
    });
    
    updateAuthUI();
    
    if (window.supabase) {
        window.supabase.auth.onAuthStateChange(() => updateAuthUI());
    }
});

// Signal that auth.js is fully loaded
window.authLoaded = true;
console.log('auth.js fully loaded');
