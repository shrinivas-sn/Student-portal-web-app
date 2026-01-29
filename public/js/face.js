// --- FACE API LOGIC ---
const MODELS_URL = "https://justadudewhohacks.github.io/face-api.js/models";
let modelsLoaded = false;
let areModelsReady = false; 

let videoStream = null;
let attendanceInterval = null; 
let moodInterval = null; 

// 1. Load AI Models
async function loadFaceModels() {
    try {
        console.log("Starting Background Model Load...");
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL)
        ]);
        
        modelsLoaded = true;
        areModelsReady = true;
        console.log("✅ FaceAPI Models Loaded Successfully");
        enableScannerButtons();
        if(typeof loadingScreen !== 'undefined' && loadingScreen) loadingScreen.classList.add('hidden');

    } catch (error) {
        console.error("Error loading FaceAPI models:", error);
        
        // SILENT FAIL FIX: Replaced aggressive Alert with a gentle Toast
        if (typeof showToast === 'function') {
            showToast("AI features unavailable (Check Connection)", "error");
        }
        // No alert() blocking the screen anymore.
    }
}

function enableScannerButtons() {
    const startScanBtn = document.getElementById('start-scanner-btn');
    const startMoodBtn = document.getElementById('start-mood-btn');
    const scanFaceBtn = document.getElementById('scan-face-btn');

    if (startScanBtn) {
        startScanBtn.disabled = false;
        startScanBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Start Scanning';
        startScanBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    if (startMoodBtn) {
        startMoodBtn.disabled = false;
        startMoodBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Start Monitor';
        startMoodBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (scanFaceBtn) {
        scanFaceBtn.disabled = false;
        scanFaceBtn.innerHTML = '<i class="fas fa-camera mr-2"></i> Scan Face';
        scanFaceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// 2. Start Camera (Registration)
async function startFaceCamera() {
    if (!areModelsReady) { 
        if (typeof showToast === 'function') showToast("AI models are still loading...", "info");
        return; 
    }
    
    const faceScanModal = document.getElementById('face-scan-modal');
    const faceScanStatusText = document.getElementById('face-scan-status');
    const faceVideo = document.getElementById('face-video');
    
    if(faceScanModal) faceScanModal.classList.remove('hidden');
    if(faceScanStatusText) faceScanStatusText.textContent = "Starting camera...";
    
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if(faceVideo) faceVideo.srcObject = videoStream;
        
        faceVideo.addEventListener('play', () => {
            const canvas = document.getElementById('face-canvas');
            const displaySize = { width: faceVideo.clientWidth, height: faceVideo.clientHeight };
            faceapi.matchDimensions(canvas, displaySize);
            
            const interval = setInterval(async () => {
                if (faceScanModal.classList.contains('hidden')) { clearInterval(interval); return; }
                
                const detections = await faceapi.detectAllFaces(faceVideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resizedDetections);
                
                const captureBtn = document.getElementById('capture-face-btn');
                if (detections.length > 0) {
                    faceScanStatusText.textContent = "Face Detected! Ready.";
                    faceScanStatusText.className = "text-center text-sm mt-3 text-green-600 font-bold";
                    if(captureBtn) {
                        captureBtn.disabled = false;
                        captureBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                } else {
                    faceScanStatusText.textContent = "No face detected.";
                    faceScanStatusText.className = "text-center text-sm mt-3 text-red-500";
                    if(captureBtn) {
                        captureBtn.disabled = true;
                        captureBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                }
            }, 100);
        });
    } catch (err) {
        handleCameraError(err);
        closeFaceModal();
    }
}

function closeFaceModal() {
    const faceScanModal = document.getElementById('face-scan-modal');
    if(faceScanModal) faceScanModal.classList.add('hidden');
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

async function captureFaceHandler() {
    const captureFaceButton = document.getElementById('capture-face-btn');
    const faceVideo = document.getElementById('face-video');
    const faceStatus = document.getElementById('face-status');

    captureFaceButton.disabled = true;
    captureFaceButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    
    const detection = await faceapi.detectSingleFace(faceVideo, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();
    
    if (detection) {
        currentFaceDescriptor = Array.from(detection.descriptor);
        if(faceStatus) {
            faceStatus.innerHTML = '<i class="fas fa-check-circle"></i> Face Registered';
            faceStatus.className = "text-sm mb-2 text-green-600 font-bold";
        }
        alert("Face Registered Successfully!");
        closeFaceModal();
    } else {
        alert("Could not detect face clearly. Try again.");
    }
    captureFaceButton.disabled = false;
    captureFaceButton.innerHTML = '<i class="fas fa-camera mr-2"></i> Capture & Save ID';
}

// 3. Attendance Scanner
async function startAttendanceScanner() {
    if (!areModelsReady) { 
        if (typeof showToast === 'function') showToast("AI is still loading...", "info");
        return; 
    }
    
    const studentsWithFaces = allStudents.filter(s => s.faceDescriptor);
    if (studentsWithFaces.length === 0) {
        alert("No students have Face IDs registered yet. Go to profiles and register faces first.");
        return;
    }

    const labeledDescriptors = studentsWithFaces.map(student => {
        return new faceapi.LabeledFaceDescriptors(student.id, [new Float32Array(student.faceDescriptor)]);
    });

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
        const attendanceVideo = document.getElementById('attendance-video');
        attendanceVideo.srcObject = videoStream;
        
        attendanceVideo.addEventListener('play', () => {
            const canvas = document.getElementById('attendance-canvas');
            const displaySize = { width: attendanceVideo.clientWidth, height: attendanceVideo.clientHeight };
            faceapi.matchDimensions(canvas, displaySize);
            
            attendanceInterval = setInterval(async () => {
                if (currentView !== 'attendance') { stopAttendanceScanner(); return; }

                const detections = await faceapi.detectAllFaces(attendanceVideo, new faceapi.TinyFaceDetectorOptions())
                                                .withFaceLandmarks()
                                                .withFaceDescriptors();
                
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
                
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                
                results.forEach((result, i) => {
                    const box = resizedDetections[i].detection.box;
                    const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
                    drawBox.draw(canvas);

                    if (result.label !== 'unknown') {
                        const matchedStudent = allStudents.find(s => s.id === result.label);
                        if (matchedStudent) {
                            saveAttendanceRecord(matchedStudent);
                        }
                    }
                });

            }, 200);
        });

    } catch (err) {
        handleCameraError(err);
    }
}

function stopAttendanceScanner() {
    if (attendanceInterval) clearInterval(attendanceInterval);
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const canvas = document.getElementById('attendance-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// 4. Mood Scanner
async function startMoodScanner() {
    if (!areModelsReady) { 
        if (typeof showToast === 'function') showToast("AI is still loading...", "info");
        return; 
    }

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
        const moodVideo = document.getElementById('mood-video');
        moodVideo.srcObject = videoStream;

        moodVideo.addEventListener('play', () => {
            const canvas = document.getElementById('mood-canvas');
            const displaySize = { width: moodVideo.clientWidth, height: moodVideo.clientHeight };
            faceapi.matchDimensions(canvas, displaySize);

            moodInterval = setInterval(async () => {
                if (currentView !== 'mood') { stopMoodScanner(); return; }

                const detections = await faceapi.detectAllFaces(moodVideo, new faceapi.TinyFaceDetectorOptions())
                                                .withFaceLandmarks()
                                                .withFaceExpressions();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

                if (detections.length > 0) {
                    const expressions = detections[0].expressions;
                    const dominant = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
                    if (typeof updateMoodDisplay === 'function') updateMoodDisplay(dominant);
                } else {
                    if (typeof updateMoodDisplay === 'function') updateMoodDisplay('neutral');
                }

            }, 200);
        });

    } catch (err) {
        handleCameraError(err);
    }
}

function stopMoodScanner() {
    if (moodInterval) clearInterval(moodInterval);
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const canvas = document.getElementById('mood-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Helper to Explain Errors (No Alert on first block)
function handleCameraError(err) {
    console.error("Camera Error:", err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Camera Access Required.\n\nTap 'Allow' when the browser asks, or check your site settings.");
    } else if (err.name === 'NotFoundError') {
        alert("No camera found on this device.");
    } else {
        // Optional: Can switch this to showToast too if you prefer, 
        // but explicit errors like "No Camera" usually need an alert.
        alert("Camera failed to start. Please refresh.");
    }
}