// Dashboard JavaScript functionality

// Global variables (declared once)
let currentTranslationTask = null;
let progressInterval = null;
let isTranslating = false;
let translationCancelled = false;


// Novel Upload
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
    
    const formData = new FormData(this);
    const button = this.querySelector('button[type="submit"]');
    const progressDiv = document.getElementById('uploadProgress');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Uploading...';
    button.disabled = true;
    progressDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/upload_novel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`Novel uploaded successfully! Found ${result.total_chapters} chapters in ${result.total_batches} batches.`, 'success');
            
            // Reset form and reload page after delay
            this.reset();
                    setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showAlert(result.error || 'Failed to upload novel', 'danger');
        }
    } catch (error) {
        showAlert('Error uploading novel: ' + error.message, 'danger');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
        progressDiv.style.display = 'none';
    }
    });
}

// Current view mode
let currentView = 'batch';

// View Novel and Load Content
async function viewNovel(novelId) {
    document.getElementById('currentNovelId').value = novelId;
    document.getElementById('translationSection').style.display = 'block';
    
    // Load both batches and chapters
    await loadBatches(novelId);
    await loadChapters(novelId);
    
    // Show the current view
    switchView(currentView);
}

// Load Batches
async function loadBatches(novelId) {
    try {
        const response = await fetch(`/api/get_batches/${novelId}`);
        const batches = await response.json();
        
        if (Array.isArray(batches)) {
            displayBatches(batches);
        } else {
            console.error('Failed to load batches:', batches.error);
        }
    } catch (error) {
        console.error('Error loading batches:', error.message);
    }
}

// Load Chapters  
async function loadChapters(novelId) {
    try {
        const response = await fetch(`/api/get_chapters/${novelId}`);
        const chapters = await response.json();
        
        if (Array.isArray(chapters)) {
            console.log('Successfully loaded', chapters.length, 'chapters');
            displayChapters(chapters);
        } else {
            console.error('Failed to load chapters:', chapters.error);
            showAlert('Failed to load chapters: ' + (chapters.error || 'Unknown error'), 'warning');
        }
    } catch (error) {
        console.error('Error loading chapters:', error.message);
        showAlert('Error loading chapters: ' + error.message, 'danger');
    }
}

// Display Batches
function displayBatches(batches) {
    const batchList = document.getElementById('batchList');
    batchList.innerHTML = '';
    
    batches.forEach(batch => {
        const batchCard = document.createElement('div');
        batchCard.className = 'col-md-6 col-lg-4 mb-3';
        
        const translatedBadge = batch.translated ? 
            '<span class="badge bg-success ms-2">Translated</span>' : 
            '<span class="badge bg-secondary ms-2">Not Translated</span>';
        
        batchCard.innerHTML = `
            <div class="card batch-card h-100" onclick="toggleBatch(${batch.id})">
                <div class="card-body position-relative">
                    <button class="btn btn-outline-secondary btn-sm position-absolute top-0 end-0 m-2" 
                            onclick="event.stopPropagation(); viewBatchContent(${batch.id})"
                            title="View full content">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="batch_${batch.id}" value="${batch.id}">
                        <label class="form-check-label w-100" for="batch_${batch.id}">
                            <strong>Batch ${batch.batch_number}</strong>
                            ${translatedBadge}
                            <br>
                            <small class="text-muted">Chapters ${batch.chapter_start}-${batch.chapter_end}</small>
                        </label>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">${batch.content_preview}</small>
                    </div>
                    <div id="batch-progress-${batch.id}" class="batch-progress mt-2" style="display: none;">
                        <div class="progress" style="height: 4px;">
                            <div class="progress-bar bg-primary" style="width: 0%"></div>
                        </div>
                        <small class="text-info">Currently translating...</small>
                    </div>
                </div>
            </div>
        `;
        
        batchList.appendChild(batchCard);
    });
}

// Display Chapters
function displayChapters(chapters) {
    const chapterList = document.getElementById('chapterList');
    chapterList.innerHTML = '';
    
    console.log('Displaying chapters in chapterList element:', chapterList);
    console.log('Number of chapters to display:', chapters.length);
    
    chapters.forEach(chapter => {
        const chapterCard = document.createElement('div');
        chapterCard.className = 'col-md-6 col-lg-4 mb-3';
        
        const translatedBadge = chapter.translated ? 
            '<span class="badge bg-success ms-2">Translated</span>' : 
            '<span class="badge bg-secondary ms-2">Not Translated</span>';
        
        // Progress bar based on translation_progress (0-100)
        const progressWidth = chapter.translation_progress || 0;
        const progressClass = progressWidth === 100 ? 'bg-success' : 
                             progressWidth > 0 ? 'bg-primary progress-bar-striped progress-bar-animated' : 'bg-secondary';
        
        chapterCard.innerHTML = `
            <div class="card chapter-card h-100" onclick="toggleChapter(${chapter.id})">
                <div class="card-body position-relative">
                    <button class="btn btn-outline-secondary btn-sm position-absolute top-0 end-0 m-2" 
                            onclick="event.stopPropagation(); viewChapterContent(${chapter.id})"
                            title="View full content">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="chapter_${chapter.id}" value="${chapter.id}">
                        <label class="form-check-label w-100" for="chapter_${chapter.id}">
                            <strong>${chapter.title}</strong>
                            ${translatedBadge}
                            <br>
                            <small class="text-muted">Chapter ${chapter.chapter_number}</small>
                        </label>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">${chapter.content_preview}</small>
                    </div>
                    <div class="chapter-progress mt-2">
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${progressClass}" 
                                 style="width: ${progressWidth}%" 
                                 title="Translation Progress: ${progressWidth}%">
                                ${progressWidth > 0 ? progressWidth + '%' : ''}
                            </div>
                        </div>
                        <small class="text-muted">Progress: ${progressWidth}%</small>
                    </div>
                </div>
            </div>
        `;
        
        chapterList.appendChild(chapterCard);
    });
}

// Toggle Batch Selection
function toggleBatch(batchId) {
    const checkbox = document.getElementById(`batch_${batchId}`);
    const card = checkbox.closest('.batch-card');
    
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
}

// Toggle Chapter Selection
function toggleChapter(chapterId) {
    const checkbox = document.getElementById(`chapter_${chapterId}`);
    const card = checkbox.closest('.chapter-card');
    
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
}

// Toggle Translation (YouTube-style play/stop button)
async function toggleTranslation() {
    if (isTranslating) {
        stopTranslation();
    } else {
        await startTranslation();
    }
}

// Start Translation
async function startTranslation() {
    let selectedItems, endpoint, errorMessage;
    
    if (currentView === 'batch') {
        selectedItems = Array.from(document.querySelectorAll('#batchList input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value));
        endpoint = '/api/translate';
        errorMessage = 'Please select at least one batch to translate';
    } else {
        selectedItems = Array.from(document.querySelectorAll('#chapterList input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value));
        endpoint = '/api/translate_chapters';
        errorMessage = 'Please select at least one chapter to translate';
    }
    
    if (selectedItems.length === 0) {
        showAlert(errorMessage, 'warning');
        return;
    }
    
    const targetLanguage = document.getElementById('targetLanguage').value;
    const progressDiv = document.getElementById('translationProgress');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const toggleButton = document.getElementById('translationToggle');
    
    // Update button to stop state
    isTranslating = true;
    translationCancelled = false;
    toggleButton.innerHTML = '<i class="fas fa-stop me-1"></i>Stop Translation';
    toggleButton.className = 'btn btn-danger me-2';
    
    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    progressStatus.textContent = 'Starting translation...';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentView === 'batch' ? {
                batch_ids: selectedItems,
                target_language: targetLanguage
            } : {
                chapter_ids: selectedItems,
                target_language: targetLanguage
            })
        });
        
        const result = await response.json();
        
        if (result.task_id) {
            currentTranslationTask = result.task_id;
            trackTranslationProgress(result.task_id);
        } else {
            showAlert(result.error || 'Failed to start translation', 'danger');
            resetTranslationButton();
        }
    } catch (error) {
        showAlert('Error starting translation: ' + error.message, 'danger');
        resetTranslationButton();
    }
}

// Stop Translation
function stopTranslation() {
    translationCancelled = true;
    
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    const progressStatus = document.getElementById('progressStatus');
    progressStatus.textContent = 'Translation stopped by user';
    
    showAlert('Translation stopped', 'warning');
    resetTranslationButton();
}

// Reset Translation Button
function resetTranslationButton() {
    const toggleButton = document.getElementById('translationToggle');
    const progressDiv = document.getElementById('translationProgress');
    
    isTranslating = false;
    toggleButton.innerHTML = '<i class="fas fa-play me-1"></i>Start Translation';
    toggleButton.className = 'btn btn-success me-2';
    
    setTimeout(() => {
        if (!isTranslating) {
            progressDiv.style.display = 'none';
        }
    }, 3000);
}

// Track Translation Progress
function trackTranslationProgress(taskId) {
    progressInterval = setInterval(async () => {
        // Check if translation was cancelled
        if (translationCancelled) {
            clearInterval(progressInterval);
            progressInterval = null;
            return;
        }
        
        try {
            const response = await fetch(`/api/translation_progress/${taskId}`);
            const progress = await response.json();
            
            const percentage = Math.round((progress.progress / progress.total) * 100);
            const progressBar = document.getElementById('progressBar');
            const progressStatus = document.getElementById('progressStatus');
            
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
            progressStatus.textContent = progress.status;
            
            // Update individual progress based on view
            if (currentView === 'batch') {
                updateBatchProgress(progress.current_batch, progress.status);
            } else {
                updateChapterProgress(progress.current_chapter_id, progress.status);
            }
            
            if (progress.status === 'completed') {
                clearInterval(progressInterval);
                progressInterval = null;
                showAlert('Translation completed successfully!', 'success');
                resetTranslationButton();
                
                // Reload batches to show updated status
                const novelId = document.getElementById('currentNovelId').value;
                if (novelId) {
                    viewNovel(parseInt(novelId));
                }
            } else if (progress.status.startsWith('Failed:')) {
                clearInterval(progressInterval);
                progressInterval = null;
                showAlert(progress.status, 'danger');
                resetTranslationButton();
            }
        } catch (error) {
            console.error('Error tracking progress:', error);
            if (!translationCancelled) {
                showAlert('Error tracking translation progress', 'warning');
                resetTranslationButton();
            }
        }
    }, 2000);
}

// Generate Output in Selected Format
async function generateOutput() {
    const novelId = document.getElementById('currentNovelId').value;
    const outputFormat = document.getElementById('outputFormat').value;
    
    if (!novelId) {
        showAlert('Please select a novel first', 'warning');
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    const formatNames = {
        'epub': 'EPUB',
        'pdf': 'PDF',
        'txt': 'Text',
        'docx': 'Word Document'
    };
    const formatName = formatNames[outputFormat] || outputFormat.toUpperCase();
    
    button.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>Generating ${formatName}...`;
    button.disabled = true;
    
    try {
        const response = await fetch('/api/generate_output', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                novel_id: novelId,
                output_format: outputFormat
            })
        });
        const result = await response.json();
        
        if (result.success) {
            const epubResult = document.getElementById('epubResult');
            const downloadLink = document.getElementById('downloadLink');
            
            downloadLink.href = result.download_url;
            epubResult.style.display = 'block';
            
            showAlert(`${formatName} generated successfully!`, 'success');
        } else {
            showAlert(result.error || `Failed to generate ${formatName}`, 'danger');
        }
    } catch (error) {
        showAlert(`Error generating ${formatName}: ` + error.message, 'danger');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Utility function to show alerts
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the main container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Update individual batch progress
function updateBatchProgress(currentBatch, status) {
    // Hide all batch progress indicators
    document.querySelectorAll('.batch-progress').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show progress for current batch - find by batch number
    if (currentBatch) {
        // Find the batch ID by looking through all checkboxes to match batch number
        const batches = document.querySelectorAll('[id^="batch_"]');
        let foundBatchId = null;
        
        batches.forEach(checkbox => {
            const batchCard = checkbox.closest('.batch-card');
            if (batchCard) {
                const batchNumberText = batchCard.querySelector('strong').textContent;
                const batchNumber = parseInt(batchNumberText.replace('Batch ', ''));
                
                if (batchNumber === currentBatch) {
                    foundBatchId = checkbox.value;
                }
            }
        });
        
        if (foundBatchId) {
            const batchProgress = document.getElementById(`batch-progress-${foundBatchId}`);
            if (batchProgress) {
                batchProgress.style.display = 'block';
                const progressBar = batchProgress.querySelector('.progress-bar');
                const statusText = batchProgress.querySelector('small');
                
                if (status.includes('Translating')) {
                    progressBar.style.width = '100%';
                    progressBar.className = 'progress-bar bg-primary progress-bar-striped progress-bar-animated';
                    statusText.textContent = 'Currently translating...';
                    statusText.className = 'text-info';
                } else if (status.includes('Error')) {
                    progressBar.style.width = '100%';
                    progressBar.className = 'progress-bar bg-danger';
                    statusText.textContent = 'Translation error';
                    statusText.className = 'text-danger';
                }
            }
        }
    }
}

// Update individual chapter progress
function updateChapterProgress(currentChapterId, status, progress = null) {
    // Update the specific chapter if we have the ID
    if (currentChapterId) {
        const chapterCard = document.querySelector(`#chapter_${currentChapterId}`)?.closest('.chapter-card');
        if (chapterCard) {
            const progressBar = chapterCard.querySelector('.progress-bar');
            const statusText = chapterCard.querySelector('.chapter-progress small');
            
            if (status.includes('Translating')) {
                progressBar.style.width = '50%';
                progressBar.className = 'progress-bar bg-primary progress-bar-striped progress-bar-animated';
                progressBar.textContent = '50%';
                statusText.textContent = 'Progress: 50% (Translating...)';
            } else if (status.includes('Error')) {
                progressBar.style.width = '0%';
                progressBar.className = 'progress-bar bg-danger';
                progressBar.textContent = '';
                statusText.textContent = 'Progress: 0% (Error)';
            } else if (status === 'completed' || progress === 100) {
                progressBar.style.width = '100%';
                progressBar.className = 'progress-bar bg-success';
                progressBar.textContent = '100%';
                statusText.textContent = 'Progress: 100% (Completed)';
            }
        }
    }
}

// View batch content function
function viewBatchContent(batchId) {
    // Fetch full content for the batch
    fetch(`/api/get_batch_content/${batchId}`)
        .then(response => response.json())
        .then(data => {
            if (data.content) {
                showContentModal(`Batch ${data.batch_number} (Chapters ${data.chapter_start}-${data.chapter_end})`, data.content);
            } else {
                showAlert('Could not load batch content', 'warning');
            }
        })
        .catch(error => {
            console.error('Error fetching batch content:', error);
            showAlert('Error loading batch content', 'danger');
        });
}

// View chapter content function
function viewChapterContent(chapterId) {
    // Fetch full content for the chapter
    fetch(`/api/get_chapter_content/${chapterId}`)
        .then(response => response.json())
        .then(data => {
            if (data.content) {
                showContentModal(data.title, data.content, data.translated_content);
            } else {
                showAlert('Could not load chapter content', 'warning');
            }
        })
        .catch(error => {
            console.error('Error fetching chapter content:', error);
            showAlert('Error loading chapter content', 'danger');
        });
}

// Show content in modal
function showContentModal(chapterTitle, content, translatedContent = null) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('contentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'contentModal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chapter Content</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="contentTabs">
                            <ul class="nav nav-tabs" id="contentTabList" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="original-tab" data-bs-toggle="tab" 
                                            data-bs-target="#original-content" type="button" role="tab">
                                        Original Content
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="translated-tab" data-bs-toggle="tab" 
                                            data-bs-target="#translated-content" type="button" role="tab">
                                        Translated Content
                                    </button>
                                </li>
                            </ul>
                            <div class="tab-content" id="contentTabContent">
                                <div class="tab-pane fade show active" id="original-content" role="tabpanel">
                                    <pre id="modalOriginalContent" style="white-space: pre-wrap; max-height: 500px; overflow-y: auto; padding: 15px; background-color: var(--bs-dark); border: 1px solid var(--bs-border-color); border-radius: 0 0 5px 5px;"></pre>
                                </div>
                                <div class="tab-pane fade" id="translated-content" role="tabpanel">
                                    <pre id="modalTranslatedContent" style="white-space: pre-wrap; max-height: 500px; overflow-y: auto; padding: 15px; background-color: var(--bs-dark); border: 1px solid var(--bs-border-color); border-radius: 0 0 5px 5px;"></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Update modal content
    document.querySelector('#contentModal .modal-title').textContent = chapterTitle;
    document.getElementById('modalOriginalContent').textContent = content;
    
    // Update translated content tab
    const translatedTab = document.getElementById('translated-tab');
    const translatedContentDiv = document.getElementById('modalTranslatedContent');
    
    if (translatedContent) {
        translatedTab.classList.remove('disabled');
        translatedContentDiv.textContent = translatedContent;
        translatedTab.querySelector('button').disabled = false;
    } else {
        translatedTab.classList.add('disabled');
        translatedContentDiv.textContent = 'No translation available yet.';
        translatedTab.querySelector('button').disabled = true;
    }
    
    // Show modal using Bootstrap
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Clean up intervals when page unloads
window.addEventListener('beforeunload', function() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
});

// Spacing Control Functions
function initializeSpacingControl() {
    // Bottom spacing control
    const spacingControl = document.getElementById('spacingControl');
    const spacingInput = document.getElementById('spacingInput');
    const spacingValue = document.getElementById('spacingValue');
    
    if (spacingControl && spacingInput && spacingValue) {
        // Slider input handler
        spacingControl.addEventListener('input', function() {
            const value = this.value;
            spacingInput.value = value;
            spacingValue.textContent = value + 'px';
            updatePageSpacing(value);
        });
        
        // Number input handler
        spacingInput.addEventListener('input', function() {
            const value = Math.max(0, Math.min(1500, parseInt(this.value) || 0));
            this.value = value;
            spacingControl.value = value;
            spacingValue.textContent = value + 'px';
            updatePageSpacing(value);
        });
        
        // Initialize with current value
        updatePageSpacing(spacingControl.value);
    }
    
    // Top spacing control
    const topSpacingControl = document.getElementById('topSpacingControl');
    const topSpacingInput = document.getElementById('topSpacingInput');
    const topSpacingValue = document.getElementById('topSpacingValue');
    
    if (topSpacingControl && topSpacingInput && topSpacingValue) {
        // Slider input handler
        topSpacingControl.addEventListener('input', function() {
            const value = this.value;
            topSpacingInput.value = value;
            topSpacingValue.textContent = value + 'px';
            updateTopSpacing(value);
        });
        
        // Number input handler
        topSpacingInput.addEventListener('input', function() {
            const value = Math.max(0, Math.min(100, parseInt(this.value) || 0));
            this.value = value;
            topSpacingControl.value = value;
            topSpacingValue.textContent = value + 'px';
            updateTopSpacing(value);
        });
        
        // Initialize with current value
        updateTopSpacing(topSpacingControl.value);
    }
}

function updatePageSpacing(pixels) {
    const style = document.createElement('style');
    style.id = 'dynamic-spacing';
    
    // Remove existing dynamic spacing
    const existing = document.getElementById('dynamic-spacing');
    if (existing) {
        existing.remove();
    }
    
    style.innerHTML = `
        #translationSection {
            margin-bottom: ${pixels}px !important;
            padding-bottom: ${Math.floor(pixels/3)}px !important;
        }
        
        #chapterList {
            margin-bottom: ${Math.floor(pixels/2)}px !important;
            padding-bottom: ${Math.floor(pixels/3)}px !important;
        }
        
        #chapterList .col-md-6:last-child,
        #chapterList .col-lg-4:last-child {
            margin-bottom: ${pixels}px !important;
        }
        
        body {
            padding-bottom: ${pixels}px !important;
        }
    `;
    
    document.head.appendChild(style);
}

function updateTopSpacing(pixels) {
    const style = document.createElement('style');
    style.id = 'dynamic-top-spacing';
    
    // Remove existing dynamic spacing
    const existing = document.getElementById('dynamic-top-spacing');
    if (existing) {
        existing.remove();
    }
    
    style.innerHTML = `
        .container {
            padding-top: ${pixels}px !important;
        }
        
        main {
            padding-top: ${Math.floor(pixels/2)}px !important;
        }
    `;
    
    document.head.appendChild(style);
}

function resetSpacing() {
    const spacingControl = document.getElementById('spacingControl');
    const spacingInput = document.getElementById('spacingInput');
    const spacingValue = document.getElementById('spacingValue');
    
    if (spacingControl && spacingInput && spacingValue) {
        spacingControl.value = 300;
        spacingInput.value = 300;
        spacingValue.textContent = '300px';
        updatePageSpacing(300);
    }
}

function resetTopSpacing() {
    const topSpacingControl = document.getElementById('topSpacingControl');
    const topSpacingInput = document.getElementById('topSpacingInput');
    const topSpacingValue = document.getElementById('topSpacingValue');
    
    if (topSpacingControl && topSpacingInput && topSpacingValue) {
        topSpacingControl.value = 8;
        topSpacingInput.value = 8;
        topSpacingValue.textContent = '8px';
        updateTopSpacing(8);
    }
}

// Switch between batch and chapter view
function switchView(view) {
    currentView = view;
    
    const batchBtn = document.getElementById('batchViewBtn');
    const chapterBtn = document.getElementById('chapterViewBtn');
    const batchSelection = document.getElementById('batchSelection');
    const chapterSelection = document.getElementById('chapterSelection');
    
    if (view === 'batch') {
        batchBtn.classList.add('active');
        chapterBtn.classList.remove('active');
        batchSelection.style.display = 'block';
        chapterSelection.style.display = 'none';
    } else {
        chapterBtn.classList.add('active');
        batchBtn.classList.remove('active');
        batchSelection.style.display = 'none';
        chapterSelection.style.display = 'block';
    }
    
    // Clear all selections when switching views
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        cb.checked = false;
        cb.closest('.card').classList.remove('selected');
    });
}

// Initialize spacing control and API key status when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSpacingControl();
    checkApiKeyStatus();
});

// API Key Management Functions
async function checkApiKeyStatus() {
    try {
        const response = await fetch('/api/check_api_key');
        const result = await response.json();
        
        const statusIcon = document.getElementById('apiStatusIcon');
        const statusText = document.getElementById('apiStatusText');
        
        if (statusIcon && statusText) {
            if (result.has_key) {
                statusIcon.className = 'fas fa-check-circle text-success me-2';
                statusText.className = 'text-success';
                statusText.textContent = 'OpenRouter API key is configured';
            } else {
                statusIcon.className = 'fas fa-exclamation-triangle text-warning me-2';
                statusText.className = 'text-warning';
                statusText.textContent = 'OpenRouter API key not configured - translation will not work';
            }
        }
    } catch (error) {
        console.error('Error checking API key status:', error);
    }
}

async function saveApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showAlert('Please enter an API key', 'warning');
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Saving...';
    button.disabled = true;
    
    try {
        const response = await fetch('/api/save_api_key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('API key saved and validated successfully!', 'success');
            apiKeyInput.value = '';
            checkApiKeyStatus();
            
            // Collapse the form
            const collapse = new bootstrap.Collapse(document.getElementById('apiKeyForm'));
            collapse.hide();
        } else {
            showAlert(result.error || 'Failed to save API key', 'danger');
        }
    } catch (error) {
        showAlert('Error saving API key: ' + error.message, 'danger');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}
