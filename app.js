// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDD7dxbRk8e5R-6L8rnnPkgmsAiC-GROXc",
    authDomain: "file-boss.firebaseapp.com",
    databaseURL: "https://file-boss-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "file-boss",
    storageBucket: "file-boss.appspot.com",
    messagingSenderId: "603454141929",
    appId: "1:603454141929:web:72cbe1df562b65c1dfc778",
    measurementId: "G-L1MP458XD0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// DOM elements
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const appContainer = document.getElementById('app-container');
const createNoteBtn = document.getElementById('create-note-btn');
const createNoteModal = new bootstrap.Modal(document.getElementById('createNoteModal'));
const createNoteForm = document.getElementById('create-note-form');
const notesList = document.getElementById('notes-list');
const logoutBtn = document.getElementById('logout-btn');
const updateUsernameBtn = document.getElementById('update-username-btn');
const addDescriptionBtn = document.getElementById('add-description-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        showApp();
        loadNotes();
    } else {
        showAuth();
    }
});

// Show authentication form
function showAuth() {
    authContainer.classList.remove('d-none');
    appContainer.classList.add('d-none');
    renderLoginForm();
}

// Show main app
function showApp() {
    authContainer.classList.add('d-none');
    appContainer.classList.remove('d-none');
}

// Render login form
function renderLoginForm() {
    authForm.innerHTML = `
        <form id="login-form">
            <div class="mb-3">
                <input type="email" class="form-control" id="login-email" placeholder="Email" required>
            </div>
            <div class="mb-3">
                <input type="password" class="form-control" id="login-password" placeholder="Password" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
        </form>
        <p class="text-center mt-3">
            <a href="#" id="signup-link">Sign Up</a> | 
            <a href="#" id="forgot-password-link">Forgot Password</a>
        </p>
    `;

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-link').addEventListener('click', renderSignupForm);
    document.getElementById('forgot-password-link').addEventListener('click', renderForgotPasswordForm);
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(`Login error: ${error.message}`);
        });
}

// Render signup form
function renderSignupForm() {
    authForm.innerHTML = `
        <form id="signup-form">
            <div class="mb-3">
                <input type="email" class="form-control" id="signup-email" placeholder="Email" required>
            </div>
            <div class="mb-3">
                <input type="password" class="form-control" id="signup-password" placeholder="Password" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Sign Up</button>
        </form>
        <p class="text-center mt-3">
            <a href="#" id="login-link">Back to Login</a>
        </p>
    `;

    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('login-link').addEventListener('click', renderLoginForm);
}

// Handle signup
function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(`Signup error: ${error.message}`);
        });
}

// Render forgot password form
function renderForgotPasswordForm() {
    authForm.innerHTML = `
        <form id="forgot-password-form">
            <div class="mb-3">
                <input type="email" class="form-control" id="forgot-password-email" placeholder="Email" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Reset Password</button>
        </form>
        <p class="text-center mt-3">
            <a href="#" id="login-link">Back to Login</a>
        </p>
    `;

    document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);
    document.getElementById('login-link').addEventListener('click', renderLoginForm);
}

// Handle forgot password
function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-password-email').value;

    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert('Password reset email sent. Check your inbox.');
            renderLoginForm();
        })
        .catch((error) => {
            alert(`Error: ${error.message}`);
        });
}

// Load notes
function loadNotes() {
    const notesRef = database.ref('notes/' + auth.currentUser.uid);
    notesRef.on('value', (snapshot) => {
        notesList.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const note = childSnapshot.val();
                const noteElement = createNoteElement(childSnapshot.key, note);
                notesList.appendChild(noteElement);
            });
        } else {
            notesList.innerHTML = '<p class="text-center">No notes found. Create your first note!</p>';
        }
    }, (error) => {
        console.error("Error loading notes: ", error);
        notesList.innerHTML = '<p class="text-center">Error loading notes. Please try again later.</p>';
    });
}

// Create note element
function createNoteElement(id, note) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-3';
    col.innerHTML = `
        <div class="card note-card">
            <div class="card-body">
                <h5 class="card-title">${note.name}</h5>
                <p class="card-text">${note.content}</p>
                ${note.fileUrl ? `<img src="${note.fileUrl}" class="img-fluid mb-2" alt="Note attachment">` : ''}
                <button class="btn btn-danger btn-sm float-end delete-note" data-id="${id}">Delete</button>
            </div>
        </div>
    `;

    col.querySelector('.delete-note').addEventListener('click', () => deleteNote(id));
    return col;
}

// Create new note
createNoteBtn.addEventListener('click', () => {
    createNoteModal.show();
});

createNoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('note-name').value;
    const content = document.getElementById('note-content').value;
    const file = document.getElementById('note-file').files[0];

    if (file) {
        uploadFile(file, name, content);
    } else {
        saveNote(name, content);
    }
});

// Upload file
function uploadFile(file, name, content) {
    const storageRef = storage.ref(`notes/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);

    const progressBar = document.getElementById('upload-progress-bar');
    const progressContainer = document.getElementById('upload-progress-container');
    progressContainer.classList.remove('d-none');

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + '%';
        },
        (error) => {
            console.error("Upload error: ", error);
            progressContainer.classList.add('d-none');
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                saveNote(name, content, downloadURL);
                progressContainer.classList.add('d-none');
            });
        }
    );
}

// Save note
function saveNote(name, content, fileUrl = null) {
    const notesRef = database.ref('notes/' + auth.currentUser.uid);
    notesRef.push({
        name: name,
        content: content,
        fileUrl: fileUrl,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        createNoteForm.reset();
        createNoteModal.hide();
    }).catch((error) => {
        console.error("Error saving note: ", error);
    });
}

// Delete note
function deleteNote(id) {
    const noteRef = database.ref('notes/' + auth.currentUser.uid + '/' + id);
    noteRef.remove()
        .catch((error) => {
            console.error("Error deleting note: ", error);
        });
}

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Update username
updateUsernameBtn.addEventListener('click', () => {
    const newUsername = prompt("Enter new username:");
    if (newUsername) {
        auth.currentUser.updateProfile({
            displayName: newUsername
        }).then(() => {
            alert("Username updated successfully!");
        }).catch((error) => {
            console.error("Error updating username: ", error);
        });
    }
});

// Add profile description
addDescriptionBtn.addEventListener('click', () => {
    const newDescription = prompt("Enter your profile description:");
    if (newDescription) {
        const userRef = database.ref('users/' + auth.currentUser.uid);
        userRef.update({
            description: newDescription
        }).then(() => {
            alert("Profile description updated successfully!");
        }).catch((error) => {
            console.error("Error updating profile description: ", error);
        });
    }
});

// Delete account
deleteAccountBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        const user = auth.currentUser;
        const userId = user.uid;

        // Delete user data from Realtime Database
        database.ref('users/' + userId).remove()
            .then(() => {
                return database.ref('notes/' + userId).remove();
            })
            .then(() => {
                // Delete user account
                return user.delete();
            })
            .then(() => {
                alert("Your account and all associated data have been deleted.");
            })
            .catch((error) => {
                console.error("Error deleting account: ", error);
                alert("An error occurred while deleting your account. Please try again.");
            });
    }
});

// Initialize the app
renderLoginForm();