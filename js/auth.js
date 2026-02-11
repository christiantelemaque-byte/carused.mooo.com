// auth.js - Minimal working version
console.log('auth.js loading...');

// 1. SUPABASE CLIENT - CREATE IMMEDIATELY
const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co';
const supabaseKey = 'sb_publishable__JgPVoaGArNDKXB2lF--mw_X4XsBUwH'; // Your key

// Create and attach to window immediately
try {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created on window.supabase');
} catch (e) {
    console.error('Failed to create Supabase client:', e);
}

// 2. MODAL FUNCTIONS
window.openAuthModal = function() {
    console.log('openAuthModal called');
    document.getElementById('authModal').style.display = 'block';
    loadAuthForms();
};

window.closeAuthModal = function() {
    document.getElementById('authModal').style.display = 'none';
};

function loadAuthForms() {
    document.getElementById('authForms').innerHTML = `
        <div class="auth-container">
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="switchTab('login')">Login</button>
                <button class="auth-tab" onclick="switchTab('register')">Register</button>
            </div>
            
            <div id="loginForm" class="auth-form active">
                <h3>Sign In</h3>
                <div class="form-group"><label>Email</label><input type="email" id="loginEmail"></div>
                <div class="form-group"><label>Password</label><input type="password" id="loginPassword"></div>
                <button onclick="handleLogin()" class="btn-auth">Login</button>
                <div id="loginMsg" class="auth-message"></div>
            </div>
            
            <div id="registerForm" class="auth-form">
                <h3>Create Account</h3>
                <div class="form-group"><label>Username</label><input type="text" id="regUsername"></div>
                <div class="form-group"><label>Email</label><input type="email" id="regEmail"></div>
                <div class="form-group"><label>Password</label><input type="password" id="regPassword"></div>
                <button onclick="handleSignup()" class="btn-auth">Sign Up</button>
                <div id="regMsg" class="auth-message"></div>
            </div>
        </div>
    `;
}

// 3. TAB SWITCHING
window.switchTab = function(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
};

// 4. AUTH FUNCTIONS
window.handleSignup = async function() {
    const msg = document.getElementById('regMsg');
    if (!window.supabase) { msg.textContent = 'Error: Database not connected'; return; }
    
    const { data, error } = await window.supabase.auth.signUp({
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        options: { data: { username: document.getElementById('regUsername').value } }
    });
    
    if (error) {
        msg.textContent = 'Error: ' + error.message;
    } else {
        msg.textContent = 'Success! Check your email.';
        msg.className = 'auth-message success';
    }
};

window.handleLogin = async function() {
    const msg = document.getElementById('loginMsg');
    if (!window.supabase) { msg.textContent = 'Error: Database not connected'; return; }
    
    const { data, error } = await window.supabase.auth.signInWithPassword({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    });
    
    if (error) {
        msg.textContent = 'Error: ' + error.message;
    } else {
        msg.textContent = 'Success! Redirecting...';
        msg.className = 'auth-message success';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    }
};

// 5. INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('auth.js initialized');
    // Setup modal close button
    document.querySelector('.close').addEventListener('click', closeAuthModal);
});
