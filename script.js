// Global cropper variable
let cropper = null;

// Drag mode state
let isDragMode = false;
let draggedElement = null;
let offsetX = 0;
let offsetY = 0;

// Store template as base64 for download
let templateBase64 = null;

// Initialize barcode on page load
document.addEventListener('DOMContentLoaded', function() {
    generateBarcode('ID-CARD-GENERATOR');
    initializeDragSystem();
    setupTemplateUpload();
});

// Setup template upload handler
function setupTemplateUpload() {
    document.getElementById('templateInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                templateBase64 = e.target.result;
                document.querySelector('.template-bg').src = templateBase64;
                showNotification('Template uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Handle photo upload - Open Cropper
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

// Apply cropped image
function applyCrop() {
    if (cropper) {
        // Get cropped canvas with exact dimensions
        const croppedCanvas = cropper.getCroppedCanvas({
            width: 290,  // 2x for better quality (145 * 2)
            height: 344, // 2x for better quality (172 * 2)
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        // Set the cropped image to preview
        const croppedImage = croppedCanvas.toDataURL('image/png');
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
    const barcodeData = document.getElementById('barcodeData').value || fullName.replace(/\s+/g, '-');

    // Update preview
    document.getElementById('fullNamePreview').textContent = fullName.toUpperCase();
    document.getElementById('designationPreview').textContent = designation;
    document.getElementById('idNumberPreview').textContent = idNumber;
    document.getElementById('phonePreview').textContent = phoneNumber;
    document.getElementById('bloodPreview').textContent = bloodGroup;
    document.getElementById('emailPreview').textContent = email;

    // Generate barcode
    generateBarcode(barcodeData);

    // Show success message
    showNotification('ID Card generated successfully!');
}

// Generate Barcode
function generateBarcode(data) {
    try {
        JsBarcode("#barcode", data, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: false,
            margin: 0
        });
    } catch (error) {
        console.error('Barcode generation error:', error);
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
    // Create a new canvas and draw everything manually
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = 400 * scale;
    canvas.height = 650 * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    
    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 650);
    
    // Draw template background
    const templateImg = document.querySelector('.template-bg');
    if (templateImg && templateImg.complete) {
        ctx.drawImage(templateImg, 0, 0, 400, 650);
    }
    
    // Draw photo
    const photoImg = document.getElementById('photoPreview');
    if (photoImg && photoImg.complete && photoImg.src && !photoImg.src.includes('Person Photo')) {
        const photoSection = document.querySelector('.photo-section');
        const photoRect = getElementPosition(photoSection);
        ctx.drawImage(photoImg, photoRect.left, photoRect.top, photoRect.width, photoRect.height);
    }
    
    // Draw name
    const nameSection = document.querySelector('.name-section');
    const nameText = document.getElementById('fullNamePreview').textContent;
    const namePos = getElementPosition(nameSection);
    ctx.font = '900 32px Roboto, sans-serif';
    ctx.fillStyle = '#004d73';
    ctx.textAlign = 'center';
    ctx.fillText(nameText, namePos.left + namePos.width/2, namePos.top + 28);
    
    // Draw designation with dashes
    const designationSection = document.querySelector('.designation-section');
    const designationText = document.getElementById('designationPreview').textContent;
    const designationPos = getElementPosition(designationSection);
    const designationWithDashes = '— ' + designationText + ' —';
    ctx.font = '400 17px Roboto, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    
    // Draw the dashes in blue and text in black
    const centerX = designationPos.left + designationPos.width/2;
    const textY = designationPos.top + 15;
    const textWidth = ctx.measureText(designationText).width;
    
    // Left dash
    ctx.fillStyle = '#004d73';
    ctx.font = '700 17px Roboto, sans-serif';
    ctx.fillText('—', centerX - textWidth/2 - 20, textY);
    
    // Designation text
    ctx.fillStyle = '#000000';
    ctx.font = '400 17px Roboto, sans-serif';
    ctx.fillText(designationText, centerX, textY);
    
    // Right dash
    ctx.fillStyle = '#004d73';
    ctx.font = '700 17px Roboto, sans-serif';
    ctx.fillText('—', centerX + textWidth/2 + 20, textY);
    
    // Draw detail values
    ctx.font = '400 15px Roboto, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    
    const details = [
        { id: 'idRow', textId: 'idNumberPreview' },
        { id: 'phoneRow', textId: 'phonePreview' },
        { id: 'bloodRow', textId: 'bloodPreview' },
        { id: 'emailRow', textId: 'emailPreview' }
    ];
    
    details.forEach(detail => {
        const row = document.getElementById(detail.id);
        const text = document.getElementById(detail.textId).textContent;
        const pos = getElementPosition(row);
        ctx.fillText(text, pos.left, pos.top + 12);
    });
    
    // Draw barcode
    const barcodeSection = document.querySelector('.barcode-section');
    const barcodeSvg = document.getElementById('barcode');
    if (barcodeSvg) {
        const barcodePos = getElementPosition(barcodeSection);
        // Convert SVG to image
        const svgData = new XMLSerializer().serializeToString(barcodeSvg);
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        const barcodeImg = new Image();
        barcodeImg.onload = function() {
            ctx.drawImage(barcodeImg, barcodePos.left, barcodePos.top, barcodeSvg.clientWidth, barcodeSvg.clientHeight);
            URL.revokeObjectURL(url);
            
            // Download the canvas
            downloadCanvas(canvas, restoreDragMode);
        };
        barcodeImg.src = url;
    } else {
        downloadCanvas(canvas, restoreDragMode);
    }
}

function getElementPosition(element) {
    const card = document.getElementById('idCard');
    const cardRect = card.getBoundingClientRect();
    const elemRect = element.getBoundingClientRect();
    
    return {
        left: elemRect.left - cardRect.left,
        top: elemRect.top - cardRect.top,
        width: elemRect.width,
        height: elemRect.height
    };
}

function downloadCanvas(canvas, restoreDragMode) {
    const link = document.createElement('a');
    link.download = 'id-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    if (restoreDragMode) {
        toggleDragMode();
    }
    
    showNotification('ID Card downloaded successfully!');
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

document.getElementById('barcodeData').addEventListener('input', function() {
    const data = this.value || 'ID-CARD-GENERATOR';
    generateBarcode(data);
});

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
