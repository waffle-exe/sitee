
// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCut-Qi7scoHnjHyE8UBuN53PHWnMMKqSE",
    authDomain: "sitee-f6a0c.firebaseapp.com",
    databaseURL: "https://sitee-f6a0c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sitee-f6a0c",
    storageBucket: "sitee-f6a0c.appspot.com",
    messagingSenderId: "284183052545",
    appId: "1:284183052545:web:ef85ecc7be844cede8db00",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// --- Global Constants & Plans ---
const BACKEND_URL = "https://sitee-project.onrender.com";
const RAZORPAY_KEY_ID = "rzp_live_ROEwepn6yDqGCa";
const REGION_STORAGE_KEY = 'sitee_user_region';

const plans = {
    in: { currency: "INR", symbol: "₹", creator: 250, pro: 999, creatorYearly: 2499, proYearly: 9999, rates: { credit: 2, publish: 100 } },
    us: { currency: "USD", symbol: "$", creator: 9, pro: 29, creatorYearly: 90, proYearly: 290, rates: { credit: 0.03, publish: 2 } }
};

let currentRegion = 'us'; // Default fallback
let currentBillingCycle = 'monthly';

document.addEventListener('DOMContentLoaded', () => {

    const authModal = document.getElementById('auth-modal');
    const getStartedBtn = document.getElementById('get-started-btn');
    const closeAuthModalBtn = document.getElementById('close-auth-modal');
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const verificationView = document.getElementById('verification-view');
    const forgotPasswordView = document.getElementById('forgot-password-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const forgotPasswordMessage = document.getElementById('forgot-password-message');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');
    const showForgotPasswordBtn = document.getElementById('show-forgot-password');
    const showLoginFromForgotBtn = document.getElementById('show-login-from-forgot');
    const showLoginFromVerifyBtn = document.getElementById('show-login-from-verify');
    const verificationEmailDisplay = document.getElementById('verification-email-display');
    const loginButtonContainer = document.getElementById('login-button-container');
    const dashboardButtonContainer = document.getElementById('user-dashboard-button-container');
    const userEmailDisplay = document.getElementById('user-email-display');
    const dashboardModal = document.getElementById('dashboard-modal');
    const closeDashboardModalBtn = document.getElementById('close-dashboard-modal');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutBtn = document.getElementById('logout-btn');
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmailInput = document.querySelector('#newsletterForm input[name="email"]');
    const newsletterResponseMsg = document.getElementById('responseMsg');
    const toggleComparisonButton = document.getElementById('toggle-comparison');
    const comparisonContent = document.getElementById('comparison-content');

    onAuthStateChanged(auth, (user) => {
        const isLoggedIn = user && user.emailVerified;
        loginButtonContainer.style.display = isLoggedIn ? 'none' : 'flex';
        dashboardButtonContainer.style.display = isLoggedIn ? 'flex' : 'none';
        if (isLoggedIn) {
            userEmailDisplay.textContent = user.displayName || user.email.split('@')[0];
        }
    });

    // --- All other functions (createUserInBackend, modals, auth handlers) remain the same ---
    // For brevity, they are included but minimized here.

    // --- Place this code inside your 'DOMContentLoaded' event listener ---

    // 1. DEFINE THE FUNCTIONS TO CONTROL THE MODAL
    // =================================================

    async function createUserInBackend(user) {
        // This function creates the user in your FastAPI backend after they sign up
        try {
            const token = await user.getIdToken();
            await fetch(`${BACKEND_URL}/users/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: user.email,
                    // Add username or other details if your backend needs them
                    username: user.displayName || user.email.split('@')[0]
                })
            });
        } catch (error) {
            console.error("Failed to create user in backend:", error);
            // Optional: handle this error, e.g., by showing a message to the user
        }
    }


    const openAuthModal = (e) => {
        e.preventDefault();
        authModal.style.display = 'flex';
        // Add a slight delay to allow the display property to apply before adding the class for the transition
        setTimeout(() => authModal.classList.add('active'), 10);
        showLoginView(); // Default to showing the login view first
    };

    const closeAllModals = () => {
        authModal.classList.remove('active');
        dashboardModal.classList.remove('active');
        // Wait for the transition to finish before hiding the element completely
        setTimeout(() => {
            authModal.style.display = 'none';
            dashboardModal.style.display = 'none';
        }, 300); // This duration should match your CSS transition duration
    };

    const showLoginView = () => {
        loginView.style.display = 'block';
        signupView.style.display = 'none';
        verificationView.style.display = 'none';
        forgotPasswordView.style.display = 'none';
    };

    const showSignupView = () => {
        loginView.style.display = 'none';
        signupView.style.display = 'block';
        verificationView.style.display = 'none';
        forgotPasswordView.style.display = 'none';
    };

    const showForgotPasswordView = () => {
        loginView.style.display = 'none';
        signupView.style.display = 'none';
        verificationView.style.display = 'none';
        forgotPasswordView.style.display = 'block';
    };

    const showVerificationView = (email) => {
        verificationEmailDisplay.textContent = email;
        loginView.style.display = 'none';
        signupView.style.display = 'none';
        verificationView.style.display = 'block';
        forgotPasswordView.style.display = 'none';
    };


    // 2. ATTACH THE EVENT LISTENERS TO BUTTONS
    // =================================================

    // Main button to open the modal
    if (getStartedBtn) getStartedBtn.addEventListener('click', openAuthModal);

    // This is likely your main "Login" button in the navbar
    const mainLoginBtn = document.querySelector('#login-button-container button');
    if (mainLoginBtn) mainLoginBtn.addEventListener('click', openAuthModal);


    // Button to close the modal
    // Links to switch between views inside the modal
    if (showSignupBtn) showSignupBtn.addEventListener('click', showSignupView);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginView);
    if (showForgotPasswordBtn) showForgotPasswordBtn.addEventListener('click', showForgotPasswordView);
    if (showLoginFromForgotBtn) showLoginFromForgotBtn.addEventListener('click', showLoginView);
    if (showLoginFromVerifyBtn) showLoginFromVerifyBtn.addEventListener('click', showLoginView);

    // ... inside your DOMContentLoaded event listener ...

    // Button to close the auth modal
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeAllModals);

    // ADD THIS LINE for the dashboard modal's close button
    if (closeDashboardModalBtn) closeDashboardModalBtn.addEventListener('click', closeAllModals);

    // Links to switch between views inside the modal
    if (showSignupBtn) showSignupBtn.addEventListener('click', showSignupView);
    // Signup Form
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const signupError = document.getElementById('signup-error');
            const signupButton = signupForm.querySelector('button[type="submit"]'); // NEW: Get the button

            signupError.textContent = '';
            signupButton.disabled = true; // NEW: Disable button
            signupButton.textContent = 'Signing Up...'; // NEW: Change button text

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    sendEmailVerification(user)
                        .then(() => {
                            createUserInBackend(user);
                            showVerificationView(email);
                        });
                })
                .catch((error) => {
                    signupError.textContent = error.message;
                })
                .finally(() => {
                    // NEW: This block runs after success or failure
                    signupButton.disabled = false; // Re-enable the button
                    signupButton.textContent = 'Sign Up'; // Change text back
                });
        });
    }
    // Login Form// Login Form
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const loginError = document.getElementById('login-error');
            const loginButton = loginForm.querySelector('button[type="submit"]'); // NEW: Get the button

            loginError.textContent = '';
            loginButton.disabled = true; // NEW: Disable button to prevent multiple clicks
            loginButton.textContent = 'Signing In...'; // NEW: Change button text

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    if (userCredential.user.emailVerified) {
                        closeAllModals();
                    } else {
                        loginError.textContent = 'Please verify your email before logging in.';
                        signOut(auth);
                    }
                })
                .catch((error) => {
                    loginError.textContent = error.message;
                })
                .finally(() => {
                    // NEW: This block runs after success or failure
                    loginButton.disabled = false; // Re-enable the button
                    loginButton.textContent = 'Sign In'; // Change text back
                });
        });
    }

    // Forgot Password Form
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = forgotPasswordForm.email.value;
            forgotPasswordMessage.textContent = '';
            forgotPasswordMessage.style.color = '#34D399'; // Green for success

            sendPasswordResetEmail(auth, email)
                .then(() => {
                    forgotPasswordMessage.textContent = 'Password reset link sent! Check your email.';
                })
                .catch((error) => {
                    forgotPasswordMessage.textContent = error.message;
                    forgotPasswordMessage.style.color = '#F87171'; // Red for error
                });
        });
    }
    // --- Dashboard & Logout ---
    if (dashboardButtonContainer) {
        dashboardButtonContainer.addEventListener('click', async (e) => {
            e.preventDefault();
            const user = auth.currentUser; if (!user) return;
            dashboardContent.innerHTML = `<p>Loading your details...</p>`;
            dashboardModal.style.display = 'flex'; setTimeout(() => dashboardModal.classList.add('active'), 10);
            // --- Inside your dashboardButtonContainer click handler ---
            try {
                const token = await user.getIdToken();
                const response = await fetch(`${BACKEND_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Could not fetch user data.');
                const data = await response.json();

                const expiryDate = data.subscriptionTier !== 'free' && data.plan_validity ? new Date(data.plan_validity).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
                const storageUsedMB = data.storage_used_mb || 0;
                let totalMB = 0;

                const plan = (data.subscriptionTier || 'Free').toLowerCase();
                if (plan.includes('creator')) totalMB = 500;
                else if (plan.includes('pro')) totalMB = 2 * 1024; // 2 GB

                const usedText = storageUsedMB < 1024 ? `${storageUsedMB.toFixed(2)} MB` : `${(storageUsedMB / 1024).toFixed(2)} GB`;
                const totalText = totalMB > 0 ? `${(totalMB / 1024)} GB total` : 'N/A';
                const usagePercentage = totalMB > 0 ? (storageUsedMB / totalMB) * 100 : 0;

                const storageHTML = totalMB > 0 ? `
        <div class="storage-progress-container">
            <div class="storage-progress-text"><span>${usedText} used</span><span>${totalText}</span></div>
            <div class="storage-progress-bar"><div class="storage-progress-bar-fill" style="width: ${usagePercentage}%;"></div></div>
        </div>` : 'N/A';

                // NEW: Conditional row item for Credits vs Generations depending on the plan tier
                let allowanceRow = '';
                if (plan === 'free') {
                    // Fallback or count generations from projects array length if tracked there, otherwise show total allocation limit
                    const generationsUsed = data.projects ? data.projects.length : 0;
                    const generationsLeft = Math.max(0, 2 - generationsUsed);
                    allowanceRow = `<div class="detail-item"><span class="detail-label">Generations Left:</span> <span class="detail-value">${generationsLeft} / 2</span></div>`;
                } else {
                    allowanceRow = `<div class="detail-item"><span class="detail-label">Remaining Credits:</span> <span class="detail-value">${data.credits}</span></div>`;
                }

                // Build finalized inner HTML
                dashboardContent.innerHTML = `
        <div class="detail-item"><span class="detail-label">Email:</span> <span class="detail-value" title="${user.email}">${user.email}</span></div>
        <div class="detail-item"><span class="detail-label">Current Plan:</span> <span class="detail-value" style="text-transform: capitalize;">${plan}</span></div>
        ${allowanceRow}
        <div class="detail-item"><span class="detail-label">Image Storage:</span><div class="detail-value" style="flex: 1; max-width: 60%;">${storageHTML}</div></div>
        <div class="detail-item"><span class="detail-label">Plan Validity:</span> <span class="detail-value">${expiryDate}</span></div>
    `;
            } catch (error) {
                dashboardContent.innerHTML = `<p style="color: #F87171;">Could not load plan details.</p>`;
            }
        });
    }
    if (logoutBtn) { logoutBtn.addEventListener('click', () => signOut(auth).then(closeAllModals)); }

    // --- Form Submission Handlers ---
    // ... (signupForm, loginForm, forgotPasswordForm listeners are the same) ...
    if (forgotPasswordForm) { forgotPasswordForm.addEventListener('submit', (e) => { /* ... */ }); }
    if (newsletterForm) { /* ... same as before ... */ }


    // --- Payment Logic (Updated) ---
    async function handlePayment(planId, billingCycle) {
        if (!auth.currentUser) { openAuthModal(new Event('click')); return; }
        const button = document.querySelector(`.choose-plan-btn[data-plan="${planId}"]`); if (!button) return;
        const originalText = button.textContent; button.textContent = 'Processing...'; button.disabled = true;

        const idToken = await auth.currentUser.getIdToken();
        const currency = plans[currentRegion].currency;
        let payload = { plan_id: planId, billing_cycle: billingCycle, currency: currency };

        if (planId === 'custom') {
            payload.custom_ai_credits = parseInt(document.getElementById('ai-credits-select').value);
            payload.custom_publish_credits = parseInt(document.getElementById('publish-credits-input').value);
        }

        try {
            const response = await fetch(`${BACKEND_URL}/payments/create-order`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` }, body: JSON.stringify(payload)
            });
            if (!response.ok) { const err = await response.json(); throw new Error(err.detail || 'Order creation failed.'); }
            const order = await response.json();
            const options = {
                key: RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency, name: "Sitee",
                description: `Purchase: ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`, order_id: order.id,
                handler: (res) => { verifyPayment(planId, billingCycle, res, payload); },
                prefill: { email: auth.currentUser.email }, theme: { color: "#3B82F6" }
            };
            const rzp = new Razorpay(options); rzp.open();
            rzp.on('payment.failed', (res) => Swal.fire({ title: 'Payment Failed', text: res.error.description, icon: 'error', background: '#1a1a1e', color: '#ffffff', confirmButtonColor: '#c53030' }));
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            button.textContent = originalText; button.disabled = false;
        }
    }

    async function verifyPayment(planId, billingCycle, razorpayResponse, orderPayload) {
        document.body.style.cursor = 'wait';
        let verificationPayload = { ...orderPayload, ...razorpayResponse };
        try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch(`${BACKEND_URL}/payments/verify-and-upgrade`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` }, body: JSON.stringify(verificationPayload)
            });
            if (!response.ok) { const err = await response.json(); throw new Error(err.detail || 'Update failed.'); }
            Swal.fire({ title: 'Payment Successful!', text: 'Your purchase is complete.', icon: 'success', background: '#1a1a1e', color: '#ffffff', confirmButtonColor: '#3B82F6' })
                .then(() => window.location.reload());
        } catch (err) {
            Swal.fire({ title: 'Verification Error', text: err.message, icon: 'error', background: '#1a1a1e', color: '#ffffff', confirmButtonColor: '#c53030' });
        } finally { document.body.style.cursor = 'default'; }
    }

    function updateCustomPrice() {
        const planData = plans[currentRegion]; if (!planData) return;
        const aiCreditsSelect = document.getElementById('ai-credits-select');
        const publishCreditsInput = document.getElementById('publish-credits-input');
        const priceEl = document.getElementById('custom-plan-price');
        const buyButton = document.querySelector('.plan-card.custom .choose-plan-btn');
        if (!aiCreditsSelect || !publishCreditsInput || !priceEl || !buyButton) return;

        const aiCredits = parseInt(aiCreditsSelect.value);
        const publishCredits = parseInt(publishCreditsInput.value) || 0; // Default to 0 if empty

        const aiCost = aiCredits * planData.rates.credit;
        const publishCost = publishCredits * planData.rates.publish;
        const totalCost = aiCost + publishCost;

        priceEl.innerHTML = `${planData.symbol}${totalCost.toFixed(2)}`;
        buyButton.disabled = totalCost <= 0;
        buyButton.textContent = totalCost <= 0 ? 'Select Credits' : 'Add On';
    }

    function buildPricingUI(planData, billingCycle) {
        const container = document.getElementById('pricing-container'); const loader = document.getElementById('pricing-loader');
        if (!container || !loader || !planData) return;

        const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
        const billingPeriod = billingCycle === 'yearly' ? '/ year' : '/ month';

        const creatorPriceDisplay = billingCycle === 'yearly' ? planData.symbol + planData.creatorYearly : planData.symbol + planData.creator;
        const creatorSavings = (planData.creator * 12) - planData.creatorYearly;
        const creatorSavingsLine = billingCycle === 'yearly' ? `<li style="color: #fff; background: rgba(129, 199, 132, 0.2); padding: 5px 10px; border-radius: 5px; margin-bottom: 10px;"><b>Save ${planData.symbol}${creatorSavings} (2 months free)</b></li>` : '';

        const proPriceDisplay = billingCycle === 'yearly' ? planData.symbol + planData.proYearly : planData.symbol + planData.pro;
        const proSavings = (planData.pro * 12) - planData.proYearly;
        const proSavingsLine = billingCycle === 'yearly' ? `<li style="color: #fff; background: rgba(144, 202, 249, 0.2); padding: 5px 10px; border-radius: 5px; margin-bottom: 10px;"><b>Save ${planData.symbol}${proSavings} (2 months free)</b></li>` : '';
        // ... existing variables setup ...
        container.innerHTML = `
    <article class="plan-card free">
        <h2 class="plan-title">Free</h2>
        <div class="plan-price">${planData.symbol}0</div><br>
        <p class="description">Perfect for getting started and exploring the platform.</p>
        <ul class="plan-features">
            <li>${checkIcon} 2 Generations</li>
            <li>${checkIcon} Live Publish (Only 1 Website)</li>
            <li>${checkIcon} Visual Editor</li>
            <li>${checkIcon} Live Code Editor</li>
            <li>${checkIcon} Get Full Source Code</li>
            <li>${checkIcon} Backend Integration</li>
            <li>${checkIcon} No Sitee Branding</li>
            
            
        </ul>
        <button class="choose-plan-btn" disabled>Your Current Plan</button>
    </article>

    <article class="plan-card creator">
        <div class="popular-badge">Most Popular</div>
        <h2 class="plan-title">Creator</h2>
        <div class="plan-price">${creatorPriceDisplay}<span>${billingPeriod}</span></div>
        <p class="description">For non-coders and business owners who need a live website.</p>
        <ul class="plan-features">
            ${creatorSavingsLine}
            <li>${checkIcon} 300 AI Credits per month</li>
            <li>${checkIcon} Visual Editor</li>
            <li>${checkIcon} Live Code Editor</li>
            <li>${checkIcon} Get Full Source Code</li>
            <li>${checkIcon} Publish up to 7 Websites</li>
            <li>${checkIcon} 500 MB Storage</li>
            <li>${checkIcon} Backend Integration</li>
            <li>${checkIcon} AI Refine</li>
            <li>${checkIcon} No Sitee Branding</li>
            
        </ul>
        <button class="choose-plan-btn" data-plan="creator">Choose Creator</button>
    </article>

    <article class="plan-card pro">
        <div class="popular-badge" style="background-color:#ffaa00">Coders Love</div>
        <h2 class="plan-title">Pro</h2>
        <div class="plan-price">${proPriceDisplay}<span>${billingPeriod}</span></div>
        <p class="description">For developers and agencies who need full control.</p>
        <ul class="plan-features">
            ${proSavingsLine}
            <li>${checkIcon} Priority Access to Sitee Model</li>
            <li>${checkIcon} 1,200 AI Credits per month</li>
            <li>${checkIcon} Visual Editor</li>
            <li>${checkIcon} Live Code Editor</li>
            <li>${checkIcon} Get Full Source Code</li>
            <li>${checkIcon} Github Deployment</li>
            <li>${checkIcon} Publish Unlimited Websites</li> 
            <li>${checkIcon} 1 GB Storage</li>
            <li>${checkIcon} Backend Integration</li>
            <li>${checkIcon} AI Refine</li>
            <li>${checkIcon} No Sitee Branding</li>
        </ul>
        <button class="choose-plan-btn" data-plan="pro">Choose Pro</button>
    </article>
    
    <article class="plan-card custom">
        <h2 class="plan-title">Custom</h2>
        <div class="plan-price" id="custom-plan-price">${planData.symbol}0.00</div><br>
        <p class="description">Buy Credits and Publish as needed add on to existing plan.</p>
        <ul class="plan-features">
            <li>${checkIcon} Buy Credits as needed</li>
            <li>
                <div class="control-group">
                    <label for="ai-credits-select">AI Credits</label>
                    <select id="ai-credits-select" class="custom-select">
                        <option value="0">0</option><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="300">300</option><option value="500">500</option><option value="700">700</option><option value="1000">1000</option>
                    </select>
                </div>
            </li> 
            <li>
                <div class="control-group">
                    <label for="publish-credits-input">Publish</label>
                    <div class="quantity-selector">
                        <button type="button" class="quantity-btn" data-action="decrement">-</button>
                        <input type="number" id="publish-credits-input" class="quantity-input" value="1" min="1">
                        <button type="button" class="quantity-btn" data-action="increment">+</button>
                    </div>
                </div>
            </li>
            <li><small style="font-size: 10px;">*1 Publish = ₹100 | 25 Credits = ₹50.</small></li>
        </ul>
        <button class="choose-plan-btn" data-plan="custom">Add On</button>
    </article>
`;
        loader.style.display = 'none';
        container.style.display = 'grid';
        // --- ATTACH EVENT LISTENERS for the new custom card ---
        document.getElementById('ai-credits-select').addEventListener('change', updateCustomPrice);
        document.getElementById('publish-credits-input').addEventListener('input', updateCustomPrice);

        // Replace this entire block in your code
        container.querySelectorAll('.choose-plan-btn[data-plan]').forEach(button => {
            button.addEventListener('click', (e) => {
                const planId = e.currentTarget.dataset.plan;

                // **FIX:** If the plan is 'custom', set cycle to 'one-time', otherwise use the toggle.
                const cycle = planId === 'custom' ? 'lifetime' : currentBillingCycle;

                handlePayment(planId, cycle);
            });
        });

        container.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', () => {
                const input = button.parentElement.querySelector('.quantity-input');
                const action = button.dataset.action;
                let currentValue = parseInt(input.value) || 0;
                const minValue = parseInt(input.min) || 0; // Get the minimum value

                if (action === 'increment') {
                    currentValue++;
                } else if (action === 'decrement' && currentValue > minValue) { // **FIX:** Check against the minimum value
                    currentValue--;
                }

                input.value = currentValue;
                // Manually trigger the input event to update the price
                input.dispatchEvent(new Event('input'));
            });
        });

        updateCustomPrice();
    }


    async function initializePricing() {
        let storedRegion = localStorage.getItem(REGION_STORAGE_KEY);

        // FIX 1: Validate that the stored region actually exists in our plans object!
        // This prevents old/invalid cache data (like "IN" or "undefined") from breaking the UI.
        if (storedRegion && plans[storedRegion]) {
            currentRegion = storedRegion;
            buildPricingUI(plans[currentRegion], currentBillingCycle);
            return;
        }

        try {
            // Failsafe: if IPAPI is blocked by an adblocker, this will throw an error and jump to catch
            const response = await fetch('https://ipapi.co/json/', { cache: 'no-cache' });
            if (!response.ok) throw new Error('Could not fetch region');
            const data = await response.json();

            // Ensure we strictly assign the lowercase 'in' or 'us'
            currentRegion = (data.country_code === 'IN') ? 'in' : 'us';
            localStorage.setItem(REGION_STORAGE_KEY, currentRegion);

        } catch (error) {
            console.warn("IP detection failed (Network/Adblocker). Defaulting to USD.", error);
            currentRegion = 'us';
        } finally {
            // FIX 2: Ultimate fallback just in case currentRegion somehow got mangled
            if (!plans[currentRegion]) currentRegion = 'us';

            // Build the UI and clear the loader
            buildPricingUI(plans[currentRegion], currentBillingCycle);
        }
    }

    initializePricing();

    const billingToggle = document.getElementById('billing-cycle-checkbox');
    if (billingToggle) {
        billingToggle.addEventListener('change', () => {
            currentBillingCycle = billingToggle.checked ? 'yearly' : 'monthly';
            document.getElementById('monthly-label').classList.toggle('active', !billingToggle.checked);
            document.getElementById('yearly-label').classList.toggle('active', billingToggle.checked);
            buildPricingUI(plans[currentRegion], currentBillingCycle);
        });
    }

    if (toggleComparisonButton) {
        toggleComparisonButton.addEventListener('click', () => {
            const isExpanded = toggleComparisonButton.getAttribute('aria-expanded') === 'true';
            toggleComparisonButton.setAttribute('aria-expanded', !isExpanded);
            if (comparisonContent) comparisonContent.classList.toggle('open');
            const buttonText = toggleComparisonButton.querySelector('.button-text');
            const icon = toggleComparisonButton.querySelector('.dropdown-icon');
            if (!isExpanded) {
                if (buttonText) buttonText.textContent = 'Compare All Features (Hide)';
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                if (buttonText) buttonText.textContent = 'Compare All Features (Show)';
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        });
    }
});
