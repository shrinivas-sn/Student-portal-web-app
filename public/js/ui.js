// --- UI & VIEW NAVIGATION ---

// Toast Notification
function showToast(message, type = 'info') {
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `
        px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white animate-fade-in-up transition-opacity duration-300
        ${type === 'success' ? 'bg-green-600' : 'bg-blue-600'}
    `;
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0'); 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

// NEW: Mood View Navigation
function showMoodView(historyMode = 'push') {
    currentView = 'mood';
    
    // Hide all other views
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('attendance-view').classList.add('hidden');
    document.getElementById('class-view').classList.add('hidden');
    document.getElementById('students-list-view').classList.add('hidden');
    document.getElementById('student-profile-view').classList.add('hidden');
    
    // Show Mood View
    document.getElementById('mood-view').classList.remove('hidden');
    
    document.getElementById('page-title').textContent = 'Class Mood';
    
    // Reset State
    stopAttendanceScanner();
    stopMoodScanner();
    
    const state = { view: 'mood' };
    const url = '#mood';
    if (historyMode === 'push') history.pushState(state, '', url);
    else if (historyMode === 'replace') history.replaceState(state, '', url);
}

// NEW: Update Mood Display
function updateMoodDisplay(expression) {
    if (!moodEmojiDisplay || !moodTextDisplay) return;

    let emoji = '😶';
    let text = 'Detecting...';
    let colorClass = 'text-gray-800';

    switch (expression) {
        case 'happy':
            emoji = '😄'; text = 'Happy & Positive!'; colorClass = 'text-green-600';
            break;
        case 'sad':
            emoji = '🙁'; text = 'Sad / Low Energy'; colorClass = 'text-blue-600';
            break;
        case 'angry':
            emoji = '😠'; text = 'Angry / Tense'; colorClass = 'text-red-600';
            break;
        case 'surprised':
            emoji = '😮'; text = 'Surprised'; colorClass = 'text-purple-600';
            break;
        case 'neutral':
            emoji = '😐'; text = 'Neutral / Calm'; colorClass = 'text-gray-600';
            break;
        default:
            emoji = '😶'; text = 'Waiting...'; colorClass = 'text-gray-400';
    }

    moodEmojiDisplay.textContent = emoji;
    moodTextDisplay.textContent = text;
    moodTextDisplay.className = `text-3xl font-extrabold mb-2 ${colorClass}`;
}


function showDashboardView(historyMode = 'push') {
    currentView = 'dashboard';
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('attendance-view').classList.add('hidden'); 
    document.getElementById('class-view').classList.add('hidden');
    document.getElementById('students-list-view').classList.add('hidden');
    document.getElementById('student-profile-view').classList.add('hidden');
    document.getElementById('mood-view').classList.add('hidden'); // Hide mood

    document.getElementById('page-title').textContent = 'School Statistics';
    
    stopAttendanceScanner();
    stopMoodScanner();
    hideClassAttendanceReport();
    
    const state = { view: 'dashboard' };
    const url = '#dashboard';
    if (historyMode === 'push') history.pushState(state, '', url);
    else if (historyMode === 'replace') history.replaceState(state, '', url);
}

function showClassAttendanceReport(classId) {
    currentReportClass = classId;
    attendanceClassSelector.classList.add('hidden');
    attendanceClassReport.classList.remove('hidden');
    reportClassTitle.textContent = `Class ${classId} Attendance`;
    
    const today = new Date().toISOString().split('T')[0];
    if(reportDatePicker) reportDatePicker.value = today;
    
    loadTodaysAttendance(); 
}

function hideClassAttendanceReport() {
    currentReportClass = null;
    attendanceClassSelector.classList.remove('hidden');
    attendanceClassReport.classList.add('hidden');
}

function showAttendanceView(historyMode = 'push') {
    currentView = 'attendance';
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('attendance-view').classList.remove('hidden'); 
    document.getElementById('class-view').classList.add('hidden');
    document.getElementById('students-list-view').classList.add('hidden');
    document.getElementById('student-profile-view').classList.add('hidden');
    document.getElementById('mood-view').classList.add('hidden'); // Hide mood
    document.getElementById('page-title').textContent = 'Scanner';
    
    document.getElementById('attendance-log').innerHTML = '<p class="text-sm text-gray-400 text-center italic mt-10">Waiting for scans...</p>';
    todaysAttendance = []; 
    todayScanCount.textContent = '0';
    
    startScannerButton.classList.remove('hidden');
    stopScannerButton.classList.add('hidden');
    attendanceVideo.classList.add('hidden');
    cameraPlaceholder.classList.remove('hidden');
    liveIndicator.classList.add('hidden');

    const state = { view: 'attendance' };
    const url = '#attendance';
    if (historyMode === 'push') history.pushState(state, '', url);
    else if (historyMode === 'replace') history.replaceState(state, '', url);
}

function showClassView(classId, historyMode = 'push') {
    currentView = 'class';
    currentClass = classId;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('attendance-view').classList.add('hidden');
    document.getElementById('class-view').classList.remove('hidden');
    document.getElementById('students-list-view').classList.add('hidden');
    document.getElementById('student-profile-view').classList.add('hidden');
    document.getElementById('mood-view').classList.add('hidden'); // Hide mood
    
    stopAttendanceScanner();
    stopMoodScanner();

    let title = classId === 'graduated' ? 'Graduated Students' : `${classId}th Class`;
    document.getElementById('page-title').textContent = title;
    document.getElementById('class-view-title').textContent = title;

    if (classId !== 'graduated') {
        document.querySelector('#class-view .grid').classList.remove('hidden');
        const studentsInClass = allStudents.filter(s => s.standard === classId);
        document.getElementById('male-count').textContent = studentsInClass.filter(s => s.gender === 'male').length;
        document.getElementById('female-count').textContent = studentsInClass.filter(s => s.gender === 'female').length;
    } else {
        document.querySelector('#class-view .grid').classList.add('hidden');
        showStudentsListView('graduated', null, 'replace'); 
        return; 
    }
    
    const state = { view: 'class', classId: classId };
    const url = `#class-${classId}`;
    if (historyMode === 'push') history.pushState(state, '', url);
    else if (historyMode === 'replace') history.replaceState(state, '', url);
}

function showStudentsListView(classId, gender, historyMode = 'push') {
    currentView = 'students-list';
    currentClass = classId;
    currentGender = gender;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('attendance-view').classList.add('hidden');
    document.getElementById('class-view').classList.add('hidden');
    document.getElementById('students-list-view').classList.remove('hidden');
    document.getElementById('student-profile-view').classList.add('hidden');
    document.getElementById('mood-view').classList.add('hidden'); // Hide mood
    
    stopAttendanceScanner();
    stopMoodScanner();

    let title = classId === 'graduated' ? 'Graduated Students' : `${classId}th Class - ${gender === 'male' ? 'Boys' : 'Girls'}`;
    document.getElementById('page-title').textContent = title;
    document.getElementById('students-list-title').textContent = title;
    loadStudentsList(classId, gender);
    
    const state = { view: 'students-list', classId: classId, gender: gender };
    const url = `#students-${classId}-${gender || 'all'}`;
    if (historyMode === 'push') history.pushState(state, '', url);
    else if (historyMode === 'replace') history.replaceState(state, '', url);
}

function showStudentProfileView(studentId, historyMode = 'push') {
    currentView = 'student-profile';
    currentStudentId = studentId;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('attendance-view').classList.add('hidden');
    document.getElementById('class-view').classList.add('hidden');
    document.getElementById('students-list-view').classList.add('hidden');
    document.getElementById('student-profile-view').classList.remove('hidden');
    document.getElementById('mood-view').classList.add('hidden'); // Hide mood
    
    stopAttendanceScanner();
    stopMoodScanner();

    if (studentId === null) {
        clearStudentProfileForm();
        const state = { view: 'student-profile', studentId: 'new' };
        if (historyMode === 'push') history.pushState(state, '', '#student-new');
        else if (historyMode === 'replace') history.replaceState(state, '', '#student-new');
    } else {
        loadStudentProfile(studentId);
        const state = { view: 'student-profile', studentId: studentId };
        const url = `#profile-${studentId}`;
        if (historyMode === 'push') history.pushState(state, '', url);
        else if (historyMode === 'replace') history.replaceState(state, '', url);
    }
}

// --- DOM POPULATION HELPERS (Unchanged) ---
// (Keep existing helper functions here: renderDailyReport, clearStudentProfileForm, loadStudentsList, etc.)

function renderDailyReport(attendanceRecords, classFilter) {
    reportTableBody.innerHTML = '';
    const studentsInClass = allStudents.filter(s => s.standard === classFilter);
    
    if (studentsInClass.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No students found in this class.</td></tr>';
        return;
    }

    const reportData = studentsInClass.map(student => {
        const record = attendanceRecords.find(r => r.studentId === student.id);
        return {
            name: student.name,
            rollNo: student.rollNumber || 'N/A',
            status: record ? 'Present' : 'Absent',
            time: record ? new Date(record.timestamp?.toDate ? record.timestamp.toDate() : record.createdAt || Date.now()).toLocaleTimeString() : '-'
        };
    });

    reportData.sort((a, b) => {
        const rA = parseInt(a.rollNo) || 99999;
        const rB = parseInt(b.rollNo) || 99999;
        return rA - rB;
    });

    reportData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${row.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.rollNo}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${row.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.time}</td>
        `;
        reportTableBody.appendChild(tr);
    });
}

function clearStudentProfileForm() {
    pendingDocuments = [];
    currentFaceDescriptor = null;
    const faceStatus = document.getElementById('face-status');
    if (faceStatus) {
        faceStatus.innerHTML = '<i class="fas fa-times-circle"></i> Not Registered';
        faceStatus.className = "text-sm mb-2 text-red-500 font-semibold";
    }

    document.getElementById('student-profile-title').textContent = 'New Student';
    document.getElementById('student-name-display').textContent = 'New Student';
    document.getElementById('student-class-display').textContent = '-';
    document.getElementById('student-profile-pic').src = 'https://placehold.co/200x200/cccccc/ffffff?text=Photo';
    profilePicFilename.textContent = 'No file selected';
    document.getElementById('student-full-name').value = '';
    studentRollNoInput.value = '';
    document.getElementById('student-dob').value = '';
    document.getElementById('student-age').value = '';
    document.getElementById('student-standard').value = currentClass || '8';
    document.getElementById('student-gender').value = currentGender || 'male';
    document.getElementById('student-address').value = '';
    document.getElementById('student-father-name').value = '';
    document.getElementById('student-mother-name').value = '';
    document.getElementById('custom-fields-container').innerHTML = '<p class="text-gray-500 text-sm">No additional information.</p>';
    document.getElementById('documents-list').innerHTML = '<div class="text-sm text-gray-500">No documents uploaded.</div>';
}

function loadStudentsList(classId, gender) {
    const container = document.getElementById('students-list-container');
    container.innerHTML = '';
    let students = allStudents.filter(s => s.standard === classId);
    if (gender) {
        students = students.filter(s => s.gender === gender);
    }
    if (students.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-gray-500">No students found.</div>';
        return;
    }
    students.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card p-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between';
        studentCard.dataset.studentId = student.id;
        studentCard.innerHTML = `
            <div class="flex items-center flex-1" onclick="showStudentProfileView('${student.id}')">
                <img src="${student.profilePicUrl || 'https://placehold.co/50x50/cccccc/ffffff?text=S'}" alt="${student.name}" class="w-10 h-10 rounded-full mr-4 object-cover">
                <div>
                    <h3 class="font-medium text-gray-800">${student.name}</h3>
                    <p class="text-sm text-gray-500">${student.standard === 'graduated' ? 'Graduated' : student.standard + 'th Class'}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button class="edit-student-btn text-blue-600 hover:text-blue-800 p-2 rounded-full" data-id="${student.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-student-btn text-red-600 hover:text-red-800 p-2 rounded-full" data-id="${student.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(studentCard);
    });
    
    container.querySelectorAll('.edit-student-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showStudentProfileView(btn.dataset.id);
    }));
    container.querySelectorAll('.delete-student-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentStudentId = btn.dataset.id;
        deleteModal.classList.remove('hidden');
    }));
}

function loadStudentProfile(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    pendingDocuments = [];
    currentFaceDescriptor = null; 
    const faceStatus = document.getElementById('face-status');
    if (faceStatus) {
        if (student.faceDescriptor) {
            faceStatus.innerHTML = '<i class="fas fa-check-circle"></i> Registered';
            faceStatus.className = "text-sm mb-2 text-green-600 font-bold";
        } else {
            faceStatus.innerHTML = '<i class="fas fa-times-circle"></i> Not Registered';
            faceStatus.className = "text-sm mb-2 text-red-500 font-semibold";
        }
    }

    document.getElementById('student-profile-title').textContent = student.name;
    document.getElementById('student-name-display').textContent = student.name;
    document.getElementById('student-class-display').textContent = student.standard === 'graduated' ? 'Graduated' : `${student.standard}th Class`;
    document.getElementById('student-profile-pic').src = student.profilePicUrl || 'https://placehold.co/200x200/cccccc/ffffff?text=Photo';
    profilePicFilename.textContent = 'No file selected';
    document.getElementById('student-full-name').value = student.name || '';
    studentRollNoInput.value = student.rollNumber || '';
    document.getElementById('student-dob').value = student.dob || '';
    document.getElementById('student-standard').value = student.standard || '8';
    document.getElementById('student-gender').value = student.gender || 'male';
    document.getElementById('student-address').value = student.address || '';
    document.getElementById('student-father-name').value = student.fatherName || '';
    document.getElementById('student-mother-name').value = student.motherName || '';
    calculateAge();
    
    const customFieldsContainer = document.getElementById('custom-fields-container');
    customFieldsContainer.innerHTML = '';
    if (student.customFields && student.customFields.length > 0) {
        student.customFields.forEach(field => addCustomFieldToUI(field.name, field.value));
    } else {
        customFieldsContainer.innerHTML = '<p class="text-gray-500 text-sm">No additional information.</p>';
    }
    
    const documentsList = document.getElementById('documents-list');
    documentsList.innerHTML = '';
    if (student.documents && student.documents.length > 0) {
        student.documents.forEach(doc => addDocumentToUI(doc.id, doc.name, 'Uploaded', doc.url));
    } else {
        documentsList.innerHTML = '<div class="text-sm text-gray-500">No documents uploaded.</div>';
    }
}

function updateStudentCounts() {
    const activeStudents = allStudents.filter(s => ['8', '9', '10'].includes(s.standard));
    const totalActive = activeStudents.length;
    const activeBoys = activeStudents.filter(s => s.gender === 'male').length;
    const activeGirls = activeStudents.filter(s => s.gender === 'female').length;

    const safeSetText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    safeSetText('total-active-count', totalActive);
    safeSetText('total-boys-count', activeBoys);
    safeSetText('total-girls-count', activeGirls);
    
    safeSetText('dash-class-8', allStudents.filter(s => s.standard === '8').length);
    safeSetText('dash-class-9', allStudents.filter(s => s.standard === '9').length);
    safeSetText('dash-class-10', allStudents.filter(s => s.standard === '10').length);
    safeSetText('dash-graduated', allStudents.filter(s => s.standard === 'graduated').length);
    
    if(currentView === 'class' && currentClass) {
        const studentsInClass = allStudents.filter(s => s.standard === currentClass);
        safeSetText('male-count', studentsInClass.filter(s => s.gender === 'male').length);
        safeSetText('female-count', studentsInClass.filter(s => s.gender === 'female').length);
    }
}

function filterStudents(query) {
    const container = document.getElementById('students-list-container');
    container.querySelectorAll('.student-card').forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = name.includes(query.toLowerCase()) ? 'flex' : 'none';
    });
}

function calculateAge() {
    const dobString = studentDobInput.value;
    if (!dobString) {
        studentAgeInput.value = '';
        return;
    }
    const age = new Date().getFullYear() - new Date(dobString).getFullYear();
    studentAgeInput.value = age >= 0 ? age : '';
}

function addCustomField() {
    const name = document.getElementById('new-custom-field-name').value.trim();
    const value = document.getElementById('new-custom-field-value').value.trim();
    if (!name) {
        alert('Please enter a field name');
        return;
    }
    addCustomFieldToUI(name, value);
    document.getElementById('new-custom-field-name').value = '';
    document.getElementById('new-custom-field-value').value = '';
    newCustomFieldSection.classList.add('hidden');
}

function addCustomFieldToUI(name, value) {
    const container = document.getElementById('custom-fields-container');
    if (container.querySelector('p')) container.innerHTML = '';
    const fieldElement = document.createElement('div');
    fieldElement.className = 'custom-field flex items-center gap-2 mb-2';
    fieldElement.innerHTML = `
        <input type="text" class="custom-field-name flex-1 px-3 py-2 border border-gray-300 rounded-lg" value="${name}" placeholder="Field name">
        <input type="text" class="custom-field-value flex-1 px-3 py-2 border border-gray-300 rounded-lg" value="${value}" placeholder="Value">
        <button class="remove-custom-field-btn text-red-600 hover:text-red-800 p-2 rounded-full"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(fieldElement);
    fieldElement.querySelector('.remove-custom-field-btn').addEventListener('click', () => {
        fieldElement.remove();
        if (container.children.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No additional information.</p>';
        }
    });
}

function addDocumentToUI(docId, name, statusText, url = null) {
    const documentsList = document.getElementById('documents-list');
    if (documentsList.querySelector('div.text-sm')) documentsList.innerHTML = '';
    const docElement = document.createElement('div');
    docElement.id = docId;
    docElement.className = 'flex items-center justify-between p-2 bg-gray-50 rounded-lg';

    let finalUrl = url;
    if (url) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            finalUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
        }
    }

    const content = `
        <div class="flex items-center">
            <div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                 <i class="fas fa-file-alt text-gray-600"></i>
            </div>
            <div>
                <p class="text-sm font-medium text-gray-800 truncate max-w-xs">${name}</p>
                <p class="doc-status text-xs text-gray-500">${statusText}</p>
            </div>
        </div>
        <div>
            ${finalUrl ? `<a href="${finalUrl}" target="_blank" class="view-doc-btn text-blue-600 hover:text-blue-800 p-2 rounded-full"><i class="fas fa-download"></i></a>` : ''}
            <button class="remove-document-btn text-red-600 hover:text-red-800 p-2 rounded-full"><i class="fas fa-trash"></i></button>
        </div>
    `;
    docElement.innerHTML = content;
    documentsList.appendChild(docElement);
    docElement.querySelector('.remove-document-btn').addEventListener('click', async () => {
        if (!currentStudentId) {
             docElement.remove();
             return;
        }
        if (confirm('Are you sure you want to delete this document?')) {
            const student = allStudents.find(s => s.id === currentStudentId);
            const updatedDocs = student.documents.filter(d => d.id !== docId);
            try {
                await db.collection('students').doc(currentStudentId).update({ documents: updatedDocs });
                docElement.remove();
            } catch (error) {
                console.error("Error removing document:", error);
                alert("Failed to remove document record.");
            }
        }
    });
    return { element: docElement, status: docElement.querySelector('.doc-status') };
}