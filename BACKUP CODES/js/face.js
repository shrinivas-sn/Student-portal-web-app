// --- FACE API LOGIC ---
const MODELS_URL = "https://justadudewhohacks.github.io/face-api.js/models";
let modelsLoaded = false;
let videoStream = null;
let attendanceInterval = null; // To stop the loop

// 1. Load AI Models
async function loadFaceModels() {
    try {
        loadingText.textContent = "Loading AI Models...";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL); // Better accuracy
        modelsLoaded = true;
        console.log("FaceAPI Models Loaded");
        loadingText.textContent = "Loading Portal...";
    } catch (error) {
        console.error("Error loading FaceAPI models:", error);
        alert("Failed to load Face Recognition models. Check internet.");
    }
}

// 2. Start Camera (Registration Mode)
async function startFaceCamera() {
    if (!modelsLoaded) { alert("Models loading..."); return; }
    
    faceScanModal.classList.remove('hidden');
    faceScanStatusText.textContent = "Starting camera...";
    
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
        faceVideo.srcObject = videoStream;
        
        faceVideo.addEventListener('play', () => {
            const canvas = faceCanvas;
            const displaySize = { width: faceVideo.clientWidth, height: faceVideo.clientHeight };
            faceapi.matchDimensions(canvas, displaySize);
            
            const interval = setInterval(async () => {
                if (faceScanModal.classList.contains('hidden')) { clearInterval(interval); return; }
                
                const detections = await faceapi.detectAllFaces(faceVideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resizedDetections);
                
                if (detections.length > 0) {
                    faceScanStatusText.textContent = "Face Detected! Ready.";
                    faceScanStatusText.className = "text-center text-sm mt-3 text-green-600 font-bold";
                    captureFaceButton.disabled = false;
                    captureFaceButton.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    faceScanStatusText.textContent = "No face detected.";
                    faceScanStatusText.className = "text-center text-sm mt-3 text-red-500";
                    captureFaceButton.disabled = true;
                    captureFaceButton.classList.add('opacity-50', 'cursor-not-allowed');
                }
            }, 100);
        });
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera permission denied.");
        closeFaceModal();
    }
}

function closeFaceModal() {
    faceScanModal.classList.add('hidden');
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

async function captureFaceHandler() {
    captureFaceButton.disabled = true;
    captureFaceButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    
    const detection = await faceapi.detectSingleFace(faceVideo, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();
    
    if (detection) {
        currentFaceDescriptor = Array.from(detection.descriptor);
        faceStatus.innerHTML = '<i class="fas fa-check-circle"></i> Face Registered';
        faceStatus.className = "text-sm mb-2 text-green-600 font-bold";
        alert("Face Registered Successfully!");
        closeFaceModal();
    } else {
        alert("Could not detect face clearly. Try again.");
    }
    captureFaceButton.disabled = false;
    captureFaceButton.innerHTML = '<i class="fas fa-camera mr-2"></i> Capture & Save ID';
}

// --- NEW: ATTENDANCE MODE (Continuous Scanning) ---

async function startAttendanceScanner() {
    if (!modelsLoaded) { alert("Models loading..."); return; }
    
    // 1. Prepare Matcher with all student data
    const studentsWithFaces = allStudents.filter(s => s.faceDescriptor);
    if (studentsWithFaces.length === 0) {
        alert("No students have Face IDs registered yet. Go to profiles and register faces first.");
        return;
    }

    const labeledDescriptors = studentsWithFaces.map(student => {
        // Convert array back to Float32Array for FaceAPI
        return new faceapi.LabeledFaceDescriptors(student.id, [new Float32Array(student.faceDescriptor)]);
    });

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is strictness (lower is stricter)

    // 2. Start Camera
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
        attendanceVideo.srcObject = videoStream;
        
        attendanceVideo.addEventListener('play', () => {
            const canvas = attendanceCanvas;
            const displaySize = { width: attendanceVideo.clientWidth, height: attendanceVideo.clientHeight };
            faceapi.matchDimensions(canvas, displaySize);
            
            attendanceInterval = setInterval(async () => {
                if (currentView !== 'attendance') { stopAttendanceScanner(); return; }

                // Detect Faces
                const detections = await faceapi.detectAllFaces(attendanceVideo, new faceapi.TinyFaceDetectorOptions())
                                                .withFaceLandmarks()
                                                .withFaceDescriptors();
                
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
                
                // Draw Box
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                
                results.forEach((result, i) => {
                    const box = resizedDetections[i].detection.box;
                    const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
                    drawBox.draw(canvas);

                    // MATCH FOUND LOGIC
                    if (result.label !== 'unknown') {
                        const matchedStudent = allStudents.find(s => s.id === result.label);
                        if (matchedStudent) {
                            saveAttendanceRecord(matchedStudent);
                        }
                    }
                });

            }, 200); // Check every 200ms
        });

    } catch (err) {
        console.error("Scanner Error:", err);
        alert("Camera start failed.");
    }
}

function stopAttendanceScanner() {
    if (attendanceInterval) clearInterval(attendanceInterval);
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    // Clear canvas
    const ctx = attendanceCanvas.getContext('2d');
    if(ctx) ctx.clearRect(0, 0, attendanceCanvas.width, attendanceCanvas.height);
}