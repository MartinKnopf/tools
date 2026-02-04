// Data structure
const APP_DATA_KEY = 'workoutTrackerData';
let appData = {
    templates: [],
    sessions: []
};

// DOM Elements
const sessionsTab = document.getElementById('sessions-tab');
const templatesTab = document.getElementById('templates-tab');
const dataTab = document.getElementById('data-tab');
const sessionsView = document.getElementById('sessions-view');
const templatesView = document.getElementById('templates-view');
const dataView = document.getElementById('data-view');
const sessionsList = document.getElementById('sessions-list');
const templatesList = document.getElementById('templates-list');
const newSessionBtn = document.getElementById('new-session-btn');
const newTemplateBtn = document.getElementById('new-template-btn');
const templateModal = document.getElementById('template-modal');
const newSessionModal = document.getElementById('new-session-modal');
const templateForm = document.getElementById('template-form');
const templateName = document.getElementById('template-name');
const templateExercises = document.getElementById('template-exercises');
const addExerciseBtn = document.getElementById('add-exercise-btn');
const templateSelection = document.getElementById('template-selection');
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importDataInput = document.getElementById('import-data-input');

// Initialize the app
function init() {
    loadData();
    renderSessions();
    renderTemplates();
    setupEventListeners();
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem(APP_DATA_KEY);
    if (savedData) {
        try {
            appData = JSON.parse(savedData);
        } catch (e) {
            console.error('Failed to parse saved data:', e);
        }
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    sessionsTab.addEventListener('click', () => switchTab('sessions'));
    templatesTab.addEventListener('click', () => switchTab('templates'));
    dataTab.addEventListener('click', () => switchTab('data'));

    // Button actions
    newSessionBtn.addEventListener('click', openNewSessionModal);
    newTemplateBtn.addEventListener('click', openNewTemplateModal);
    addExerciseBtn.addEventListener('click', () => addExerciseInput()); // Fix: call with no arguments
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importDataInput.click());
    importDataInput.addEventListener('change', importData);

    // Form submissions
    templateForm.addEventListener('submit', saveTemplate);

    // Close modals when clicking on X or outside the modal
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeAllModals);
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and views
    sessionsTab.classList.remove('active');
    templatesTab.classList.remove('active');
    dataTab.classList.remove('active');
    sessionsView.classList.remove('active');
    templatesView.classList.remove('active');
    dataView.classList.remove('active');

    // Add active class to selected tab and view
    if (tabName === 'sessions') {
        sessionsTab.classList.add('active');
        sessionsView.classList.add('active');
    } else if (tabName === 'templates') {
        templatesTab.classList.add('active');
        templatesView.classList.add('active');
    } else if (tabName === 'data') {
        dataTab.classList.add('active');
        dataView.classList.add('active');
    }
}

// Close all modals
function closeAllModals() {
    templateModal.style.display = 'none';
    newSessionModal.style.display = 'none';
}

// ================ TEMPLATES FUNCTIONALITY ================

// Open modal for creating a new template
function openNewTemplateModal() {
    // Reset form
    templateForm.reset();
    document.getElementById('template-modal-title').textContent = 'New Template';
    templateForm.dataset.mode = 'create';
    templateForm.dataset.templateId = '';
    
    // Clear exercises
    templateExercises.innerHTML = '';
    
    // Add one empty exercise by default
    addExerciseInput();
    
    // Show modal
    templateModal.style.display = 'block';
}

// Open modal for editing an existing template
function openEditTemplateModal(templateId) {
    const template = appData.templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Set form title and mode
    document.getElementById('template-modal-title').textContent = 'Edit Template';
    templateForm.dataset.mode = 'edit';
    templateForm.dataset.templateId = templateId;
    
    // Set template name
    templateName.value = String(template.name || '');
    
    // Clear exercises
    templateExercises.innerHTML = '';
    
    // Add exercises from the template
    template.exercises.forEach(exercise => {
        const title = String(exercise.title || '');
        const info = String(exercise.info || '');
        addExerciseInput(title, info);
    });
    
    // Show modal
    templateModal.style.display = 'block';
}

// Add a new exercise input to the template form
function addExerciseInput(title = '', info = '') {
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-input';
    exerciseDiv.innerHTML = `
        <button type="button" class="remove-exercise">&times;</button>
        <div class="form-group">
            <input type="text" class="exercise-title-input" value="${title || ''}" placeholder="Exercise Title" required>
        </div>
        <div class="form-group">
            <input type="text" class="exercise-info-input" value="${info || ''}" placeholder="Additional Information (e.g., 3x10 @ 60kg)">
        </div>
    `;
    
    // Add delete exercise functionality
    exerciseDiv.querySelector('.remove-exercise').addEventListener('click', () => {
        exerciseDiv.remove();
    });
    
    templateExercises.appendChild(exerciseDiv);
}

// Save template (create or update)
function saveTemplate(e) {
    e.preventDefault();
    
    // Get form data
    const mode = templateForm.dataset.mode;
    const templateId = templateForm.dataset.templateId;
    const name = templateName.value.trim();
    const exercises = [];
    
    // Get all exercises
    templateExercises.querySelectorAll('.exercise-input').forEach(exerciseInput => {
        const titleInput = exerciseInput.querySelector('.exercise-title-input');
        const infoInput = exerciseInput.querySelector('.exercise-info-input');
        
        // Only add exercises that have a title
        if (titleInput && titleInput.value.trim()) {
            exercises.push({ 
                title: titleInput.value.trim(),
                info: (infoInput && infoInput.value) ? infoInput.value.trim() : ''
            });
        }
    });
    
    if (exercises.length === 0) {
        alert('Please add at least one exercise with a title.');
        return;
    }
    
    if (mode === 'create') {
        // Create new template
        const newTemplate = {
            id: Date.now().toString(),
            name,
            exercises
        };
        appData.templates.push(newTemplate);
    } else {
        // Update existing template
        const templateIndex = appData.templates.findIndex(t => t.id === templateId);
        if (templateIndex !== -1) {
            appData.templates[templateIndex] = {
                ...appData.templates[templateIndex],
                name,
                exercises
            };
        }
    }
    
    // Save data and update UI
    saveData();
    renderTemplates();
    closeAllModals();
}

// Delete template
function deleteTemplate(templateId) {
    if (confirm('Are you sure you want to delete this template?')) {
        appData.templates = appData.templates.filter(t => t.id !== templateId);
        saveData();
        renderTemplates();
    }
}

// Render all templates
function renderTemplates() {
    templatesList.innerHTML = '';
    
    if (appData.templates.length === 0) {
        templatesList.innerHTML = '<p>No templates yet. Create your first workout template!</p>';
        return;
    }
    
    appData.templates.forEach(template => {
        const templateEl = document.createElement('div');
        templateEl.className = 'template-item';
        templateEl.innerHTML = `
            <div class="template-header">
                <div class="template-title">${String(template.name || '')}</div>
                <div class="template-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
            <div class="exercises">
                ${template.exercises.map(exercise => `
                    <div class="exercise-item">
                        <div class="exercise-title">
                            ${String(exercise.title || '')}
                            ${exercise.info ? `<span class="exercise-info">(${String(exercise.info)})</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners
        templateEl.querySelector('.edit-btn').addEventListener('click', () => openEditTemplateModal(template.id));
        templateEl.querySelector('.delete-btn').addEventListener('click', () => deleteTemplate(template.id));
        
        templatesList.appendChild(templateEl);
    });
}

// ================ SESSIONS FUNCTIONALITY ================

// Open modal for creating a new session
function openNewSessionModal() {
    // Clear template selection
    templateSelection.innerHTML = '';
    
    if (appData.templates.length === 0) {
        templateSelection.innerHTML = '<p>No templates available. Create a template first!</p>';
    } else {
        appData.templates.forEach(template => {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';
            templateEl.innerHTML = `
                <div class="template-header">
                    <div class="template-title">${String(template.name || '')}</div>
                    <button class="primary-btn select-template-btn">Select</button>
                </div>
                <div class="exercises">
                    ${template.exercises.map(exercise => `
                        <div class="exercise-item">
                            <div class="exercise-title-row">
                                <div class="exercise-title">${String(exercise.title || '')}</div>
                                <div class="exercise-info">${String(exercise.info || '')}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Add event listener to select button
            templateEl.querySelector('.select-template-btn').addEventListener('click', () => createNewSession(template.id));
            
            templateSelection.appendChild(templateEl);
        });
    }
    
    // Show modal
    newSessionModal.style.display = 'block';
}

// Create a new workout session from a template
function createNewSession(templateId) {
    const template = appData.templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Generate today's date in YYYY-MM-DD format
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Create exercises from template
    const exercises = template.exercises.map(exercise => ({
        title: exercise.title,
        info: exercise.info || '',
        completed: false,
        notes: ''
    }));
    
    // Create new session
    const newSession = {
        id: Date.now().toString(),
        date: dateStr,
        templateId,
        templateName: template.name,
        exercises,
        collapsed: false
    };
    
    // Add to beginning of sessions array (latest first)
    appData.sessions.unshift(newSession);
    
    // Save data and update UI
    saveData();
    renderSessions();
    closeAllModals();
    
    // Switch to sessions tab
    switchTab('sessions');
}

// Toggle exercise completion
function toggleExercise(sessionId, exerciseIndex) {
    const sessionIndex = appData.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return;
    
    // Toggle completion status
    appData.sessions[sessionIndex].exercises[exerciseIndex].completed = 
        !appData.sessions[sessionIndex].exercises[exerciseIndex].completed;
    
    // Check if all exercises are completed
    const allCompleted = appData.sessions[sessionIndex].exercises.every(ex => ex.completed);
    if (allCompleted) {
        // Auto-collapse session
        appData.sessions[sessionIndex].collapsed = true;
    }
    
    // Save data and update UI
    saveData();
    renderSessions();
}

// Save exercise notes
function saveExerciseNotes(sessionId, exerciseIndex, notes) {
    const sessionIndex = appData.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return;
    
    appData.sessions[sessionIndex].exercises[exerciseIndex].notes = notes;
    saveData();
}

// Toggle session collapse state
function toggleSessionCollapse(sessionId) {
    const sessionIndex = appData.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return;
    
    appData.sessions[sessionIndex].collapsed = !appData.sessions[sessionIndex].collapsed;
    saveData();
    renderSessions();
}

// Render all workout sessions
function renderSessions() {
    sessionsList.innerHTML = '';
    
    if (appData.sessions.length === 0) {
        sessionsList.innerHTML = '<p>No workout sessions yet. Start a new workout!</p>';
        return;
    }
    
    appData.sessions.forEach(session => {
        const completedCount = session.exercises.filter(ex => ex.completed).length;
        const totalCount = session.exercises.length;
        
        const sessionEl = document.createElement('div');
        sessionEl.className = 'session-item';
        
        // Session header
        const header = document.createElement('div');
        header.className = 'session-header';
        header.innerHTML = `
            <div class="session-title">${String(session.date || '')} <span class="session-template">${String(session.templateName || '')}</span></div>
            <div class="session-subtitle">${completedCount}/${totalCount}</div>
        `;
        header.addEventListener('click', () => toggleSessionCollapse(session.id));
        sessionEl.appendChild(header);
        
        // Session content (exercises)
        if (!session.collapsed) {
            const exercisesContainer = document.createElement('div');
            exercisesContainer.className = 'exercises';
            
            session.exercises.forEach((exercise, index) => {
                const exerciseEl = document.createElement('div');
                exerciseEl.className = `exercise-item${exercise.completed ? ' completed' : ''}`;
                
                exerciseEl.innerHTML = `
                    <div class="exercise-header">
                        <div class="exercise-title-row">
                            <div class="exercise-title">
                                <input type="checkbox" ${exercise.completed ? 'checked' : ''}>
                                ${String(exercise.title || '')}
                                ${exercise.info ? `<span class="exercise-info">(${String(exercise.info)})</span>` : ''}
                            </div>
                        </div>
                        <div class="exercise-actions">
                            <button class="edit-btn">Edit</button>
                        </div>
                    </div>
                    <div class="exercise-details">
                        <textarea class="exercise-note" placeholder="Record your reps/weights here...">${String(exercise.notes || '')}</textarea>
                    </div>
                `;
                
                // Add event listeners
                const checkbox = exerciseEl.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => toggleExercise(session.id, index));
                
                const editBtn = exerciseEl.querySelector('.edit-btn');
                const details = exerciseEl.querySelector('.exercise-details');
                editBtn.addEventListener('click', () => {
                    details.classList.toggle('visible');
                    editBtn.textContent = details.classList.contains('visible') ? 'Close' : 'Edit';
                });
                
                const noteInput = exerciseEl.querySelector('.exercise-note');
                noteInput.addEventListener('input', () => {
                    saveExerciseNotes(session.id, index, noteInput.value);
                });
                
                exercisesContainer.appendChild(exerciseEl);
            });
            
            sessionEl.appendChild(exercisesContainer);
        }
        
        sessionsList.appendChild(sessionEl);
    });
}

// ================ DATA MANAGEMENT ================

// Export data as JSON file
function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `workout-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import data from JSON file
function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!importedData.templates || !importedData.sessions) {
                alert('Invalid data format. Import failed.');
                return;
            }
            
            // Confirm with user
            if (confirm('Importing will replace all your current data. Continue?')) {
                appData = importedData;
                saveData();
                renderTemplates();
                renderSessions();
                alert('Data imported successfully!');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import data. Please check the file and try again.');
        }
        
        // Reset file input
        importDataInput.value = '';
    };
    reader.readAsText(file);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);