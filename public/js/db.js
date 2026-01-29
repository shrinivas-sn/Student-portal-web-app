// --- FIRESTORE DATA HANDLING (Dual-Mode Enabled) ---

function loadAllStudentsFromFirestore() {
    loadingScreen.classList.remove('hidden');
    
    // SWITCHER: Uses 'students' OR 'demo_students'
    const collection = getCollectionName('students'); 
    console.log(`Loading data from: ${collection}`);

    db.collection(collection).onSnapshot(snapshot => {
        allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateStudentCounts(); 
        loadingScreen.classList.add('hidden');
        
        if (currentView === 'dashboard' && currentReportClass) {
            loadTodaysAttendance();
        }

        if (currentView === 'students-list' && currentClass) {
            loadStudentsList(currentClass, currentGender);
        }
    }, error => {
        console.error("Error fetching students: ", error);
        alert("Could not load data. Check internet connection.");
        loadingScreen.classList.add('hidden');
    });
}

// Load Attendance with Class Filter Logic
async function loadTodaysAttendance() {
    if (!currentReportClass) return;

    const dateInput = document.getElementById('report-date-picker');
    const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];

    try {
        // SWITCHER: Uses 'attendance' OR 'demo_attendance'
        const collection = getCollectionName('attendance');
        const snapshot = await db.collection(collection).where('date', '==', date).get();
        const records = snapshot.docs.map(doc => doc.data());
        renderDailyReport(records, currentReportClass); 
    } catch (error) {
        console.error("Error loading attendance report:", error);
    }
}

async function saveAttendanceRecord(student) {
    const today = new Date().toISOString().split('T')[0];
    
    if (todaysAttendance.includes(student.id)) return;
    todaysAttendance.push(student.id);
    
    const logItem = document.createElement('div');
    logItem.className = 'flex items-center justify-between p-2 bg-green-50 rounded border border-green-100 animate-fade-in';
    logItem.innerHTML = `
        <div class="flex items-center">
            <img src="${student.profilePicUrl || 'https://placehold.co/30x30'}" class="w-8 h-8 rounded-full mr-2 object-cover">
            <div>
                <p class="text-sm font-bold text-gray-800">${student.name}</p>
                <p class="text-xs text-gray-500">${new Date().toLocaleTimeString()}</p>
            </div>
        </div>
        <span class="text-xs font-bold text-green-600 bg-green-200 px-2 py-1 rounded">Present</span>
    `;
    if (attendanceLog.children[0]?.tagName === 'P') attendanceLog.innerHTML = '';
    attendanceLog.prepend(logItem);
    todayScanCount.textContent = todaysAttendance.length;

    try {
        // SWITCHER: Uses 'attendance' OR 'demo_attendance'
        const collection = getCollectionName('attendance');
        
        const check = await db.collection(collection)
                              .where('studentId', '==', student.id)
                              .where('date', '==', today)
                              .get();
        
        if (check.empty) {
            await db.collection(collection).add({
                studentId: student.id,
                name: student.name,
                class: student.standard,
                date: today,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Present',
                method: 'FaceID'
            });
            console.log(`Saved attendance for ${student.name}`);
        }
    } catch (error) {
        console.error("Error saving attendance:", error);
        todaysAttendance = todaysAttendance.filter(id => id !== student.id);
    }
}

async function createNewStudent() {
    currentStudentId = null; 
    showStudentProfileView(null); 
}

async function saveStudent() {
    saveStudentButton.disabled = true;
    saveStudentButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    
    const studentData = {
        name: document.getElementById('student-full-name').value || 'Unnamed Student',
        rollNumber: document.getElementById('student-roll-no').value.trim(),
        dob: document.getElementById('student-dob').value,
        standard: document.getElementById('student-standard').value,
        gender: document.getElementById('student-gender').value,
        address: document.getElementById('student-address').value,
        fatherName: document.getElementById('student-father-name').value,
        motherName: document.getElementById('student-mother-name').value,
        customFields: [],
        profilePicUrl: document.getElementById('student-profile-pic').src.includes('placehold.co') ? '' : document.getElementById('student-profile-pic').src,
        documents: [] 
    };

    document.querySelectorAll('#custom-fields-container .custom-field').forEach(field => {
        const name = field.querySelector('.custom-field-name').value.trim();
        const value = field.querySelector('.custom-field-value').value.trim();
        if (name && value) {
            studentData.customFields.push({ name, value });
        }
    });

    try {
        // SWITCHER: Uses 'students' OR 'demo_students'
        const collection = getCollectionName('students');

        if (currentStudentId) {
            const originalStudent = allStudents.find(s => s.id === currentStudentId);
            if (originalStudent) {
                studentData.documents = originalStudent.documents || [];
                if (!currentFaceDescriptor && originalStudent.faceDescriptor) {
                    studentData.faceDescriptor = originalStudent.faceDescriptor;
                }
            }
            if (currentFaceDescriptor) {
                studentData.faceDescriptor = currentFaceDescriptor;
            }
            
            await db.collection(collection).doc(currentStudentId).set(studentData, { merge: true });
            alert('Student updated successfully!');
        } else {
            studentData.documents = pendingDocuments;
            if (currentFaceDescriptor) {
                studentData.faceDescriptor = currentFaceDescriptor;
            }
            
            const docRef = await db.collection(collection).add(studentData);
            currentStudentId = docRef.id; 
            alert('New student created successfully!');
        }

        currentClass = studentData.standard;
        currentGender = studentData.gender;
        showStudentsListView(studentData.standard, studentData.gender);
        
    } catch (error) {
        console.error("Error saving student: ", error);
        alert("Failed to save student data.");
    } finally {
        saveStudentButton.disabled = false;
        saveStudentButton.innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
    }
}

async function deleteStudent() {
    if (!currentStudentId) return;
    try {
        // SWITCHER: Uses 'students' OR 'demo_students'
        const collection = getCollectionName('students');
        await db.collection(collection).doc(currentStudentId).delete();
        deleteModal.classList.add('hidden');
        showClassView(currentClass);
    } catch (error) {
        console.error("Error deleting student: ", error);
        alert("Failed to delete student.");
    }
}

async function promoteStudents() {
    confirmPromoteButton.disabled = true;
    confirmPromoteButton.textContent = 'Promoting...';
    const batch = db.batch();
    
    // SWITCHER: Uses 'students' OR 'demo_students'
    const collection = getCollectionName('students');
    
    const studentsToPromote = allStudents.filter(s => ['8', '9', '10'].includes(s.standard));
    studentsToPromote.forEach(student => {
        const docRef = db.collection(collection).doc(student.id);
        let newStandard = student.standard;
        if (student.standard === '10') newStandard = 'graduated';
        else if (student.standard === '9') newStandard = '10';
        else if (student.standard === '8') newStandard = '9';
        batch.update(docRef, { standard: newStandard });
    });
    try {
        await batch.commit();
        alert('Students promoted successfully for the new academic year!');
    } catch (error) {
        console.error("Error promoting students: ", error);
        alert("An error occurred during promotion.");
    } finally {
        promoteModal.classList.add('hidden');
        confirmPromoteButton.disabled = false;
        confirmPromoteButton.textContent = 'Confirm Promotion';
    }
}