// --- INITIALIZATION ---
const fbApp = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- GLOBAL STATE ---
let allStudents = [];
let currentView = 'dashboard';
let currentClass = null;
let currentGender = null;
let currentStudentId = null;

// Temporary vars
let pendingDocuments = []; 
let currentFaceDescriptor = null; 

// Local Cache to prevent duplicate attendance saves
let todaysAttendance = [];
// New: Store which class report is currently being viewed on dashboard
let currentReportClass = null;

const AUTHORIZED_EMAILS = [
    "shrinivassn772001@gmail.com",
    "vsnemagoudar1978@gmail.com" ,
];

// --- DOM ELEMENTS ---
const loadingScreen = document.getElementById('loading-screen');
const signinScreen = document.getElementById('signin-screen');
const app = document.getElementById('app');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.getElementById('main-content');

// Buttons
const signinButton = document.getElementById('signin-button');
const signoutButton = document.getElementById('signout-btn');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const promoteButton = document.getElementById('promote-btn');
const backToDashboardButton = document.getElementById('back-to-dashboard');
const backToClassButton = document.getElementById('back-to-class');
const backToStudentsListButton = document.getElementById('back-to-students-list');
const addStudentButton = document.getElementById('add-student-btn');
const saveStudentButton = document.getElementById('save-student-btn');
const cancelPromoteButton = document.getElementById('cancel-promote-btn');
const confirmPromoteButton = document.getElementById('confirm-promote-btn');
const cancelDeleteButton = document.getElementById('cancel-delete-btn');
const confirmDeleteButton = document.getElementById('confirm-delete-btn');
const addCustomFieldButton = document.getElementById('add-custom-field-btn');
const saveCustomFieldButton = document.getElementById('save-custom-field-btn');
const cancelCustomFieldButton = document.getElementById('cancel-custom-field-btn');
const uploadProfilePicButton = document.getElementById('upload-profile-pic-btn');
const uploadDocumentButton = document.getElementById('upload-document-btn');

// Face Scan Elements
const scanFaceButton = document.getElementById('scan-face-btn');
const faceScanModal = document.getElementById('face-scan-modal');
const closeFaceModalButton = document.getElementById('close-face-modal');
const captureFaceButton = document.getElementById('capture-face-btn');
const faceVideo = document.getElementById('face-video');
const faceCanvas = document.getElementById('face-canvas');
const faceStatus = document.getElementById('face-status');
const faceScanStatusText = document.getElementById('face-scan-status');
const loadingText = document.getElementById('loading-text');

// Attendance Scanner Elements
const markAttendanceButton = document.getElementById('mark-attendance-btn');
const backFromAttendanceButton = document.getElementById('back-from-attendance');
const attendanceVideo = document.getElementById('attendance-video');
const attendanceCanvas = document.getElementById('attendance-canvas');
const attendanceLog = document.getElementById('attendance-log');
const todayScanCount = document.getElementById('today-scan-count');
const startScannerButton = document.getElementById('start-scanner-btn');
const stopScannerButton = document.getElementById('stop-scanner-btn');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const liveIndicator = document.getElementById('live-indicator');

// Report Elements
const attendanceClassSelector = document.getElementById('attendance-class-selector');
const attendanceClassReport = document.getElementById('attendance-class-report');
const reportClassTitle = document.getElementById('report-class-title');
const backToReportsButton = document.getElementById('back-to-reports-btn');
const reportTableBody = document.getElementById('report-table-body');
const reportDatePicker = document.getElementById('report-date-picker');
const downloadReportButton = document.getElementById('download-report-btn');
// Node List for new Class Cards
const attendanceClassCards = document.querySelectorAll('.attendance-class-card');

// Inputs & Display
const signinError = document.getElementById('signin-error');
const studentSearch = document.getElementById('student-search');
const newCustomFieldSection = document.getElementById('new-custom-field');
const profilePicUpload = document.getElementById('profile-pic-upload');
const profilePicFilename = document.getElementById('profile-pic-filename');
const profilePicError = document.getElementById('profile-pic-error');
const documentUpload = document.getElementById('document-upload');
const studentDobInput = document.getElementById('student-dob');
const studentAgeInput = document.getElementById('student-age');
// NEW: Roll Number Input
const studentRollNoInput = document.getElementById('student-roll-no');

// Modals
const promoteModal = document.getElementById('promote-modal');
const deleteModal = document.getElementById('delete-modal');

// Node Lists
const classLinks = document.querySelectorAll('.class-link');
const genderCards = document.querySelectorAll('.gender-card');