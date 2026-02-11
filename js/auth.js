// Authentication and User Management
//const supabase = supabase.createClient(supabaseUrl, supabaseKey);





// js/auth.js - Fixed version (no duplicate supabase declaration)
console.log('✅ auth.js loading...');

// Check if supabase is already defined to avoid redeclaration
if (typeof supabase === 'undefined') {
    // Only create supabase client if it doesn't exist
    const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co'; // REPLACE WITH YOUR URL
    const supabaseKey = 'process.env.SUPABASE_KEY';
    
    if (supabaseUrl && supabaseAnonKey && 
        supabaseUrl !== 'https://mdjwpndaxksdxbjscgas.supabase.co' && 
        supabaseAnonKey !== 'process.env.SUPABASE_KEY') {
        
        window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase client created');
    } else {
        console.error('❌ Missing Supabase credentials. Please update auth.js with your URL and Key.');
    }
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
                <button class="auth-tab active" onclick="switchAuthTab(event, 'login')">Login</button>
                <button class="auth-tab" onclick="switchAuthTab(event, 'register')">Register</button>
            </div>
            
            <div id="loginForm" class="auth-form active">
                <h3>Sign In</h3>
                <form id="loginFormElement" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="loginEmail" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="loginPassword" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn-auth">Login</button>
                </form>
                <div id="loginMessage" class="auth-message"></div>
            </div>
            
            <div id="registerForm" class="auth-form">
                <h3>Create Account</h3>
                <form id="registerFormElement" onsubmit="handleSignup(event)">
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
                    <button type="submit" class="btn-auth">Sign Up</button>
                </form>
                <div id="registerMessage" class="auth-message"></div>
            </div>
        </div>
    `;
}

function switchAuthTab(event, tabName) {
    event.preventDefault();
    
    // Switch tabs
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
    console.log('Handling signup...');
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerUsername').value;
    
    const messageDiv = document.getElementById('registerMessage');
    
    if (!email || !password || !username) {
        showAuthMessage(messageDiv, 'Please fill in all fields', 'error');
        return;
    }
    
    if (!window.supabase) {
        showAuthMessage(messageDiv, 'Database connection error. Please refresh.', 'error');
        return;
    }
    
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username: username }
            }
        });
        
        if (authError) {
            showAuthMessage(messageDiv, 'Error: ' + authError.message, 'error');
            return;
        }
        
        // 2. Create profile in profiles table
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
            console.warn('Profile creation note:', profileError.message);
            // Continue anyway - profile might be created via trigger
        }
        
        showAuthMessage(messageDiv, 'Registration successful! You can now login.', 'success');
        
        // Switch to login tab after successful registration
        setTimeout(() => {
            switchAuthTab({preventDefault: () => {}}, 'login');
            // Pre-fill the login form
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        showAuthMessage(messageDiv, 'Unexpected error: ' + error.message, 'error');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    console.log('Handling login...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const messageDiv = document.getElementById('loginMessage');
    
    if (!email || !password) {
        showAuthMessage(messageDiv, 'Please enter email and password', 'error');
        return;
    }
    
    if (!window.supabase) {
        showAuthMessage(messageDiv, 'Database connection error. Please refresh.', 'error');
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
    if (window.supabase) {
        await supabase.auth.signOut();
    }
    window.location.href = 'index.html';
}

// ====================
// UI HELPER FUNCTIONS
// ====================
function showAuthMessage(element, message, type) {
    if (!element) return;
    
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
    if (!window.supabase) return;
    
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
    console.log('✅ auth.js initialized');
    
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
    if (window.supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            updateAuthUI();
        });
    }
});
