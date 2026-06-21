
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, push, serverTimestamp as dbServerTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { getFirestore, collection, addDoc, serverTimestamp as fsServerTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


// --- GLOBAL STATE ---

let hasLoginModalBeenShown = false;
let currentEditingImageElement = null;
let currentUser = null;
let selectedTheme = null;
let currentMode = 'canvas-en';
let chatHistory = [];
const CHAT_HISTORY_PROJECT_NAME = '__chat_history__';
const LOCAL_STORAGE_SYNC_KEY = 'sitee_user_sync';
let uploadedImageFiles = [];
let currentlySelectedElementInIframe = null;
let currentEditingIframe = null;
let currentEditingProjectTimestamp = null;
let audioContext, analyser, source, animationFrameId;
let mediaStream = null;
let isListening = false;
let finalTranscript = '';
let currentConfirmCallback = null;
let currentCodeCache = { html: '', react: '' };
const visualEditorHistories = new Map();



// --- DOM ELEMENTS ---
const removeTokenBtn = document.getElementById('remove-token-btn');

const netlifyDeployView = document.getElementById('netlify-deploy-view');
const selectNetlifyBtn = document.getElementById('select-netlify-deploy-btn');
const netlifyPublishForm = document.getElementById('netlify-publish-form');
const netlifyProjectNameInput = document.getElementById('netlify-project-name-input');
const netlifyPublishError = document.getElementById('netlify-publish-error');
const netlifyPublishConfirmBtn = document.getElementById('netlify-publish-confirm-btn');

const promptViewerModal = document.getElementById('prompt-viewer-modal');
const promptViewerContent = document.getElementById('prompt-viewer-content');
const closePromptModalBtn = document.getElementById('close-prompt-modal-btn');
const copyFullPromptBtn = document.getElementById('copy-full-prompt-btn');

const fontSelectorBtn = document.getElementById('font-family-select-btn');
const fontDropdown = document.getElementById('font-family-dropdown');
const fontBtnText = document.getElementById('font-family-select-btn'); // The button itself holds the text
const deployGithubBtn = document.getElementById('deploy-github-btn');
const githubDeployModal = document.getElementById('github-deploy-modal');
const closeGithubModalBtn = document.getElementById('close-github-modal-btn');
const githubDeployForm = document.getElementById('github-deploy-form');
const githubRepoNameInput = document.getElementById('github-repo-name-input');
const githubTokenInput = document.getElementById('github-token-input');
const githubDeployError = document.getElementById('github-deploy-error');
const githubDeployCancelBtn = document.getElementById('github-deploy-cancel-btn');
const githubDeployConfirmBtn = document.getElementById('github-deploy-confirm-btn');
const visualEditorPanel = document.getElementById('visual-editor-panel');
const authModal = document.getElementById('auth-modal');
const dashboardModal = document.getElementById('dashboard-modal');
const appContainer = document.querySelector('.app-container');
const userAvatar = document.getElementById('user-avatar');
const avatarWrapper = document.querySelector('.avatar-wrapper');
const avatarDropdown = document.getElementById('avatar-dropdown');
const canvas = document.getElementById('canvas');
const generateBtn = document.getElementById('generate');
const promptInput = document.getElementById('prompt');
const micBtn = document.getElementById('mic-btn');
const visualizerCanvas = document.getElementById('input-visualizer');
const visualizerCtx = visualizerCanvas.getContext('2d');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const projectList = document.getElementById('project-list');
const promptSuggestions = document.getElementById('prompt-suggestions');
const codeEditorModal = document.getElementById('code-editor-modal');
const codeEditorContent = document.getElementById('code-editor-content');
const closeEditorBtn = document.getElementById('close-editor-btn');
const creditDisplay = document.getElementById('credit-display');
const themeSelectorBtn = document.getElementById('theme-selector-btn');
const themeDropdown = document.getElementById('theme-dropdown');
const themeBtnText = document.getElementById('theme-btn-text');
const deleteAllBtn = document.getElementById('delete-all-btn');
const confirmationModal = document.getElementById('confirmation-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const modeSelector = document.getElementById('mode-selector');
const chatContainer = document.getElementById('chat-container');
const feedbackModal = document.getElementById('feedback-modal');
const closeFeedbackModalBtn = document.getElementById('close-feedback-modal-btn');
const feedbackForm = document.getElementById('feedback-form');
const feedbackTextarea = document.getElementById('feedback-textarea');
const suggestionModal = document.getElementById('ai-suggestion-modal');
const closeSuggestionModalBtn = document.getElementById('close-suggestion-modal-btn');
const regenerateSuggestionBtn = document.getElementById('regenerate-suggestion-btn');
const codeEditorTabs = document.getElementById('code-editor-tabs');
const copyEditorCodeBtn = document.getElementById('copy-editor-code-btn');
const downloadCodeBtn = document.getElementById('download-code-btn');
const downloadModal = document.getElementById('download-modal');
const downloadForm = document.getElementById('download-form');
const filenameInput = document.getElementById('filename-input');
const fileFormatSelect = document.getElementById('file-format-select');
const downloadCancelBtn = document.getElementById('download-cancel-btn');
const closeDownloadModalBtn = document.getElementById('close-download-modal-btn');
const uploadBtn = document.getElementById('upload-btn');
const imageUploadInput = document.getElementById('image-upload-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imageThumbnail = document.getElementById('image-thumbnail');
const removeImageBtn = document.getElementById('remove-image-btn');
const editImageModal = document.getElementById('edit-image-modal');
const closeEditImageModalBtn = document.getElementById('close-edit-image-modal-btn');
const editImageCancelBtn = document.getElementById('edit-image-cancel-btn');
const editImageSaveBtn = document.getElementById('edit-image-save-btn');
const chooseFileBtn = document.getElementById('choose-file-btn');
const imageUploadFromDevice = document.getElementById('image-upload-from-device');
const fileNameDisplay = document.getElementById('file-name-display');
const imageUrlInput = document.getElementById('image-url-input');
const visualEditorToolbar = document.getElementById('visual-editor-toolbar');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const deleteElementBtn = document.getElementById('delete-element-btn');
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
const closeDashboardModalBtn = document.getElementById('close-dashboard-modal');
const dashboardContent = document.getElementById('dashboard-content');
const logoutBtn = document.getElementById('logout-btn');
const loginBtn = document.getElementById('login-btn');
// --- ADD THESE NEW CONSTANTS ---
const buttonStyleGroup = document.getElementById('button-style-group');
const btnStyleFilled = document.getElementById('btn-style-filled');
const btnStyleOutline = document.getElementById('btn-style-outline');
const publishModal = document.getElementById('publish-modal');
const closePublishModalBtn = document.getElementById('close-publish-modal-btn');
const publishCancelBtn = document.getElementById('publish-cancel-btn');

const publishChoiceView = document.getElementById('publish-choice-view');
const siteeDeployView = document.getElementById('sitee-deploy-view');

const selectSiteeBtn = document.getElementById('select-sitee-deploy-btn');

const siteePublishForm = document.getElementById('sitee-publish-form');
const siteeSubdomainInput = document.getElementById('sitee-subdomain-input');
const siteePublishStatus = document.getElementById('sitee-publish-status');
const siteePublishConfirmBtn = document.getElementById('sitee-publish-confirm-btn');


const backendUrl = 'https://sitee-l7xy.onrender.com';
// Add with your other icon constants
const githubIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const unpublishIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>`;
const suggestionIcon = `<img src="https://www.sitee.in/assets/img/ico.svg" width="20" height="20" alt="Unpublish Icon">`;
const shareIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`;
const publishIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;
const fullscreenIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
const exitFullscreenIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`;
const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const copyCodeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
const editCodeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const micIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>`;
const stopIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`;
const generateIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/></svg>`;
const checkIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>`;
const thumbUpIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 176h358q32 0 56 24t24 56v80q0 7-1.5 15t-4.5 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406ZM200-120h80v-520h-80v520Z"/></svg>`;
const thumbDownIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M240-840h440v520L400-40l-50-50q-7-7-11.5-19t-4.5-23v-14l44-176H80q-32 0-56-24t-24-56v-80q0-7 1.5-15t4.5-15l120-282q9-20 30-34t44-14Zm120 80H240L120-480v80h360l-54 220 174-174v-406ZM760-840h-80v520h80v-520Z"/></svg>`;
const copyChatIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h560v80H200Zm160-720v480-480Z"/></svg>`;
const editChatIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`;
const resendIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-660v-140h80v280H520v-80h168q-32-54-87-87t-121-33q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>`;
const arrowLeftIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>`;
const arrowRightIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`;
const uploadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;
const undoIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Edit / Undo"> <path id="Vector" d="M10 8H5V3M5.29102 16.3569C6.22284 17.7918 7.59014 18.8902 9.19218 19.4907C10.7942 20.0913 12.547 20.1624 14.1925 19.6937C15.8379 19.225 17.2893 18.2413 18.3344 16.8867C19.3795 15.5321 19.963 13.878 19.9989 12.1675C20.0347 10.4569 19.5211 8.78001 18.5337 7.38281C17.5462 5.98561 16.1366 4.942 14.5122 4.40479C12.8878 3.86757 11.1341 3.86499 9.5083 4.39795C7.88252 4.93091 6.47059 5.97095 5.47949 7.36556" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg>`;

const redoIcon = `<svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" xml:space="preserve" fill="currentColor"><path d="M29,18c0,3.472-1.353,6.736-3.808,9.192S19.473,31,16,31c-3.472,0-6.736-1.352-9.192-3.807 C4.353,24.737,3,21.472,3,18s1.353-6.737,3.808-9.192C9.263,6.353,12.527,5,16,5h2.172l-1.586-1.586 c-0.781-0.781-0.781-2.047,0-2.828s2.047-0.781,2.828,0l5,5c0.781,0.781,0.781,2.047,0,2.828l-5,5c-0.782,0.782-2.059,0.769-2.828,0 c-0.781-0.781-0.781-2.047,0-2.828L18.172,9H16c-2.404,0-4.664,0.936-6.364,2.636C7.937,13.336,7,15.596,7,18 s0.937,4.664,2.636,6.364C11.336,26.064,13.597,27,16,27c2.404,0,4.664-0.936,6.364-2.636C24.063,22.664,25,20.403,25,18 c0-1.104,0.896-2,2-2S29,16.896,29,18z"></path></svg>`;
const themes = [{ name: 'Neubrutalism', promptHint: 'Uses stark contrasts, solid colors, and raw HTML elements.' }, { name: 'Cyberpunk', promptHint: 'Features dark backgrounds with neon accents and glitch effects.' }, { name: 'Corporate', promptHint: 'Clean, professional, with a structured layout and conservative colors.' }, { name: 'Kawaii Aesthetic', promptHint: 'Cute and playful with pastel colors and rounded elements.' }, { name: '80s Retro', promptHint: 'Vibrant neon colors, grid patterns, and retro fonts.' }, { name: 'Glassmorphism', promptHint: 'Creates a frosted-glass effect with blurred backgrounds and semi-transparent elements.' }];
const availableAvatars = [{ name: 'Pipo', path: 'avatar/image.png' }, { name: 'Zoe', path: 'avatar/image_.png' }];

// =================== PASTE THE FONT CODE HERE ===================
// --- EXPANDED FONT LIST ---
const fontFamilies = [
    // Sans-Serif
    { name: 'System Default', css: 'inherit' },
    { name: 'Inter', css: '"Inter", sans-serif' },
    { name: 'Roboto', css: '"Roboto", sans-serif' },
    { name: 'Lato', css: '"Lato", sans-serif' },
    { name: 'Montserrat', css: '"Montserrat", sans-serif' },
    { name: 'Open Sans', css: '"Open Sans", sans-serif' },
    { name: 'Poppins', css: '"Poppins", sans-serif' },
    { name: 'Nunito', css: '"Nunito", sans-serif' },
    { name: 'Verdana', css: 'Verdana, sans-serif' },
    { name: 'Arial', css: 'Arial, sans-serif' },

    // Serif
    { name: 'Playfair Display', css: '"Playfair Display", serif' },
    { name: 'Lora', css: '"Lora", serif' },
    { name: 'Merriweather', css: '"Merriweather", serif' },
    { name: 'EB Garamond', css: '"EB Garamond", serif' },
    { name: 'Times New Roman', css: 'Times New Roman, serif' },
    { name: 'Georgia', css: 'Georgia, serif' },

    // Display
    { name: 'Oswald', css: '"Oswald", sans-serif' },
    { name: 'Lobster', css: '"Lobster", cursive' },
    { name: 'Pacifico', css: '"Pacifico", cursive' },
    { name: 'Bebas Neue', css: '"Bebas Neue", sans-serif' },

    // Monospace
    { name: 'Roboto Mono', css: '"Roboto Mono", monospace' },
    { name: 'Source Code Pro', css: '"Source Code Pro", monospace' },
    { name: 'Courier New', css: 'Courier New, monospace' }
];

// --- COMPONENT LIBRARY ---
const componentLibrary = {
    'card-basic': `
        <div style="padding: 2rem; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; margin: 1rem 0; color: #333;">
            <h3>Basic Card Title</h3>
            <p>This is a new section. Click to edit this text and make it your own!</p>
        </div>
    `,
    'card-image': `
        <div style="border: 1px solid #ddd; border-radius: 8px; background-color: #fff; margin: 1rem 0; color: #333; overflow: hidden; text-align: left;">
            <img src="https://via.placeholder.com/400x200" alt="Placeholder Image" style="width: 100%; height: auto; display: block;">
            <div style="padding: 1.5rem;">
                <h3>Image Card Title</h3>
                <p>This card is great for showcasing products, portfolio items, or blog posts.</p>
            </div>
        </div>
    `,
    'card-testimonial': `
        <div style="padding: 2rem; border-left: 4px solid #3B82F6; background-color: #f0f2f5; margin: 1rem 0; color: #555;">
            <p style="font-style: italic; margin-bottom: 1rem;">"This is an amazing testimonial. The service was fantastic and I couldn't be happier with the result."</p>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="https://via.placeholder.com/50" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%;">
                <div>
                    <strong style="display: block; color: #333;">Jane Doe</strong>
                    <small>CEO, Example Corp</small>
                </div>
            </div>
        </div>
    `,
    'button': `
        <button class="btn-sitee btn-sitee-filled">Click Me</button>
    `,
};
// Global helper to open the modal
window.openPromptModal = (source) => {
    let textToShow = "";

    if (typeof source === 'string') {
        // Option 1: Passed raw text directly (from Sidebar)
        textToShow = source;
    } else if (source.tagName) {
        // Option 2: Passed a button element (from Chat)
        // Try to find the hidden span sibling first
        const wrapper = source.closest('.message-content'); 
        const hiddenSpan = wrapper ? wrapper.querySelector('.raw-prompt-data') : null;
        
        if (hiddenSpan) {
            textToShow = hiddenSpan.textContent;
        } else {
            // Fallback if structure is different
            textToShow = "Error: Could not retrieve prompt text.";
        }
    }

    const promptViewerModal = document.getElementById('prompt-viewer-modal');
    const promptViewerContent = document.getElementById('prompt-viewer-content');
    
    promptViewerContent.textContent = textToShow;
    promptViewerModal.style.display = 'flex';
};
function loadGoogleFonts() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lato:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700&family=Open+Sans:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@400;700&family=Roboto:wght@400;700&family=Merriweather:wght@400;700&family=Nunito:wght@400;700&family=EB+Garamond:wght@400;700&family=Lobster&family=Pacifico&family=Bebas+Neue&family=Roboto+Mono&family=Source+Code+Pro&display=swap';
    document.head.appendChild(link);
}

/**
 * Populates the font dropdown with available font families.
 */
function populateFontDropdown() {
    fontDropdown.innerHTML = '';
    fontFamilies.forEach(font => {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.textContent = font.name;
        item.style.fontFamily = font.css;
        item.addEventListener('click', () => {
            applyStyle('fontFamily', font.css);
            fontBtnText.textContent = font.name;
            fontDropdown.classList.remove('show');
        });
        fontDropdown.appendChild(item);
    });
}
// ===================================================================

// --- AUTH & INITIALIZATION ---
window.openAuthModal = () => {
    if (authModal) {
        authModal.style.display = 'flex';
        setTimeout(() => authModal.classList.add('active'), 10);
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${backendUrl}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not fetch user data from backend.');

            currentUser = await response.json();
            console.log('DATABASE DATA:', currentUser);
            initializeAppUI();

        } catch (error) {
            console.error("Error fetching user data:", error);
            currentUser = null;
            initializeAppUI();
            showNotification("Could not load your profile. Please try again.", "error");
        }
    } else {
        currentUser = null;
        initializeAppUI();
    }
});

function initializeAppUI() {
    if (currentUser) {
        document.getElementById('user-id').textContent = `ID: ${currentUser.id.slice(0, 10)}...`;
        updateCreditDisplay();
        renderProjects();
        loadChatHistory();
    } else {
        document.getElementById('user-id').textContent = 'Guest Mode';
        document.getElementById('credit-display').textContent = 'Log in for credits';
        if (projectList) projectList.innerHTML = '<p style="text-align:center; font-style:italic; color: var(--text-muted-color);">Log in to see your projects.</p>';
        if (chatContainer) chatContainer.innerHTML = '';
    }

    userAvatar.src = "avatar/image.png";
    populateAvatarDropdown();
    document.body.classList.add('loaded');
    checkCreditStatus();
    populateThemes();
    updateThemeSelectorPosition();
    updateHeaderButtons();
}

async function createUserInBackend(user) {
    const token = await user.getIdToken();
    try {
        const response = await fetch(`${backendUrl}/create-user`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 400 || response.status === 200) { return; }
        if (!response.ok) throw new Error("Failed to create user record on server.");
    } catch (error) {
        console.error("Error creating user in backend:", error);
        if (signupError) signupError.textContent = "Could not create user profile on server.";
    }
}

const closeAllModals = () => {
    if (authModal) { authModal.classList.remove('active'); setTimeout(() => authModal.style.display = 'none', 300); }
    if (dashboardModal) { dashboardModal.classList.remove('active'); setTimeout(() => dashboardModal.style.display = 'none', 300); }
};

const showLoginView = () => {
    if (loginView) loginView.style.display = 'block';
    if (signupView) signupView.style.display = 'none';
    if (verificationView) verificationView.style.display = 'none';
    if (forgotPasswordView) forgotPasswordView.style.display = 'none';
};

function updateHeaderButtons() {
    // This function now correctly handles the new login button
    if (currentUser) {
        // User is LOGGED IN
        loginBtn.style.display = 'none';
        dashboardBtn.style.display = 'flex';

        // THE FIX: Use 'subscriptionTier' to be consistent with the rest of your code.
        const plan = (currentUser.subscriptionTier || 'free').toLowerCase();

        if (plan === 'creator' || plan === 'free') {
            upgradeBtn.style.display = 'flex'; // SHOW button for 'creator' and 'free'
        } else {
            upgradeBtn.style.display = 'none'; // HIDE button for 'pro' and other plans
        }
    } else {
        // User is LOGGED OUT
        loginBtn.style.display = 'flex';
        dashboardBtn.style.display = 'none';
        upgradeBtn.style.display = 'none';
    }
}
function renderImagePreviews() {
    imagePreviewContainer.innerHTML = ''; // Clear existing previews
    if (uploadedImageFiles.length === 0) {
        imagePreviewContainer.style.display = 'none';
        return;
    }

    uploadedImageFiles.forEach((file, index) => {
        const previewWrapper = document.createElement('div');
        previewWrapper.style.position = 'relative';

        const thumb = document.createElement('img');
        thumb.id = 'image-thumbnail';
        thumb.src = URL.createObjectURL(file);
        thumb.onload = () => URL.revokeObjectURL(thumb.src); // Free up memory

        const removeBtn = document.createElement('button');
        removeBtn.id = 'remove-image-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = `Remove ${file.name}`;
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            uploadedImageFiles.splice(index, 1); // Remove the file from the array
            renderImagePreviews(); // Re-render the previews
        };

        previewWrapper.appendChild(thumb);
        previewWrapper.appendChild(removeBtn);
        imagePreviewContainer.appendChild(previewWrapper);
    });

    imagePreviewContainer.style.display = 'flex';
}

/**
 * Reads an array of File objects and converts them to base64 strings.
 * @returns {Promise<object[]>} Resolves to an array of objects like {data, size}.
 */
function readFilesAsDataUrls(files) {
    return Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve({ data: e.target.result, size: file.size });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }));
}
function openDashboardModal() {
    if (!currentUser) {
        showNotification('Please log in to view your dashboard.', 'error');
        window.openAuthModal();
        return;
    }
    populateDashboard();
    dashboardModal.style.display = 'flex';
    setTimeout(() => dashboardModal.classList.add('active'), 10);
}

function populateDashboard() {
    if (!currentUser || !auth.currentUser) {
        dashboardContent.innerHTML = '<p>Could not load user data. Please log in again.</p>';
        return;
    }

    const email = auth.currentUser.email;
    const plan = (currentUser.subscriptionTier || 'Free').toLowerCase();
    const validity = currentUser.plan_validity ? new Date(currentUser.plan_validity).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
    const credits = currentUser.credits ?? 'N/A';

    // --- START: MODIFIED LOGIC FOR DYNAMIC UNITS ---
    const storageUsedMB = currentUser.storage_used_mb || 0;
    let totalMB = 0;
    let usedText = '';
    let totalText = '';

    if (plan === 'creator') {
        totalMB = 2 * 1024; // 2 GB
    } else if (plan === 'pro') {
        totalMB = 10 * 1024; // 10 GB
    }

    // Conditionally display MB or GB based on usage
    if (storageUsedMB < 1024) {
        // If less than 1 GB used, show in MB
        usedText = `${storageUsedMB.toFixed(2)} MB used`;
        totalText = `${(totalMB / 1024).toFixed(0)} GB total`;
    } else {
        // If 1 GB or more is used, show in GB
        usedText = `${(storageUsedMB / 1024).toFixed(2)} GB used`;
        totalText = `${(totalMB / 1024).toFixed(0)} GB total`;
    }

    const usagePercentage = totalMB > 0 ? (storageUsedMB / totalMB) * 100 : 0;

    const storageHTML = `
        <div class="storage-progress-container">
            <div class="storage-progress-text">
                <span>${usedText}</span>
                <span>${totalText}</span>
            </div>
            <div class="storage-progress-bar">
                <div class="storage-progress-bar-fill" style="width: ${usagePercentage}%;"></div>
            </div>
        </div>
    `;
    // --- END: MODIFIED LOGIC ---

    dashboardContent.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value" title="${email}">${email}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Current Plan:</span>
            <span class="detail-value" style="text-transform: capitalize;">${plan}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Remaining Credits:</span>
            <span class="detail-value">${credits}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Image Storage:</span>
            <div class="detail-value" style="flex: 1; max-width: 60%;">${storageHTML}</div>
        </div>
         <div class="detail-item">
            <span class="detail-label">Plan Validity:</span>
            <span class="detail-value">${validity}</span>
        </div>
    `;
}
// --- END: ADDED FUNCTIONS FOR DASHBOARD ---

// --- CORE APP LOGIC & UI FUNCTIONS ---
// Add this function
function clearImageUpload() {
    uploadedImageFile = null;
    imageUploadInput.value = ''; // Clear the file input
    imagePreviewContainer.style.display = 'none';
    imageThumbnail.src = '';
}

// And also add this function
function makeIframeImagesEditable(iframe) {
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return;

        const images = doc.getElementsByTagName('img');
        for (const img of images) {
            img.addEventListener('click', (e) => {
                if (currentMode === 'visual-edit') {
                    e.preventDefault();
                    e.stopPropagation(); // Stop the event to prevent other editor listeners from firing.
                    currentEditingImageElement = img;
                    editImageModal.style.display = 'flex';
                }
            });
        }
    } catch (error) {
        console.warn("Could not make iframe images editable:", error);
    }
}
// --- ADD THIS ENTIRE FUNCTION ---
async function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken(true); // Force refresh token
            headers['Authorization'] = `Bearer ${token}`;
        } catch (error) {
            console.error("Could not get auth token:", error);
            // Optionally handle the error, e.g., prompt for re-login
        }
    }
    return headers;
}
function updateCreditDisplay() {
    if (currentUser) {
        creditDisplay.textContent = `Credits: ${currentUser.credits}`;
    }
}

function checkCreditStatus() {
    if (!currentUser) {
        promptInput.placeholder = "Sign in or Sign up to start generating...";
        promptInput.disabled = false;
        generateBtn.disabled = false;
        return;
    }
    const hasCredits = currentUser.credits > 0;
    promptInput.disabled = !hasCredits;
    generateBtn.disabled = !hasCredits;
    const isChat = currentMode === 'chat';
    if (isChat) {
        promptInput.placeholder = hasCredits ? "Message Sitee..." : "No credits remaining.";
    } else {
        promptInput.placeholder = hasCredits ? "Describe your idea..." : "No credits remaining.";
    }
    if (!hasCredits) {
        showNotification("You have run out of credits.", "error");
    }
}
// REPLACE your old handleGenerateClick function with this new one

async function handleGenerateClick() {
    if (!auth.currentUser || !auth.currentUser.emailVerified) {
        window.openAuthModal();
        showNotification('Please sign up or log in to generate.', 'error');
        return;
    }
    if (!currentUser || currentUser.credits <= 0) {
        checkCreditStatus();
        return;
    }

    let userPrompt = promptInput.value.trim();

    if (uploadedImageFiles.length > 0) {
        if (!userPrompt) {
            userPrompt = "Create a website based on the uploaded images.";
        }

        try {
            const imageDataArray = await readFilesAsDataUrls(uploadedImageFiles);
            const allBase64Data = imageDataArray.map(item => item.data);
            const totalSize = imageDataArray.reduce((sum, item) => sum + item.size, 0);

            createSiteContainer(userPrompt, null, { data: allBase64Data, size: totalSize });

            promptSuggestions.classList.add('hidden');
            uploadedImageFiles = []; // Clear files after use
            renderImagePreviews();

        } catch (error) {
            console.error("Error reading image files:", error);
            showNotification("Could not process one or more images.", "error");
        }

    } else {
        // This is the existing logic for text-only generation.
        if (!userPrompt) return;

        let finalPrompt = userPrompt;
        if (selectedTheme) {
            finalPrompt = `${userPrompt} in a ${selectedTheme.name} style.`;
        }
        createSiteContainer(finalPrompt);
        promptSuggestions.classList.add('hidden');
    }

    promptInput.value = '';
    autoResizePrompt.call(promptInput);
}


async function generateWebsite(promptText, images = null) {
    // 1. Setup UI (Disable buttons, show loader)
    const generateBtn = document.getElementById('generate');
    generateBtn.disabled = true;
    document.body.classList.add('generating'); // Triggers your blob CSS animations

    // (Assuming you create a new target element for the code/HTML here)
    // const targetCodeElement = document.getElementById('code-editor-content');
    // targetCodeElement.textContent = ''; 
    let accumulatedCode = "";

    try {
        // 2. Call the new streaming endpoint
        const response = await fetch('http://localhost:8000/generate/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${userToken}` // Add your Firebase auth token here
            },
            body: JSON.stringify({
                prompt: promptText,
                target_language: "html",
                // user_id: currentUserId,
                // image_data: images
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to generate");
        }

        // 3. Turn off the main loader as soon as the first byte arrives
        document.body.classList.remove('generating');

        // 4. Initialize the Stream Reader
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the raw bytes into a string
            const chunkString = decoder.decode(value, { stream: true });
            
            // SSE chunks are separated by double newlines
            const events = chunkString.split('\n\n');

            for (const event of events) {
                if (event.startsWith('data: ')) {
                    try {
                        // Parse the JSON data from the event
                        const data = JSON.parse(event.slice(6));
                        
                        if (data.error) {
                            console.error("Backend Error:", data.error);
                            // Show your red error notification here
                            break;
                        }
                        
                        if (data.done) {
                            console.log("Stream successfully completed!");
                            break;
                        }
                        
                        if (data.chunk) {
                            accumulatedCode += data.chunk;
                            
                            // 5. Frontend Regex Cleanup (Strips ```html if the AI disobeys)
                            let displayCode = accumulatedCode
                                .replace(/^```[a-z]*\n/gi, '')
                                .replace(/```$/g, '');
                                
                            // 6. Update the UI in real-time
                            // targetCodeElement.textContent = displayCode;
                            
                            // Auto-scroll the chat container so the user sees the text typing
                            const chatContainer = document.getElementById('chat-container');
                            if (chatContainer) {
                                chatContainer.scrollTop = chatContainer.scrollHeight;
                            }
                        }
                    } catch (e) {
                        // Ignore parsing errors for incomplete chunks
                        console.warn("JSON Parse skipped for chunk:", e);
                    }
                }
            }
        }

        // 7. Post-Generation Actions
        // Apply syntax highlighting once fully generated
        if (window.hljs) {
            // hljs.highlightElement(targetCodeElement);
        }
        
        // Push the final 'displayCode' into your iframe preview
        // updateIframePreview(accumulatedCode);

    } catch (error) {
        console.error("Generation failed:", error);
        // showNotification("Generation failed. Please try again.", "error");
    } finally {
        // Reset UI state
        generateBtn.disabled = false;
        document.body.classList.remove('generating');
    }
}

function convertOldHistory(oldHistory) {
    const newHistory = [];
    let currentTurn = null;
    oldHistory.forEach(msg => {
        if (msg.role === 'user') {
            if (currentTurn) {
                newHistory.push(currentTurn);
            }
            currentTurn = { id: Date.now() + Math.random(), prompt: msg.content, responses: [], displayIndex: 0 };
        } else if (msg.role === 'ai' && currentTurn) {
            currentTurn.responses.push({ content: msg.content });
            currentTurn.displayIndex = currentTurn.responses.length - 1;
        }
    });
    if (currentTurn) {
        newHistory.push(currentTurn);
    }
    return newHistory;
}

function updateTurnUI(turnContainer, turn, isLoading = false) {
    if (!turnContainer || !turn) return;
    const aiMessageWrapper = turnContainer.querySelector('.ai-message .message-wrapper');
    if (!aiMessageWrapper) return;
    aiMessageWrapper.innerHTML = '';
    const aiMessageHeader = document.createElement('div');
    aiMessageHeader.className = 'ai-message-header';
    if (turn.responses.length > 1) {
        const nav = document.createElement('div');
        nav.className = 'response-nav';
        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn';
        prevBtn.innerHTML = arrowLeftIcon;
        prevBtn.disabled = turn.displayIndex === 0;
        prevBtn.onclick = () => {
            if (turn.displayIndex > 0) {
                turn.displayIndex--;
                updateTurnUI(turnContainer, turn);
                saveChatHistory();
            }
        };
        const counter = document.createElement('span');
        counter.textContent = `${turn.displayIndex + 1} / ${turn.responses.length}`;
        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn';
        nextBtn.innerHTML = arrowRightIcon;
        nextBtn.disabled = turn.displayIndex >= turn.responses.length - 1;
        nextBtn.onclick = () => {
            if (turn.displayIndex < turn.responses.length - 1) {
                turn.displayIndex++;
                updateTurnUI(turnContainer, turn);
                saveChatHistory();
            }
        };
        nav.append(prevBtn, counter, nextBtn);
        aiMessageHeader.appendChild(nav);
    }
    aiMessageWrapper.appendChild(aiMessageHeader);
    const aiContentDiv = document.createElement('div');
    aiContentDiv.className = 'message-content';
    if (isLoading) {
        aiContentDiv.innerHTML = '<div class="spinner" style="width:20px; height:20px; border-width:2px;"></div>';
    } else {
        const response = turn.responses[turn.displayIndex];
        if (response) {
            aiContentDiv.innerHTML = marked.parse(response.content);
            if (window.MathJax) {
                MathJax.typesetPromise([aiContentDiv]).catch((err) => console.error('MathJax typesetting error:', err));
            }
            aiContentDiv.querySelectorAll('pre').forEach(addCopyButton);
            aiContentDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            aiContentDiv.innerHTML = "No response yet.";
        }
    }
    aiMessageWrapper.appendChild(aiContentDiv);
    if (!isLoading && turn.responses.length > 0) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        const thumbUpBtn = document.createElement('button');
        thumbUpBtn.className = 'feedback-btn thumb-up';
        thumbUpBtn.innerHTML = thumbUpIcon;
        thumbUpBtn.title = 'Good response';
        const thumbDownBtn = document.createElement('button');
        thumbDownBtn.className = 'feedback-btn thumb-down';
        thumbDownBtn.innerHTML = thumbDownIcon;
        thumbDownBtn.title = 'Bad response';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'feedback-btn copy-chat';
        copyBtn.innerHTML = copyChatIcon;
        copyBtn.title = 'Copy';
        actionsDiv.append(thumbUpBtn, thumbDownBtn, copyBtn);
        aiMessageWrapper.appendChild(actionsDiv);
        const currentResponseContent = turn.responses[turn.displayIndex].content;
        thumbUpBtn.addEventListener('click', (e) => {
            e.currentTarget.parentElement.querySelectorAll('.feedback-btn').forEach(btn => btn.disabled = true);
            e.currentTarget.classList.add('active');
            showNotification('Thanks for your feedback!', 'success');
        });
        thumbDownBtn.addEventListener('click', () => {
            feedbackModal.style.display = 'flex';
            feedbackModal.dataset.messageContent = currentResponseContent;
        });
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(currentResponseContent).then(() => {
                showNotification('Copied to clipboard!', 'success');
            }).catch(err => console.error('Failed to copy text: ', err));
        });
    }
}

function appendTurn(turn, isLoading = false) {
    const turnContainer = document.createElement('div');
    turnContainer.className = 'turn-container';
    turnContainer.dataset.id = turn.id;
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-message user-message';
    userMessageDiv.dataset.content = turn.prompt;
    const userAvatarImg = document.createElement('img');
    userAvatarImg.className = 'avatar';
    userAvatarImg.src = userAvatar.src || 'avatar/image.png';
    const userMessageWrapper = document.createElement('div');
    userMessageWrapper.className = 'message-wrapper';
    const userContentDiv = document.createElement('div');
    userContentDiv.className = 'message-content';
    // 1. Render the Markdown
    userContentDiv.innerHTML = marked.parse(turn.prompt);

    // ... inside appendTurn function ...

    // 2. Add the Direct Copy Button
    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'user-message-tools';
    toolsDiv.contentEditable = "false"; 

    const copyBtn = document.createElement('button');
    copyBtn.className = 'user-tool-btn';
    copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
           <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/>
        </svg>
        Copy
    `;
    
    copyBtn.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(turn.prompt).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#4ADE80" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> Copied!`;
            copyBtn.style.color = "#4ADE80";
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.color = "";
            }, 2000);
        });
    };

    toolsDiv.appendChild(copyBtn);
    userContentDiv.appendChild(toolsDiv);
    // Safely set text to avoid HTML injection in the hidden span
    toolsDiv.querySelector('.raw-prompt-data').textContent = turn.prompt;
    userContentDiv.appendChild(toolsDiv);
    const userActionsDiv = document.createElement('div');
    userActionsDiv.className = 'message-actions';
    const resendBtn = document.createElement('button');
    resendBtn.className = 'feedback-btn resend-chat';
    resendBtn.innerHTML = resendIcon;
    resendBtn.title = 'Resend';
    resendBtn.addEventListener('click', () => sendChatMessage(turn.prompt, turn));
    const editBtn = document.createElement('button');
    editBtn.className = 'feedback-btn edit-chat';
    editBtn.innerHTML = editChatIcon;
    editBtn.title = 'Edit';
    userActionsDiv.append(editBtn, resendBtn);
    userMessageWrapper.append(userContentDiv, userActionsDiv);
    userMessageDiv.append(userAvatarImg, userMessageWrapper);
    editBtn.addEventListener('click', () => {
        userContentDiv.contentEditable = "true";
        userContentDiv.style.border = "1px solid var(--accent-color)";
        userContentDiv.focus();
        userActionsDiv.style.display = 'none';
        const editActionsDiv = document.createElement('div');
        editActionsDiv.className = 'message-actions';
        editActionsDiv.style.opacity = 1;
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save & Regenerate';
        saveBtn.className = 'feedback-btn edit-mode-btn save';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'feedback-btn edit-mode-btn cancel';
        editActionsDiv.append(saveBtn, cancelBtn);
        userMessageWrapper.appendChild(editActionsDiv);
        const restoreUI = () => {
            userContentDiv.contentEditable = "false";
            userContentDiv.style.border = "none";
            editActionsDiv.remove();
            userActionsDiv.style.display = 'flex';
        };
        cancelBtn.addEventListener('click', () => {
            userContentDiv.innerHTML = marked.parse(turn.prompt);
            restoreUI();
        });
        saveBtn.addEventListener('click', async () => {
            const newContent = userContentDiv.textContent.trim();
            if (newContent && newContent !== turn.prompt) {
                turn.prompt = newContent;
                userMessageDiv.dataset.content = newContent;
                userContentDiv.innerHTML = marked.parse(newContent);
                restoreUI();
                await sendChatMessage(newContent, turn);
            } else {
                restoreUI();
            }
        });
    });
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'chat-message ai-message';
    const aiAvatarImg = document.createElement('img');
    aiAvatarImg.className = 'avatar';
    aiAvatarImg.src = 'avatar/site.png';
    const aiMessageWrapper = document.createElement('div');
    aiMessageWrapper.className = 'message-wrapper';
    aiMessageDiv.append(aiAvatarImg, aiMessageWrapper);
    turnContainer.append(userMessageDiv, aiMessageDiv);
    chatContainer.appendChild(turnContainer);
    updateTurnUI(turnContainer, turn, isLoading);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendChatMessage(prompt, turnToUpdate = null) {
    if (!document.body.classList.contains('chat-started')) {
        document.body.classList.add('chat-started');
    }
    let turn;
    const isResend = !!turnToUpdate;
    if (isResend) {
        turn = turnToUpdate;
    } else {
        turn = { id: Date.now(), prompt: prompt, responses: [], displayIndex: 0 };
        chatHistory.push(turn);
        appendTurn(turn, true);
    }
    const turnContainer = document.querySelector(`.turn-container[data-id='${turn.id}']`);
    if (!turnContainer) {
        console.error("Could not find turn container for ID:", turn.id);
        return;
    }
    updateTurnUI(turnContainer, turn, true);
    try {
        const response = await fetch(`${backendUrl}/generate/`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ prompt: prompt, is_chat_mode: true, user_id: currentUser.id })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const aiResponse = result.html;
        turn.responses.push({ content: aiResponse });
        turn.displayIndex = turn.responses.length - 1;
        updateTurnUI(turnContainer, turn);
        await saveChatHistory();
        if (result.credits_remaining !== undefined) {
            currentUser.credits = result.credits_remaining;
            updateCreditDisplay();
        }
        checkCreditStatus();
    } catch (error) {
        console.error("Error in chat:", error);
        const errorContent = "Sorry, I couldn't get a response. Please check the server connection and try again.";
        if (isResend) {
            turn.responses.push({ content: errorContent });
            turn.displayIndex = turn.responses.length - 1;
        } else {
            turn.responses[0] = { content: errorContent };
        }
        updateTurnUI(turnContainer, turn);
    }
}

function addCopyButton(preElement) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-code-btn';
    copyButton.innerHTML = copyIconSVG;
    copyButton.title = 'Copy code';
    preElement.appendChild(copyButton);
    copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = preElement.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            copyButton.innerHTML = checkIconSVG;
            setTimeout(() => {
                copyButton.innerHTML = copyIconSVG;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
}
// --- REPLACE your existing createSiteContainer function with this one ---
function createSiteContainer(prompt, projectData = null, imageData = null) {
    if (projectData) {
        // Look for an existing window with this specific timestamp
        const existingWindow = document.querySelector(`.site-container[data-timestamp="${projectData.timestamp}"]`);
        
        if (existingWindow) {
            // It is already open! Just bring it to the front.
            existingWindow.style.zIndex = getMaxZIndex() + 1;
            
            // Optional: Highlight it briefly so the user knows where it is
            existingWindow.style.transition = "transform 0.1s";
            existingWindow.style.transform = "scale(1.02)";
            setTimeout(() => existingWindow.style.transform = "scale(1)", 100);
            
            return; // STOP here. Do not create a new window.
        }
    }

    const container = document.createElement('div');
    container.className = 'site-container glassy';
    container.style.top = `${Math.random() * 20 + 5}%`;
    container.style.left = `${Math.random() * 50 + 5}%`;
    container.style.zIndex = getMaxZIndex() + 1;

    const header = document.createElement('div');
    header.className = 'site-header';

    const reviewTag = document.createElement('div');
    reviewTag.className = 'review-tag';
    reviewTag.textContent = 'Preview';
    header.appendChild(reviewTag);

    const windowControls = document.createElement('div');
    windowControls.className = 'window-controls';


    const suggestionBtn = document.createElement('button');
    suggestionBtn.className = 'control-btn suggestion-btn';
    suggestionBtn.innerHTML = suggestionIcon;
    suggestionBtn.title = 'Get Sitee Suggestions for Improvement';
    windowControls.appendChild(suggestionBtn);

    const publishBtn = document.createElement('button');
    publishBtn.className = 'control-btn publish-btn';
    publishBtn.innerHTML = publishIcon;
    publishBtn.title = 'Publish and get link';
    windowControls.appendChild(publishBtn);

    const updateBtn = document.createElement('button');
    updateBtn.className = 'control-btn update-btn';
    updateBtn.title = 'Update live site';
    updateBtn.style.display = 'none'; // Initially hidden
    updateBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`;
    windowControls.appendChild(updateBtn);

    // --- ADD THIS EVENT LISTENER ---
    updateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const timestamp = parseInt(container.dataset.timestamp, 10);
        handleUpdateSiteePublish(timestamp);
    });

    // RESTORED: Undo and Redo buttons
    const localUndoBtn = document.createElement('button');
    localUndoBtn.className = 'control-btn undo-btn';
    localUndoBtn.title = 'Undo';
    localUndoBtn.innerHTML = undoIcon;
    localUndoBtn.disabled = true;

    const localRedoBtn = document.createElement('button');
    localRedoBtn.className = 'control-btn redo-btn';
    localRedoBtn.title = 'Redo';
    localRedoBtn.innerHTML = redoIcon;
    localRedoBtn.disabled = true;

    // RESTORED: Compare button
    const compareBtn = document.createElement('button');
    compareBtn.className = 'control-btn compare-btn';
    compareBtn.title = 'Compare Changes';
    compareBtn.style.display = 'none'; // Initially hidden
    compareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm8.5 0v12H14a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8.5zM7.5 15V1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5.5z"/></svg>`;
    windowControls.appendChild(compareBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'control-btn edit-btn';
    editBtn.innerHTML = editCodeIcon;
    editBtn.title = 'Edit Code';
    windowControls.appendChild(editBtn);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'control-btn copy-btn';
    copyBtn.innerHTML = copyCodeIcon;
    copyBtn.title = 'Copy Code';
    windowControls.appendChild(copyBtn);

    const fullBtn = document.createElement('button');
    fullBtn.className = 'control-btn';
    fullBtn.innerHTML = fullscreenIcon;
    fullBtn.title = 'Fullscreen';
    windowControls.appendChild(fullBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'control-btn delete-btn';
    deleteBtn.innerHTML = deleteIcon;
    deleteBtn.title = 'Delete';
    windowControls.appendChild(deleteBtn);

    header.appendChild(windowControls);
    container.appendChild(header);

    const preview = document.createElement('div');
    preview.className = 'preview';
    container.appendChild(preview);

    const refineControls = document.createElement('div');
    refineControls.className = 'refine-controls';
    refineControls.innerHTML = `<input type="text" class="refine-input" placeholder="Regenerate a part or add a feature..."><button class="refine-btn">Refine</button>`;
    container.appendChild(refineControls);

    const stats = document.createElement('div');
    stats.className = 'stats';
    container.appendChild(stats);

    const feedbackWidget = document.createElement('div');
    feedbackWidget.className = 'feedback-widget';
    feedbackWidget.dataset.refinementCount = '0';
    feedbackWidget.innerHTML = `
        <div class="feedback-initial-prompt">
            <span class="feedback-prompt-text">How was this generation?</span>
            <div class="feedback-actions">
                <button class="feedback-rate-btn" data-rating="good" title="Good generation">👍</button>
                <button class="feedback-rate-btn" data-rating="bad" title="Bad generation">👎</button>
            </div>
        </div>
        <div class="feedback-details hidden">
            <p class="feedback-details-prompt"></p>
            <div class="feedback-tags"></div>
            <textarea class="feedback-comment" placeholder="Any other comments? (Optional)"></textarea>
            <button class="feedback-submit-btn">Submit Feedback</button>
        </div>
    `;
    container.appendChild(feedbackWidget);
    feedbackWidget.style.display = 'none';

    function attachFeedbackListeners(widget, cont, currentPrompt) {
        const actions = widget.querySelector('.feedback-actions');
        const details = widget.querySelector('.feedback-details');
        const detailsPrompt = widget.querySelector('.feedback-details-prompt');
        const tagsContainer = widget.querySelector('.feedback-tags');
        const submitBtn = widget.querySelector('.feedback-submit-btn');
        let currentRating = null;

        actions.querySelectorAll('.feedback-rate-btn').forEach(btn => {
            btn.onclick = (e) => {
                currentRating = e.currentTarget.dataset.rating;
                actions.querySelectorAll('.feedback-rate-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const positiveTags = ['Aesthetics', 'Creativity', 'Code Quality', 'Followed Prompt Well'];
                const negativeTags = ['Layout', 'Colors', 'Fonts', 'Unresponsive', 'Code Error', 'Didn’t Follow Prompt'];
                const tagsToShow = currentRating === 'good' ? positiveTags : negativeTags;
                detailsPrompt.textContent = currentRating === 'good' ? 'What did you like?' : 'What went wrong?';
                tagsContainer.innerHTML = tagsToShow.map(tag => `<button class="feedback-tag">${tag}</button>`).join('');
                tagsContainer.querySelectorAll('.feedback-tag').forEach(tagBtn => {
                    tagBtn.onclick = () => tagBtn.classList.toggle('selected');
                });
                details.classList.remove('hidden');
                actions.querySelectorAll('button').forEach(b => b.disabled = true);
            };
        });

        submitBtn.onclick = () => {
            const selectedTags = Array.from(tagsContainer.querySelectorAll('.feedback-tag.selected')).map(t => t.textContent);
            const comment = widget.querySelector('.feedback-comment').value;
            saveGenerationFeedback(cont, currentRating, selectedTags, comment, currentPrompt);
        };
    }

    attachFeedbackListeners(feedbackWidget, container, prompt || (projectData ? projectData.name : ''));

    const publishInfo = document.createElement('div');
    publishInfo.className = 'publish-info';
    container.appendChild(publishInfo);

    makeDraggable(container);
    canvas.appendChild(container);

    const iframe = document.createElement('iframe');
    
    iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";
    iframe.addEventListener('contextmenu', e => e.preventDefault());
    preview.appendChild(iframe);

    const refineInput = refineControls.querySelector('.refine-input');
    const refineBtn = refineControls.querySelector('.refine-btn');

    // ALL EVENT LISTENERS ARE ATTACHED HERE

    refineBtn.addEventListener('click', async () => {
        pushStateForIframe(iframe); // Save state before refining
        const refinePrompt = refineInput.value.trim();
        if (!refinePrompt) return showNotification('Please enter what you want to refine.', 'error');

        const currentHtml = getCleanIframeHtml(iframe);
        if (!currentHtml) return showNotification('No website content to refine.', 'error');

        const loading = container.querySelector('.loading') || document.createElement('div');
        if (!loading.parentElement) {
            loading.className = 'loading';
            loading.innerHTML = `<div class="spinner"></div>`;
            preview.appendChild(loading);
        }
        loading.style.display = 'flex';
        feedbackWidget.style.display = 'none'; // Hide feedback during refinement
        document.body.classList.add('generating');

        try {
            const response = await fetch(`${backendUrl}/generate/`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ prompt: refinePrompt, existing_html: currentHtml, user_id: currentUser.id })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            iframe.srcdoc = result.html;
            compareBtn.style.display = 'flex'; // Show compare button after refinement

            const timestamp = parseInt(container.dataset.timestamp);
            if (timestamp) await updateProjectCode(timestamp, result.html);

            if (result.credits_remaining !== undefined) {
                currentUser.credits = result.credits_remaining;
                updateCreditDisplay();
            }
            checkCreditStatus();
            refineInput.value = '';

            const count = parseInt(feedbackWidget.dataset.refinementCount, 10) + 1;
            feedbackWidget.dataset.refinementCount = count;
            feedbackWidget.classList.remove('submitted');
            feedbackWidget.querySelector('.feedback-details').classList.add('hidden');
            feedbackWidget.querySelector('.feedback-comment').value = '';
            feedbackWidget.querySelector('.feedback-prompt-text').textContent = `How was refinement #${count}?`;
            feedbackWidget.querySelectorAll('.feedback-actions button').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('active');
            });
            attachFeedbackListeners(feedbackWidget, container, refinePrompt);

        } catch (error) {
            console.error("Error refining website:", error);
            showNotification('Could not refine the website.', 'error');
        } finally {
            loading.style.display = 'none';
            document.body.classList.remove('generating');
        }
    });

    suggestionBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        
        // --- ✅ NEW: Check for Pro Plan ---
        const plan = (currentUser?.subscriptionTier || 'free').toLowerCase();
        if (plan !== 'pro') {
            showNotification("AI Suggestions are only available on the Pro plan.", "error");
            return;
        }
        // ----------------------------------

        const timestamp = parseInt(container.dataset.timestamp); 
        if (!timestamp) { 
            showNotification("Please save the project before getting suggestions.", "error"); 
            return; 
        } 
        handleSuggestionRequest(timestamp, iframe.srcdoc, false); 
    });
    
    publishBtn.addEventListener('click', (e) => { e.stopPropagation(); publishModal.dataset.currentTimestamp = container.dataset.timestamp; publishChoiceView.style.display = 'block'; siteeDeployView.style.display = 'none'; netlifyDeployView.style.display = 'none'; publishModal.style.display = 'flex'; });
    // In your <script type="module">, inside createSiteContainer(), REPLACE the editBtn listener

   editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // --- ✅ NEW: Allow Pro AND Creator ---
        const plan = (currentUser?.subscriptionTier || 'free').toLowerCase();
        if (currentUser && (plan === 'pro' || plan === 'creator')) {
        // -------------------------------------
            let htmlContent = getCleanIframeHtml(iframe);
            if (htmlContent) {
                if (!htmlContent.trim().toLowerCase().startsWith('<!doctype html>')) {
                    htmlContent = '<!DOCTYPE html>\n' + htmlContent;
                }
                currentCodeCache.html = htmlContent;
                currentCodeCache.react = `// Click 'React' tab to generate JSX code...`;
                openCodeEditor();
                currentEditingIframe = iframe;
                currentEditingProjectTimestamp = parseInt(container.dataset.timestamp);

                // --- NEW: START LISTENING FOR LIVE CHANGES ---
                codeEditorContent.addEventListener('input', debouncedCodeEditorUpdate);

            } else {
                showNotification('No code available to edit.', 'error');
            }
        } else {
            showNotification('Upgrade to Creator or Pro to edit and export code.', 'error');
        }
    });
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // --- ✅ NEW: Allow Pro AND Creator ---
        const plan = (currentUser?.subscriptionTier || 'free').toLowerCase();
        if (currentUser && (plan === 'pro' || plan === 'creator')) {
        // -------------------------------------
            const codeToCopy = getCleanIframeHtml(iframe);
            if (codeToCopy) {
                navigator.clipboard.writeText(codeToCopy)
                    .then(() => { showNotification('Code copied to clipboard!', 'success'); })
                    .catch(err => { showNotification('Failed to copy code.', 'error'); });
            }
        } else {
            showNotification('Upgrade to Creator or Pro to copy code.', 'error');
        }
    });

    fullBtn.addEventListener('click', (e) => { e.stopPropagation(); const isFullscreen = container.classList.toggle('fullscreen'); fullBtn.innerHTML = isFullscreen ? exitFullscreenIcon : fullscreenIcon; document.body.classList.toggle('site-fullscreen-active', isFullscreen); });
    deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); const timestamp = parseInt(container.dataset.timestamp); if (!timestamp) { container.remove(); return; } showConfirmationModal('Delete Project', 'Are you sure you want to delete this project?', async () => { const success = await deleteProject(timestamp); if (success) { if (container.classList.contains('fullscreen')) { document.body.classList.remove('site-fullscreen-active'); } container.remove(); } }, 'danger'); });
    localUndoBtn.addEventListener('click', (e) => { e.stopPropagation(); handleUndo(iframe); });
    localRedoBtn.addEventListener('click', (e) => { e.stopPropagation(); handleRedo(iframe); });

    // RESTORED: Compare button logic
    compareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        preview.classList.toggle('compare-mode');

        const exitCompareMode = () => {
            preview.classList.remove('compare-mode');
            preview.querySelectorAll('.compare-pane').forEach(pane => pane.remove());
            iframe.style.width = '100%';
            preview.appendChild(iframe);
            compareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm8.5 0v12H14a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8.5zM7.5 15V1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5.5z"/></svg>`;
        };

        if (preview.classList.contains('compare-mode')) {
            const timestamp = container.dataset.timestamp;
            const history = visualEditorHistories.get(timestamp);
            if (history && history.undoStack.length > 0) {
                const afterState = getCleanIframeHtml(iframe); // The most current state
                const beforeState = history.undoStack[history.undoStack.length - 1]; // The state before the last action

                const beforePane = document.createElement('div');
                beforePane.className = 'compare-pane';
                const iframeBefore = document.createElement('iframe');
                iframeBefore.srcdoc = beforeState;
                const selectBeforeBtn = document.createElement('button');
                selectBeforeBtn.className = 'select-version-btn';
                selectBeforeBtn.textContent = 'Select This Version';
                selectBeforeBtn.onclick = () => {
                    iframe.srcdoc = beforeState;
                    history.redoStack = []; // Choosing an old version clears the redo stack
                    triggerVisualUpdateSave();
                    exitCompareMode();
                    updateUndoRedoButtonsForContainer(container);
                };
                beforePane.append(iframeBefore, selectBeforeBtn);

                const afterPane = document.createElement('div');
                afterPane.className = 'compare-pane';
                const iframeAfter = document.createElement('iframe');
                iframeAfter.srcdoc = afterState;
                const selectAfterBtn = document.createElement('button');
                selectAfterBtn.className = 'select-version-btn';
                selectAfterBtn.textContent = 'Select This Version';
                selectAfterBtn.onclick = exitCompareMode;
                afterPane.append(iframeAfter, selectAfterBtn);

                preview.innerHTML = '';
                preview.append(beforePane, afterPane);
            }
            compareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2z"/></svg>`;
        } else {
            exitCompareMode();
        }
    });

    iframe.onload = () => {
        if (projectData && container.querySelector('.loading')) container.querySelector('.loading').style.display = 'none';
        container.querySelector('.feedback-widget').style.display = 'flex';
        handleIframeLinks(iframe);
        makeIframeImagesEditable(iframe);
        if (currentMode === 'visual-edit') {
            enableEditingInIframe(iframe);
        }
        disableIframeContextMenu(iframe);
    };

    // ✅ CORRECTED CODE
    if (projectData) {
        container.dataset.timestamp = projectData.timestamp;
        // This line now correctly loads the HTML directly from the project data
        iframe.srcdoc = projectData.html;
        stats.textContent = 'Loaded from history';

        // This part handles showing the "published" link if it exists
        if (projectData.published_url) {
            const publishInfo = container.querySelector('.publish-info');
            const publishBtnEl = container.querySelector('.publish-btn');
            const updateBtnEl = container.querySelector('.update-btn');
            displayPublishInfo(publishInfo, projectData.published_url, publishBtnEl, updateBtnEl, container);
        }
    } else {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `<div class="spinner"></div>`;
        preview.appendChild(loading);
        generateWebsite(prompt, container, iframe, imageData);
    }
}
function closeEditImageModal() {
    imageUrlInput.value = '';
    imageUploadFromDevice.value = '';
    fileNameDisplay.textContent = 'no file selected';
    currentEditingImageElement = null;
    editImageModal.style.display = 'none';
}
async function updateProjectAfterImageChange(newImageUrl = null) {
    if (!currentEditingImageElement) return;
    const iframe = currentEditingImageElement.ownerDocument.defaultView.frameElement;
    if (!iframe) return;

    // 1. Directly set the new image URL.
    if (newImageUrl) {
        currentEditingImageElement.src = newImageUrl;
    }

    // 2. THE FIX: Wait a tiny moment (50ms) for the browser to process the DOM update.
    await new Promise(resolve => setTimeout(resolve, 50));

    // 3. Now, get the HTML and save it.
    const updatedHtml = getCleanIframeHtml(iframe);
    const container = iframe.closest('.site-container');
    const timestamp = parseInt(container.dataset.timestamp);

    if (timestamp) {
        await updateProjectCode(timestamp, updatedHtml);
        showNotification('Image updated and project saved!', 'success');
    }
}
// In your <script type="module">, REPLACE this entire function

async function handleSuggestionRequest(timestamp, htmlContent, forceRegenerate = false) {
    const suggestionContent = document.getElementById('suggestion-content');
    const suggestionActions = document.getElementById('suggestion-actions');
    suggestionModal.dataset.currentTimestamp = timestamp;
    suggestionModal.style.display = 'flex';
    suggestionContent.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
    suggestionActions.style.display = 'none';

    try {
        const response = await fetch(`${backendUrl}/suggest_improvements/`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ user_id: currentUser.id, html_content: htmlContent, timestamp: timestamp, force_regenerate: forceRegenerate })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Failed to fetch suggestions');
        }

        const result = await response.json();

        suggestionContent.innerHTML = ''; // Clear spinner

        const suggestionsList = result.suggestions;
        let suggestionsRendered = 0; // Counter for valid suggestions

        if (suggestionsList && Array.isArray(suggestionsList) && suggestionsList.length > 0) {
            suggestionsList.forEach((suggestion) => {
                if (!suggestion.selector || !suggestion.new_outer_html) {
                    return; // Skip broken or incomplete suggestions from the AI
                }

                const item = document.createElement('div');
                item.style.borderBottom = "1px solid var(--border-color)";
                item.style.paddingBottom = "1.5rem";
                item.style.marginBottom = "1.5rem";

                const description = document.createElement('p');
                description.innerHTML = marked.parse(suggestion.description);
                description.style.marginBottom = '1rem';

                const fixedCodeHeader = document.createElement('strong');
                fixedCodeHeader.textContent = 'Suggested Fix:';
                fixedCodeHeader.style.fontSize = '0.8rem';
                fixedCodeHeader.style.color = 'var(--text-muted-color)';
                fixedCodeHeader.style.marginTop = '1rem';
                fixedCodeHeader.style.display = 'block';

                const preFixed = document.createElement('pre');
                const codeFixed = document.createElement('code');
                codeFixed.className = 'language-html';
                codeFixed.textContent = suggestion.new_outer_html;
                preFixed.appendChild(codeFixed);
                preFixed.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                preFixed.style.border = '1px solid rgba(76, 175, 80, 0.2)';
                preFixed.style.padding = '0.75rem';
                preFixed.style.borderRadius = '6px';
                preFixed.style.marginTop = '0.5rem';

                const applyBtn = document.createElement('button');
                applyBtn.textContent = 'Apply Fix';
                applyBtn.style.backgroundColor = 'var(--accent-color)';
                applyBtn.style.color = 'white';
                applyBtn.style.border = 'none';
                applyBtn.style.padding = '0.5rem 1rem';
                applyBtn.style.borderRadius = '6px';
                applyBtn.style.cursor = 'pointer';
                applyBtn.style.marginTop = '1rem';

                applyBtn.addEventListener('click', async () => {
                    applyBtn.textContent = 'Applying...';
                    applyBtn.disabled = true;
                    try {
                        const fixResponse = await fetch(`${backendUrl}/apply-suggestion-fix/`, {
                            method: 'POST',
                            headers: await getAuthHeaders(),
                            body: JSON.stringify({
                                timestamp: timestamp,
                                selector: suggestion.selector,
                                new_outer_html: suggestion.new_outer_html
                            })
                        });
                        if (!fixResponse.ok) {
                            const err = await fixResponse.json(); throw new Error(err.detail);
                        }
                        const fixResult = await fixResponse.json();
                        const container = document.querySelector(`.site-container[data-timestamp="${timestamp}"]`);
                        if (container) {
                            const iframe = container.querySelector('iframe');
                            if (iframe) iframe.srcdoc = fixResult.new_html;
                        }
                        showNotification('Fix applied successfully!', 'success');
                        applyBtn.textContent = 'Applied ✅';
                    } catch (error) {
                        showNotification(error.message, 'error');
                        applyBtn.textContent = 'Apply Fix';
                        applyBtn.disabled = false;
                    }
                });

                item.append(description, fixedCodeHeader, preFixed, applyBtn);
                suggestionContent.appendChild(item);
                hljs.highlightElement(codeFixed);
                suggestionsRendered++; // Increment the counter for each valid suggestion rendered
            });
        }

        // This is the crucial fallback check
        if (suggestionsRendered === 0) {
            suggestionContent.innerHTML = '<p>No specific code suggestions were found at this time.</p>';
        }

        if (result.user_profile) {
            currentUser = result.user_profile;
            updateCreditDisplay();
        }
        checkCreditStatus();

    } catch (error) {
        console.error("Error fetching Sitee suggestions:", error);
        suggestionContent.innerHTML = `<p style="color: var(--error-color);">Error: ${error.message}</p>`;
    } finally {
        suggestionActions.style.display = 'flex';
    }
}

function updateThemeSelectorPosition() {
    const controls = document.getElementById('controls');
    const themeSelector = document.getElementById('theme-selector-container');
    if (!controls || !themeSelector) return;
    const controlsHeight = controls.offsetHeight;
    const baseRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const controlsBottomMargin = 1.5 * baseRem;
    const desiredGap = 0.5 * baseRem;
    const newThemeSelectorBottom = controlsBottomMargin + controlsHeight + desiredGap;
    themeSelector.style.bottom = `${newThemeSelectorBottom}px`;
}

function showConfirmationModal(title, message, onConfirm, type = 'normal') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    currentConfirmCallback = onConfirm;
    modalConfirmBtn.classList.remove('danger');
    if (type === 'danger') {
        modalConfirmBtn.classList.add('danger');
        modalConfirmBtn.textContent = 'Delete';
    } else if (type === 'publish') {
        modalConfirmBtn.textContent = 'Publish';
    } else {
        modalConfirmBtn.textContent = 'Confirm';
    }
    confirmationModal.style.display = 'flex';
}
// Make sure this function is present and correct in your app.js

function hideConfirmationModal() {
    const confirmationModal = document.getElementById('confirmation-modal');
    if (confirmationModal) {
        confirmationModal.style.display = 'none';
    }
    currentConfirmCallback = null;
}

function handleIframeLinks(iframe) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc.documentElement) {
            iframeDoc.documentElement.style.scrollBehavior = 'smooth';
        }
        iframeDoc.addEventListener('click', (e) => {
            if (currentMode === 'visual-edit') return;
            const target = e.target.closest('a');
            if (!target) return;
            const href = target.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetElement = iframeDoc.getElementById(href.substring(1));
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else if (target.href && !target.href.startsWith('about:srcdoc')) {
                e.preventDefault();
                window.open(target.href, '_blank', 'noopener,noreferrer');
            }
        }, true);
    } catch (error) {
        console.warn("Could not attach link handler to iframe:", error);
    }
}

function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification glassy ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    requestAnimationFrame(() => notification.classList.add('show'));
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove(), { once: true });
    }, 4000);
}

function makeDraggable(element) {
    let isDragging = false, offset = { x: 0, y: 0 };
    const header = element.querySelector('.site-header');
    header.addEventListener('mousedown', (e) => {
        if (element.classList.contains('fullscreen')) return;
        if (e.target.closest('.control-btn') || e.target.closest('.share-btn')) return;
        isDragging = true;
        offset = { x: e.clientX - element.offsetLeft, y: e.clientY - element.offsetTop };
        element.style.zIndex = getMaxZIndex() + 1;
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            element.style.left = `${e.clientX - offset.x}px`;
            element.style.top = `${e.clientY - offset.y}px`;
        }
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function getMaxZIndex() {
    return Math.max(1, ...Array.from(document.querySelectorAll(".site-container"), el => parseInt(window.getComputedStyle(el).zIndex) || 1));
}

// REPLACE your old displayPublishInfo function with this new one

function displayPublishInfo(element, url, publishBtn, updateBtn, container) {
    element.innerHTML = ''; // Clear previous content
    element.style.display = 'flex';

    const link = document.createElement('a');
    link.href = url;
    link.textContent = url.replace('https://', '');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Open published site in a new tab';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'share-btn';
    copyBtn.title = 'Copy link';
    copyBtn.innerHTML = copyIconSVG;
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Published link copied!', 'success');
        });
    });

    const unpublishBtn = document.createElement('button');
    unpublishBtn.className = 'share-btn';
    unpublishBtn.title = 'Unpublish and remove domain';
    unpublishBtn.innerHTML = unpublishIcon;
    unpublishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const timestamp = parseInt(container.dataset.timestamp, 10);
        if (timestamp) {
            handleUnpublishClick(timestamp);
        }
    });

    element.appendChild(link);
    element.appendChild(copyBtn);
    element.appendChild(unpublishBtn);

    // Hide Publish button and show Update button
    if (publishBtn && updateBtn) {
        publishBtn.style.display = 'none';
        updateBtn.style.display = 'flex';
    }

    // --- NEW LOGIC: Add the event listener for the update button ---
    updateBtn.onclick = async (e) => {
        e.stopPropagation();

        const timestamp = parseInt(container.dataset.timestamp, 10);
        const iframe = container.querySelector('iframe');
        const subdomain = url.replace('https://', '').split('.')[0];

        if (!timestamp || !iframe || !subdomain) {
            showNotification('Error: Cannot find project data to update.', 'error');
            return;
        }

        const originalIcon = updateBtn.innerHTML;
        updateBtn.innerHTML = `<div class="spinner" style="width:16px; height:16px; border-width:2px;"></div>`;
        updateBtn.disabled = true;

        const htmlToPublish = getCleanIframeHtml(iframe);

        try {
            const response = await fetch(`${backendUrl}/publish-sitee`, {
                method: 'POST', // We re-use the same POST endpoint
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    html_content: htmlToPublish,
                    subdomain: subdomain,
                    project_timestamp: timestamp
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || 'Failed to update site.');

            showNotification('Website updated successfully!', 'success');

        } catch (error) {
            console.error("Update error:", error);
            showNotification(error.message, 'error');
        } finally {
            updateBtn.innerHTML = originalIcon;
            updateBtn.disabled = false;
        }
    };
}
// --- ADD THIS ENTIRE NEW FUNCTION ---

async function handleUpdateSiteePublish(timestamp) {
    const container = document.querySelector(`.site-container[data-timestamp="${timestamp}"]`);
    if (!container) return;

    const iframe = container.querySelector('iframe');
    const updateBtn = container.querySelector('.update-btn');
    const project = currentUser.projects.find(p => p.timestamp === timestamp);

    if (!iframe || !updateBtn || !project || !project.published_url) {
        showNotification('Error: Cannot find project data to update.', 'error');
        return;
    }

    const subdomain = project.published_url.replace('https://', '').split('.')[0];
    const htmlToPublish = getCleanIframeHtml(iframe);

    const originalIcon = updateBtn.innerHTML;
    updateBtn.innerHTML = `<div class="spinner" style="width:16px; height:16px; border-width:2px;"></div>`;
    updateBtn.disabled = true;

    try {
        const response = await fetch(`${backendUrl}/publish-sitee`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({
                html_content: htmlToPublish,
                subdomain: subdomain,
                project_timestamp: timestamp
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Failed to update site.');

        showNotification('Website updated successfully!', 'success');

    } catch (error) {
        console.error("Update error:", error);
        showNotification(error.message, 'error');
    } finally {
        updateBtn.innerHTML = originalIcon;
        updateBtn.disabled = false;
    }
}

// Add this entire function to your script
function populateAvatarDropdown() {
    avatarDropdown.innerHTML = '';
    availableAvatars.forEach(avatar => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'avatar-option';
        const img = document.createElement('img');
        img.src = avatar.path;
        img.alt = avatar.name;
        const span = document.createElement('span');
        span.textContent = avatar.name;
        optionDiv.appendChild(img);
        optionDiv.appendChild(span);
        optionDiv.addEventListener('click', () => {
            userAvatar.src = avatar.path;
            avatarDropdown.classList.remove('show');
        });
        avatarDropdown.appendChild(optionDiv);
    });
}

function populateThemes() {
    themeDropdown.innerHTML = '';
    const defaultOption = document.createElement('div');
    defaultOption.className = 'theme-item';
    defaultOption.textContent = 'No Theme';
    defaultOption.addEventListener('click', () => {
        selectedTheme = null;
        themeBtnText.textContent = 'Select a Theme';
        themeDropdown.classList.remove('show');
    });
    themeDropdown.appendChild(defaultOption);
    themes.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'theme-item';
        item.textContent = theme.name;
        item.addEventListener('click', () => {
            selectedTheme = theme;
            themeBtnText.textContent = `Theme: ${theme.name}`;
            themeDropdown.classList.remove('show');
        });
        themeDropdown.appendChild(item);
    });
} async function saveProject(name, htmlCode, isUpdate = false, timestampToUpdate = null, originalProject = null) {
    let projectPayload;

    if (isUpdate && originalProject) {
        // For updates, use all original project data and just overwrite the HTML
        projectPayload = {
            ...originalProject,
            html: htmlCode
        };
    } else {
        // For new projects, create a complete new object
        projectPayload = {
            name,
            html: htmlCode,
            timestamp: Date.now(),
            published_url: null,
            react: null,
            suggestions: null
        };
    }

    const url = isUpdate ? `${backendUrl}/users/${currentUser.id}/projects/${timestampToUpdate}` : `${backendUrl}/users/${currentUser.id}/projects`;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: await getAuthHeaders(),
            body: JSON.stringify(projectPayload)
        });
        if (!response.ok) throw new Error(`Failed to ${isUpdate ? 'update' : 'save'} project.`);

        const savedProject = await response.json();

        const projectIndex = currentUser.projects.findIndex(p => p.timestamp === savedProject.timestamp);
        if (projectIndex > -1) {
            currentUser.projects[projectIndex] = savedProject;
        } else {
            currentUser.projects.push(savedProject);
        }

        if (name !== CHAT_HISTORY_PROJECT_NAME) {
            if (!isUpdate) addProjectToSidebar(savedProject);
            showNotification(`Project ${isUpdate ? 'updated' : 'saved'}!`, 'success');
        }
        return savedProject;
    } catch (error) {
        console.error(`Error ${isUpdate ? 'updating' : 'saving'} project:`, error);
        showNotification(`Could not ${isUpdate ? 'update' : 'save'} project.`, 'error');
        return null;
    }
}
async function saveGenerationFeedback(container, rating, tags, comment, prompt) {
    if (!currentUser) {
        showNotification('Please log in to submit feedback.', 'error');
        return;
    }
    const feedbackWidget = container.querySelector('.feedback-widget');
    if (!feedbackWidget || feedbackWidget.classList.contains('submitted')) {
        return; // Already submitted
    }

    try {
        const statsText = container.querySelector('.stats')?.textContent || '';
        const timeMatch = statsText.match(/Time: (\d+)s/);
        const generationTime = timeMatch ? parseInt(timeMatch[1], 10) : -1;

        const feedbackData = {
            userId: currentUser.id,
            userPlan: currentUser.plan || 'free',
            generationId: container.dataset.timestamp,
            isRefinement: parseInt(feedbackWidget.dataset.refinementCount, 10) > 0,
            refinementNumber: parseInt(feedbackWidget.dataset.refinementCount, 10),
            prompt: prompt,
            rating: rating,
            tags: tags,
            comment: comment,
            generationTimeSeconds: generationTime,
            submittedAt: fsServerTimestamp() // Use Firestore Server Timestamp
        };

        await addDoc(collection(db, "generation_feedback"), feedbackData);

        showNotification('Thank you for your feedback!', 'success');
        feedbackWidget.classList.add('submitted'); // Mark as submitted
        feedbackWidget.querySelector('.feedback-prompt-text').textContent = 'Feedback Received!';
        feedbackWidget.querySelector('.feedback-details').classList.add('hidden');

    } catch (error) {
        console.error("Error saving feedback:", error);
        showNotification('Could not save feedback. Please try again.', 'error');
    }
}
function loadChatHistory() {
    const historyProject = currentUser.projects.find(p => p.name === CHAT_HISTORY_PROJECT_NAME);
    chatContainer.innerHTML = '';
    if (historyProject && historyProject.html) {
        try {
            chatHistory = JSON.parse(historyProject.html);
            if (chatHistory.length > 0 && chatHistory[0].role) {
                console.log("Converting old chat history format...");
                chatHistory = convertOldHistory(chatHistory);
                saveChatHistory();
            }
            chatHistory.forEach(turn => appendTurn(turn));
        } catch (e) {
            console.error("Could not parse chat history:", e);
            chatHistory = [];
        }
    }
}

async function saveChatHistory() {
    const historyProject = currentUser.projects.find(p => p.name === CHAT_HISTORY_PROJECT_NAME);
    const historyJSON = JSON.stringify(chatHistory);
    if (historyProject) {
        await saveProject(CHAT_HISTORY_PROJECT_NAME, historyJSON, true, historyProject.timestamp);
    } else {
        await saveProject(CHAT_HISTORY_PROJECT_NAME, historyJSON);
    }
}

async function saveFeedbackToFirebase(feedbackText, originalMessage) {
    if (!currentUser) {
        showNotification('You must be logged in to provide feedback.', 'error');
        return;
    }
    try {
        await addDoc(collection(db, `feedback`), {
            userId: currentUser.id,
            feedback: feedbackText,
            originalMessage: originalMessage,
            timestamp: fsServerTimestamp(),
            userAgent: navigator.userAgent,
        });
        showNotification('Feedback submitted successfully. Thank you!', 'success');
    } catch (e) {
        console.error("Error adding document: ", e);
        showNotification('Could not submit feedback. Please try again.', 'error');
    }
}
// --- REPLACE THIS ENTIRE FUNCTION ---
async function updateProjectCode(timestamp, newHtml) {
    const project = currentUser.projects.find(p => p.timestamp === timestamp);
    if (project) {
        // We now pass the 'project' object itself to saveProject
        await saveProject(project.name, newHtml, true, timestamp, project);
    }
}

async function deleteProject(timestamp) {
    try {
        const response = await fetch(`${backendUrl}/users/${currentUser.id}/projects/${timestamp}`, {
            method: 'DELETE',
            headers: await getAuthHeaders() // <-- ADD THIS LINE
        });
        if (!response.ok) throw new Error('Failed to delete project.');
        currentUser.projects = currentUser.projects.filter(p => p.timestamp !== timestamp);
        renderProjects();
        showNotification('Project deleted.', 'success');
        return true;
    } catch (error) {
        console.error("Error deleting project:", error);
        showNotification('Could not delete project.', 'error');
        return false;
    }
}
// In your <script type="module">, add this new function

// This function will handle updating the iframe and saving the project
const handleLiveCodeUpdate = () => {
    if (!currentEditingIframe || !codeEditorModal.classList.contains('open')) return;

    const newCode = codeEditorContent.textContent;

    // Update the live preview
    currentEditingIframe.srcdoc = newCode;

    // Also update the cache for the React tab
    currentCodeCache.html = newCode;

    // Save the changes to the backend
    if (currentEditingProjectTimestamp) {
        updateProjectCode(currentEditingProjectTimestamp, newCode);
    }
};

// Create a debounced version of the update function for performance
const debouncedCodeEditorUpdate = debounce(handleLiveCodeUpdate, 200); // 200ms delay
async function handleDeleteAllProjects() {
    try {

        const response = await fetch(`${backendUrl}/users/${currentUser.id}/projects`, {
            method: 'DELETE',
            headers: await getAuthHeaders() // <-- ADD THIS LINE
        });
        if (!response.ok) throw new Error('Failed to delete all projects.');
        currentUser.projects = currentUser.projects.filter(p => p.name === CHAT_HISTORY_PROJECT_NAME);
        renderProjects();
        document.querySelectorAll('#canvas .site-container').forEach(c => c.remove());
        showNotification('All projects deleted.', 'success');
    } catch (error) {
        console.error("Error deleting all projects:", error);
        showNotification('Could not delete all projects.', 'error');
    }
}

function renderProjects() {
    if (!currentUser || !currentUser.projects) return;
    const savedProjects = currentUser.projects;
    projectList.innerHTML = '';
    savedProjects.filter(p => p.name !== CHAT_HISTORY_PROJECT_NAME).sort((a, b) => b.timestamp - a.timestamp).forEach(addProjectToSidebar);
}
function addProjectToSidebar(project) {
    if (project.name === CHAT_HISTORY_PROJECT_NAME) return;

    const li = document.createElement("li");
    li.className = "project-item";
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.gap = "8px";

    // 1. Project Name (Click to load)
    const nameSpan = document.createElement("span");
    nameSpan.textContent = project.name;
    nameSpan.style.whiteSpace = "nowrap";
    nameSpan.style.overflow = "hidden";
    nameSpan.style.textOverflow = "ellipsis";
    nameSpan.style.flex = "1";
    nameSpan.dataset.timestamp = project.timestamp;
    
    nameSpan.addEventListener("click", () => {
        if (currentMode === 'chat') {
            document.querySelector('.mode-btn[data-mode="canvas-en"]')?.click();
        }
        createSiteContainer(null, project);
    });

    // 2. Direct Copy Button
    const copyBtn = document.createElement("button");
    copyBtn.className = "sidebar-copy-btn";
    copyBtn.title = "Copy Prompt";
    // Copy Icon SVG
    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/></svg>`;
    
    // Minimal styling
    copyBtn.style.background = "transparent";
    copyBtn.style.border = "none";
    copyBtn.style.color = "var(--text-muted-color)";
    copyBtn.style.cursor = "pointer";
    copyBtn.style.padding = "4px";
    copyBtn.style.display = "flex";
    copyBtn.style.transition = "color 0.2s";

    copyBtn.onmouseover = () => copyBtn.style.color = "white";
    copyBtn.onmouseout = () => copyBtn.style.color = "var(--text-muted-color)";

    copyBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Don't open the project
        const textToCopy = project.name;

        navigator.clipboard.writeText(textToCopy).then(() => {
            // Visual feedback: Switch to Checkmark icon
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#4ADE80" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>`;
            
            // Show global notification
            showNotification("Prompt copied to clipboard!", "success");

            // Revert icon after 2 seconds
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        });
    });

    li.append(nameSpan, copyBtn);
    projectList.append(li);
}
// Add this new function anywhere inside your <script type="module"> block

/**
 * Handles the logic for unpublishing a site deployed via Sitee subdomain.
 * @param {number} timestamp The timestamp ID of the project to unpublish.
 */
async function handleUnpublishClick(timestamp) {
    showConfirmationModal(
        'Unpublish Site',
        'Are you sure you want to unpublish this site? The domain will be released and the link will no longer work. This cannot be undone.',
        async () => {
            const container = document.querySelector(`.site-container[data-timestamp="${timestamp}"]`);
            if (!container) return;

            const unpublishBtn = container.querySelector('.publish-info .share-btn[title="Unpublish and remove domain"]');
            const originalIcon = unpublishBtn.innerHTML;
            unpublishBtn.innerHTML = `<div class="spinner" style="width:14px; height:14px; border-width:2px;"></div>`;
            unpublishBtn.disabled = true;

            try {
                const response = await fetch(`${backendUrl}/unpublish-sitee/${timestamp}`, {
                    method: 'DELETE',
                    headers: await getAuthHeaders(),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.detail || 'Failed to unpublish site.');
                }

                showNotification('Site unpublished successfully!', 'success');

                // Update UI
                const project = currentUser.projects.find(p => p.timestamp === timestamp);
                if (project) {
                    project.published_url = null;
                }

                const publishInfo = container.querySelector('.publish-info');
                const publishBtn = container.querySelector('.publish-btn');
                const updateBtn = container.querySelector('.update-btn');

                publishInfo.innerHTML = '';
                publishInfo.style.display = 'none';
                publishBtn.style.display = 'flex';
                updateBtn.style.display = 'none';

            } catch (error) {
                console.error("Unpublish error:", error);
                showNotification(error.message, 'error');
                unpublishBtn.innerHTML = originalIcon; // Restore icon on error
                unpublishBtn.disabled = false;
            }
        },
        'danger'
    );
}
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            return;
        }
        promptSuggestions.classList.add('hidden');
        if (!mediaStream) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                mediaStream = stream;
                setupVisualizer(mediaStream);
                recognition.start();
            }).catch(err => {
                console.error("Microphone access denied:", err);
                showNotification('Microphone access denied. Check browser permissions.');
            });
        } else {
            setupVisualizer(mediaStream);
            recognition.start();
        }
    });
    recognition.onstart = () => { isListening = true; finalTranscript = promptInput.value ? promptInput.value + ' ' : ''; micBtn.classList.add('listening'); micBtn.innerHTML = stopIcon; };
    recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript.trim() + ' '; } else { interimTranscript += event.results[i][0].transcript; } } promptInput.value = finalTranscript + interimTranscript; autoResizePrompt.call(promptInput); };
    recognition.onend = () => { isListening = false; micBtn.classList.remove('listening'); micBtn.innerHTML = micIcon; stopVisualizer(); if (promptInput.value.trim() === '' && currentMode !== 'chat') { promptSuggestions.classList.remove('hidden'); } };
    recognition.onerror = (event) => { showNotification(`Error: ${event.error}.`, 'error'); isListening = false; micBtn.classList.remove('listening'); micBtn.innerHTML = micIcon; stopVisualizer(); };
} else {
    micBtn.style.display = 'none';
}


function setupVisualizer(stream) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (!source || source.mediaStream !== stream) source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 2048;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    visualizerCanvas.width = visualizerCanvas.clientWidth;
    visualizerCanvas.height = visualizerCanvas.clientHeight;
    visualizerCanvas.style.display = 'block';
    promptInput.classList.add('listening');

    function draw() {
        animationFrameId = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        visualizerCtx.lineWidth = 2.5;
        visualizerCtx.strokeStyle = '#3B82F6';
        visualizerCtx.beginPath();
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * visualizerCanvas.height / 2;
            if (i === 0) {
                visualizerCtx.moveTo(x, y);
            } else {
                visualizerCtx.lineTo(x, y);
            }
            x += visualizerCanvas.width / bufferLength;
        }
        visualizerCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
        visualizerCtx.stroke();
    }
    draw();
}

function stopVisualizer() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (source && analyser) {
        source.disconnect(analyser);
    }
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    visualizerCanvas.style.display = 'none';
    promptInput.classList.remove('listening');


}

async function handleUpdatePublishedSite(timestamp, iframe, buttonElement) {
    const htmlToPublish = getCleanIframeHtml(iframe);
    if (!htmlToPublish) {
        showNotification('No code available to update.', 'error');
        return;
    }

    // Show loading state
    const originalIcon = buttonElement.innerHTML;
    buttonElement.innerHTML = `<div class="spinner" style="width:16px; height:16px; border-width:2px;"></div>`;
    buttonElement.disabled = true;

    try {
        // Use PUT to update the existing published site
        const response = await fetch(`${backendUrl}/users/${currentUser.id}/projects/${timestamp}/publish`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ html_content: htmlToPublish })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to update the website.');
        }

        await response.json();
        showNotification('Website updated successfully!', 'success');

    } catch (error) {
        console.error("Update error:", error);
        showNotification(error.message, 'error');
    } finally {
        // Restore button state
        buttonElement.innerHTML = originalIcon;
        buttonElement.disabled = false;
    }
}


function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
// REPLACE THE ENTIRE BLOCK ABOVE WITH THIS SINGLE FUNCTION

function updateUndoRedoButtons() {
    let activeIframe = null;
    if (currentlySelectedElementInIframe) {
        activeIframe = currentlySelectedElementInIframe.ownerDocument.defaultView.frameElement;
    }

    if (!activeIframe) {
        undoBtn.disabled = true;
        redoBtn.disabled = true;
        return;
    }

    const container = activeIframe.closest('.site-container');
    const timestamp = container ? container.dataset.timestamp : null;

    if (timestamp && visualEditorHistories.has(timestamp)) {
        const history = visualEditorHistories.get(timestamp);
        // You can't undo the very first state.
        undoBtn.disabled = history.undoStack.length <= 1;
        redoBtn.disabled = history.redoStack.length === 0;
    } else {
        undoBtn.disabled = true;
        redoBtn.disabled = true;
    }
}
/**
 * Pushes the current HTML state of an iframe to its undo stack.
 */
/**
 * Pushes the current HTML state of an iframe to its undo stack.
 */
function pushStateForIframe(iframe) {
    if (!iframe) return;
    const container = iframe.closest('.site-container');
    const timestamp = container ? container.dataset.timestamp : null;
    if (!timestamp) return;

    if (!visualEditorHistories.has(timestamp)) {
        visualEditorHistories.set(timestamp, { undoStack: [], redoStack: [] });
    }
    const history = visualEditorHistories.get(timestamp);
    const currentState = getCleanIframeHtml(iframe);

    // Avoid pushing identical states consecutively
    const lastState = history.undoStack[history.undoStack.length - 1];
    if (lastState === currentState) {
        return;
    }

    history.undoStack.push(currentState);
    history.redoStack = []; // A new action clears the redo stack

    // Limit history size to prevent using too much memory
    if (history.undoStack.length > 30) {
        history.undoStack.shift();
    }

    // --- FIX STARTS HERE ---
    // Update Global Toolbar Buttons
    updateUndoRedoButtons(); 
    
    // Update Local Window Buttons (The ones on the site container header)
    if (container) {
        updateUndoRedoButtonsForContainer(container);
    }
    // --- FIX ENDS HERE ---
}

/**
 * A helper function to call before any modification is made to an element.
 */

// --- ADD THIS BLOCK for font selection ---

function prepareToModifyElement() {
    if (currentlySelectedElementInIframe) {
        pushStateForIframe(currentlySelectedElementInIframe.ownerDocument.defaultView.frameElement);
    }
}
// In app.js, REPLACE your old handleUndo and handleRedo functions with these
function handleUndo(iframe) {
    const container = iframe.closest('.site-container');
    if (!container) return;
    const timestamp = container.dataset.timestamp;
    const history = visualEditorHistories.get(timestamp);

    // Can't undo the very first state (initial load)
    if (history && history.undoStack.length > 1) { 
        const currentState = history.undoStack.pop();
        history.redoStack.push(currentState);
        const stateToRestore = history.undoStack[history.undoStack.length - 1];

        iframe.srcdoc = stateToRestore;
        iframe.onload = () => {
            if (currentMode === 'visual-edit') enableEditingInIframe(iframe);
            triggerVisualUpdateSave(iframe); // Pass iframe explicitly
            
            // --- FIX: Update both global and local buttons ---
            updateUndoRedoButtons(); 
            updateUndoRedoButtonsForContainer(container);
        };
    }
}

function handleRedo(iframe) {
    const container = iframe.closest('.site-container');
    if (!container) return;
    const timestamp = container.dataset.timestamp;
    const history = visualEditorHistories.get(timestamp);

    if (history && history.redoStack.length > 0) {
        const stateToRestore = history.redoStack.pop();
        history.undoStack.push(stateToRestore);

        iframe.srcdoc = stateToRestore;
        iframe.onload = () => {
            if (currentMode === 'visual-edit') enableEditingInIframe(iframe);
            triggerVisualUpdateSave(iframe); // Pass iframe explicitly
            
            // --- FIX: Update both global and local buttons ---
            updateUndoRedoButtons();
            updateUndoRedoButtonsForContainer(container);
        };
    }
}

// A helper function to update the specific container's buttons
function updateUndoRedoButtonsForContainer(container) {
    const timestamp = container.dataset.timestamp;
    
    // Select the buttons specifically inside this container's header
    const localUndoBtn = container.querySelector('.undo-btn'); 
    const localRedoBtn = container.querySelector('.redo-btn'); 

    if (timestamp && visualEditorHistories.has(timestamp)) {
        const history = visualEditorHistories.get(timestamp);
        
        // Undo is disabled if there is 1 or 0 items (initial state)
        if (localUndoBtn) localUndoBtn.disabled = history.undoStack.length <= 1;
        
        // Redo is disabled if stack is empty
        if (localRedoBtn) localRedoBtn.disabled = history.redoStack.length === 0;
    } else {
        // Default state if no history exists yet
        if (localUndoBtn) localUndoBtn.disabled = true;
        if (localRedoBtn) localRedoBtn.disabled = true;
    }
}
// --- END: NEW Undo/Redo and History Functions ---

function rgbToHex(rgb) {
    if (!rgb || !rgb.startsWith('rgb')) return '#ffffff'; // Default to white for safety
    const match = rgb.match(/\d+/g);
    if (!match) return '#ffffff';
    const [r, g, b] = match.map(Number);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function applyStyle(styleProp, value) {
    if (currentlySelectedElementInIframe) {
        prepareToModifyElement();
        currentlySelectedElementInIframe.style[styleProp] = value;
        triggerVisualUpdateSave();
    }
}

function changeFontSize(delta) {
    if (currentlySelectedElementInIframe) {
        prepareToModifyElement();
        const fontSizeInput = document.getElementById('font-size-input');
        const currentSize = parseFloat(fontSizeInput.value) || 16;
        const newSize = Math.max(8, currentSize + delta); // Set a min size of 8px
        currentlySelectedElementInIframe.style.fontSize = `${newSize}px`;
        fontSizeInput.value = Math.round(newSize);
        triggerVisualUpdateSave();
    }
}

function toggleBold() {
    if (currentlySelectedElementInIframe) {
        prepareToModifyElement();
        const style = window.getComputedStyle(currentlySelectedElementInIframe);
        const isBold = style.fontWeight === '700' || style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700;
        currentlySelectedElementInIframe.style.fontWeight = isBold ? 'normal' : 'bold';
        triggerVisualUpdateSave();
    }
}

function toggleItalic() {
    if (currentlySelectedElementInIframe) {
        prepareToModifyElement();
        const style = window.getComputedStyle(currentlySelectedElementInIframe);
        const isItalic = style.fontStyle === 'italic';
        currentlySelectedElementInIframe.style.fontStyle = isItalic ? 'normal' : 'italic';
        triggerVisualUpdateSave();
    }
}

function toggleUnderline() {
    if (currentlySelectedElementInIframe) {
        prepareToModifyElement();
        const style = window.getComputedStyle(currentlySelectedElementInIframe);
        const isUnderlined = style.textDecoration.includes('underline');
        currentlySelectedElementInIframe.style.textDecoration = isUnderlined ? 'none' : 'underline';
        triggerVisualUpdateSave();
    }
}

function applyTextAlign(align) {
    if (currentlySelectedElementInIframe) {
        prepareToModifyElement();
        currentlySelectedElementInIframe.style.textAlign = align;
        triggerVisualUpdateSave();
    }
}
function deleteSelectedElement() {
    const elementToDelete = currentlySelectedElementInIframe;
    if (!elementToDelete) return;

    showConfirmationModal(
        'Delete Element',
        'Are you sure you want to permanently delete this element?',
        () => {
            // 1. Safety Check: Ensure element and iframe exist
            if (!elementToDelete.ownerDocument) return;
            const iframe = elementToDelete.ownerDocument.defaultView ? elementToDelete.ownerDocument.defaultView.frameElement : null;
            
            // 2. Push state to history (Undo)
            if (iframe) pushStateForIframe(iframe);

            // 3. Remove the element
            elementToDelete.remove();

            // 4. Safely update the UI (Prevents the crash)
            const selectionBox = document.getElementById('selection-box');
            const inspectorSection = document.getElementById('inspector-section');
            const noElementSelected = document.getElementById('no-element-selected');

            if (selectionBox) selectionBox.style.display = 'none';
            if (inspectorSection) inspectorSection.style.display = 'none';
            if (noElementSelected) noElementSelected.style.display = 'block';

            // 5. Clear global selection
            currentlySelectedElementInIframe = null;

            // 6. Save Changes (Pass iframe explicitly since selection is now null)
            if (iframe) {
                triggerVisualUpdateSave(iframe);
                
                // Update Undo/Redo buttons if the function exists
                if (typeof updateUndoRedoButtons === 'function') {
                    // Temporarily help updateUndoRedoButtons find the context
                    // or we manually trigger it for this specific container
                    const container = iframe.closest('.site-container');
                    if (container && typeof updateUndoRedoButtonsForContainer === 'function') {
                        updateUndoRedoButtonsForContainer(container);
                    } else if (typeof updateUndoRedoButtons === 'function') {
                        updateUndoRedoButtons();
                    }
                }
            }
        },
        'danger'
    );
}

let visualUpdateDebounceTimer;

function triggerVisualUpdateSave(overrideIframe = null) {
    let iframe = overrideIframe;

    // If no specific iframe was passed, try to find the active one
    if (!iframe) {
        if (currentlySelectedElementInIframe) {
            iframe = currentlySelectedElementInIframe.ownerDocument.defaultView.frameElement;
        } else {
            // Fallback: Try to find based on the toolbar's stored timestamp
            const timestamp = visualEditorToolbar ? visualEditorToolbar.dataset.iframeTimestamp : null;
            if (timestamp) {
                const container = document.querySelector(`.site-container[data-timestamp="${timestamp}"]`);
                if (container) iframe = container.querySelector('iframe');
            }
        }
    }

    if (!iframe) return;

    clearTimeout(visualUpdateDebounceTimer);
    visualUpdateDebounceTimer = setTimeout(() => {
        const htmlToSave = getCleanIframeHtml(iframe);
        const container = iframe.closest('.site-container');
        if (container) {
            const timestamp = parseInt(container.dataset.timestamp);
            if (timestamp) {
                updateProjectCode(timestamp, htmlToSave);
            }
        }
    }, 1000); // Debounce for 1 second
}

function toggleVisualEditor(enable) {
    const iframes = document.querySelectorAll('.site-container iframe');
    iframes.forEach(iframe => {
        if (enable) {
            const enableEditing = () => enableEditingInIframe(iframe);
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                enableEditing();
            } else {
                iframe.addEventListener('load', enableEditing, { once: true });
            }
        } else {
            disableEditingInIframe(iframe);
        }
    });
    if (!enable) {
        visualEditorToolbar.style.display = 'none';
        currentlySelectedElementInIframe = null;
    }
}

function getCleanIframeHtml(iframe) {
    if (!iframe.contentDocument) return '';
    const doc = iframe.contentDocument.cloneNode(true);

    // Your existing cleanup code (this is all correct)
    doc.getElementById('sitee-visual-editor-styles')?.remove();
    doc.querySelectorAll('.sitee-selected-element').forEach(el => el.classList.remove('sitee-selected-element'));
    doc.querySelectorAll('[contenteditable="true"]').forEach(el => el.removeAttribute('contenteditable'));
    return `<!DOCTYPE html>\n` + doc.documentElement.outerHTML;
}
// =================== PASTE THIS ENTIRE BLOCK ===================

const selectionBox = document.getElementById('selection-box');
/**
 * Disables the default right-click context menu inside an iframe.
 */
function disableIframeContextMenu(iframe) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
           iframeDoc.addEventListener('contextmenu', e => e.preventDefault());
        }
    } catch (error) {
        // This might fail due to security policies, but is unlikely with srcdoc.
        console.warn("Could not disable context menu in iframe:", error);
    }
}
/**
 * Updates the position and size of the selection box to match a target element.
 */
function updateSelectionBox(targetElement) {
    if (!targetElement) {
        selectionBox.style.display = 'none';
        return;
    }
    const iframe = targetElement.ownerDocument.defaultView.frameElement;
    const iframeRect = iframe.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    selectionBox.style.display = 'block';
    selectionBox.style.top = `${iframeRect.top + window.scrollY + targetRect.top}px`;
    selectionBox.style.left = `${iframeRect.left + window.scrollX + targetRect.left}px`;
    selectionBox.style.width = `${targetRect.width}px`;
    selectionBox.style.height = `${targetRect.height}px`;

    initDraggable(selectionBox, targetElement);
    initResizable(selectionBox, targetElement);
}

// In app.js, find and REPLACE your entire enableEditingInIframe function with this one
function enableEditingInIframe(iframe) {
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc || doc.getElementById('sitee-visual-editor-styles')) return;

        const style = doc.createElement('style');
        style.id = 'sitee-visual-editor-styles';
        style.textContent = `
            *:hover { outline: 2px dashed #3B82F6 !important; cursor: pointer !important; }
            [contenteditable="true"]:focus { outline: 2px solid var(--accent-color) !important; box-shadow: 0 0 10px var(--accent-color); }
            
            /* --- BUTTON STYLES --- */
            .btn-sitee {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
                margin: 0.5rem;
            }
            .btn-sitee-filled {
                background-color: #3B82F6;
                color: white;
                border-color: #3B82F6;
            }
            .btn-sitee-filled:hover {
                background-color: #2563EB;
                border-color: #2563EB;
            }
            .btn-sitee-outline {
                background-color: transparent;
                color: #333;
                border-color: #333;
            }
            .btn-sitee-outline:hover {
                background-color: #333;
                color: white;
            }
        `;
        doc.head.appendChild(style);

        const inspectorSection = document.getElementById('inspector-section');
        const noElementSelected = document.getElementById('no-element-selected');

        const clickListener = (e) => {
            // 1. Prevent Default: Stops links from navigating while editing
            e.preventDefault(); 
            // 2. Stop Propagation: Prevents the event from bubbling further
            e.stopPropagation(); 

            // If a different element was already being edited, make it non-editable
            if (currentlySelectedElementInIframe) {
                currentlySelectedElementInIframe.removeAttribute('contenteditable');
            }

            // Set the new element as the current one
            currentlySelectedElementInIframe = e.target;

            // Explicitly make the clicked element editable and focus it
            currentlySelectedElementInIframe.setAttribute('contenteditable', 'true');
            currentlySelectedElementInIframe.focus();

            updateSelectionBox(currentlySelectedElementInIframe);

            inspectorSection.style.display = 'block';
            noElementSelected.style.display = 'none';

            const computedStyle = window.getComputedStyle(currentlySelectedElementInIframe);

            // Update Toolbar UI values to match the clicked element
            document.getElementById('text-color-picker').parentElement.style.backgroundColor = computedStyle.color;
            document.getElementById('bg-color-picker').parentElement.style.backgroundColor = computedStyle.backgroundColor;
            document.getElementById('font-size-input').value = Math.round(parseFloat(computedStyle.fontSize));

            const borderRadius = parseInt(computedStyle.borderRadius, 10) || 0;
            document.getElementById('border-radius-slider').value = borderRadius;
            document.getElementById('border-radius-value').textContent = `${borderRadius}px`;
            
            if(fontBtnText) {
                 fontBtnText.textContent = computedStyle.fontFamily.split(',')[0].replace(/"/g, '');
            }

            if (currentlySelectedElementInIframe.classList.contains('btn-sitee')) {
                buttonStyleGroup.style.display = 'grid'; 
                btnStyleFilled.classList.toggle('active', currentlySelectedElementInIframe.classList.contains('btn-sitee-filled'));
                btnStyleOutline.classList.toggle('active', currentlySelectedElementInIframe.classList.contains('btn-sitee-outline'));
            } else {
                buttonStyleGroup.style.display = 'none';
            }
        };

        const outsideClickListener = (e) => {
            // Improved check to ensure we don't deselect when clicking editor tools
            if (!iframe.contains(e.target) && 
                !selectionBox.contains(e.target) && 
                !visualEditorPanel.contains(e.target) &&
                !e.target.closest('.color-picker-wrapper')) { // Added safety for color pickers
                
                if (currentlySelectedElementInIframe) {
                    currentlySelectedElementInIframe.removeAttribute('contenteditable');
                }
                currentlySelectedElementInIframe = null;
                selectionBox.style.display = 'none';
                inspectorSection.style.display = 'none';
                noElementSelected.style.display = 'block';
            }
        };

        const dragOverListener = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
        const dropListener = (e) => {
            e.preventDefault();
            e.stopPropagation(); // Ensure drop doesn't bubble
            
            const componentType = e.dataTransfer.getData('text/plain');
            const dropTarget = doc.elementFromPoint(e.clientX, e.clientY);

            if (dropTarget && componentLibrary[componentType]) {
                pushStateForIframe(iframe); 
                const componentHTML = componentLibrary[componentType];
                dropTarget.insertAdjacentHTML('afterend', componentHTML);
                triggerVisualUpdateSave(); 
            }
        };

        // Clean up previous listeners if they exist to prevent duplicates
        if (iframe.eventListeners) {
            doc.removeEventListener('click', iframe.eventListeners.clickListener, true);
            document.removeEventListener('click', iframe.eventListeners.outsideClickListener, true);
            doc.body.removeEventListener('dragover', iframe.eventListeners.dragOverListener);
            doc.body.removeEventListener('drop', iframe.eventListeners.dropListener);
        }

        // --- KEY FIX HERE ---
        // Use 'true' (Capture Phase) to catch the click BEFORE the element handles it.
        // Also attach to 'doc' instead of 'doc.body' to ensure we catch everything.
        doc.addEventListener('click', clickListener, true);
        
        document.addEventListener('click', outsideClickListener, true);
        doc.body.addEventListener('dragover', dragOverListener);
        doc.body.addEventListener('drop', dropListener);

        iframe.eventListeners = { clickListener, outsideClickListener, dragOverListener, dropListener };

    } catch (error) {
        console.warn("Could not enable visual editor in iframe:", error);
    }
}

/**
 * Makes an element draggable using the new #drag-handle.
 */
function initDraggable(dragElement, targetElement) {
    let startX, startY, startTop, startLeft;
    const dragHandle = dragElement.querySelector('#drag-handle'); // Get the specific handle

    const dragMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const computedStyle = window.getComputedStyle(targetElement);
        if (computedStyle.position === 'static') {
            targetElement.style.position = 'relative';
        }

        startX = e.clientX;
        startY = e.clientY;
        startTop = parseFloat(targetElement.style.top) || 0;
        startLeft = parseFloat(targetElement.style.left) || 0;

        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
    };

    const elementDrag = (e) => {
        e.preventDefault();
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        targetElement.style.top = `${startTop + deltaY}px`;
        targetElement.style.left = `${startLeft + deltaX}px`;
        updateSelectionBox(targetElement);
    };

    const closeDragElement = () => {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        triggerVisualUpdateSave();
    };

    // Attach the listener ONLY to the drag handle
    dragHandle.onmousedown = dragMouseDown;
}

function initResizable(boxElement, targetElement) {
    const handles = boxElement.querySelectorAll('.resize-handle');
    let startX, startY, startWidth, startHeight, startTop, startLeft;

    handles.forEach(handle => {
        handle.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            startX = e.clientX;
            startY = e.clientY;
            startWidth = targetElement.offsetWidth;
            startHeight = targetElement.offsetHeight;
            startTop = targetElement.offsetTop;
            startLeft = targetElement.offsetLeft;

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                if (handle.id.includes('bottom')) targetElement.style.height = `${startHeight + deltaY}px`;
                if (handle.id.includes('right')) targetElement.style.width = `${startWidth + deltaX}px`;
                if (handle.id.includes('top')) {
                    targetElement.style.height = `${startHeight - deltaY}px`;
                    targetElement.style.top = `${startTop + deltaY}px`;
                }
                if (handle.id.includes('left')) {
                    targetElement.style.width = `${startWidth - deltaX}px`;
                    targetElement.style.left = `${startLeft + deltaX}px`;
                }
                updateSelectionBox(targetElement);
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                triggerVisualUpdateSave();
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
    });
}

function openCodeEditor() {
    updateCodeEditorView('html');
    codeEditorModal.classList.add('open');
}

async function fetchAndDisplayReactCode() {
    updateCodeEditorView('react', true);
    try {
        const response = await fetch(`${backendUrl}/generate/`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({
                prompt: currentCodeCache.html,
                user_id: currentUser.id,
                is_chat_mode: false,
                target_language: 'react'
            })
        });
        if (!response.ok) throw new Error("Failed to generate React code.");
        const result = await response.json();
        currentCodeCache.react = result.code;
        if (result.user_profile) { currentUser = result.user_profile; }
        updateCreditDisplay();
        checkCreditStatus();
    } catch (error) {
        console.error("React generation error:", error);
        currentCodeCache.react = `// Error: Could not generate React code.\n// ${error.message}`;
        showNotification("Failed to generate React code.", "error");
    } finally {
        updateCodeEditorView('react', false);
    }
}
// REPLACE your old showDeployMode function with this new one.

function showDeployMode() {
    const project = currentUser.projects.find(p => p.timestamp === currentEditingProjectTimestamp);
    githubRepoNameInput.value = project ? project.name.replace(/[^a-zA-Z0-9-_\.]/g, '-').toLowerCase() : 'my-sitee-project';

    // Configure inputs
    githubRepoNameInput.disabled = false;
    githubRepoNameInput.parentElement.style.display = 'block';
    githubTokenInput.disabled = true;
    githubTokenInput.parentElement.style.display = 'none';

    // Hide help text, show info text
    githubDeployModal.querySelector('p').style.display = 'none';
    document.getElementById('github-deploy-info').style.display = 'block';

    // --- THIS IS THE FIX ---
    // Display the token expiry date correctly
    const expiryText = document.getElementById('github-token-expiry-text');
    if (currentUser.github_token_expiry) {
        const expiryDate = new Date(currentUser.github_token_expiry);
        // Check if the date is valid before trying to display it
        if (!isNaN(expiryDate.getTime())) {
            expiryText.textContent = `Token expires on: ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        } else {
            expiryText.textContent = 'Token is active.';
        }
    } else {
        expiryText.textContent = 'Token is active (no expiry date provided).';
    }

    githubDeployConfirmBtn.textContent = 'Deploy';
    githubDeployError.textContent = '';
}
function showSaveTokenMode() {
    // Configure inputs
    githubRepoNameInput.disabled = true;
    githubRepoNameInput.parentElement.style.display = 'none';
    githubTokenInput.disabled = false;
    githubTokenInput.parentElement.style.display = 'block';

    // Show help text, hide info text
    githubDeployModal.querySelector('p').style.display = 'block';
    document.getElementById('github-deploy-info').style.display = 'none';

    githubDeployConfirmBtn.textContent = 'Save Token';
    githubDeployError.textContent = '';
}
function updateCodeEditorView(lang, isLoading = false) {
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === lang);
    });
    const content = lang === 'react' ? currentCodeCache.react : currentCodeCache.html;
    codeEditorContent.setAttribute('contenteditable', lang === 'html');
    codeEditorContent.className = lang === 'react' ? 'language-jsx' : 'language-html';
    if (isLoading) {
        codeEditorContent.innerHTML = `<div class="spinner" style="margin: auto; width:24px; height:24px; border-width: 3px;"></div>`;
    } else {
        codeEditorContent.textContent = content;
        hljs.highlightElement(codeEditorContent);
    }
}

function autoResizePrompt() {
    this.style.height = 'auto';
    const maxHeight = 150;
    const newHeight = Math.min(this.scrollHeight, maxHeight);
    this.style.height = newHeight + 'px';
    this.style.overflowY = (this.scrollHeight > maxHeight) ? 'auto' : 'hidden';
    setTimeout(updateThemeSelectorPosition, 0);
}

// =================== END OF REPLACEMENT BLOCK ===================


// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    // Setup Icons
    micBtn.innerHTML = micIcon;
    generateBtn.innerHTML = generateIcon;
    uploadBtn.innerHTML = uploadIcon;
    copyEditorCodeBtn.innerHTML = copyCodeIcon;
    downloadCodeBtn.innerHTML = downloadIcon;
    // Inside the DOMContentLoaded listener
    deployGithubBtn.innerHTML = githubIcon;


    // Auth Modal Listeners
    closeAuthModalBtn.addEventListener('click', closeAllModals);
    closeDashboardModalBtn.addEventListener('click', closeAllModals);
    authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAllModals(); });
    dashboardModal.addEventListener('click', (e) => { if (e.target === dashboardModal) closeAllModals(); });
    showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); showLoginView(); });
    showLoginFromVerifyBtn.addEventListener('click', (e) => { e.preventDefault(); showLoginView(); });
    showLoginFromForgotBtn.addEventListener('click', (e) => { e.preventDefault(); showLoginView(); });
    showSignupBtn.addEventListener('click', (e) => { e.preventDefault(); loginView.style.display = 'none'; forgotPasswordView.style.display = 'none'; signupView.style.display = 'block'; });
    showForgotPasswordBtn.addEventListener('click', (e) => { e.preventDefault(); loginView.style.display = 'none'; forgotPasswordView.style.display = 'block'; });

    // Add this inside your main DOMContentLoaded listener
    // Add this inside the main document.addEventListener("DOMContentLoaded", ...) block
    document.getElementById('close-visual-editor-btn').addEventListener('click', () => {
        // Programmatically click the "Canvas" mode button to exit visual edit
        document.querySelector('.mode-btn[data-mode="canvas-en"]').click();
    });
    removeTokenBtn.addEventListener('click', () => {
        showConfirmationModal(
            'Remove GitHub Token',
            'Are you sure you want to remove your saved GitHub token? You will need to add a new one to deploy.',
            async () => {
                try {
                    const response = await fetch(`${backendUrl}/users/me/github-token`, {
                        method: 'DELETE',
                        headers: await getAuthHeaders(),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail || 'Failed to remove token.');
                    }

                    showNotification('GitHub token removed successfully!', 'success');

                    // Update local user state
                    currentUser.github_token = null;
                    currentUser.github_token_expiry = null;

                    // Switch the modal view back to "Save Token" mode
                    showSaveTokenMode();

                } catch (error) {
                    console.error("Error removing token:", error);
                    showNotification(error.message, 'error');
                }
            },
            'danger' // Use the danger confirmation style
        );
    });

    const modeSelector = document.getElementById('mode-selector');
    const visualEditorPanel = document.getElementById('visual-editor-panel');
    const closeVisualEditorBtn = document.getElementById('close-visual-editor-btn');
    const editorTabButtons = document.querySelectorAll('.editor-tab-btn');
    const editorTabPanes = document.querySelectorAll('.editor-tab-pane');

    // Function to open or close the panel based on the selected mode
    const handleModeChange = (selectedMode) => {
        // Toggle the panel visibility
        if (selectedMode === 'visual-edit') {
            visualEditorPanel.classList.add('open');
        } else {
            visualEditorPanel.classList.remove('open');
        }

        // Update the active state of the mode buttons
        modeSelector.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === selectedMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };
// Prompt Viewer Modal Listeners
    if (closePromptModalBtn) {
        closePromptModalBtn.addEventListener('click', () => {
            promptViewerModal.style.display = 'none';
        });
    }

    if (copyFullPromptBtn) {
        copyFullPromptBtn.addEventListener('click', () => {
            const text = document.getElementById('prompt-viewer-content').textContent;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyFullPromptBtn.innerText;
                copyFullPromptBtn.innerText = "Copied!";
                copyFullPromptBtn.style.backgroundColor = "#4ADE80"; 
                setTimeout(() => {
                    copyFullPromptBtn.innerText = originalText;
                    copyFullPromptBtn.style.backgroundColor = ""; 
                }, 2000);
            });
        });
    }

    // Add to global click listener to close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target === promptViewerModal) {
            promptViewerModal.style.display = 'none';
        }
    });
    // Listen for clicks on the main mode selector (Canvas / Visual Edit)
    modeSelector.addEventListener('click', (e) => {
        const button = e.target.closest('.mode-btn');
        if (button) {
            handleModeChange(button.dataset.mode);
        }
    });

    // Listen for a click on the panel's close button
    closeVisualEditorBtn.addEventListener('click', () => {
        // Set the mode back to canvas to close the panel and update the button
        handleModeChange('canvas-en'); 
    });

    // Logic for switching tabs INSIDE the visual editor (Design, Elements, Apps)
    editorTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Update active state for tab buttons
            editorTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show the correct tab pane
            editorTabPanes.forEach(pane => {
                if (pane.id === `${targetTab}-tab-pane`) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
    
    deployGithubBtn.addEventListener('click', () => {
        if (currentUser && currentUser.github_token) {
            showDeployMode();
        } else {
            showSaveTokenMode();
        }
        githubDeployModal.style.display = 'flex';
    });
    closeGithubModalBtn.addEventListener('click', () => {
        githubDeployModal.style.display = 'none';
    });

    githubDeployCancelBtn.addEventListener('click', () => {
        githubDeployModal.style.display = 'none';
    });
    // Inside DOMContentLoaded, replace the old githubDeployForm.onsubmit

    githubDeployForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if we are in "Save Token" mode or "Deploy" mode
        const isSaveTokenMode = githubDeployConfirmBtn.textContent === 'Save Token';

        if (isSaveTokenMode) {
            // --- Logic for SAVING the token ---
            const token = githubTokenInput.value.trim();
            if (!token) {
                githubDeployError.textContent = 'Please provide a Personal Access Token.';
                return;
            }

            githubDeployConfirmBtn.textContent = 'Saving...';
            githubDeployConfirmBtn.disabled = true;
            githubDeployError.textContent = '';

            try {
                const response = await fetch(`${backendUrl}/users/me/github-token`, {
                    method: 'POST',
                    headers: await getAuthHeaders(),
                    body: JSON.stringify({ github_token: token })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.detail);

                showNotification('GitHub token saved successfully! You can now deploy to Github', 'success');
                currentUser.github_token = 'exists'; // Update local state
                githubDeployModal.style.display = 'none';

            } catch (error) {
                githubDeployError.textContent = error.message;
            } finally {
                githubDeployConfirmBtn.textContent = 'Save Token';
                githubDeployConfirmBtn.disabled = false;
            }

        } else {
            // --- Logic for DEPLOYING to GitHub ---
            const repoName = githubRepoNameInput.value.trim();
            const htmlContent = currentCodeCache.html;

            if (!repoName) {
                githubDeployError.textContent = 'Repository name is required.';
                return;
            }

            githubDeployConfirmBtn.textContent = 'Deploying...';
            githubDeployConfirmBtn.disabled = true;
            githubDeployError.textContent = '';

            try {
                const response = await fetch(`${backendUrl}/deploy-github`, {
                    method: 'POST',
                    headers: await getAuthHeaders(),
                    body: JSON.stringify({
                        html_content: htmlContent,
                        repo_name: repoName,
                        project_timestamp: currentEditingProjectTimestamp
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    // If token expired, backend returns 401
                    if (response.status === 401) {
                        currentUser.github_token = null; // Clear local state
                        showNotification(result.detail, 'error');

                        // THIS IS THE FIX: Call the helper function to reset the modal state
                        showSaveTokenMode();

                        return; // Stop execution here
                    }
                    throw new Error(result.detail || 'Deployment failed.');
                }

                showNotification('Successfully deployed to GitHub!', 'success');
                githubDeployModal.style.display = 'none';
                window.open(result.url, '_blank');

            } catch (error) {
                githubDeployError.textContent = error.message;
            } finally {
                githubDeployConfirmBtn.textContent = 'Deploy';
                githubDeployConfirmBtn.disabled = false;
            }
        }
    });
    loadGoogleFonts();
    populateFontDropdown();

    fontSelectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fontDropdown.classList.toggle('show');
    });

    // Also, add the font dropdown to the global click listener that closes popups
    // Find this listener in your code and add the new condition.
    document.addEventListener('click', (e) => {
        if (!themeDropdown.contains(e.target) && !themeSelectorBtn.contains(e.target)) { themeDropdown.classList.remove('show'); }
        if (!avatarDropdown.contains(e.target) && !avatarWrapper.contains(e.target)) { avatarDropdown.classList.remove('show'); }
        // Add this line:
        if (!fontDropdown.contains(e.target) && !fontSelectorBtn.contains(e.target)) { fontDropdown.classList.remove('show'); }
    });

    const componentsPalette = document.getElementById('visual-editor-components');
    if (componentsPalette) {
        componentsPalette.addEventListener('dragstart', (e) => {
            const componentItem = e.target.closest('.component-item');
            if (componentItem) {
                // Store the type of component being dragged
                e.dataTransfer.setData('text/plain', componentItem.dataset.componentType);
                e.dataTransfer.effectAllowed = 'copy';
            }
        });
    }

    const borderRadiusSlider = document.getElementById('border-radius-slider');
    const borderRadiusValue = document.getElementById('border-radius-value');

    if (borderRadiusSlider && borderRadiusValue) {
        borderRadiusSlider.addEventListener('input', (e) => {
            const radius = e.target.value;
            borderRadiusValue.textContent = `${radius}px`;
            applyStyle('borderRadius', `${radius}px`);
        });
    }
signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // --- 1. Get Button and Set Loading State ---
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>';
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        signupError.textContent = "";

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                sendEmailVerification(userCredential.user).then(() => {
                    signOut(auth);
                    signupView.style.display = 'none';
                    verificationEmailDisplay.textContent = userCredential.user.email;
                    verificationView.style.display = 'block';
                    
                    // Reset button for next time
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                });
            })
            .catch((error) => { 
                signupError.textContent = error.message; 
                // --- Reset Button on Error ---
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
    });
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // --- 1. Get Button and Set Loading State ---
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>';

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = "";

        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                if (userCredential.user.emailVerified) {
                    await createUserInBackend(userCredential.user);
                    closeAllModals();
                    // Reset button after successful login and modal close
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }, 500);
                } else {
                    loginError.textContent = "Please verify your email to sign in.";
                    signOut(auth);
                    // Reset button if not verified
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            })
            .catch((error) => { 
                loginError.textContent = error.message; 
                // --- Reset Button on Error ---
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
    });
    
forgotPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // --- 1. Get Button and Set Loading State ---
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>';

        const email = document.getElementById('forgot-password-email').value;
        forgotPasswordMessage.textContent = "";
        forgotPasswordMessage.className = "";

        sendPasswordResetEmail(auth, email)
            .then(() => {
                forgotPasswordMessage.textContent = "Success! Check your inbox for a reset link.";
                forgotPasswordMessage.className = "auth-success";
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            })
            .catch((error) => {
                forgotPasswordMessage.textContent = error.message;
                forgotPasswordMessage.className = "auth-error";
                // Reset button on error
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
    });
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            // This forces a full page refresh after logout.
            // It clears all JavaScript variables and DOM elements,
            // ensuring no data from the previous session remains.
            location.reload();
        }).catch((error) => {
            console.error("Sign out error", error);
            showNotification('Logout failed. Please try again.', 'error');
        });
    });
    // --- START: Add this entire block to fix the Image Editor Modal ---

    closeEditImageModalBtn.addEventListener('click', closeEditImageModal);
    editImageCancelBtn.addEventListener('click', closeEditImageModal);

    // --- THIS IS THE NEW, CORRECTED CODE ---// --- THIS IS THE NEW, CORRECTED CODE ---
    editImageSaveBtn.addEventListener('click', async () => {
        if (!currentEditingImageElement) return;

        const imageUrl = imageUrlInput.value.trim();
        const imageFile = imageUploadFromDevice.files[0];

        // Logic for handling a URL input
        if (imageUrl) {
            await updateProjectAfterImageChange(imageUrl);
            closeEditImageModal();
        }
        // Logic for handling a file upload
        else if (imageFile) {
            const container = currentEditingImageElement.ownerDocument.defaultView.frameElement.closest('.site-container');
            const projectId = container.dataset.timestamp;

            if (!projectId) {
                showNotification("Could not identify the project to upload the image for.", "error");
                return;
            }

            const formData = new FormData();
            formData.append('file', imageFile);
            // Explicitly send the file size to the backend
            formData.append('file_size_bytes', imageFile.size);

            editImageSaveBtn.textContent = 'Uploading...';
            editImageSaveBtn.disabled = true;

            try {
                const response = await fetch(`${backendUrl}/upload-image/${projectId}`, {
                    method: 'POST',
                    headers: { 'Authorization': (await getAuthHeaders()).Authorization }, // Note: No 'Content-Type' for FormData
                    body: formData
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || 'Image upload failed.');
                }

                const result = await response.json();

                // VITAL FIX: Update the user's data (including storage) from the server's response
                if (result.user_profile) {
                    currentUser = result.user_profile;
                    updateCreditDisplay();
                }

                // Save the project with the new image URL
                await updateProjectAfterImageChange(result.url);
                closeEditImageModal();

            } catch (error) {
                console.error("Image upload error:", error);
                showNotification(error.message, 'error');
            } finally {
                editImageSaveBtn.textContent = 'Save Change';
                editImageSaveBtn.disabled = false;
            }
        }
        // If neither is provided, just close
        else {
            closeEditImageModal();
        }


        const borderRadiusSlider = document.getElementById('border-radius-slider');
        const borderRadiusValue = document.getElementById('border-radius-value');

        if (borderRadiusSlider && borderRadiusValue) {
            borderRadiusSlider.addEventListener('input', (e) => {
                const radius = e.target.value;
                borderRadiusValue.textContent = `${radius}px`;
                applyStyle('borderRadius', `${radius}px`);
            });
        }
        // --- END ADD ---
    });


    // Also add the missing logic for the "Choose File" button itself
    chooseFileBtn.addEventListener('click', () => imageUploadFromDevice.click());

    imageUploadFromDevice.addEventListener('change', () => {
        if (imageUploadFromDevice.files.length > 0) {
            fileNameDisplay.textContent = imageUploadFromDevice.files[0].name;
            imageUrlInput.value = ''; // Clear the URL input if a file is chosen
        } else {
            fileNameDisplay.textContent = 'no file selected';
        }
    });

    // --- END: Image Editor Modal Fix ---
    // Main UI Listeners
    generateBtn.addEventListener('click', handleGenerateClick);
    promptInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateClick(); } });
    sidebarToggle.addEventListener('click', () => { sidebar.classList.toggle('collapsed'); setTimeout(updateThemeSelectorPosition, 300); });
    promptInput.addEventListener('input', () => {
        const isChat = currentMode === 'chat';
        if (promptInput.value.trim() !== '' || isChat) { promptSuggestions.classList.add('hidden'); } else { promptSuggestions.classList.remove('hidden'); }
        if (!auth.currentUser && !hasLoginModalBeenShown) { window.openAuthModal(); hasLoginModalBeenShown = true; }
    });
    document.querySelectorAll('.suggestion-card').forEach(card => card.addEventListener('click', () => { promptInput.value = card.dataset.prompt; handleGenerateClick(); }));
    deleteAllBtn.addEventListener('click', () => { showConfirmationModal('Delete All Projects', 'Are you sure you want to delete all projects? This action cannot be undone.', handleDeleteAllProjects, 'danger'); });
    dashboardBtn.addEventListener('click', openDashboardModal);
    loginBtn.addEventListener('click', window.openAuthModal); // ADD THIS LINE

    promptInput.addEventListener('input', autoResizePrompt, false);
    uploadBtn.addEventListener('click', () => { imageUploadInput.click(); });
    // REPLACE your old imageUploadInput listener with this one

    imageUploadInput.addEventListener('change', () => {
        const newFiles = Array.from(imageUploadInput.files);

        for (const file of newFiles) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit per image
                showNotification(`Image '${file.name}' exceeds the 10MB limit and was skipped.`, 'error');
                continue; // Skip this file
            }
            uploadedImageFiles.push(file); // Append new files to the list
        }

        renderImagePreviews(); // Update the UI
        imageUploadInput.value = ''; // Clear input to allow re-selecting the same files
    });
    removeImageBtn.addEventListener('click', clearImageUpload);

    // Dropdown/Global Click Listeners
    themeSelectorBtn.addEventListener('click', (e) => { e.stopPropagation(); themeDropdown.classList.toggle('show'); });
    avatarWrapper.addEventListener('click', (e) => { e.stopPropagation(); avatarDropdown.classList.toggle('show'); });
    document.addEventListener('click', (e) => {
        if (!themeDropdown.contains(e.target) && !themeSelectorBtn.contains(e.target)) { themeDropdown.classList.remove('show'); }
        if (!avatarDropdown.contains(e.target) && !avatarWrapper.contains(e.target)) { avatarDropdown.classList.remove('show'); }
    });
    // In app.js, REPLACE your entire modeSelector listener with this
    modeSelector.addEventListener('click', (e) => {
        const clickedButton = e.target.closest('.mode-btn');
        if (!clickedButton) return;

        const newMode = clickedButton.dataset.mode;

        if (newMode === 'visual-edit') {
            const readySite = document.querySelector('.site-container[data-timestamp]');
            if (!readySite) {
                showNotification("Please generate a project before using the visual editor.", "error");
                return;
            }
        }
        if (newMode === currentMode) return;

        currentMode = newMode;

        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        clickedButton.classList.add('active');

        const isVisualEdit = newMode === 'visual-edit';

        // --- THIS IS THE NEW LOGIC ---
        if (isVisualEdit) {
            visualEditorPanel.classList.add('open');
        } else {
            visualEditorPanel.classList.remove('open');
        }
        // --- END NEW LOGIC ---

        document.body.classList.toggle('visual-edit-active', isVisualEdit);
        toggleVisualEditor(isVisualEdit);
    });

    const showSiteeView = () => {
        publishChoiceView.style.display = 'none';
        netlifyDeployView.style.display = 'none';
        siteeDeployView.style.display = 'block';
        siteeSubdomainInput.value = '';
        siteePublishStatus.textContent = '';
        siteePublishConfirmBtn.disabled = true;
    };

    selectSiteeBtn.onclick = showSiteeView;
    const checkSubdomainAvailability = debounce(async () => {
        const subdomain = siteeSubdomainInput.value.trim();
        const suggestionsContainer = document.getElementById('subdomain-suggestions');

        // 1. CRITICAL FIX: Clear previous suggestions at the start of every check.
        suggestionsContainer.innerHTML = '';

        if (subdomain.length < 3) {
            siteePublishStatus.textContent = 'Must be at least 3 characters.';
            siteePublishStatus.className = 'publish-status taken';
            siteePublishConfirmBtn.disabled = true;
            return;
        }
        if (!/^[a-z0-9-]+$/.test(subdomain)) {
            siteePublishStatus.textContent = 'Only lowercase letters, numbers, and hyphens allowed.';
            siteePublishStatus.className = 'publish-status taken';
            siteePublishConfirmBtn.disabled = true;
            return;
        }

        siteePublishStatus.textContent = 'Checking availability...';
        siteePublishStatus.className = 'publish-status checking';
        siteePublishConfirmBtn.disabled = true;

        try {
            const response = await fetch(`${backendUrl}/check-subdomain-availability?name=${encodeURIComponent(subdomain)}`, {
                headers: await getAuthHeaders()
            });
            const result = await response.json();

            if (result.available) {
                siteePublishStatus.textContent = `${subdomain}-app.sitee.in is available!`;
                siteePublishStatus.className = 'publish-status available';
                siteePublishConfirmBtn.disabled = false;
            } else {
                siteePublishStatus.innerHTML = `<span>${subdomain}-app.sitee.in is taken. Try one of these:</span>`;
                siteePublishStatus.className = 'publish-status taken';
                siteePublishConfirmBtn.disabled = true;

                if (result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
                    result.suggestions.forEach(suggestion => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'suggestion-btn'; // Use the CSS class we added
                        btn.textContent = suggestion;
                        btn.onclick = () => {
                            siteeSubdomainInput.value = suggestion;
                            checkSubdomainAvailability();
                        };
                        suggestionsContainer.appendChild(btn);
                    });
                } else {
                    siteePublishStatus.innerHTML += `<br><small>No simple suggestions found. Try another name.</small>`;
                }
            }
        } catch (error) {
            siteePublishStatus.textContent = 'Could not check availability.';
            siteePublishStatus.className = 'publish-status taken';
        }
    }, 300);
    siteeSubdomainInput.addEventListener('input', checkSubdomainAvailability);

    siteePublishForm.onsubmit = async (event) => {
        event.preventDefault();
        const timestamp = parseInt(publishModal.dataset.currentTimestamp, 10);
        const container = document.querySelector(`.site-container[data-timestamp="${timestamp}"]`);
        const iframe = container ? container.querySelector('iframe') : null;
        const subdomain = siteeSubdomainInput.value.trim();

        if (!subdomain || !iframe || !container) {
            siteePublishStatus.textContent = "Error: Could not find project data.";
            siteePublishStatus.className = 'publish-status taken';
            return;
        }

        siteePublishConfirmBtn.textContent = 'Publishing...';
        siteePublishConfirmBtn.disabled = true;
        const htmlToPublish = getCleanIframeHtml(iframe);

        try {
            const response = await fetch(`${backendUrl}/publish-sitee`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    html_content: htmlToPublish,
                    subdomain: subdomain,
                    project_timestamp: timestamp
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || 'Failed to publish to Sitee subdomain.');

            const publishInfo = container.querySelector('.publish-info');
            const publishBtnEl = container.querySelector('.publish-btn');
            const updateBtnEl = container.querySelector('.update-btn');

            displayPublishInfo(publishInfo, result.url, publishBtnEl, updateBtnEl, container);



            showNotification('Published successfully! Link copied.', 'success');
            navigator.clipboard.writeText(result.url);
            publishModal.style.display = 'none';

        } catch (error) {
            siteePublishStatus.textContent = `Error: ${error.message}`;
            siteePublishStatus.className = 'publish-status taken';
        } finally {
            siteePublishConfirmBtn.textContent = 'Publish';
            // The button will be re-enabled or disabled by the input listener
        }
    };

    // --- END: SITE SUBDOMAIN PUBLISH LOGIC ---
    // Modal Close/Cancel Buttons
    // --- FIX: Modal Stuck Issue ---
modalConfirmBtn.addEventListener('click', async () => {
    try {
        // Execute the specific action (delete, publish, etc.)
        if (currentConfirmCallback) {
            await currentConfirmCallback(); // Await ensures we catch async errors too
        }
    } catch (error) {
        console.error("Error during confirmation action:", error);
        showNotification("An error occurred, but the action may have completed.", "error");
    } finally {
        // This ALWAYS runs, ensuring the popup closes no matter what
        hideConfirmationModal();
    }
});

    modalCancelBtn.addEventListener('click', hideConfirmationModal);
    closeFeedbackModalBtn.addEventListener('click', () => { feedbackModal.style.display = 'none'; });
    // --- START: MISSING FEEDBACK FORM SUBMISSION HANDLER ---

    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedbackText = feedbackTextarea.value.trim();
        const originalMessage = feedbackModal.dataset.messageContent || 'N/A';

        if (feedbackText) {
            // Get the submit button and show a loading state
            const submitBtn = document.getElementById('submit-feedback-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            try {
                await saveFeedbackToFirebase(feedbackText, originalMessage);
                feedbackTextarea.value = ''; // Clear the textarea
                feedbackModal.style.display = 'none'; // Close the modal
            } catch (error) {
                // Error is already handled in saveFeedbackToFirebase, but we can log it here too
                console.error("Submission failed:", error);
            } finally {
                // Restore button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } else {
            showNotification('Please enter your feedback before submitting.', 'error');
        }
    });

    // --- END: MISSING FEEDBACK FORM SUBMISSION HANDLER ---
    feedbackModal.addEventListener('click', (e) => { if (e.target === feedbackModal) { feedbackModal.style.display = 'none'; } });
    closeSuggestionModalBtn.addEventListener('click', () => { suggestionModal.style.display = 'none'; });
    suggestionModal.addEventListener('click', (e) => { if (e.target === suggestionModal) { suggestionModal.style.display = 'none'; } });
    closeDownloadModalBtn.addEventListener('click', () => downloadModal.style.display = 'none');
    downloadCancelBtn.addEventListener('click', () => downloadModal.style.display = 'none');
    // Near the bottom of your <script type="module">, REPLACE the closeEditorBtn listener

    closeEditorBtn.addEventListener('click', () => {
        codeEditorModal.classList.remove('open');

        // --- NEW: STOP LISTENING FOR LIVE CHANGES ---
        codeEditorContent.removeEventListener('input', debouncedCodeEditorUpdate);

        // Final save just in case
        const updatedHtmlFromEditor = codeEditorContent.textContent;
        if (currentEditingProjectTimestamp && updatedHtmlFromEditor) {
            updateProjectCode(currentEditingProjectTimestamp, updatedHtmlFromEditor);
            currentCodeCache.html = updatedHtmlFromEditor;
        }
    });

    // **FIX 3: Download Button Functionality**
    downloadCodeBtn.addEventListener('click', () => {
        const project = currentUser.projects.find(p => p.timestamp === currentEditingProjectTimestamp);
        filenameInput.value = project ? project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'my_sitee_project';
        downloadModal.style.display = 'flex';
    });

    downloadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const format = fileFormatSelect.value;
        const filename = filenameInput.value || 'download';
        const content = format === 'jsx' ? currentCodeCache.react : currentCodeCache.html;
        const mimeType = format === 'jsx' ? 'text/jsx' : 'text/html';

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadModal.style.display = 'none';
    });

    // Visual Editor Toolbar Listeners
    document.getElementById('text-color-picker').addEventListener('input', (e) => {
        applyStyle('color', e.target.value);
        e.target.parentElement.style.backgroundColor = e.target.value; // This updates the swatch
    });
    document.getElementById('bg-color-picker').addEventListener('input', (e) => {
        applyStyle('backgroundColor', e.target.value);
        e.target.parentElement.style.backgroundColor = e.target.value; // This updates the swatch
    });
    document.getElementById('font-size-increase').addEventListener('click', () => changeFontSize(1));
    document.getElementById('font-size-decrease').addEventListener('click', () => changeFontSize(-1));
    document.getElementById('font-bold-btn').addEventListener('click', toggleBold);
    document.getElementById('font-italic-btn').addEventListener('click', toggleItalic);
    document.getElementById('font-underline-btn').addEventListener('click', toggleUnderline);
    document.getElementById('align-left-btn').addEventListener('click', () => applyTextAlign('left'));
    document.getElementById('align-center-btn').addEventListener('click', () => applyTextAlign('center'));
    document.getElementById('align-right-btn').addEventListener('click', () => applyTextAlign('right'));
    document.getElementById('font-size-input').addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value);
        if (!isNaN(newSize) && currentlySelectedElementInIframe) {
            prepareToModifyElement();
            currentlySelectedElementInIframe.style.fontSize = `${newSize}px`;
            triggerVisualUpdateSave();
        }
    });
    // REPLACE THE TWO LINES ABOVE WITH THIS BLOCK
    undoBtn.addEventListener('click', () => {
        if (currentlySelectedElementInIframe) {
            const iframe = currentlySelectedElementInIframe.ownerDocument.defaultView.frameElement;
            if (iframe) handleUndo(iframe);
        }
    });

    redoBtn.addEventListener('click', () => {
        if (currentlySelectedElementInIframe) {
            const iframe = currentlySelectedElementInIframe.ownerDocument.defaultView.frameElement;
            if (iframe) handleRedo(iframe);
        }
    });
    deleteElementBtn.addEventListener('click', deleteSelectedElement);
    // --- PUBLISH MODAL LOGIC ---

    // Function to switch to the Netlify view
    const showNetlifyView = () => {
        if (publishChoiceView) publishChoiceView.style.display = 'none';
        if (siteeDeployView) siteeDeployView.style.display = 'none';
        if (netlifyDeployView) netlifyDeployView.style.display = 'block';
        netlifyProjectNameInput.value = '';
        netlifyPublishError.textContent = '';
    };

    // Function to switch back to the main choice view
    const showChoiceView = () => {
        if (publishChoiceView) publishChoiceView.style.display = 'block';
        if (siteeDeployView) siteeDeployView.style.display = 'none';
        if (netlifyDeployView) netlifyDeployView.style.display = 'none';
    };

    // Attach listeners to the buttons
    selectNetlifyBtn.onclick = showNetlifyView;

    document.querySelectorAll('.publish-back-btn').forEach(btn => {
        btn.onclick = showChoiceView;
    });

    closePublishModalBtn.onclick = () => {
        publishModal.style.display = 'none';
    };

    publishCancelBtn.onclick = () => {
        publishModal.style.display = 'none';
    };

    // The missing submission handler for the Netlify form
    netlifyPublishForm.onsubmit = async (event) => {
        event.preventDefault();

        // Use the stored timestamp to find the correct container and iframe
        const timestamp = publishModal.dataset.currentTimestamp;
        const container = document.querySelector(`.site-container[data-timestamp="${timestamp}"]`);
        const iframe = container ? container.querySelector('iframe') : null;
        const projectName = netlifyProjectNameInput.value.trim();

        // This check will now pass
        if (!projectName || !iframe || !container) {
            netlifyPublishError.textContent = "Could not find the project to publish.";
            return;
        }

        netlifyPublishConfirmBtn.textContent = 'Publishing...';
        netlifyPublishConfirmBtn.disabled = true;
        netlifyPublishError.textContent = '';

        const htmlToPublish = getCleanIframeHtml(iframe);

        try {
            const response = await fetch(`${backendUrl}/users/${currentUser.id}/projects/${container.dataset.timestamp}/publish`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    html_content: htmlToPublish,
                    project_name: projectName
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || 'Failed to publish.');

            const publishInfo = container.querySelector('.publish-info');
            const publishBtnEl = container.querySelector('.publish-btn');
            const updateBtnEl = container.querySelector('.update-btn');

            container.dataset.projectName = projectName;
            displayPublishInfo(publishInfo, result.url, publishBtnEl, updateBtnEl);

            showNotification('Published to Netlify! Link copied.', 'success');
            navigator.clipboard.writeText(result.url);
            publishModal.style.display = 'none';

        } catch (error) {
            netlifyPublishError.textContent = error.message;
        } finally {
            netlifyPublishConfirmBtn.textContent = 'Publish';
            netlifyPublishConfirmBtn.disabled = false;
        }
    };
    btnStyleFilled.addEventListener('click', () => {
        if (currentlySelectedElementInIframe && currentlySelectedElementInIframe.classList.contains('btn-sitee')) {
            prepareToModifyElement();
            currentlySelectedElementInIframe.classList.remove('btn-sitee-outline');
            currentlySelectedElementInIframe.classList.add('btn-sitee-filled');
            btnStyleFilled.classList.add('active');
            btnStyleOutline.classList.remove('active');
            triggerVisualUpdateSave();
        }
    });

    btnStyleOutline.addEventListener('click', () => {
        if (currentlySelectedElementInIframe && currentlySelectedElementInIframe.classList.contains('btn-sitee')) {
            prepareToModifyElement();
            currentlySelectedElementInIframe.classList.remove('btn-sitee-filled');
            currentlySelectedElementInIframe.classList.add('btn-sitee-outline');
            btnStyleOutline.classList.add('active');
            btnStyleFilled.classList.remove('active');
            triggerVisualUpdateSave();
        }
    });

});
const minDelayPromise = new Promise(resolve => {
    setTimeout(resolve, 2000);
});

const pageLoadPromise = new Promise(resolve => {
    // FIX: Check if the page ALREADY finished loading before we attached the listener
    if (document.readyState === 'complete') {
        resolve();
    } else {
        window.addEventListener('load', resolve);
    }
});

Promise.all([minDelayPromise, pageLoadPromise]).then(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
        preloader.classList.add("hidden");
    }
});
