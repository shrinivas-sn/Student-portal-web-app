// --- MAIN ENTRY POINT & EVENT LISTENERS ---

function setupEventListeners() {
    signinButton.addEventListener('click', handleSignIn);
    signoutButton.addEventListener('click', handleSignOut);
    
    // 1. GLOBAL BROWSER BACK BUTTON HANDLING
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const state = event.state;
            if (state.view === 'dashboard') {
                showDashboardView(false);
            } else if (state.view === 'class') {
                showClassView(state.classId, false);
            } else if (state.view === 'students-list') {
                showStudentsListView(state.classId, state.gender, false);
            } else if (state.view === 'student-profile') {
                showStudentProfileView(state.studentId, false);
            } else if (state.view === 'attendance') {
                showAttendanceView(false);
            }
        } else {
             showDashboardView(false);
        }
    });

    document.addEventListener('click', (event) => {
        const target = event.target;
        const isMobile = window.innerWidth < 768;

        if (target.closest('#mobile-menu-button')) {
            if (isMobile) {
                sidebar.classList.toggle('active');
            } else {
                sidebar.classList.toggle('w-64');
                sidebar.classList.toggle('w-0');
                sidebar.querySelectorAll('.p-4').forEach(el => {
                    el.classList.toggle('opacity-0');
                    el.classList.toggle('invisible');
                });
            }
        } 
        else if (!target.closest('.sidebar')) {
            if (isMobile && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    studentDobInput.addEventListener('change', calculateAge);

    // 2. SIDEBAR NAVIGATION
    classLinks.forEach(link => link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetClass = link.dataset.class;
        showClassView(targetClass, 'replace');
        if (sidebar.classList.contains('active')) sidebar.classList.remove('active');
    }));
    
    genderCards.forEach(card => card.addEventListener('click', () => {
        showStudentsListView(currentClass, card.dataset.gender, 'push');
    }));
    
    // 3. FIX: DIRECT BACK BUTTON NAVIGATION
    backToDashboardButton.addEventListener('click', () => {
        showDashboardView('replace');
    });

    backToClassButton.addEventListener('click', () => {
        if (currentClass) showClassView(currentClass, 'replace');
        else showDashboardView('replace');
    });

    backToStudentsListButton.addEventListener('click', () => {
        if (currentClass && currentGender) showStudentsListView(currentClass, currentGender, 'replace');
        else showClassView(currentClass || '8', 'replace');
    });
    
    // 4. OTHER LISTENERS
    promoteButton.addEventListener('click', (e) => { e.preventDefault(); promoteModal.classList.remove('hidden'); });
    addStudentButton.addEventListener('click', createNewStudent);
    saveStudentButton.addEventListener('click', saveStudent);
    studentSearch.addEventListener('input', (e) => filterStudents(e.target.value));
    cancelPromoteButton.addEventListener('click', () => promoteModal.classList.add('hidden'));
    confirmPromoteButton.addEventListener('click', promoteStudents);
    cancelDeleteButton.addEventListener('click', () => deleteModal.classList.add('hidden'));
    confirmDeleteButton.addEventListener('click', deleteStudent);
    addCustomFieldButton.addEventListener('click', () => newCustomFieldSection.classList.remove('hidden'));
    saveCustomFieldButton.addEventListener('click', addCustomField);
    cancelCustomFieldButton.addEventListener('click', () => { 
        newCustomFieldSection.classList.add('hidden');
        document.getElementById('new-custom-field-name').value = '';
        document.getElementById('new-custom-field-value').value = '';
    });
    uploadProfilePicButton.addEventListener('click', () => profilePicUpload.click());
    profilePicUpload.addEventListener('change', handleProfilePicUpload);
    uploadDocumentButton.addEventListener('click', () => documentUpload.click());
    documentUpload.addEventListener('change', handleDocumentUpload);

    scanFaceButton.addEventListener('click', (e) => {
        e.preventDefault();
        startFaceCamera();
    });
    
    closeFaceModalButton.addEventListener('click', closeFaceModal);
    captureFaceButton.addEventListener('click', captureFaceHandler);

    // --- ATTENDANCE LISTENERS ---
    markAttendanceButton.addEventListener('click', (e) => {
        e.preventDefault();
        showAttendanceView('push');
        if (sidebar.classList.contains('active')) sidebar.classList.remove('active');
    });

    backFromAttendanceButton.addEventListener('click', () => {
        showDashboardView('replace');
    });

    startScannerButton.addEventListener('click', () => {
        startScannerButton.classList.add('hidden');
        stopScannerButton.classList.remove('hidden');
        cameraPlaceholder.classList.add('hidden');
        attendanceVideo.classList.remove('hidden');
        liveIndicator.classList.remove('hidden');
        startAttendanceScanner();
    });

    stopScannerButton.addEventListener('click', () => {
        startScannerButton.classList.remove('hidden');
        stopScannerButton.classList.add('hidden');
        cameraPlaceholder.classList.remove('hidden');
        attendanceVideo.classList.add('hidden');
        liveIndicator.classList.add('hidden');
        stopAttendanceScanner();
    });

    // NEW: Dashboard Class Card Listeners
    attendanceClassCards.forEach(card => {
        card.addEventListener('click', () => {
            const classId = card.dataset.reportClass;
            showClassAttendanceReport(classId);
        });
    });

    // Back button from Class Attendance Table
    if(backToReportsButton) {
        backToReportsButton.addEventListener('click', () => {
            hideClassAttendanceReport();
        });
    }

    if (reportDatePicker) {
        reportDatePicker.addEventListener('change', () => {
            loadTodaysAttendance();
        });
    }

    if (downloadReportButton) {
        downloadReportButton.addEventListener('click', generatePDFReport);
    }
}

// PDF Generation Logic
async function generatePDFReport() {
    if (!window.jspdf) {
        alert("PDF Library not loaded. Check internet.");
        return;
    }

    if (!currentReportClass) {
        alert("Please select a class first.");
        return;
    }

    const date = reportDatePicker.value || new Date().toISOString().split('T')[0];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Filter Students for Current Class
    const activeStudents = allStudents.filter(s => s.standard === currentReportClass);
    
    let attendanceRecords = [];
    try {
        const snapshot = await db.collection('attendance').where('date', '==', date).get();
        attendanceRecords = snapshot.docs.map(doc => doc.data());
    } catch (e) {
        console.error("PDF Fetch Error", e);
    }

    const tableData = activeStudents.map(student => {
        const record = attendanceRecords.find(r => r.studentId === student.id);
        const status = record ? 'Present' : 'Absent';
        const rollNo = student.rollNumber || 'N/A';
        return [student.name, rollNo, student.standard + 'th', status];
    });

    // Sort by Roll No
    tableData.sort((a, b) => (parseInt(a[1]) || 9999) - (parseInt(b[1]) || 9999));

    // Add Title
    doc.setFontSize(18);
    doc.text(`Daily Attendance Report: Class ${currentReportClass}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 14, 30);
    doc.text(`Total Students: ${activeStudents.length}`, 14, 36);

    // Add Table
    doc.autoTable({
        head: [['Student Name', 'Roll No', 'Class', 'Status']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244] }, 
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw === 'Absent') {
                    data.cell.styles.textColor = [220, 53, 69]; // Red
                } else {
                    data.cell.styles.textColor = [40, 167, 69]; // Green
                }
            }
        }
    });

    doc.save(`Attendance_Class${currentReportClass}_${date}.pdf`);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadFaceModels();
    setupEventListeners();
});