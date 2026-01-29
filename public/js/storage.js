// --- CLOUDINARY STORAGE LOGIC (Dual-Mode Compatible) ---

// 1. HELPER: Client-Side Image Compressor
function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Compression failed')); 
                        return;
                    }
                    console.log(`[Compression] Original: ${(file.size/1024).toFixed(2)}KB -> New: ${(blob.size/1024).toFixed(2)}KB`);
                    resolve(blob);
                }, 'image/jpeg', quality); 
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// 2. CORE: Upload Function
async function uploadFileToCloudinary(file) {
    const CLOUD_NAME = "YOUR CLOUDINARY API KEY HERE";
    const UPLOAD_PRESET = "YOUR UPLOAD PRESET NAME";

    let resourceType = 'raw';
    if (file.type.startsWith('image/')) {
        resourceType = 'image';
    } 

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
            method: "POST",
            body: formData,
        });
        
        if (!response.ok) throw new Error('Cloudinary Error');
        
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Upload to Cloudinary failed:", error);
        return null;
    }
}

// 3. HANDLER: Profile Picture
async function handleProfilePicUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const LIMIT_KB = 50;
    profilePicFilename.textContent = 'Processing...';
    uploadProfilePicButton.disabled = true;

    try {
        const compressedFile = await compressImage(file, 300, 0.6);
        
        if (compressedFile.size > LIMIT_KB * 1024) {
            alert(`File too large! \nTarget: 50KB \nYours: ${(compressedFile.size/1024).toFixed(1)}KB\n\nPlease crop the photo closer to the face and try again.`);
            profilePicFilename.textContent = 'File too big (>50KB)';
            e.target.value = ''; 
            return;
        }

        profilePicFilename.textContent = 'Uploading...';
        const imageUrl = await uploadFileToCloudinary(compressedFile);

        if (imageUrl) {
            profilePicFilename.textContent = 'Uploaded Successfully';
            document.getElementById('student-profile-pic').src = imageUrl;
            e.target.value = ''; 

            if (currentStudentId) {
                // SWITCHER: Uses 'students' OR 'demo_students'
                const collection = getCollectionName('students');
                await db.collection(collection).doc(currentStudentId).update({ profilePicUrl: imageUrl });
            }
        } else {
            profilePicFilename.textContent = 'Upload failed.';
            alert("Upload failed. Check internet connection.");
        }
    } catch (error) {
        console.error("Profile Pic Error:", error);
        alert("Error processing image.");
        profilePicFilename.textContent = 'Error';
    } finally {
        uploadProfilePicButton.disabled = false;
    }
}

// 4. HANDLER: Documents
async function handleDocumentUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    
    const LIMIT_KB = 50;
    uploadDocumentButton.disabled = true;
    uploadDocumentButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    for (const [index, file] of Array.from(files).entries()) {
        const docId = `doc_${Date.now()}_${index}`;
        const docUI = addDocumentToUI(docId, file.name, 'Checking size...');

        try {
            let fileToUpload = file;

            if (file.type.startsWith('image/')) {
                fileToUpload = await compressImage(file, 600, 0.5);
            } 
            
            if (fileToUpload.size > LIMIT_KB * 1024) {
                docUI.status.textContent = 'Rejected (>50KB)';
                docUI.status.classList.add('text-red-600', 'font-bold');
                alert(`The file "${file.name}" is too big. Limit is 50KB.`);
                setTimeout(() => docUI.element.remove(), 5000); 
                continue; 
            }

            docUI.status.textContent = 'Uploading...';
            const fileUrl = await uploadFileToCloudinary(fileToUpload);
            
            if (fileUrl) {
                const newDocument = { id: docId, name: file.name, url: fileUrl, type: file.type };
                
                if (currentStudentId) {
                    // SWITCHER: Uses 'students' OR 'demo_students'
                    const collection = getCollectionName('students');
                    await db.collection(collection).doc(currentStudentId).update({
                        documents: firebase.firestore.FieldValue.arrayUnion(newDocument)
                    });
                } else {
                    pendingDocuments.push(newDocument);
                }

                docUI.status.textContent = 'Uploaded'; 
                docUI.status.classList.add('text-green-600');
                
                const downloadButton = document.createElement('a');
                let downloadUrl = fileUrl;
                const parts = fileUrl.split('/upload/');
                if (parts.length === 2) {
                    downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
                }
                
                downloadButton.href = downloadUrl;
                downloadButton.target = '_blank';
                downloadButton.className = 'view-doc-btn text-blue-600 hover:text-blue-800 p-2 rounded-full';
                downloadButton.innerHTML = '<i class="fas fa-download"></i>';

                const deleteButton = docUI.element.querySelector('.remove-document-btn');
                deleteButton.parentNode.insertBefore(downloadButton, deleteButton);
            } else {
                docUI.status.textContent = 'Server Error';
                docUI.status.classList.add('text-red-500');
            }

        } catch (error) {
            console.error("Document logic failed: ", error);
            docUI.status.textContent = 'Error';
            docUI.status.classList.add('text-red-500');
        }
    }
    
    e.target.value = '';
    uploadDocumentButton.disabled = false;
    uploadDocumentButton.innerHTML = '<i class="fas fa-plus mr-2"></i> Add Documents';
}