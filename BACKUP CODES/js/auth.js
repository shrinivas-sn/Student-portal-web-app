// --- AUTHENTICATION LOGIC ---

auth.onAuthStateChanged(user => {
    // Check if user is logged in AND is authorized
    if (user && AUTHORIZED_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase()))  {
        
        // 1. FIX: Clear the forceful inline display style so 'hidden' class works
        signinScreen.style.display = ''; 
        signinScreen.classList.add('hidden');
        
        // 2. Show the App
        app.classList.remove('hidden');
        
        // 3. Update User Info
        document.getElementById('user-name').textContent = user.displayName;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-avatar').src = user.photoURL;
        
        // 4. Load Data & Ensure Dashboard is visible
        loadAllStudentsFromFirestore();
        
        // Force view to dashboard if just logging in
        if (!history.state || history.state.view !== 'student-profile') {
             showDashboardView(); 
        }
        
    } else {
        // User is logged out or unauthorized
        loadingScreen.classList.add('hidden');
        
        // Show Login Screen (Flex to center content)
        signinScreen.classList.remove('hidden');
        signinScreen.style.display = 'flex'; 
        
        app.classList.add('hidden');
        
        if (user) {
            signinError.textContent = 'This Google account is not authorized.';
            signinError.classList.remove('hidden');
            auth.signOut();
        }
    }
});

function handleSignIn() {
    signinButton.disabled = true;
    signinButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i> Signing in...';
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Force account selection prompt
    provider.setCustomParameters({ prompt: 'select_account' });

    auth.signInWithPopup(provider)
        .catch(error => {
            console.error("Sign-in error", error);
            signinError.textContent = `Error: ${error.message}`;
            signinError.classList.remove('hidden');
        })
        .finally(() => {
            signinButton.disabled = false;
            signinButton.innerHTML = '<i class="fab fa-google mr-3"></i> Sign in with Google';
        });
}

function handleSignOut() {
    auth.signOut();
    // history.pushState(null, null, ' '); // Optional: clear URL clutter
}