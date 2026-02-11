// js/auth.js - Complete & Corrected Version
console.log('auth.js loading...');

// 1. SUPABASE CLIENT SETUP
const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co';
const supabaseKey = 'sb_publishable__JgPVoaGArNDKXB2lF--mw_X4XsBUwH'; // Your key

console.log('Using Supabase URL:', supabaseUrl);
console.log('Key first 10 chars:', supabaseKey.substring(0, 10) + '...');

// Create and attach to window
try {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created. Testing auth...');
    
    if (window.supabase.auth) {
        console.log('✅ Supabase.auth module is available');
    } else {
        console.error('❌ Supabase.auth is NOT available!');
    }
} catch (e) {
    console.error('❌ Failed to create Supabase client:', e);
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
    console.log('Loading forms into modal');
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
    
    // Attach tab switching event listeners
    document.getElementById('loginTabBtn').addEventListener('click', () => switchTab('login'));
    document.getElementById('registerTabBtn').addEventListener('click', () => switchTab('register'));
}

// 3. TAB SWITCHING
window.switchTab = function(tab) {
    console.log('Switching to tab:', tab);
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

// 4. AUTH FUNCTIONS
window.handleSignup = async function() {
    console.log('=== START SIGNUP PROCESS ===');
    const msgEl = document.getElementById('regMsg');
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const username = document.getElementById('regUsername').value;
    
    console.log('Form data:', { email, username });
    
    if (!window.supabase) {
        showAuthMessage(msgEl, 'Database not ready. Please refresh.', 'error');
        return;
    }
    
    if (!email || !password || !username) {
        showAuthMessage(msgEl, 'Please fill all fields', 'error');
        return;
    }
    
    try {
        // Create auth user
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });
        
        if (authError) {
            showAuthMessage(msgEl, `Error: ${authError.message}`, 'error');
            return;
        }
        
        console.log('✅ Auth user created:', authData.user.id, email);
        
        // Create profile
        const { error: profileError } = await window.supabase
            .from('profiles')
            .insert([{ 
                id: authData.user.id, 
                username, 
                subscription_type: 'none',
                subscription_expires_at: null 
            }]);
        
        if (profileError && profileError.code !== '23505') {
            console.error('Profile creation error:', profileError);
        }
        
        // AUTO-LOGIN: Try to log the user in immediately
        console.log('Attempting auto-login...');
        const { data: loginData, error: loginError } = await window.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (loginError) {
            showAuthMessage(msgEl, 'Account created! Please log in manually.', 'success');
            // Switch to login tab after 2 seconds
            setTimeout(() => {
                switchTab('login');
                document.getElementById('loginEmail').value = email;
            }, 2000);
        } else {
            // SUCCESS: User is now logged in!
            showAuthMessage(msgEl, '🎉 Account created successfully! Redirecting...', 'success');
            
            // Clear form
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regUsername').value = '';
            
            // Close modal and redirect after 1.5 seconds
            setTimeout(() => {
                closeAuthModal();
                updateAuthUI();
                // Try to redirect to dashboard
                try {
                    window.location.href = 'dashboard.html';
                } catch (e) {
                    console.log('Dashboard page not ready yet');
                }
            }, 1500);
        }
        
    } catch (unexpectedError) {
        console.error('Unexpected error:', unexpectedError);
        showAuthMessage(msgEl, `Error: ${unexpectedError.message}`, 'error');
    }
};

window.handleLogin = async function() {
    console.log('=== START LOGIN PROCESS ===');
    const msgEl = document.getElementById('loginMsg');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login attempt for:', email);
    
    if (!window.supabase) {
        showAuthMessage(msgEl, 'Database not ready', 'error');
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        console.log('Login response:', { data, error });
        
        if (error) {
            console.error('❌ Login error:', error);
            showAuthMessage(msgEl, `Error: ${error.message}`, 'error');
        } else {
            console.log('✅ Login successful for user:', data.user.id);
            showAuthMessage(msgEl, '✅ Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                closeAuthModal();
                updateAuthUI();
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (unexpectedError) {
        console.error('❌ Unexpected login error:', unexpectedError);
        showAuthMessage(msgEl, `Unexpected Error: ${unexpectedError.message}`, 'error');
    }
};

window.handleLogout = async function() {
    console.log('Logging out...');
    if (window.supabase && window.supabase.auth) {
        await window.supabase.auth.signOut();
    }
    updateAuthUI();
    window.location.href = 'index.html';
};

// 5. HELPER FUNCTIONS
function showAuthMessage(element, message, type) {
    if (!element) {
        console.error('Message element not found');
        return;
    }
    
    element.textContent = message;
    element.className = 'auth-message ' + type;
    element.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function updateAuthUI() {
    if (!window.supabase) {
        console.warn('Supabase not available for updateAuthUI');
        return;
    }
    
    window.supabase.auth.getUser().then(({ data }) => {
        const user = data?.user;
        const authButtons = document.querySelector('.nav-links');
        
        if (!authButtons) return;
        
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
    }).catch(error => {
        console.error('Error checking auth state:', error);
    });
}

// 6. INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('auth.js initialized');
    
    // Setup modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAuthModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.id === 'authModal') {
            closeAuthModal();
        }
    });
    
    // Initial UI update
    updateAuthUI();
    
    // Listen for auth state changes
    if (window.supabase) {
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            updateAuthUI();
        });
    }
});
