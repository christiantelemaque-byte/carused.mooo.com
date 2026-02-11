// auth.js - Debug Version
console.log('auth.js loading...');

// 1. SUPABASE CLIENT - CRITICAL: Use your REAL key
const supabaseUrl = 'https://mdjwpndaxksdxbjscgas.supabase.co';
// ⚠️  REPLACE THE NEXT LINE WITH YOUR ACTUAL PUBLISHABLE KEY FROM SUPABASE DASHBOARD ⚠️
const supabaseKey = 'sb_publishable__JgPVoaGArNDKXB2lF--mw_X4XsBUwH';

console.log('Using Supabase URL:', supabaseUrl);
console.log('Key first 10 chars:', supabaseKey.substring(0, 10) + '...');

// Create and attach to window
try {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created. Testing auth...');
    
    // Quick test of the auth module
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
                <button class="auth-tab active" onclick="switchTab(event, 'login')">Login</button>
                <button class="auth-tab" onclick="switchTab(event, 'register')">Register</button>
            </div>
            
            <div id="loginForm" class="auth-form active">
                <h3>Sign In</h3>
                <div class="form-group"><label>Email</label><input type="email" id="loginEmail" required></div>
                <div class="form-group"><label>Password</label><input type="password" id="loginPassword" required></div>
                <button onclick="handleLogin()" class="btn-auth">Login</button>
                <div id="loginMsg" class="auth-message"></div>
            </div>
            
            <div id="registerForm" class="auth-form">
                <h3>Create Account</h3>
                <div class="form-group"><label>Username</label><input type="text" id="regUsername" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="regEmail" required></div>
                <div class="form-group"><label>Password</label><input type="password" id="regPassword" required minlength="6"></div>
                <button onclick="handleSignup()" class="btn-auth">Sign Up</button>
                <div id="regMsg" class="auth-message"></div>
            </div>
        </div>
    `;
}

// 3. TAB SWITCHING
window.switchTab = function(event, tab) {
    event.preventDefault();
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
};

// 4. AUTH FUNCTIONS - DEBUG VERSION
window.handleSignup = async function() {
    console.log('=== START SIGNUP PROCESS ===');
    const msgEl = document.getElementById('regMsg');
    
    // Get form values
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const username = document.getElementById('regUsername').value;
    
    console.log('Form data:', { email, password: '***', username });
    
    // 1. Check Supabase client
    if (!window.supabase || !window.supabase.auth) {
        const error = 'Supabase client not ready. Please refresh.';
        console.error('❌', error);
        msgEl.textContent = error;
        msgEl.className = 'auth-message error';
        return;
    }
    
    // 2. Validate input
    if (!email || !password || !username) {
        const error = 'Please fill all fields';
        console.warn('Validation failed:', error);
        msgEl.textContent = error;
        msgEl.className = 'auth-message error';
        return;
    }
    
    // 3. Attempt to create auth user
    console.log('Attempting Supabase.auth.signUp()...');
    try {
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });
        
        console.log('Supabase.auth.signUp() response:', { authData, authError });
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            msgEl.textContent = `Auth Error: ${authError.message}`;
            msgEl.className = 'auth-message error';
            return;
        }
        
        if (!authData.user) {
            console.error('❌ No user object in response');
            msgEl.textContent = 'Registration failed: No user created';
            msgEl.className = 'auth-message error';
            return;
        }
        
        console.log('✅ Auth user created:', authData.user.id, authData.user.email);
        
        // 4. Create profile in the database
        console.log('Attempting to create profile in "profiles" table...');
        const { error: profileError } = await window.supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    username: username,
                    subscription_type: 'none',
                    subscription_expires_at: null,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            
            // Check if it's a duplicate key (profile already exists via trigger)
            if (profileError.code === '23505') {
                console.log('Note: Profile may have been auto-created by trigger');
            } else {
                msgEl.textContent = `Profile Error: ${profileError.message}`;
                msgEl.className = 'auth-message error';
                return;
            }
        } else {
            console.log('✅ Profile created successfully');
        }
        
        // 5. SUCCESS
        console.log('=== SIGNUP SUCCESSFUL ===');
        msgEl.textContent = `Success! Account created for ${email}. Please check your email to confirm.`;
        msgEl.className = 'auth-message success';
        
        // Clear form and switch to login after 3 seconds
        setTimeout(() => {
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regUsername').value = '';
            switchTab({ preventDefault: () => {}, target: document.querySelector('[onclick*="login"]') }, 'login');
            document.getElementById('loginEmail').value = email;
        }, 3000);
        
    } catch (unexpectedError) {
        console.error('❌ Unexpected error in handleSignup:', unexpectedError);
        msgEl.textContent = `Unexpected Error: ${unexpectedError.message}`;
        msgEl.className = 'auth-message error';
    }
};

window.handleLogin = async function() {
    console.log('=== START LOGIN PROCESS ===');
    const msgEl = document.getElementById('loginMsg');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login attempt for:', email);
    
    if (!window.supabase || !window.supabase.auth) {
        msgEl.textContent = 'Supabase client not ready';
        msgEl.className = 'auth-message error';
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
            msgEl.textContent = `Error: ${error.message}`;
            msgEl.className = 'auth-message error';
        } else {
            console.log('✅ Login successful for user:', data.user.id);
            msgEl.textContent = 'Success! Redirecting...';
            msgEl.className = 'auth-message success';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (unexpectedError) {
        console.error('❌ Unexpected login error:', unexpectedError);
        msgEl.textContent = `Unexpected Error: ${unexpectedError.message}`;
        msgEl.className = 'auth-message error';
    }
};

// 5. INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('auth.js DOM ready');
    
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
});
