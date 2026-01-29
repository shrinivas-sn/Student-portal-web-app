// --- GLOBAL VOICE VARIABLES ---
let recognition = null;
let isListening = false;
let voiceAutoStopTimer = null;

// --- GLOBAL TOUR VARIABLES ---
let currentTourIndex = 0;

// --- MAIN ENTRY POINT & EVENT LISTENERS ---

// Defined at the top to avoid ReferenceErrors
function setupEventListeners() {
    console.log("Setting up event listeners..."); // Debug check

    if (signinButton) signinButton.addEventListener('click', handleSignIn);
    if (signoutButton) signoutButton.addEventListener('click', handleSignOut);
    
    // Voice Command: Smart Toggle
    if (voiceCommandButton) {
        voiceCommandButton.addEventListener('click', () => {
            toggleVoiceCommand();
        });
    }

    // App Tour Button (Restored to Open Modal)
    const appTourButton = document.getElementById('app-tour-btn');
    if (appTourButton) {
        appTourButton.addEventListener('click', (e) => {
            e.preventDefault();
            startAppTour();
            // Close sidebar on mobile if open
            if (sidebar && sidebar.classList.contains('active')) sidebar.classList.remove('active');
        });
    }
    const closeTourButton = document.getElementById('close-tour-btn');
    if (closeTourButton) closeTourButton.addEventListener('click', closeAppTour);

    // Navigation
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const state = event.state;
            if (state.view === 'dashboard') showDashboardView(false);
            else if (state.view === 'class') showClassView(state.classId, false);
            else if (state.view === 'students-list') showStudentsListView(state.classId, state.gender, false);
            else if (state.view === 'student-profile') showStudentProfileView(state.studentId, false);
            else if (state.view === 'attendance') showAttendanceView(false);
            else if (state.view === 'mood') showMoodView(false);
        } else {
             showDashboardView(false);
        }
    });

    document.addEventListener('click', (event) => {
        const target = event.target;
        const isMobile = window.innerWidth < 768;
        if (target.closest('#mobile-menu-button')) {
            if (isMobile) sidebar.classList.toggle('active');
            else {
                sidebar.classList.toggle('w-64');
                sidebar.classList.toggle('w-0');
                sidebar.querySelectorAll('.p-4').forEach(el => {
                    el.classList.toggle('opacity-0');
                    el.classList.toggle('invisible');
                });
            }
        } else if (!target.closest('.sidebar') && isMobile && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    if (studentDobInput) studentDobInput.addEventListener('change', calculateAge);
    if (studentSearch) studentSearch.addEventListener('input', (e) => filterStudents(e.target.value));

    classLinks.forEach(link => link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetClass = link.dataset.class;
        showClassView(targetClass, 'replace');
        if (sidebar.classList.contains('active')) sidebar.classList.remove('active');
    }));
    
    genderCards.forEach(card => card.addEventListener('click', () => {
        showStudentsListView(currentClass, card.dataset.gender, 'push');
    }));

    if (backToDashboardButton) backToDashboardButton.addEventListener('click', () => showDashboardView('replace'));
    if (backToClassButton) backToClassButton.addEventListener('click', () => {
        if (currentClass) showClassView(currentClass, 'replace');
        else showDashboardView('replace');
    });
    if (backToStudentsListButton) backToStudentsListButton.addEventListener('click', () => {
        if (currentClass && currentGender) showStudentsListView(currentClass, currentGender, 'replace');
        else showClassView(currentClass || '8', 'replace');
    });

    if (promoteButton) promoteButton.addEventListener('click', (e) => { e.preventDefault(); promoteModal.classList.remove('hidden'); });
    if (addStudentButton) addStudentButton.addEventListener('click', createNewStudent);
    if (saveStudentButton) saveStudentButton.addEventListener('click', saveStudent);
    if (cancelPromoteButton) cancelPromoteButton.addEventListener('click', () => promoteModal.classList.add('hidden'));
    if (confirmPromoteButton) confirmPromoteButton.addEventListener('click', promoteStudents);
    if (cancelDeleteButton) cancelDeleteButton.addEventListener('click', () => deleteModal.classList.add('hidden'));
    if (confirmDeleteButton) confirmDeleteButton.addEventListener('click', deleteStudent);
    
    if (addCustomFieldButton) addCustomFieldButton.addEventListener('click', () => newCustomFieldSection.classList.remove('hidden'));
    if (saveCustomFieldButton) saveCustomFieldButton.addEventListener('click', addCustomField);
    if (cancelCustomFieldButton) cancelCustomFieldButton.addEventListener('click', () => { 
        newCustomFieldSection.classList.add('hidden');
        document.getElementById('new-custom-field-name').value = '';
        document.getElementById('new-custom-field-value').value = '';
    });

    if (uploadProfilePicButton) uploadProfilePicButton.addEventListener('click', () => profilePicUpload.click());
    if (profilePicUpload) profilePicUpload.addEventListener('change', handleProfilePicUpload);
    if (uploadDocumentButton) uploadDocumentButton.addEventListener('click', () => documentUpload.click());
    if (documentUpload) documentUpload.addEventListener('change', handleDocumentUpload);

    if (scanFaceButton) {
        scanFaceButton.disabled = true;
        scanFaceButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading AI...';
        scanFaceButton.classList.add('opacity-50', 'cursor-not-allowed');
        scanFaceButton.addEventListener('click', (e) => { e.preventDefault(); startFaceCamera(); });
    }
    if (closeFaceModalButton) closeFaceModalButton.addEventListener('click', closeFaceModal);
    if (captureFaceButton) captureFaceButton.addEventListener('click', captureFaceHandler);

    if (markAttendanceButton) {
        markAttendanceButton.addEventListener('click', (e) => {
            e.preventDefault();
            showAttendanceView('push');
            if (sidebar.classList.contains('active')) sidebar.classList.remove('active');
        });
    }
    if (backFromAttendanceButton) backFromAttendanceButton.addEventListener('click', () => showDashboardView('replace'));

    if (startScannerButton) {
        startScannerButton.disabled = true;
        startScannerButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading AI...';
        startScannerButton.classList.add('opacity-50', 'cursor-not-allowed');
        startScannerButton.addEventListener('click', () => {
            startScannerButton.classList.add('hidden');
            stopScannerButton.classList.remove('hidden');
            if(cameraPlaceholder) cameraPlaceholder.classList.add('hidden');
            if(attendanceVideo) attendanceVideo.classList.remove('hidden');
            if(liveIndicator) liveIndicator.classList.remove('hidden');
            startAttendanceScanner();
        });
    }

    if (stopScannerButton) {
        stopScannerButton.addEventListener('click', () => {
            startScannerButton.classList.remove('hidden');
            stopScannerButton.classList.add('hidden');
            if(cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
            if(attendanceVideo) attendanceVideo.classList.add('hidden');
            if(liveIndicator) liveIndicator.classList.add('hidden');
            stopAttendanceScanner();
        });
    }

    if (classMoodButton) {
        classMoodButton.addEventListener('click', (e) => {
            e.preventDefault();
            showMoodView('push');
            if (sidebar.classList.contains('active')) sidebar.classList.remove('active');
        });
    }
    if (backFromMoodButton) backFromMoodButton.addEventListener('click', () => showDashboardView('replace'));

    if (startMoodButton) {
        startMoodButton.disabled = true;
        startMoodButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading AI...';
        startMoodButton.classList.add('opacity-50', 'cursor-not-allowed');
        startMoodButton.addEventListener('click', () => {
            startMoodButton.classList.add('hidden');
            stopMoodButton.classList.remove('hidden');
            if(moodCameraPlaceholder) moodCameraPlaceholder.classList.add('hidden');
            if(moodVideo) moodVideo.classList.remove('hidden');
            startMoodScanner();
        });
    }

    if (stopMoodButton) {
        stopMoodButton.addEventListener('click', () => {
            startMoodButton.classList.remove('hidden');
            stopMoodButton.classList.add('hidden');
            if(moodCameraPlaceholder) moodCameraPlaceholder.classList.remove('hidden');
            if(moodVideo) moodVideo.classList.add('hidden');
            stopMoodScanner();
        });
    }

    if (attendanceClassCards) {
        attendanceClassCards.forEach(card => {
            card.addEventListener('click', () => {
                const classId = card.dataset.reportClass;
                showClassAttendanceReport(classId);
            });
        });
    }
    if(backToReportsButton) backToReportsButton.addEventListener('click', () => hideClassAttendanceReport());
    if (reportDatePicker) reportDatePicker.addEventListener('change', () => loadTodaysAttendance());
    
    if (downloadReportButton) {
        downloadReportButton.addEventListener('click', () => {
            if (typeof generatePDFReport === 'function') generatePDFReport();
            else alert("PDF feature unavailable right now. Please refresh.");
        });
    }
}

// --- MODAL LOGIC: APP TOUR (Restored) ---

function startAppTour() {
    currentTourIndex = 0;
    const modal = document.getElementById('tour-modal');
    if(modal) {
        modal.classList.remove('hidden');
        renderTourSlide(currentTourIndex);
    }
}

function renderTourSlide(index) {
    if (typeof APP_TOUR_DATA === 'undefined') {
        alert("Tour data not loaded. Please refresh.");
        return;
    }

    const data = APP_TOUR_DATA[index];
    if (!data) return;

    const iconEl = document.getElementById('tour-icon');
    if(iconEl) iconEl.className = `${data.icon} text-6xl transform transition-transform duration-500 hover:scale-110 ${data.color}`;
    
    const titleEl = document.getElementById('tour-title');
    if(titleEl) titleEl.innerText = data.title;
    
    const descEl = document.getElementById('tour-desc');
    if(descEl) descEl.innerHTML = data.description;

    const dotsContainer = document.getElementById('tour-dots');
    if(dotsContainer) {
        dotsContainer.innerHTML = '';
        APP_TOUR_DATA.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${i === index ? 'bg-blue-600 w-4' : 'bg-gray-300'}`;
            dotsContainer.appendChild(dot);
        });
    }

    const nextBtn = document.getElementById('tour-next-btn');
    const prevBtn = document.getElementById('tour-prev-btn');

    if(prevBtn) {
        prevBtn.disabled = index === 0;
        prevBtn.onclick = () => renderTourSlide(index - 1);
    }
    
    if(nextBtn) {
        if (index === APP_TOUR_DATA.length - 1) {
            nextBtn.innerText = "Finish";
            nextBtn.onclick = closeAppTour;
        } else {
            nextBtn.innerText = "Next";
            nextBtn.onclick = () => renderTourSlide(index + 1);
        }
    }
}

function closeAppTour() {
    const modal = document.getElementById('tour-modal');
    if(modal) modal.classList.add('hidden');
}


// --- VOICE LOGIC (Smart Toggle + 5s Timer + Advanced Parser) ---

function toggleVoiceCommand() {
    if (isListening) {
        stopVoiceCommand();
    } else {
        startVoiceCommand();
    }
}

function startVoiceCommand() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Sorry, Voice Control is only supported in Chrome/Edge on Desktop or Android.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    isListening = true;
    voiceCommandButton.classList.add('listening-mode');
    showToast("Listening...", "info");

    try {
        recognition.start();
    } catch (e) {
        console.error("Recognition Start Error:", e);
        stopVoiceCommand();
        return;
    }

    if (voiceAutoStopTimer) clearTimeout(voiceAutoStopTimer);
    voiceAutoStopTimer = setTimeout(() => {
        if (isListening) {
            console.log("Auto-stopping mic.");
            showToast("Timeout: Mic off.", "info");
            stopVoiceCommand();
        }
    }, 5000);

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        showToast(`Command: "${command}"`, "info");
        processVoiceCommand(command);
        stopVoiceCommand();
    };

    recognition.onspeechend = () => {
        stopVoiceCommand();
    };

    recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            showToast("Mic blocked. Check settings.", "error");
        } else if (event.error === 'no-speech') {
            showToast("I didn't hear anything.", "info");
        }
        stopVoiceCommand();
    };
}

function stopVoiceCommand() {
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
        recognition = null;
    }
    isListening = false;
    voiceCommandButton.classList.remove('listening-mode');
    if (voiceAutoStopTimer) clearTimeout(voiceAutoStopTimer);
}

function processVoiceCommand(text) {
    const speak = (msg) => {
        const utterance = new SpeechSynthesisUtterance(msg);
        window.speechSynthesis.speak(utterance);
    };

    if (text.includes("dashboard") || text.includes("home")) {
        speak("Going to Dashboard.");
        showDashboardView('replace');
        return;
    }

    if (text.includes("start") && text.includes("attendance")) {
        speak("Starting attendance scanner.");
        showAttendanceView('replace');
        setTimeout(() => {
            if (startScannerButton && !startScannerButton.disabled) startScannerButton.click();
        }, 500);
        return;
    }

    if (text.includes("stop") && text.includes("attendance")) {
        if (currentView === 'attendance') {
            speak("Stopping attendance.");
            if (stopScannerButton) stopScannerButton.click();
        } else {
            speak("Attendance is not running.");
        }
        return;
    }

    if (text.includes("start") && (text.includes("mood") || text.includes("monitor"))) {
        speak("Starting class mood monitor.");
        showMoodView('replace');
        setTimeout(() => {
             if (startMoodButton && !startMoodButton.disabled) startMoodButton.click();
        }, 500);
        return;
    }

    if (text.includes("stop") && (text.includes("mood") || text.includes("monitor"))) {
        if (currentView === 'mood') {
            speak("Stopping mood monitor.");
            if (stopMoodButton) stopMoodButton.click();
        } else {
            speak("Mood monitor is not running.");
        }
        return;
    }

    if (text.includes("download") || (text.includes("get") && text.includes("report"))) {
        let classToDownload = null;

        if (text.includes("8") || text.includes("eighth")) classToDownload = '8';
        else if (text.includes("9") || text.includes("ninth")) classToDownload = '9';
        else if (text.includes("10") || text.includes("tenth")) classToDownload = '10';

        if (classToDownload) {
            speak(`Downloading report for class ${classToDownload}.`);
            currentReportClass = classToDownload; 
            if (currentView !== 'attendance-class-report') {
                generatePDFReport();
            } else {
                generatePDFReport();
            }
        } else {
            speak("Please specify which class report to download. Say 8th, 9th, or 10th.");
        }
        return;
    }

    speak("Sorry, I didn't understand that command.");
}


// --- PDF LOGIC ---
async function generatePDFReport() {
    if (!window.jspdf) { alert("PDF Library not loaded."); return; }
    if (!currentReportClass) { alert("Please select a class first."); return; }
    showToast("Generating PDF Report...", "info");

    const date = reportDatePicker.value || new Date().toISOString().split('T')[0];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const activeStudents = allStudents.filter(s => s.standard === currentReportClass);
    
    let attendanceRecords = [];
    try {
        // Use global database switcher function
        const collection = getCollectionName('attendance');
        const snapshot = await db.collection(collection).where('date', '==', date).get();
        attendanceRecords = snapshot.docs.map(doc => doc.data());
    } catch (e) { console.error("PDF Fetch Error", e); }

    const tableData = activeStudents.map(student => {
        const record = attendanceRecords.find(r => r.studentId === student.id);
        const status = record ? 'Present' : 'Absent';
        const rollNo = student.rollNumber || 'N/A';
        return [student.name, rollNo, student.standard + 'th', status];
    });

    tableData.sort((a, b) => (parseInt(a[1]) || 9999) - (parseInt(b[1]) || 9999));

    doc.setFontSize(18);
    doc.text(`Daily Attendance Report: Class ${currentReportClass}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 14, 30);
    doc.text(`Total Students: ${activeStudents.length}`, 14, 36);

    doc.autoTable({
        head: [['Student Name', 'Roll No', 'Class', 'Status']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244] }, 
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw === 'Absent') data.cell.styles.textColor = [220, 53, 69]; 
                else data.cell.styles.textColor = [40, 167, 69]; 
            }
        }
    });

    const timeString = new Date().toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, ''); 
    const uniqueName = `Attendance_Class${currentReportClass}_${date}_${timeString}.pdf`;
    doc.save(uniqueName);
    setTimeout(() => { showToast("Download Complete!", "success"); }, 500);
}

// ----------------------------------------------------
// INITIALIZATION LISTENER
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // This is the call that was failing. Now the function is definitely defined above.
    setupEventListeners();
    loadFaceModels(); 
});