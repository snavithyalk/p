// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDy5PXHDOWEASIxRd2bukF5FRscxFy9ZwQ",
    authDomain: "navithya-e33ae.firebaseapp.com",
    databaseURL: "https://navithya-e33ae-default-rtdb.firebaseio.com",
    projectId: "navithya-e33ae",
    storageBucket: "navithya-e33ae.firebasestorage.app",
    messagingSenderId: "753981072296",
    appId: "1:753981072296:web:a92cb922b52fcd1fabb39d",
    measurementId: "G-7YKLBE203D"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// App State
let users = [];
let requests = [];
let homeData = { title: "Welcome to Navithya", sub: "Cloud-Based Service Portal" };
let storeItems = [];
let galleryItems = [];
let currentUser = null;
let globalPlans = [];

// Persistence Initialization
function restoreSession() {
    const saved = localStorage.getItem('navithya_session');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            loginSuccess(user, true); // Pass true to avoid re-saving
        } catch (e) {
            localStorage.removeItem('navithya_session');
        }
    }
}

// Realtime listeners
db.ref('users').on('value', (snapshot) => {
    const data = snapshot.val();
    users = data ? Object.values(data) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});
db.ref('requests').on('value', (snapshot) => {
    const data = snapshot.val();
    requests = data ? Object.values(data) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

// Constants
const ADMIN_USER = { username: 'ADITHYA', role: 'admin', name: 'Adithya Admin' };
const ADMIN_PASS = '19980307';
let WHATSAPP_NUM = '94769929453';

db.ref('platformSettings').on('value', snap => {
    const data = snap.val();
    if (data) {
        if (data.whatsapp) WHATSAPP_NUM = data.whatsapp;
        
        // Update Footer and other displays
        const phoneDisplay = document.getElementById('footer-phone-display');
        const emailDisplay = document.getElementById('footer-email-display');
        
        if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-phone"></i> ${data.phone1 || ''} / ${data.phone2 || ''} / ${data.whatsapp || ''}`;
        if (emailDisplay) emailDisplay.innerHTML = `<i class="fas fa-envelope"></i> ${data.email || 'SNAVITHYA@GMAIL.COM'}`;
        
        // Update Admin inputs if they exist
        const adminWa = document.getElementById('admin-setting-wa');
        if (adminWa) {
            document.getElementById('admin-setting-phone1').value = data.phone1 || '';
            document.getElementById('admin-setting-phone2').value = data.phone2 || '';
            document.getElementById('admin-setting-wa').value = data.whatsapp || '';
            document.getElementById('admin-setting-email').value = data.email || '';
        }
    } else {
        // Setup defaults
        db.ref('platformSettings').set({
            phone1: '0729929453',
            phone2: '0719929453',
            whatsapp: '94769929453',
            email: 'SNAVITHYA@GMAIL.COM'
        });
    }
});

// Sidebar Roles Configuration
const ROLE_MENUS = {
    admin: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'admin-jobs', label: 'Provider Jobs', icon: 'fas fa-briefcase' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'admin', label: 'Admin Dashboard', icon: 'fas fa-user-shield' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'broadcast', label: 'Global Broadcast', icon: 'fas fa-bullhorn' },
        { id: 'plans-edit', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    developer: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'admin-jobs', label: 'Provider Jobs', icon: 'fas fa-briefcase' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'admin', label: 'Admin Dashboard', icon: 'fas fa-user-shield' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'plans-edit', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    provider: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'provider-jobs', label: 'Received Jobs', icon: 'fas fa-inbox' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'provider-dashboard', label: 'Provider Dashboard', icon: 'fas fa-tachometer-alt' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'plans', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    customer: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'services', label: 'Request Job', icon: 'fas fa-file-signature' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'customer-dashboard', label: 'Customer Dashboard', icon: 'fas fa-user' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'tracking', label: 'Tracking Job', icon: 'fas fa-map-marker-alt' }
    ],
    sales: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'sales-dashboard', label: 'Sales Dashboard', icon: 'fas fa-ad' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' }
    ]
};

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');

// Tabs setup
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const btns = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;

    if (username === ADMIN_USER.username && pass === ADMIN_PASS) {
        loginSuccess(ADMIN_USER);
        return;
    }

    const foundUser = users.find(u => u.phone === username || u.name === username);
    if (foundUser) {
        if (foundUser.pass !== pass) return alert('Invalid Password!');
        if (foundUser.status === 'pending') return alert('Your account is pending admin approval.');
        loginSuccess(foundUser);
    } else {
        alert('User not found. Please sign up.');
    }
}

function handleForgetPassword() {
    const phone = prompt("Enter your registered Phone Number:");
    if (!phone) return;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=Reset%20Password%20for%20${phone}`, '_blank');
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const pass = document.getElementById('signup-password').value;
    const country = document.getElementById('signup-country').value;
    const city = document.getElementById('signup-city').value;
    const experience = document.getElementById('signup-experience').value;
    const skills = document.getElementById('signup-skills').value;
    const bio = document.getElementById('signup-bio').value;

    const newUser = { id: Date.now(), name, phone, pass, country, district: city, experience, skills, bio, role: 'unassigned', status: 'pending', timestamp: Date.now() };
    db.ref('users/' + newUser.id).set(newUser);

    window.open(`https://wa.me/${WHATSAPP_NUM}?text=New%20Signup%3A%20${name}%20(${phone})`, '_blank');

    alert('Signup successful! Wait for Admin approval.');
    switchAuthTab('login');
}

function showAuthOverlay() { authOverlay.classList.remove('hidden'); }
function hideAuthOverlay() { authOverlay.classList.add('hidden'); }

// UI Control
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    sidebar.classList.toggle('hidden');
}

function populateSidebar(role) {
    const sidebar = document.getElementById('main-sidebar');
    const linksList = document.getElementById('sidebar-links');
    const roleDisplay = sidebar.querySelector('.role-display');
    
    linksList.innerHTML = '';
    roleDisplay.innerText = role.toUpperCase() + ' PANEL';

    const menu = ROLE_MENUS[role] || [];
    menu.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<button onclick="navigate('${item.id}')"><i class="${item.icon}"></i> ${item.label}</button>`;
        linksList.appendChild(li);
    });
}

function loginSuccess(user, isRestoration = false) {
    currentUser = user;
    if (!isRestoration) {
        localStorage.setItem('navithya_session', JSON.stringify(user));
    }
    authOverlay.classList.add('hidden');

    // Show Sidebar Toggle
    document.getElementById('sidebar-toggle').classList.remove('hidden');
    
    // UI toggles
    document.getElementById('nav-login-btn').classList.add('hidden');
    document.getElementById('nav-logout-btn').classList.remove('hidden');

    // Populate Sidebar based on role
    populateSidebar(user.role);

    if (user.role === 'admin' || user.role === 'developer') {
        document.getElementById('gallery-upload-section').classList.remove('hidden');
        updateAdminPanel();
    }

    if (user.role === 'provider') {
        updateProviderPanel();
    }

    if (user.role === 'sales') {
        updateSalesPanel();
    }

    alert(`Welcome back, ${user.name}!`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('navithya_session');

    // UI toggles
    document.getElementById('nav-login-btn').classList.remove('hidden');
    document.getElementById('nav-logout-btn').classList.add('hidden');
    document.getElementById('sidebar-toggle').classList.add('hidden');
    document.getElementById('main-sidebar').classList.add('hidden');

    // Clear forms
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();

    // Go back home
    navigate('home');
}

// Navigation
function navigate(pageId) {
    // Route aliases for sub-components
    if (pageId === 'rate-us' || pageId === 'reviews') pageId = 'reviews';
    if (pageId === 'admin-jobs' || pageId === 'plans-edit') pageId = 'admin';
    if (pageId === 'provider-jobs' || pageId === 'plans') pageId = 'provider-dashboard';

    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.style.animation = 'fadeIn 0.6s ease-out forwards';
    } else {
        console.warn(`Page page-${pageId} not found!`);
        const home = document.getElementById('page-home');
        home.classList.remove('hidden');
        home.style.animation = 'fadeIn 0.6s ease-out forwards';
    }

    // Update active state in sidebar
    const sidebarButtons = document.querySelectorAll('.sidebar-links button');
    sidebarButtons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${pageId}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Auto-hide sidebar on mobile or when navigating
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar && !sidebar.classList.contains('hidden')) {
        sidebar.classList.add('hidden');
    }

    if (pageId === 'admin' && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer'))) {
        alert('Access Denied. Admins/Developers Only.');
        navigate('home');
        return;
    }

    if (pageId === 'admin') {
        updateAdminPanel();
        document.getElementById('admin-home-title').value = homeData.title;
        document.getElementById('admin-home-sub').value = homeData.sub;
    }

    if (pageId === 'provider-dashboard') {
        updateProviderDashboard();
    }

    if (pageId === 'gallery') {
        renderGallery();
    }

    if (pageId === 'sales-dashboard') {
        updateSalesPanel();
    }
}


// Job Flow Handling
window.updateTowns = function() {
    // This could be used for dynamic town lists if needed
    filterProviders();
};

function filterProviders() {
    const dist = document.getElementById('req-district').value;
    const serv = document.getElementById('req-service').value;

    const resultsDiv = document.getElementById('provider-results');
    const list = document.getElementById('provider-list');
    list.innerHTML = '';

    if (!serv) {
        resultsDiv.classList.add('hidden');
        return;
    }

    const matched = users.filter(u => {
        const isProvider = u.role === 'provider' && u.status === 'approved';
        const hasService = u.providerService === serv;
        const matchesDistrict = dist ? u.district === dist : true;
        return isProvider && hasService && matchesDistrict;
    });

    if (matched.length > 0) {
        matched.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding:1rem 0;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <img src="${p.logo || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">
                        <div>
                            <span style="font-weight:600; font-size:1.1rem;">${p.shopName || p.name}</span><br>
                            <small style="color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${p.district}</small><br>
                            <small style="color:#fbbf24;">${'★'.repeat(p.rating || 5)}<span style="color:var(--text-dim)">${'★'.repeat(5-(p.rating || 5))}</span></small>
                        </div>
                    </div>
                    <button type="button" onclick="selectProvider('${p.id}', '${p.shopName || p.name}')" class="btn-outline" style="padding:8px 16px; font-size:0.9rem;">Select Provider</button>
                </div>
            `;
            list.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "No verified providers available in this area yet. Our Admin will assign one manually.";
        li.style.color = '#666';
        list.appendChild(li);
    }

    resultsDiv.classList.remove('hidden');
}

window.selectProvider = function (id, name) {
    document.getElementById('selected-provider-id').value = id;
    alert(`Provider ${name} selected! Click Book Service again to submit.`);
};

function handleServiceRequest(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please login to continue.');
        showAuthOverlay();
        return;
    }

    const district = document.getElementById('req-district').value;
    const service = document.getElementById('req-service').value;

    // Find matching providers
    const matchingProviders = users.filter(u => u.role === 'provider' && u.status === 'approved' && u.district === district && u.providerService === service);
    
    const listDiv = document.getElementById('provider-selection-list');
    if (!listDiv) return finalizeServiceRequest(null);

    if (matchingProviders.length === 0) {
        // No providers found in the area, skip directly to admin assignment
        finalizeServiceRequest(null);
        return;
    }

    // Populate modal
    listDiv.innerHTML = '';
    matchingProviders.forEach(p => {
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.border = '1px solid var(--border)';
        div.style.marginBottom = '10px';
        div.style.borderRadius = '8px';
        div.style.background = 'rgba(255,255,255,0.05)';
        div.innerHTML = `
            <div style="font-weight:bold; font-size:1.1rem; color:var(--primary);">${p.shopName || p.name}</div>
            <div style="font-size:0.9rem; color:var(--text-muted);"><i class="fas fa-check-circle"></i> Verified • ${p.experience || 'Experienced'}</div>
            <button type="button" class="btn-primary mt-2 w-100" onclick="finalizeServiceRequest('${p.id}')">Select & Confirm</button>
        `;
        listDiv.appendChild(div);
    });

    document.getElementById('provider-selection-modal').classList.remove('hidden');
}

window.finalizeServiceRequest = function(providerId) {
    document.getElementById('provider-selection-modal').classList.add('hidden');

    const custName = document.getElementById('req-customer-name').value;
    const district = document.getElementById('req-district').value;
    const town = document.getElementById('req-town').value;
    const village = document.getElementById('req-village').value;
    const service = document.getElementById('req-service').value;
    const desc = document.getElementById('req-desc').value;

    const reqId = "NAV-" + Math.floor(1000 + Math.random() * 9000);
    
    let providerName = null;
    let providerPhone = null;
    let assignedStatus = 'pending_admin';

    if (providerId) {
        const p = users.find(u => u.id == providerId);
        if (p) {
            providerName = p.shopName || p.name;
            providerPhone = p.phone;
            assignedStatus = 'assigned'; // Auto assign since customer chose them
        }
    }

    const reqData = {
        id: reqId,
        userId: currentUser.id,
        customerName: custName,
        customerPhone: currentUser.phone,
        district,
        town,
        village,
        service,
        desc,
        status: assignedStatus,
        providerId: providerId || null,
        providerName: providerName || null,
        providerPhone: providerPhone || null,
        timestamp: Date.now()
    };

    db.ref('requests/' + reqId).set(reqData);

    alert(`Request ${reqId} submitted successfully! You can track it using your tracking number.`);
    
    if (providerId && providerPhone) {
        // Direct Routing to Provider
        const waMsg = `*NAVITHYA NEW SERVICE REQUEST*\n\nID: ${reqId}\nCustomer: ${custName}\nLocation: ${town}, ${district}\nService: ${service}\nIssue: ${desc}\n\n*Please confirm this job!*`;
        const waUrl = `https://wa.me/${providerPhone}?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
        alert(`Request ${reqId} sent directly to ${providerName}!`);
    } else {
        const waMsg = `*NEW SERVICE REQUEST (ADMIN ASSIGNMENT)*\nID: ${reqId}\nCustomer: ${custName}\nLocation: ${town}, ${district}\nService: ${service}\nIssue: ${desc}`;
        const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
        alert(`Request ${reqId} submitted! Admin will assign a provider soon.`);
    }

    navigate('home');
    document.getElementById('service-request-form').reset();
};

// Provider Logic
function updateProviderDashboard() {
    if (!currentUser || currentUser.role !== 'provider') return;

    // Display Profile & Bank Info
    const profileDiv = document.getElementById('provider-profile-display');
    profileDiv.innerHTML = `
        <div style="padding:15px; border:1px solid var(--border); border-radius:var(--radius-sm); background:rgba(255,255,255,0.02);">
            <h3 style="color:var(--primary); margin-bottom:10px;">Professional CV Profile</h3>
            <p><strong>Name:</strong> ${currentUser.name}</p>
            <p><strong>Location:</strong> ${currentUser.district || currentUser.city || 'N/A'}, ${currentUser.country || 'N/A'}</p>
            <p><strong>Experience:</strong> ${currentUser.experience || 'Not specified'}</p>
            <p><strong>Skills:</strong> ${currentUser.skills || 'Not specified'}</p>
            <p><strong>Bio:</strong> <span style="color:var(--text-muted);">${currentUser.bio || 'Not specified'}</span></p>
            <hr style="border:0; border-top:1px solid var(--border); margin: 10px 0;">
            <p><strong>Shop:</strong> ${currentUser.shopName || 'Not Set'}</p>
            <p><strong>Bank:</strong> ${currentUser.bankName || 'N/A'} - ${currentUser.accNumber || 'N/A'}</p>
            <p><strong>Plan Status:</strong> <span style="color:#10b981; font-weight:bold;">${currentUser.planStatus || 'Free Trial'}</span></p>
        </div>
    `;

    // Manage Employees
    const empList = document.getElementById('employee-list');
    empList.innerHTML = '';
    const myEmps = currentUser.employees ? Object.values(currentUser.employees) : [];
    if (myEmps.length === 0) empList.innerHTML = 'No employees added.';
    myEmps.forEach(emp => {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `${emp.name} <button onclick="deleteEmployee('${emp.id}')" style="color:red; float:right; border:none; background:none; cursor:pointer;">✖</button>`;
        empList.appendChild(div);
    });

    // Received Jobs
    const jobsList = document.getElementById('provider-jobs-list');
    jobsList.innerHTML = '';
    const myJobs = requests.filter(r => r.providerId == currentUser.id && r.status !== 'pending_admin');
    if (myJobs.length === 0) jobsList.innerHTML = 'No jobs received.';
    myJobs.forEach(job => {
        const div = document.createElement('div');
        div.className = 'card mt-2';
        div.innerHTML = `
            <h3>${job.service} (${job.id})</h3>
            <p><strong>Customer:</strong> ${job.customerName}</p>
            <p><strong>Town/Village:</strong> ${job.town}, ${job.village}</p>
            <p><strong>Status:</strong> ${job.status}</p>
            ${job.status !== 'completed' ? `
                <button onclick="markJobStatus('${job.id}', 'accepted')" class="btn-outline">Accept</button>
                <button onclick="showJobCompletionModal('${job.id}')" class="btn-primary">Complete</button>
            ` : ''}
        `;
        jobsList.appendChild(div);
    });
}

window.handleAddEmployee = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-employee-name').value;
    const id = Date.now();
    db.ref(`users/${currentUser.id}/employees/${id}`).set({ id, name });
    document.getElementById('new-employee-name').value = '';
    alert('Employee added!');
};

window.deleteEmployee = function(id) {
    if (confirm('Delete employee?')) {
        db.ref(`users/${currentUser.id}/employees/${id}`).remove();
    }
};

window.handleSaveMiniSite = function(e) {
    e.preventDefault();
    const updates = {
        shopName: document.getElementById('mini-shop-name').value,
        logo: document.getElementById('mini-logo-url').value,
        shopAbout: document.getElementById('mini-about').value
    };
    db.ref(`users/${currentUser.id}`).update(updates);
    alert('Mini site updated!');
};

window.markJobStatus = function(rid, status) {
    db.ref(`requests/${rid}`).update({ status });
    alert(`Job ${status}!`);
};

window.showJobCompletionModal = function(rid) {
    const img = prompt("Upload Completion Photo (URL):");
    const payMode = prompt("Payment Mode (Cash / Card / Bank Advance):");
    let advAmount = "";
    if (payMode && payMode.toLowerCase() === 'bank advance') {
        advAmount = prompt("Enter Advance Amount:");
    }

    if (img && payMode) {
        db.ref(`requests/${rid}`).update({ 
            status: 'completed', 
            completionImage: img,
            paymentMode: payMode,
            advance: advAmount
        });

        // If Bank selected, send WhatsApp to customer (Via Admin)
        if (payMode.toLowerCase().includes('bank')) {
            const msg = `*BANK PAYMENT DETAILS*\nJob: ${rid}\nProvider: ${currentUser.shopName}\nBank: ${currentUser.bankName}\nACC: ${currentUser.accNumber}\nBrach: ${currentUser.bankBranch}\nAmount: ${advAmount || 'Full'}`;
            const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
        }
        alert('Job marked as completed!');
    }
};

// Customer Tracking
window.trackJob = function() {
    const tid = document.getElementById('track-number-input').value;
    const resDiv = document.getElementById('tracking-result');
    const job = requests.find(r => r.id === tid);
    if (job) {
        resDiv.innerHTML = `
            <div class="card" style="background:var(--bg-alt);">
                <h4>Status: <span style="color:var(--primary);">${job.status.toUpperCase()}</span></h4>
                <p><strong>Service:</strong> ${job.service}</p>
                <p><strong>Provider:</strong> ${job.providerName || 'Assigning...'}</p>
                ${job.completionImage ? `<a href="${job.completionImage}" target="_blank">View Completed Proof</a>` : ''}
            </div>
        `;
    } else {
        resDiv.innerHTML = '<p style="color:red;">Invalid Tracking Number.</p>';
    }
};

// Plans logic
const DEFAULT_PLANS = [
    { name: "Free Trial", duration: "2.5 Weeks", price: 0 },
    { name: "Weekly", duration: "1 Week", price: 250 },
    { name: "Monthly", duration: "1 Month", price: 1000 },
    { name: "Annual", duration: "1 Year", price: 12000 }
];

// Final Init
db.ref('homeData').on('value', (snapshot) => {
    if (snapshot.val()) {
        homeData = snapshot.val();
        const t = document.getElementById('home-title-display');
        const s = document.getElementById('home-sub-display');
        if (t) t.innerHTML = homeData.title;
        if (s) s.innerHTML = homeData.sub;
    }
});

db.ref('storeItems').on('value', snap => {
    storeItems = snap.val() ? Object.values(snap.val()) : [];
    renderStoreItems();
});

db.ref('gallery').on('value', snap => {
    galleryItems = snap.val() ? Object.values(snap.val()) : [];
    renderGallery();
});

// AI Bot Logic
window.toggleChat = function () {
    const win = document.getElementById('ai-chat-window');
    win.classList.toggle('hidden');
};

window.sendMessage = function () {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, 'user-msg');
    input.value = '';

    setTimeout(() => {
        const lowerMsg = msg.toLowerCase();
        let reply = "I'm sorry, I don't understand. Can you rephrase? I can help with CCTV, Solar, Plumbing, and PC repairs.";

        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) reply = "Hello! Welcome to Navithya. How can I help you with our services today?";
        if (lowerMsg.includes('service') || lowerMsg.includes('offer')) reply = "We offer CCTV Installation, House Wiring, Networking, Solar Panels, Plumbing, and PC/Software repairs.";
        if (lowerMsg.includes('price') || lowerMsg.includes('cost')) reply = "Prices vary by service. You can check our 'Store' page for products or request a service for a custom quote.";
        if (lowerMsg.includes('contact') || lowerMsg.includes('phone')) reply = "You can contact us at 0729929453 / 0769929453 or email SNAVITHYA@GMAIL.COM.";

        appendMessage(reply, 'bot-msg');
    }, 600);
};

function appendMessage(text, className) {
    const body = document.getElementById('chat-body');
    if(!body) return;
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// Global Features Logic
window.sendBroadcast = function() {
    const msg = document.getElementById('broadcast-msg').value;
    if (!msg) return alert("Enter a message");
    
    const id = Date.now();
    db.ref('notifications/' + id).set({
        id,
        msg,
        type: 'global',
        timestamp: id
    });
    
    alert("Global broadcast sent!");
    document.getElementById('broadcast-msg').value = '';
    navigate('home');
};

db.ref('notifications').on('value', snap => {
    const data = snap.val();
    const list = data ? Object.values(data) : [];
    renderNotifications(list);
});

function renderNotifications(notifs) {
    const listDiv = document.getElementById('notifications-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    notifs.slice().reverse().forEach(n => {
        const div = document.createElement('div');
        div.className = 'card mt-2';
        div.style.borderLeft = '4px solid var(--primary)';
        div.innerHTML = `<p>${n.msg}</p><small>${new Date(n.timestamp).toLocaleString()}</small>`;
        listDiv.appendChild(div);
    });
}

// Plan Management logic
window.showNewPlanModal = function() {
    const name = prompt("Plan Name:");
    const dur = prompt("Duration (e.g. 1 Month):");
    const price = prompt("Price (Rs.):");
    if (name && dur && price) {
        db.ref('plans/' + Date.now()).set({ name, duration: dur, price });
        alert("Plan added!");
    }
};

db.ref('plans').on('value', snap => {
    const data = snap.val();
    globalPlans = data ? Object.values(data) : DEFAULT_PLANS;
    renderPlans(globalPlans);
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

function renderPlans(plans) {
    const adminList = document.getElementById('admin-plans-list');
    if (adminList) {
        adminList.innerHTML = '';
        plans.forEach(p => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `<strong>${p.name}</strong> - Rs. ${p.price} / ${p.duration} <button onclick="deletePlan('${p.name}')" style="color:red; background:none; border:none; cursor:pointer; margin-left:10px;">🗑️</button>`;
            adminList.appendChild(div);
        });
    }
}

window.deletePlan = function(name) {
    if (confirm(`Delete plan "${name}"?`)) {
        db.ref('plans').once('value', snap => {
            const data = snap.val();
            for (let key in data) {
                if (data[key].name === name) {
                    db.ref('plans/' + key).remove();
                    break;
                }
            }
        });
    }
};

// Gallery Logic
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    grid.innerHTML = '';
    galleryItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        if (item.type === 'video') {
            div.innerHTML = `<video src="${item.url}" controls></video>`;
        } else {
            div.innerHTML = `<img src="${item.url}" alt="Gallery Item">`;
        }
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) {
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => db.ref('gallery/' + item.id).remove();
            div.appendChild(delBtn);
        }
        grid.appendChild(div);
    });
}

window.trackJobDirect = function() {
    const tid = document.getElementById('track-number-direct').value;
    const resDiv = document.getElementById('tracking-result-direct');
    if(!resDiv) return;
    const job = requests.find(r => r.id === tid);
    if (job) {
        resDiv.innerHTML = `
            <div class="card" style="background:#f1f5f9; border-left: 5px solid var(--primary);">
                <h4>Status: <span style="color:var(--primary);">${job.status.toUpperCase().replace('_', ' ')}</span></h4>
                <p><strong>Service:</strong> ${job.service}</p>
                <p><strong>Provider:</strong> ${job.providerName || 'Pending Assignment'}</p>
                <p><strong>Location:</strong> ${job.town}, ${job.village}</p>
                ${job.completionImage ? `<div class="mt-2"><img src="${job.completionImage}" style="max-width:100%; border-radius:8px;"></div>` : ''}
            </div>
        `;
    } else {
        resDiv.innerHTML = '<p style="color:red; font-weight:600;">Invalid Tracking Number.</p>';
    }
};

window.setRating = function(n) {
    document.getElementById('selected-rating').value = n;
    const stars = document.querySelectorAll('.rating-stars span');
    stars.forEach((s, idx) => {
        if (idx < n) s.classList.add('active');
        else s.classList.remove('active');
    });
};

window.submitReview = function() {
    const rat = document.getElementById('selected-rating').value;
    const txt = document.getElementById('review-text').value;
    if (rat == 0) return alert("Please select a rating");
    
    const id = Date.now();
    db.ref('reviews/' + id).set({
        id,
        user: currentUser ? currentUser.name : 'Guest',
        rating: rat,
        text: txt,
        timestamp: id
    });
    
    alert("Review submitted!");
    document.getElementById('review-text').value = '';
    setRating(0);
};

db.ref('reviews').on('value', snap => {
    const data = snap.val();
    const reviews = data ? Object.values(data) : [];
    const display = document.getElementById('reviews-display');
    if (!display) return;
    display.innerHTML = '';
    reviews.slice().reverse().forEach(r => {
        const div = document.createElement('div');
        div.className = 'card mt-2';
        div.innerHTML = `<strong>${r.user}</strong><br><span style="color:#f6ad55;">${'⭐'.repeat(r.rating)}</span><p>${r.text}</p>`;
        display.appendChild(div);
    });
});

let orders = [];
db.ref('orders').on('value', snap => {
    orders = snap.val() ? Object.values(snap.val()) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

let services = [];
db.ref('services').on('value', snap => {
    const data = snap.val();
    if (!data) {
        // Auto-setup default services
        const defaultServices = [
            { id: 1, name: 'CCTV Installation', desc: 'High-quality CCTV setup.', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=600' },
            { id: 2, name: 'House Wiring', desc: 'Safe electrical house wiring.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600' },
            { id: 3, name: 'Computer Networking', desc: 'LAN and Wi-Fi networking.', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600' },
            { id: 4, name: 'Hardware', desc: 'PC & Laptop repairs.', image: 'https://images.unsplash.com/photo-1593640495253-23a96b225308?q=80&w=600' },
            { id: 5, name: 'Software', desc: 'OS and software installation.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600' },
            { id: 6, name: 'Plumbing', desc: 'Water line and pump repairs.', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600' },
            { id: 7, name: 'Solar System', desc: 'Solar panel installation.', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600' },
            { id: 8, name: 'TV Radio Repair', desc: 'Electronics repair services.', image: 'https://images.unsplash.com/photo-1592833159155-c62df1b65634?q=80&w=600' }
        ];
        defaultServices.forEach(s => db.ref(`services/${s.id}`).set(s));
        return;
    }
    services = Object.values(data);
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
    updateDynamicServices();
});

function updateDynamicServices() {
    // 1. Update Home Screen Services Grid
    const homeGrid = document.querySelector('#page-home .services-grid');
    if (homeGrid && services.length > 0) {
        homeGrid.innerHTML = '';
        services.forEach(s => {
            const div = document.createElement('div');
            div.className = 'service-card';
            div.innerHTML = `
                <img src="${s.image || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=600&auto=format&fit=crop'}" alt="${s.name}">
                <div class="service-info">
                    <h3><i class="fas fa-tools"></i> ${s.name}</h3>
                    <p>${s.desc || 'Professional ' + s.name + ' services.'}</p>
                    <button class="btn-card" onclick="navigate('services'); document.getElementById('req-service').value='${s.name}';">Book Now <i class="fas fa-arrow-right"></i></button>
                </div>
            `;
            homeGrid.appendChild(div);
        });
    }

    // 2. Update Service Request Dropdown
    const reqSelect = document.getElementById('req-service');
    if (reqSelect) {
        const currentVal = reqSelect.value;
        reqSelect.innerHTML = '<option value="" disabled selected>Select Issue (Service)</option>';
        services.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.name;
            opt.textContent = s.name;
            reqSelect.appendChild(opt);
        });
        if (currentVal && services.find(s => s.name === currentVal)) {
            reqSelect.value = currentVal;
        }
    }
}

// ====== MISSING ADMIN AND PROVIDER FUNCTIONS ======

window.updateAdminPanel = function() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) return;

    // Stats
    const validUsers = users.filter(u => u && u.name);
    document.getElementById('stat-users').innerText = validUsers.length;
    document.getElementById('stat-pending').innerText = validUsers.filter(u => u.status === 'pending').length;

    // User Management
    const usersList = document.getElementById('admin-users-list');
    if (usersList) {
        usersList.innerHTML = '';
        const sortedUsers = validUsers.sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));
        sortedUsers.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.name}<br><small style="color:var(--text-muted)">${u.phone}</small></td>
                <td>${u.district || 'N/A'}<br><small>${u.country || u.province || ''}</small></td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background: ${u.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${u.status === 'approved' ? '#10b981' : '#f59e0b'};">
                        ${u.status ? u.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                </td>
                <td>
                    <select onchange="assignRole('${u.id}', this.value)" style="margin-bottom: 5px; padding: 5px; background: #fff; color: #000; border: 1px solid var(--border);">
                        <option value="unassigned" ${u.role === 'unassigned' ? 'selected' : ''}>Unassigned</option>
                        <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="provider" ${u.role === 'provider' ? 'selected' : ''}>Provider</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <select onchange="assignService('${u.id}', this.value)" style="padding: 5px; background: #fff; color: #000; border: 1px solid var(--border);" ${u.role !== 'provider' ? 'disabled' : ''}>
                        <option value="">No Service</option>
                        ${services.map(s => `<option value="${s.name}" ${u.providerService === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
                    </select>
                </td>
                <td>
                    ${u.status !== 'approved' ? `
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <select id="plan-select-${u.id}" style="padding: 4px; font-size: 0.75rem; background: #fff; color: #000; border: 1px solid var(--border);">
                                ${globalPlans.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                            </select>
                            <button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="approveUser('${u.id}', document.getElementById('plan-select-${u.id}').value)">Approve</button>
                        </div>
                    ` : (u.role === 'provider' ? `
                        <div id="plan-display-${u.id}">
                            <span class="glass-bright" style="padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--primary); color: var(--primary);">
                                ${u.planStatus || 'Free Trial'}
                            </span>
                            <button onclick="togglePlanEdit('${u.id}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-left:5px;"><i class="fas fa-edit"></i></button>
                        </div>
                        <div id="plan-edit-${u.id}" class="hidden" style="margin-top:5px;">
                            <select id="plan-select-${u.id}" style="padding: 4px; font-size: 0.75rem; background: #fff; color: #000; border: 1px solid var(--border); width: 100%;">
                                ${globalPlans.map(p => `<option value="${p.name}" ${u.planStatus === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
                            </select>
                            <div style="display:flex; gap:5px; margin-top:5px;">
                                <button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem; flex:1;" onclick="updateUserPlan('${u.id}', document.getElementById('plan-select-${u.id}').value)">Save</button>
                                <button class="btn-outline" style="padding: 4px 8px; font-size: 0.75rem; flex:1;" onclick="togglePlanEdit('${u.id}')">Cancel</button>
                            </div>
                        </div>
                    ` : '<span style="color:var(--text-dim); font-size:0.8rem;">N/A</span>')}
                    <button class="btn-outline" style="padding: 4px 8px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444; margin-top: 5px; width: 100%;" onclick="rejectUser('${u.id}')">Remove</button>
                </td>
            `;
            usersList.appendChild(tr);
        });
    }

    // Full Job Visibility for Admin
    const allJobsList = document.getElementById('admin-all-jobs-list');
    if (allJobsList) {
        allJobsList.innerHTML = '';
        const allReqs = requests.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (allReqs.length === 0) allJobsList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No jobs found.</td></tr>';
        allReqs.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${req.id}</td>
                <td>${req.service}<br><small>${req.town}, ${req.district}</small></td>
                <td>${req.customerName}</td>
                <td>${req.providerName || '<span style="color:#f59e0b">Pending</span>'}</td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background: ${req.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${req.status === 'completed' ? '#10b981' : '#f59e0b'};">
                        ${req.status.toUpperCase().replace('_', ' ')}
                    </span>
                    <button onclick="deleteRequest('${req.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:10px;"><i class="fas fa-trash"></i></button>
                </td>
            `;
            allJobsList.appendChild(tr);
        });
    }

    // System Requests (Pending Admin) & Assigned Requests
    const sysReqList = document.getElementById('admin-system-requests');
    if (sysReqList) {
        sysReqList.innerHTML = '';
        const visibleReqs = requests.filter(r => r && (r.status === 'pending_admin' || r.status === 'assigned')).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (visibleReqs.length === 0) sysReqList.innerHTML = '<li style="color:var(--text-muted)">No pending or assigned requests.</li>';
        visibleReqs.forEach(req => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.style.paddingBottom = '10px';
            li.style.borderBottom = '1px solid var(--border)';
            
            if (req.status === 'assigned') {
                li.innerHTML = `
                    <strong>${req.id}</strong> - ${req.service} in ${req.district} <span style="color:var(--primary)">(Assigned to ${req.providerName})</span><br>
                    <small>Customer: ${req.customerName} (${req.customerPhone})</small><br>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; margin-top: 5px;" onclick="adminNotifyProviderWA('${req.id}')"><i class="fab fa-whatsapp"></i> Notify Provider</button>
                `;
            } else {
                li.innerHTML = `
                    <strong>${req.id}</strong> - ${req.service} in ${req.district} <span style="color:#f59e0b">(Pending Admin)</span><br>
                    <small>Customer: ${req.customerName} (${req.customerPhone})</small><br>
                    <select id="assign-provider-${req.id}" style="padding: 5px; margin-top: 5px; width: auto; display: inline-block; background: #fff; color: #000; border: 1px solid var(--border);">
                        <option value="">Select Provider to Assign</option>
                        ${users.filter(u => u.role === 'provider' && u.status === 'approved' && (!req.service || u.providerService === req.service)).map(u => `<option value="${u.id}">${u.shopName || u.name} (${u.district})</option>`).join('')}
                    </select>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="assignProviderToJob('${req.id}')">Assign</button>
                `;
            }
            sysReqList.appendChild(li);
        });
    }

    // Provider Completed Jobs
    const compJobsList = document.getElementById('admin-completed-jobs');
    if (compJobsList) {
        compJobsList.innerHTML = '';
        const completedReqs = requests.filter(r => r && r.status === 'completed').sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (completedReqs.length === 0) compJobsList.innerHTML = '<li style="color:var(--text-muted)">No completed jobs yet.</li>';
        completedReqs.forEach(req => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.innerHTML = `<strong>${req.id}</strong> - ${req.service} by ${req.providerName || 'Unknown'} <a href="${req.completionImage}" target="_blank" style="color:var(--primary); font-size:0.8rem; margin-left:10px;"><i class="fas fa-image"></i> Proof</a>`;
            compJobsList.appendChild(li);
        });
    }

    // Admin Store Orders
    const ordersList = document.getElementById('admin-store-orders');
    if (ordersList) {
        ordersList.innerHTML = '';
        if (orders.length === 0) ordersList.innerHTML = '<li style="color:var(--text-muted)">No orders yet.</li>';
        orders.forEach(o => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.innerHTML = `
                <div>
                    <strong>${o.id}</strong> - ${o.itemName}<br>
                    <small>By: ${o.userName} (${o.phone})</small>
                </div>
                <button onclick="deleteOrder('${o.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-trash"></i></button>
            `;
            ordersList.appendChild(li);
        });
    }

    // Admin Services List
    const servicesList = document.getElementById('admin-services-list');
    if (servicesList) {
        servicesList.innerHTML = '';
        services.forEach(s => {
            const li = document.createElement('li');
            li.style.marginBottom = '5px';
            li.innerHTML = `${s.name} <button onclick="db.ref('services/${s.id}').remove()" style="color:red; background:none; border:none; cursor:pointer; float:right;">✖</button>`;
            servicesList.appendChild(li);
        });
    }

    // Admin Store Items Edit
    const storeEditList = document.getElementById('admin-store-items-list');
    if (storeEditList) {
        storeEditList.innerHTML = '';
        storeItems.forEach(item => {
            const div = document.createElement('div');
            div.style.marginBottom = '5px';
            div.innerHTML = `<strong>${item.name}</strong> - Rs.${item.price} <button onclick="deleteStoreItem('${item.id}')" style="color:red; background:none; border:none; cursor:pointer; float:right;">✖</button>`;
            storeEditList.appendChild(div);
        });
    }
};

window.approveUser = function(uid, planName) {
    db.ref(`users/${uid}`).update({ status: 'approved', planStatus: planName || 'Free Trial' });
    alert('User approved & plan assigned!');
};

window.updateUserPlan = function(uid, planName) {
    db.ref(`users/${uid}`).update({ planStatus: planName });
    alert('Provider plan updated!');
};

window.rejectUser = function(uid) {
    if (confirm('Remove this user?')) {
        db.ref(`users/${uid}`).remove();
    }
};

window.assignRole = function(uid, role) {
    db.ref(`users/${uid}`).update({ role });
    if (currentUser && currentUser.id == uid) {
        currentUser.role = role;
        populateSidebar(role);
    }
};

window.assignService = function(uid, service) {
    db.ref(`users/${uid}`).update({ providerService: service });
};

window.assignProviderToJob = function(jobId) {
    const providerId = document.getElementById(`assign-provider-${jobId}`).value;
    if (!providerId) return alert('Select a provider first.');
    const provider = users.find(u => u.id == providerId);
    db.ref(`requests/${jobId}`).update({
        providerId,
        providerName: provider.shopName || provider.name,
        providerPhone: provider.phone,
        status: 'assigned'
    });
    // Send WhatsApp to Provider via Admin Number
    const msg = `*NEW JOB ASSIGNED*\nID: ${jobId}\nPlease check your provider dashboard on Navithya!`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
    alert('Job assigned to provider!');
};

window.adminNotifyProviderWA = function(reqId) {
    const req = requests.find(r => r.id === reqId);
    if (!req || !req.providerPhone) return alert('No provider assigned or missing phone number.');
    
    const waMsg = `*NAVITHYA NEW JOB ASSIGNMENT*\nHi ${req.providerName}, you have been assigned a new job!\n\nID: ${req.id}\nCustomer: ${req.customerName}\nCustomer Phone: ${req.customerPhone}\nLocation: ${req.town}, ${req.district}\nService: ${req.service}\nIssue Details: ${req.desc}\n\nPlease login to your Navithya dashboard to update the status.`;
    const waUrl = `https://wa.me/${req.providerPhone}?text=${encodeURIComponent(waMsg)}`;
    window.open(waUrl, '_blank');
};

window.togglePlanEdit = function(uid) {
    const display = document.getElementById(`plan-display-${uid}`);
    const edit = document.getElementById(`plan-edit-${uid}`);
    if (display && edit) {
        display.classList.toggle('hidden');
        edit.classList.toggle('hidden');
    }
};

window.updateProviderPanel = function() {
    updateProviderDashboard();
};

window.renderStoreItems = function() {
    const grid = document.querySelector('.store-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (storeItems.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); padding:3rem; text-align:center;">No items available right now.</p>';
        return;
    }
    storeItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'service-card glass'; // Reuse styling
        div.innerHTML = `
            <img src="${item.image || 'https://images.unsplash.com/photo-1550009158-9ebf6d250406?q=80&w=600&auto=format&fit=crop'}" alt="${item.name}">
            <div class="service-info">
                <h3>${item.name}</h3>
                <p>${item.desc || 'Premium quality product.'}</p>
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 1rem;">Rs. ${item.price}</div>
                <button class="btn-primary w-100" onclick="buyStoreItem('${item.id}', '${item.name}')"><i class="fas fa-shopping-cart"></i> Buy Now</button>
            </div>
        `;
        grid.appendChild(div);
    });
};

window.buyStoreItem = function(id, name) {
    if (!currentUser) {
        alert("Please login to purchase items.");
        showAuthOverlay();
        return;
    }
    const reqId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    db.ref(`orders/${reqId}`).set({
        id: reqId,
        itemId: id,
        itemName: name,
        userId: currentUser.id,
        userName: currentUser.name,
        phone: currentUser.phone,
        timestamp: Date.now(),
        status: 'pending'
    });
    alert(`Order placed successfully! Order ID: ${reqId}`);
};

window.handleAddService = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-service-name').value;
    const id = Date.now();
    db.ref(`services/${id}`).set({ id, name });
    document.getElementById('new-service-name').value = '';
    alert('Service added!');
};

window.adminUpdateHomeInfo = function(e) {
    e.preventDefault();
    const title = document.getElementById('admin-home-title').value;
    const sub = document.getElementById('admin-home-sub').value;
    db.ref('homeData').set({ title, sub });
    alert('Home info updated!');
};

window.adminAddStoreItem = function(e) {
    e.preventDefault();
    const name = document.getElementById('admin-store-name').value;
    const price = document.getElementById('admin-store-price').value;
    const desc = document.getElementById('admin-store-desc').value;
    const id = Date.now();
    db.ref(`storeItems/${id}`).set({ id, name, price, desc, image: 'https://images.unsplash.com/photo-1550009158-9ebf6d250406?q=80&w=600&auto=format&fit=crop' });
    e.target.reset();
    alert('Store item added!');
};

window.deleteStoreItem = function(id) {
    if (confirm('Delete this store item?')) {
        db.ref(`storeItems/${id}`).remove();
    }
};

window.adminAddUser = function(e) {
    e.preventDefault();
    const name = document.getElementById('adm-new-name').value;
    const phone = document.getElementById('adm-new-phone').value;
    const pass = document.getElementById('adm-new-pass').value;
    const role = document.getElementById('adm-new-role').value;
    const district = document.getElementById('adm-new-district').value;
    const id = Date.now();

    const newUser = { id, name, phone, pass, role, district, status: 'approved', timestamp: id };
    db.ref('users/' + id).set(newUser);
    e.target.reset();
    alert('User created successfully and auto-approved!');
};

window.deleteRequest = function(id) {
    if (confirm('Delete this job request permanently?')) {
        db.ref('requests/' + id).remove();
    }
};

window.deleteOrder = function(id) {
    if (confirm('Delete this order?')) {
        db.ref('orders/' + id).remove();
    }
};

window.adminUpdateSettings = function(e) {
    e.preventDefault();
    const updates = {
        phone1: document.getElementById('admin-setting-phone1').value,
        phone2: document.getElementById('admin-setting-phone2').value,
        whatsapp: document.getElementById('admin-setting-wa').value,
        email: document.getElementById('admin-setting-email').value
    };
    db.ref('platformSettings').update(updates);
    alert('Platform Settings Saved!');
};

window.handleGalleryUpload = function(e) {
    e.preventDefault();
    const url = document.getElementById('gallery-url').value;
    const type = document.getElementById('gallery-type').value;
    const id = Date.now();
    db.ref(`gallery/${id}`).set({ id, url, type, timestamp: id });
    e.target.reset();
    alert('Uploaded to gallery!');
};

window.showProfileEdit = function() {
    if (!currentUser) return;
    let modal = document.getElementById('profile-modal');
    if (!modal) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'profile-modal';
        modalDiv.className = 'auth-overlay';
        modalDiv.innerHTML = `
            <div class="auth-box">
                <button class="close-auth" type="button" onclick="document.getElementById('profile-modal').classList.add('hidden')">&times;</button>
                <h2>Edit Profile</h2>
                <form onsubmit="handleProfileUpdate(event)" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="prof-name" value="${currentUser.name || ''}" required>
                    </div>
                    ${currentUser.role === 'provider' ? `
                    <div class="form-group">
                        <label>Bank Name</label>
                        <input type="text" id="prof-bank" value="${currentUser.bankName || ''}">
                    </div>
                    <div class="form-group">
                        <label>Account Number</label>
                        <input type="text" id="prof-acc" value="${currentUser.accNumber || ''}">
                    </div>
                    <div class="form-group">
                        <label>Branch</label>
                        <input type="text" id="prof-branch" value="${currentUser.bankBranch || ''}">
                    </div>
                    ` : ''}
                    <button type="submit" class="btn-primary w-100 mt-4">Save Profile</button>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
        modal = modalDiv;
    }
    modal.classList.remove('hidden');
};

window.handleProfileUpdate = function(e) {
    e.preventDefault();
    const updates = {
        name: document.getElementById('prof-name').value,
    };
    if (currentUser.role === 'provider') {
        updates.bankName = document.getElementById('prof-bank') ? document.getElementById('prof-bank').value : '';
        updates.accNumber = document.getElementById('prof-acc') ? document.getElementById('prof-acc').value : '';
        updates.bankBranch = document.getElementById('prof-branch') ? document.getElementById('prof-branch').value : '';
    }
    db.ref(`users/${currentUser.id}`).update(updates);
    alert('Profile updated successfully!');
    document.getElementById('profile-modal').classList.add('hidden');
    currentUser = { ...currentUser, ...updates };
    localStorage.setItem('navithya_session', JSON.stringify(currentUser));
    if (currentUser.role === 'provider') updateProviderDashboard();
};

// ====== SALES & SPONSOR ADS LOGIC ======
let sponsors = [];
let currentSponsorIndex = 0;

db.ref('sponsors').on('value', snap => {
    sponsors = snap.val() ? Object.values(snap.val()) : [];
    updateSponsorCycle();
});

function updateSponsorCycle() {
    const adContainer = document.getElementById('sponsor-ad-container');
    if (!adContainer || sponsors.length === 0) {
        if (adContainer) adContainer.innerHTML = '';
        return;
    }

    function showNextAd() {
        if (sponsors.length === 0) return;
        const ad = sponsors[currentSponsorIndex];
        adContainer.innerHTML = `
            <div class="sponsor-ad glass" style="animation: slideInRight 0.8s ease-out; margin-bottom: 2rem;">
                <div style="display:flex; align-items:center; gap:20px; padding: 20px;">
                    <img src="${ad.image}" style="width:80px; height:80px; border-radius:12px; object-fit:cover; border: 2px solid var(--primary);">
                    <div style="flex:1;">
                        <h4 style="color:var(--primary); font-size:1.2rem; margin-bottom:5px; font-weight:700;">${ad.name}</h4>
                        <p style="font-size:0.95rem; color:var(--text-muted); line-height:1.4;">${ad.tagline}</p>
                    </div>
                    <a href="${ad.link || '#'}" target="_blank" class="btn-primary" style="padding: 10px 20px; font-size:0.9rem; border-radius: 30px;">Visit Partner <i class="fas fa-external-link-alt"></i></a>
                </div>
            </div>
        `;
        currentSponsorIndex = (currentSponsorIndex + 1) % sponsors.length;
    }

    showNextAd();
    if (window.sponsorInterval) clearInterval(window.sponsorInterval);
    window.sponsorInterval = setInterval(showNextAd, 6000); // Cycle every 6 seconds
}

window.updateSalesPanel = function() {
    if (!currentUser || currentUser.role !== 'sales') return;

    const sponsorList = document.getElementById('sales-sponsors-list');
    if (sponsorList) {
        sponsorList.innerHTML = '';
        if (sponsors.length === 0) sponsorList.innerHTML = '<p style="color:var(--text-muted)">No active sponsors.</p>';
        sponsors.forEach(s => {
            const div = document.createElement('div');
            div.className = 'log-item glass';
            div.style.marginBottom = '10px';
            div.style.borderRadius = '8px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${s.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                        <div>
                            <strong style="color:var(--text)">${s.name}</strong><br>
                            <small style="color:var(--text-muted)">${s.tagline}</small>
                        </div>
                    </div>
                    <button onclick="deleteSponsor('${s.id}')" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:1.2rem;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            sponsorList.appendChild(div);
        });
    }
};

window.handleAddSponsor = function(e) {
    e.preventDefault();
    const name = document.getElementById('sponsor-name').value;
    const tagline = document.getElementById('sponsor-tagline').value;
    const image = document.getElementById('sponsor-image').value;
    const link = document.getElementById('sponsor-link').value;
    const id = Date.now();

    db.ref(`sponsors/${id}`).set({ id, name, tagline, image, link });
    e.target.reset();
    alert('Sponsor Advertisement successfully published!');
};

window.deleteSponsor = function(id) {
    if (confirm('Are you sure you want to remove this sponsor?')) {
        db.ref(`sponsors/${id}`).remove();
    }
};

navigate('home');
restoreSession();

// PWA & Push Notifications Setup
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            
            // Request push notification permission
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                        // In a full FCM setup, you would request a token here and save it to db.ref(`users/${currentUser.id}/fcmToken`)
                    }
                });
            }
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}


