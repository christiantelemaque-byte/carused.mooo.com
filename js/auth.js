// js/auth.js - CLEAN VERSION
console.log('✅ auth.js loading...');

// 1. SUPABASE SETUP - DO THIS ONLY ONCE
const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co';
const supabaseAnonKey = 'sb_publishable__JgPVoaGArNDKXB2lF--mw_X4XsBUwH'; // ← PASTE YOUR REAL KEY HERE

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

// Create the Supabase client and make it globally available
try {
    const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
    window.supabase = supabase; // This is the critical line for app.js
    console.log('✅ Supabase client created and attached to window');
    console.log('supabase.auth exists:', !!supabase.auth);
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
}

// 2. AUTH MODAL FUNCTIONS
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
                <button class="auth-tab active" id="loginTabBtn">Login</button>
                <button class="auth-tab" id="registerTabBtn">Register</button>
            </div>
            
            <div id="loginForm" class="auth-form active">
                <h3>Sign In</h3>
                <form id="loginFormElement">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="loginEmail" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="loginPassword" required placeholder="••••••••">
                    </div>
                    <button type="button" id="loginSubmitBtn" class="btn-auth">Login</button>
                </form>
                <div id="loginMessage" class="auth-message"></div>
            </div>
            
            <div id="registerForm" class="auth-form">
                <h3>Create Account</h3>
                <form id="registerFormElement">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="registerUsername" required placeholder="Choose a username">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="registerEmail" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="registerPassword" required minlength="6" placeholder="At least 6 characters">
                    </div>
                    <button type="button" id="registerSubmitBtn" class="btn-auth">Sign Up</button>
                </form>
                <div id="registerMessage" class="auth-message"></div>
            </div>
        </div>
    `;
    
    // Attach event listeners to the new buttons
    document.getElementById('loginTabBtn').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('registerTabBtn').addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('loginSubmitBtn').addEventListener('click', handleLogin);
    document.getElementById('registerSubmitBtn').addEventListener('click', handleSignup);
}

function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tabName === 'login') {
        document.getElementById('loginTabBtn').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerTabBtn').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// 3. AUTH HANDLERS
async function handleSignup() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerUsername').value;
    const messageDiv = document.getElementById('registerMessage');
    
    if (!window.supabase) {
        showAuthMessage(messageDiv, 'Database not ready. Please refresh.', 'error');
        return;
    }
    
    try {
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email,
            password,
            options: { data: { username: username } }
        });
        
        if (authError) throw authError;
        
        showAuthMessage(messageDiv, 'Registration successful! You can now log in.', 'success');
        setTimeout(() => switchAuthTab('login'), 1500);
        
    } catch (error) {
        showAuthMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');
    
    if (!window.supabase) {
        showAuthMessage(messageDiv, 'Database not ready. Please refresh.', 'error');
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        showAuthMessage(messageDiv, 'Login successful! Redirecting...', 'success');
        setTimeout(() => {
            closeAuthModal();
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showAuthMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
}

// 4. HELPER FUNCTIONS
function showAuthMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = 'auth-message ' + type;
    element.style.display = 'block';
}

// 5. INITIALIZE
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ auth.js DOM ready');
    
    // Setup modal close
    document.querySelector('.close')?.addEventListener('click', closeAuthModal);
    window.addEventListener('click', (event) => {
        if (event.target.id === 'authModal') closeAuthModal();
    });
});
