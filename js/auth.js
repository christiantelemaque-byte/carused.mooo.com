// Authentication and User Management
//const supabase = supabase.createClient(supabaseUrl, supabaseKey);





    const supabaseKey = 'process.env.SUPABASE_KEY';
    
  // js/auth.js - Corrected version
console.log('✅ auth.js loading...');

// Your Supabase credentials - MAKE SURE TO REPLACE THESE!
    const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co'; // REPLACE WITH YOUR URL
    const supabaseKey = 'sb_publishable__JgPVoaGArNDKXB2lF--mw_X4XsBUwH';

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'MISSING');
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'MISSING');

// Create Supabase client - SIMPLIFIED APPROACH
let supabase;
try {
    if (supabaseUrl && supabaseAnonKey && 
        supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && 
        supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
        
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        window.supabase = supabase; // Make it globally available
        console.log('✅ Supabase client created successfully');
        console.log('Supabase object:', supabase);
        console.log('Supabase.auth available:', supabase?.auth ? 'Yes' : 'No');
    } else {
        console.error('❌ ERROR: Please replace YOUR_SUPABASE_URL_HERE and YOUR_SUPABASE_ANON_KEY_HERE with your actual credentials!');
    }
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
}

// ====================
// AUTH MODAL FUNCTIONS
// ====================
function openAuthModal() {
    console.log('Opening auth modal...');
    loadAuthForms();
    document.getElementById('authModal').style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function loadAuthForms() {
    console.log('Loading auth forms...');
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
    
    // Attach event listeners to the new elements
    setupAuthEventListeners();
}

function setupAuthEventListeners() {
    // Tab switching
    document.getElementById('loginTabBtn').addEventListener('click', () => {
        switchAuthTab('login');
    });
    
    document.getElementById('registerTabBtn').addEventListener('click', () => {
        switchAuthTab('register');
    });
    
    // Form submission
    document.getElementById('loginSubmitBtn').addEventListener('click', handleLogin);
    document.getElementById('registerSubmitBtn').addEventListener('click', handleSignup);
    
    // Allow form submission with Enter key
    document.getElementById('loginFormElement').addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
    
    document.getElementById('registerFormElement').addEventListener('submit', (e) => {
        e.preventDefault();
        handleSignup();
    });
}

function switchAuthTab(tabName) {
    // Switch tabs
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

// ====================
// AUTH HANDLERS
// ====================
async function handleSignup() {
    console.log('handleSignup called');
    console.log('Supabase available:', supabase ? 'Yes' : 'No');
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerUsername').value;
    
    const messageDiv = document.getElementById('registerMessage');
    
    if (!email || !password || !username) {
        showAuthMessage(messageDiv, 'Please fill in all fields', 'error');
        return;
    }
    
    // Check if Supabase client exists
    if (!supabase) {
        showAuthMessage(messageDiv, 'Database connection error. Please check your Supabase credentials in auth.js file.', 'error');
        console.error('Supabase client is undefined. Check credentials at top of auth.js');
        return;
    }
    
    // Check if auth module is available
    if (!supabase.auth) {
        showAuthMessage(messageDiv, 'Authentication module not available. Check Supabase client creation.', 'error');
        console.error('supabase.auth is undefined. Full supabase object:', supabase);
        return;
    }
    
    try {
        console.log('Attempting to sign up user:', email);
        
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username: username }
            }
        });
        
        if (authError) {
            console.error('SignUp auth error:', authError);
            showAuthMessage(messageDiv, 'Error: ' + authError.message, 'error');
            return;
        }
        
        console.log('Auth user created:', authData);
        
        // 2. Create profile in profiles table
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { 
                        id: authData.user.id, 
                        username: username,
                        subscription_type: 'none',
                        subscription_expires_at: null
                    }
                ]);
            
            if (profileError) {
                console.warn('Profile creation note (may be okay):', profileError.message);
                // Continue anyway - profile might be created via trigger
            }
        }
        
        showAuthMessage(messageDiv, 'Registration successful! Please check your email to confirm your account.', 'success');
        
        // Clear form
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerUsername').value = '';
        
        // Switch to login tab after successful registration
        setTimeout(() => {
            switchAuthTab('login');
            // Pre-fill the login form
            document.getElementById('loginEmail').value = email;
        }, 2000);
        
    } catch (error) {
        console.error('Signup unexpected error:', error);
        showAuthMessage(messageDiv, 'Unexpected error: ' + error.message, 'error');
    }
}

async function handleLogin() {
    console.log('handleLogin called');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const messageDiv = document.getElementById('loginMessage');
    
    if (!email || !password) {
        showAuthMessage(messageDiv, 'Please enter email and password', 'error');
        return;
    }
    
    if (!supabase || !supabase.auth) {
        showAuthMessage(messageDiv, 'Authentication service unavailable. Please refresh.', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            showAuthMessage(messageDiv, 'Error: ' + error.message, 'error');
            return;
        }
        
        showAuthMessage(messageDiv, 'Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            closeAuthModal();
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage(messageDiv, 'Unexpected error: ' + error.message, 'error');
    }
}

async function handleLogout() {
    if (supabase && supabase.auth) {
        await supabase.auth.signOut();
    }
    window.location.href = 'index.html';
}

// ====================
// UI HELPER FUNCTIONS
// ====================
function showAuthMessage(element, message, type) {
    if (!element) {
        console.error('Message element not found');
        return;
    }
    
    element.textContent = message;
    element.className = 'auth-message ' + type;
    element.style.display = 'block';
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function updateAuthUI() {
    // Check if supabase is available before trying to use it
    if (!supabase) {
        console.warn('Supabase not available for updateAuthUI');
        return;
    }
    
    supabase.auth.getUser().then(({ data }) => {
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

// ====================
// INITIALIZATION
// ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing auth.js...');
    console.log('Supabase client status:', supabase ? 'Created' : 'NOT created');
    
    // Set up modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAuthModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('authModal');
        if (event.target === modal) {
            closeAuthModal();
        }
    });
    
    // Initial UI update
    updateAuthUI();
    
    // Listen for auth state changes if supabase is available
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            updateAuthUI();
        });
    }
});
