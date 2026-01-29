// --- AUTHENTICATION LOGIC (Dual-Mode) ---

// 1. GLOBAL CLICK LISTENER (Foolproof Button Handling)
document.addEventListener('click', (e) => {
    
    // A. Handle "Staff Access" / "Admin Login" (Sidebar)
    if (e.target.closest('#admin-login-btn')) {
        e.preventDefault();
        const signinScreen = document.getElementById('signin-screen');
        if(signinScreen) {
            signinScreen.classList.remove('hidden');
            // This adds an INLINE style which is very strong
            signinScreen.style.display = 'flex';
        }
    }

    // B. Handle "Back to Demo Mode" (Inside Modal)
    if (e.target.id === 'back-to-demo-btn') {
        e.preventDefault();
        console.log("Back to Demo Clicked - Redirecting...");
        
        const signinScreen = document.getElementById('signin-screen');
        if(signinScreen) {
            // 1. Add the hidden class
            signinScreen.classList.add('hidden');
            
            // 2. CRITICAL FIX: Clear the inline 'display: flex' style
            signinScreen.style.display = ''; 
        }

        // 3. Redirect to Dashboard
        if (typeof showDashboardView === 'function') {
            showDashboardView(); 
        }
    }

    // C. REMOVED "Sign In" Listener from here.
    // Why? Because main.js already adds a listener to 'signinButton'.
    // Removing it here fixes the "Conflicting Popup" error.
});


// --- CORE AUTH FUNCTIONS ---

auth.onAuthStateChanged(user => {
    
    // CASE A: User is Logged In & Authorized (ADMIN MODE)
    if (user && AUTHORIZED_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase()))  {
        
        isDemoMode = false; // Switch to Real Data
        
        // UI Updates for Admin
        if (signinScreen) {
            signinScreen.classList.add('hidden'); 
            signinScreen.style.display = ''; // Ensure inline style is cleared
        }
        app.classList.remove('hidden');
        
        document.getElementById('user-name').textContent = user.displayName;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-avatar').src = user.photoURL;
        
        // Hide Admin Button
        if(adminLoginButton) adminLoginButton.parentElement.classList.add('hidden');
        
        // Unhide Sign Out Button
        if(signoutButton) {
            signoutButton.classList.remove('hidden');
            signoutButton.parentElement.classList.remove('hidden');
        }
        
        // Hide Demo Badge
        if(demoBadge) demoBadge.classList.add('hidden');

        console.log("Admin Mode Active. Loading real data...");
        loadAllStudentsFromFirestore(); // Reloads from 'students'

    } else {
        // CASE B: Guest / Not Authorized (DEMO MODE)
        
        isDemoMode = true; // Switch to Demo Data
        
        // UI Updates for Demo
        if (signinScreen) {
            signinScreen.classList.add('hidden'); 
            signinScreen.style.display = ''; // Ensure inline style is cleared
        }
        app.classList.remove('hidden'); 

        // Set Generic "Guest" Profile
        document.getElementById('user-name').textContent = "Guest Recruiter";
        document.getElementById('user-email').textContent = "Demo Mode Access";
        document.getElementById('user-avatar').src = "https://placehold.co/40x40/orange/white?text=Demo";
        
        // Show Admin Button
        if(adminLoginButton) adminLoginButton.parentElement.classList.remove('hidden');
        
        // Hide Sign Out Button
        if(signoutButton) {
            signoutButton.classList.add('hidden');
            signoutButton.parentElement.classList.add('hidden');
        }
        
        // Show Demo Badge
        if(demoBadge) demoBadge.classList.remove('hidden');

        console.log("Demo Mode Active. Loading demo data...");
        loadAllStudentsFromFirestore(); // Reloads from 'demo_students'
        
        // If user logged in but wasn't authorized, sign them out quietly
        if (user) {
            auth.signOut();
        }
    }
});

function handleSignIn() {
    const btn = document.getElementById('signin-button');
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i> Signing in...';
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    auth.signInWithPopup(provider)
        .catch(error => {
            console.error("Sign-in error", error);
            // Alert user but ensure button resets
            alert(`Login Failed: ${error.message}`);
        })
        .finally(() => {
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fab fa-google mr-3"></i> Sign in with Google';
            }
            // We do NOT hide the screen here on error, so user can try again or go back
            // Only hide if successful (handled by onAuthStateChanged)
        });
}

function handleSignOut() {
    auth.signOut();
    showToast("Signed out. Switched to Demo Mode.", "info");
}