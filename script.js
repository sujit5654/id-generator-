// Global cropper variable
let cropper = null;

// Drag mode state
let isDragMode = false;
let draggedElement = null;
let offsetX = 0;
let offsetY = 0;

// Store template as base64 for download
let templateBase64 = null;
let backTemplateBase64 = 'back.png';

// Initialize QR code on page load
document.addEventListener('DOMContentLoaded', function() {
    generateQRCode('ID-CARD-GENERATOR');
    initializeDragSystem();
    setupTemplateUpload();
    setupBackTemplateUpload();
    setupPhotoUpload();
    setupRealTimeUpdates();
});

// Setup template upload handler
function setupTemplateUpload() {
    document.getElementById('templateInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                templateBase64 = e.target.result;
                document.querySelector('#idCard .template-bg').src = templateBase64;
                showNotification('Front template uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Setup back template upload handler
function setupBackTemplateUpload() {
    document.getElementById('backTemplateInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                backTemplateBase64 = e.target.result;
                document.getElementById('backTemplateBg').src = backTemplateBase64;
                showNotification('Back template uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Handle photo upload - Open Cropper
function setupPhotoUpload() {
    document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Show cropper modal
            const modal = document.getElementById('cropperModal');
            const cropperImage = document.getElementById('cropperImage');
            
            cropperImage.src = e.target.result;
            modal.classList.add('active');
            
            // Destroy existing cropper if any
            if (cropper) {
                cropper.destroy();
            }
            
            // Initialize cropper with fixed aspect ratio for ID photo
            cropper = new Cropper(cropperImage, {
                aspectRatio: 145 / 172, // Match the photo box ratio exactly
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        };
        reader.readAsDataURL(file);
    }
});
}

// Apply cropped image
function applyCrop() {
    if (cropper) {
        // Get cropped canvas with high resolution for print quality
        const croppedCanvas = cropper.getCroppedCanvas({
            width: 580,  // 4x for very high quality (145 * 4)
            height: 688, // 4x for very high quality (172 * 4)
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        // Set the cropped image to preview with maximum quality PNG
        const croppedImage = croppedCanvas.toDataURL('image/png', 1.0);
        document.getElementById('photoPreview').src = croppedImage;
        
        // Close modal
        cancelCrop();
        
        showNotification('Photo cropped successfully!');
    }
}

// Cancel crop and close modal
function cancelCrop() {
    const modal = document.getElementById('cropperModal');
    modal.classList.remove('active');
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// Generate ID Card
function generateCard() {
    // Get input values
    const fullName = document.getElementById('fullName').value || 'ADI BARBU';
    const designation = document.getElementById('designation').value || 'Graphic Designer';
    const idNumber = document.getElementById('idNumber').value || '0000012345678910';
    const phoneNumber = document.getElementById('phoneNumber').value || '+880 1931 034992';
    const bloodGroup = document.getElementById('bloodGroup').value || 'B+';
    const email = document.getElementById('email').value || 'example@gmail.com';
    const qrcodeData = document.getElementById('qrcodeData').value || fullName.replace(/\s+/g, '-');

    // Update preview
    document.getElementById('fullNamePreview').textContent = fullName.toUpperCase();
    document.getElementById('designationPreview').textContent = designation;
    document.getElementById('idNumberPreview').textContent = idNumber;
    document.getElementById('phonePreview').textContent = phoneNumber;
    document.getElementById('bloodPreview').textContent = bloodGroup;
    document.getElementById('emailPreview').textContent = email;

    // Generate QR code
    generateQRCode(qrcodeData);

    // Show success message
    showNotification('ID Card generated successfully!');
}

// Generate QR Code
let qrcodeInstance = null;
function generateQRCode(data) {
    try {
        const qrcodeContainer = document.getElementById('qrcode');
        // Clear previous QR code
        qrcodeContainer.innerHTML = '';
        
        // Create new QR code with higher resolution for better print quality
        qrcodeInstance = new QRCode(qrcodeContainer, {
            text: data,
            width: 240,  // 3x size for high quality download
            height: 240, // 3x size for high quality download
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Scale down the visual display but keep high res for download
        setTimeout(() => {
            const qrCanvas = qrcodeContainer.querySelector('canvas');
            const qrImg = qrcodeContainer.querySelector('img');
            if (qrCanvas) {
                qrCanvas.style.width = '80px';
                qrCanvas.style.height = '80px';
            }
            if (qrImg) {
                qrImg.style.width = '80px';
                qrImg.style.height = '80px';
            }
        }, 100);
    } catch (error) {
        console.error('QR Code generation error:', error);
    }
}

// Download Card as Image
function downloadCard() {
    // Check if template is uploaded
    if (!templateBase64) {
        showNotification('Please upload the template image first!');
        return;
    }
    
    const card = document.getElementById('idCard');
    
    // Temporarily disable drag mode for clean screenshot
    const wasDragMode = isDragMode;
    if (isDragMode) {
        toggleDragMode(); // Turn off drag mode
    }
    
    // Remove any dragging class
    document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
    });
    
    captureAndDownload(card, wasDragMode);
}

function captureAndDownload(element, restoreDragMode) {
    // Use html2canvas to capture exactly what's on screen
    html2canvas(element, {
        scale: 6, // High quality - 6x scale for crisp output
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 400,
        height: 650
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'id-card-high-quality.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        if (restoreDragMode) {
            toggleDragMode();
        }
        
        showNotification('High quality ID Card downloaded successfully!');
    }).catch(error => {
        console.error('Export error:', error);
        showNotification('Error exporting card. Please try again.', 'error');
        
        if (restoreDragMode) {
            toggleDragMode();
        }
    });
}

// Download PDF with front and back sides
function downloadPDF() {
    // Check if templates are uploaded
    if (!templateBase64) {
        showNotification('Please upload the front template image first!', 'error');
        return;
    }
    
    const frontCard = document.getElementById('idCard');
    const backCard = document.getElementById('idCardBack');
    
    // Temporarily disable drag mode for clean screenshot
    const wasDragMode = isDragMode;
    if (isDragMode) {
        toggleDragMode();
    }
    
    // Remove any dragging class
    document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
    });
    
    showNotification('Generating PDF... Please wait.');
    
    // Temporarily remove overflow hidden for proper capture
    const originalFrontOverflow = frontCard.style.overflow;
    const originalBackOverflow = backCard.style.overflow;
    frontCard.style.overflow = 'visible';
    backCard.style.overflow = 'visible';
    
    // Wait for images to be fully loaded
    const backImg = document.getElementById('backTemplateBg');
    const frontImg = document.querySelector('#idCard .template-bg');
    
    const waitForImages = Promise.all([
        new Promise((resolve) => {
            if (frontImg.complete && frontImg.naturalHeight !== 0) {
                resolve();
            } else {
                frontImg.onload = resolve;
                setTimeout(resolve, 1000);
            }
        }),
        new Promise((resolve) => {
            if (backImg.complete && backImg.naturalHeight !== 0) {
                resolve();
            } else {
                backImg.onload = resolve;
                setTimeout(resolve, 1000);
            }
        })
    ]);
    
    waitForImages.then(() => {
        // Small delay to ensure rendering is complete
        setTimeout(() => {
            // Hide back card while capturing front
            backCard.style.display = 'none';
            
            // Capture front card
            html2canvas(frontCard, {
                scale: 4,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 400,
                height: 650,
                onclone: function(clonedDoc) {
                    const clonedFront = clonedDoc.getElementById('idCard');
                    clonedFront.style.overflow = 'hidden';
                    clonedFront.style.borderRadius = '15px';
                    // Hide back card in clone too
                    const clonedBack = clonedDoc.getElementById('idCardBack');
                    if (clonedBack) clonedBack.style.display = 'none';
                }
            }).then(frontCanvas => {
                // Show back card and hide front for back capture
                backCard.style.display = 'block';
                frontCard.style.display = 'none';
                
                // Capture back card
                html2canvas(backCard, {
                    scale: 4,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: 400,
                    height: 650,
                    onclone: function(clonedDoc) {
                        const clonedBack = clonedDoc.getElementById('idCardBack');
                        clonedBack.style.overflow = 'hidden';
                        clonedBack.style.borderRadius = '15px';
                        // Hide front card in clone too
                        const clonedFront = clonedDoc.getElementById('idCard');
                        if (clonedFront) clonedFront.style.display = 'none';
                    }
                }).then(backCanvas => {
                    // Restore display
                    frontCard.style.display = 'block';
                    backCard.style.display = 'block';
                    
                    const { jsPDF } = window.jspdf;
                    
                    // Create PDF with ID card dimensions
                    const cardWidth = 85.6;
                    const cardHeight = 139;
                    
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: [cardWidth, cardHeight]
                    });
                    
                    // Add front side
                    const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
                    pdf.addImage(frontImgData, 'PNG', 0, 0, cardWidth, cardHeight);
                    
                    // Add back side on new page
                    pdf.addPage([cardWidth, cardHeight], 'portrait');
                    const backImgData = backCanvas.toDataURL('image/png', 1.0);
                    pdf.addImage(backImgData, 'PNG', 0, 0, cardWidth, cardHeight);
                    
                    // Download PDF
                    pdf.save('id-card-front-back.pdf');
                    
                    // Restore overflow
                    frontCard.style.overflow = originalFrontOverflow;
                    backCard.style.overflow = originalBackOverflow;
                    
                    if (wasDragMode) {
                        toggleDragMode();
                    }
                    
                    showNotification('PDF downloaded successfully with front and back sides!');
                }).catch(error => {
                    console.error('Back capture error:', error);
                    frontCard.style.display = 'block';
                    backCard.style.display = 'block';
                    frontCard.style.overflow = originalFrontOverflow;
                    backCard.style.overflow = originalBackOverflow;
                    showNotification('Error generating PDF. Please try again.', 'error');
                });
            }).catch(error => {
                console.error('Front capture error:', error);
                frontCard.style.display = 'block';
                backCard.style.display = 'block';
                frontCard.style.overflow = originalFrontOverflow;
                backCard.style.overflow = originalBackOverflow;
                showNotification('Error generating PDF. Please try again.', 'error');
            });
        }, 500);
    });
}

// Print Card
function printCard() {
    window.print();
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #218838)' : 'linear-gradient(135deg, #dc3545, #c82333)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Real-time preview updates
function setupRealTimeUpdates() {
    document.getElementById('fullName').addEventListener('input', function() {
        document.getElementById('fullNamePreview').textContent = (this.value || 'ADI BARBU').toUpperCase();
    });

    document.getElementById('designation').addEventListener('input', function() {
        document.getElementById('designationPreview').textContent = this.value || 'Graphic Designer';
    });

    document.getElementById('idNumber').addEventListener('input', function() {
        document.getElementById('idNumberPreview').textContent = this.value || '0000012345678910';
    });

    document.getElementById('phoneNumber').addEventListener('input', function() {
        document.getElementById('phonePreview').textContent = this.value || '+880 1931 034992';
    });

    document.getElementById('bloodGroup').addEventListener('input', function() {
        document.getElementById('bloodPreview').textContent = this.value || 'B+';
    });

    document.getElementById('email').addEventListener('input', function() {
        document.getElementById('emailPreview').textContent = this.value || 'example@gmail.com';
    });

    document.getElementById('qrcodeData').addEventListener('input', function() {
        const data = this.value || 'ID-CARD-GENERATOR';
        generateQRCode(data);
    });
}

// ========== DRAG SYSTEM ==========

function toggleDragMode() {
    isDragMode = !isDragMode;
    const idCard = document.getElementById('idCard');
    const btn = document.getElementById('dragModeBtn');
    
    if (isDragMode) {
        idCard.classList.add('drag-mode-active');
        btn.textContent = 'Disable Drag Mode';
        btn.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        showNotification('Drag mode enabled! Click and drag elements to reposition them.', 'success');
    } else {
        idCard.classList.remove('drag-mode-active');
        btn.textContent = 'Enable Drag Mode';
        btn.style.background = 'linear-gradient(135deg, #00a8cc, #0091b5)';
        showNotification('Drag mode disabled. Positions saved.', 'success');
    }
}

function initializeDragSystem() {
    const draggableElements = document.querySelectorAll('.draggable-element');
    
    draggableElements.forEach(element => {
        element.addEventListener('mousedown', startDrag);
    });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Prevent text selection while dragging
    document.addEventListener('selectstart', function(e) {
        if (isDragMode && draggedElement) {
            e.preventDefault();
        }
    });
}

function startDrag(e) {
    if (!isDragMode) return;
    
    draggedElement = e.currentTarget;
    draggedElement.classList.add('dragging');
    
    const rect = draggedElement.getBoundingClientRect();
    const cardRect = document.getElementById('idCard').getBoundingClientRect();
    
    // Calculate offset from where we clicked
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    // Store original computed position
    const computedStyle = window.getComputedStyle(draggedElement);
    if (!draggedElement.style.left) {
        draggedElement.style.left = rect.left - cardRect.left + 'px';
        draggedElement.style.top = rect.top - cardRect.top + 'px';
        draggedElement.style.right = 'auto';
        draggedElement.style.bottom = 'auto';
        draggedElement.style.transform = 'none';
    }
    
    e.preventDefault();
    e.stopPropagation();
}

function drag(e) {
    if (!draggedElement || !isDragMode) return;
    
    const cardRect = document.getElementById('idCard').getBoundingClientRect();
    
    // Calculate new position relative to card
    let newLeft = e.clientX - cardRect.left - offsetX;
    let newTop = e.clientY - cardRect.top - offsetY;
    
    // Get element dimensions
    const elemRect = draggedElement.getBoundingClientRect();
    const elemWidth = elemRect.width;
    const elemHeight = elemRect.height;
    
    // Constrain within card boundaries
    newLeft = Math.max(0, Math.min(newLeft, cardRect.width - elemWidth));
    newTop = Math.max(0, Math.min(newTop, cardRect.height - elemHeight));
    
    // Update position and remove transform
    draggedElement.style.left = newLeft + 'px';
    draggedElement.style.top = newTop + 'px';
    draggedElement.style.right = 'auto';
    draggedElement.style.bottom = 'auto';
    draggedElement.style.transform = 'none';
    
    e.preventDefault();
}

function stopDrag() {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        
        // Log the final position for reference
        const element = draggedElement;
        const name = element.getAttribute('data-element');
        const position = {
            top: element.style.top,
            left: element.style.left,
            bottom: element.style.bottom,
            right: element.style.right,
            transform: element.style.transform
        };
        
        console.log(`${name} position:`, position);
        
        draggedElement = null;
    }
}
