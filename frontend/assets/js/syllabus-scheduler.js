// Syllabus Scheduler - User-Personal Study Planning Engine

const SyllabusScheduler = {
    currentStep: 1,
    totalSteps: 5,
    tempData: {},
    
    init() {
        if (!this.checkLoginRequired()) return;
        this.loadUserData();
        this.checkExistingPlan();
        this.setupEventListeners();
    },
    
    checkLoginRequired() {
        if (!UserManager.isUserLoggedIn()) {
            this.showLoginRequired();
            return false;
        }
        return true;
    },
    
    showLoginRequired() {
        const wizardView = document.getElementById('wizard-view');
        const schedulerView = document.getElementById('scheduler-view');
        
        wizardView.style.display = 'none';
        schedulerView.style.display = 'block';
        schedulerView.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <i class="fas fa-lock" style="font-size: 4rem; color: #94a3b8; margin-bottom: 1.5rem;"></i>
                <h2 style="color: #1e293b; margin-bottom: 1rem;">Login Required</h2>
                <p style="color: #64748b; margin-bottom: 2rem;">You must be logged in to use the Syllabus Scheduler</p>
                <button class="btn btn-primary" onclick="window.location.href='../index.html'">
                    <i class="fas fa-sign-in-alt"></i> Go to Login
                </button>
            </div>
        `;
    },
    
    loadUserData() {
        const user = UserManager.getCurrentUser();
        if (user.syllabus && user.syllabus.subjects && user.syllabus.subjects.length > 0) {
            this.showSchedulerView();
        } else {
            this.showWizard();
        }
    },
    
    checkExistingPlan() {
        const user = UserManager.getCurrentUser();
        return user.syllabus && user.syllabus.subjects && user.syllabus.subjects.length > 0;
    },
    
    showWizard() {
        document.getElementById('scheduler-view').style.display = 'none';
        document.getElementById('wizard-view').style.display = 'block';
        this.renderStep(1);
    },
    
    showSchedulerView() {
        document.getElementById('wizard-view').style.display = 'none';
        document.getElementById('scheduler-view').style.display = 'block';
        this.renderScheduler();
    },
    
    renderStep(step) {
        this.currentStep = step;
        const container = document.getElementById('wizard-content');
        
        // Update progress
        document.querySelectorAll('.wizard-step').forEach((el, i) => {
            el.classList.toggle('active', i + 1 === step);
            el.classList.toggle('completed', i + 1 < step);
        });
        
        switch(step) {
            case 1: container.innerHTML = this.getStep1HTML(); break;
            case 2: container.innerHTML = this.getStep2HTML(); break;
            case 3: container.innerHTML = this.getStep3HTML(); break;
            case 4: container.innerHTML = this.getStep4HTML(); break;
            case 5: container.innerHTML = this.getStep5HTML(); break;
        }
        
        this.attachStepListeners();
    },
    
    getStep1HTML() {
        return `
            <div class="wizard-step-content">
                <h2>Add Your Subjects</h2>
                <p>List all subjects you need to study for your exam</p>
                <div id="subjects-list"></div>
                <div class="input-group">
                    <input type="text" id="subject-input" placeholder="Enter subject name" />
                    <button onclick="SyllabusScheduler.addSubject()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Subject
                    </button>
                </div>
                <div class="wizard-actions">
                    <button onclick="SyllabusScheduler.nextStep()" class="btn btn-primary" ${!this.tempData.subjects || this.tempData.subjects.length === 0 ? 'disabled' : ''}>
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    getStep2HTML() {
        if (!this.tempData.subjects || this.tempData.subjects.length === 0) {
            this.renderStep(1);
            return '';
        }
        
        return `
            <div class="wizard-step-content">
                <h2>Add Chapters/Topics</h2>
                <p>Break down each subject into chapters or topics</p>
                <div class="subjects-chapters">
                    ${this.tempData.subjects.map((subject, idx) => `
                        <div class="subject-section">
                            <h3>${subject}</h3>
                            <div id="chapters-${idx}"></div>
                            <div class="input-group">
                                <input type="text" id="chapter-input-${idx}" placeholder="Enter chapter/topic" />
                                <select id="difficulty-${idx}">
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                                <button onclick="SyllabusScheduler.addChapter(${idx})" class="btn btn-secondary">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="wizard-actions">
                    <button onclick="SyllabusScheduler.prevStep()" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button onclick="SyllabusScheduler.nextStep()" class="btn btn-primary">
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    getStep3HTML() {
        return `
            <div class="wizard-step-content">
                <h2>Set Exam Date & Priority</h2>
                <p>When is your exam and how important is it?</p>
                <div class="form-group">
                    <label>Exam Date</label>
                    <input type="date" id="exam-date" value="${this.tempData.examDate || ''}" min="${new Date().toISOString().split('T')[0]}" />
                </div>
                <div class="form-group">
                    <label>Priority Level</label>
                    <select id="priority">
                        <option value="high" ${this.tempData.priority === 'high' ? 'selected' : ''}>High - Main Exam</option>
                        <option value="medium" ${this.tempData.priority === 'medium' ? 'selected' : ''}>Medium - Important</option>
                        <option value="low" ${this.tempData.priority === 'low' ? 'selected' : ''}>Low - Practice</option>
                    </select>
                </div>
                <div class="wizard-actions">
                    <button onclick="SyllabusScheduler.prevStep()" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button onclick="SyllabusScheduler.nextStep()" class="btn btn-primary">
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    getStep4HTML() {
        return `
            <div class="wizard-step-content">
                <h2>Study Availability</h2>
                <p>Tell us about your daily study schedule</p>
                <div class="form-group">
                    <label>Daily Study Hours</label>
                    <input type="number" id="daily-hours" min="1" max="12" value="${this.tempData.dailyHours || 4}" />
                </div>
                <div class="form-group">
                    <label>Preferred Study Time</label>
                    <select id="study-time">
                        <option value="morning" ${this.tempData.studyTime === 'morning' ? 'selected' : ''}>Morning (6 AM - 12 PM)</option>
                        <option value="afternoon" ${this.tempData.studyTime === 'afternoon' ? 'selected' : ''}>Afternoon (12 PM - 6 PM)</option>
                        <option value="evening" ${this.tempData.studyTime === 'evening' ? 'selected' : ''}>Evening (6 PM - 10 PM)</option>
                        <option value="flexible" ${this.tempData.studyTime === 'flexible' ? 'selected' : ''}>Flexible</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Days Off (Optional)</label>
                    <div class="days-selector">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => `
                            <label class="day-checkbox">
                                <input type="checkbox" value="${i}" ${this.tempData.daysOff && this.tempData.daysOff.includes(i) ? 'checked' : ''} />
                                <span>${day}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="wizard-actions">
                    <button onclick="SyllabusScheduler.prevStep()" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button onclick="SyllabusScheduler.nextStep()" class="btn btn-primary">
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    getStep5HTML() {
        const totalChapters = this.tempData.chapters ? Object.values(this.tempData.chapters).flat().length : 0;
        const daysUntilExam = this.tempData.examDate ? Math.ceil((new Date(this.tempData.examDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        
        return `
            <div class="wizard-step-content">
                <h2>Confirm Your Syllabus</h2>
                <p>Review and generate your personalized study plan</p>
                <div class="summary-card">
                    <div class="summary-item">
                        <i class="fas fa-book"></i>
                        <div>
                            <strong>${this.tempData.subjects ? this.tempData.subjects.length : 0}</strong>
                            <span>Subjects</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-list"></i>
                        <div>
                            <strong>${totalChapters}</strong>
                            <span>Chapters/Topics</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <strong>${daysUntilExam}</strong>
                            <span>Days Until Exam</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <strong>${this.tempData.dailyHours || 4}h</strong>
                            <span>Daily Study Time</span>
                        </div>
                    </div>
                </div>
                <div class="wizard-actions">
                    <button onclick="SyllabusScheduler.prevStep()" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button onclick="SyllabusScheduler.generatePlan()" class="btn btn-primary btn-lg">
                        <i class="fas fa-magic"></i> Generate Study Plan
                    </button>
                </div>
            </div>
        `;
    },
    
    addSubject() {
        const input = document.getElementById('subject-input');
        const subject = input.value.trim();
        if (!subject) return;
        
        if (!this.tempData.subjects) this.tempData.subjects = [];
        this.tempData.subjects.push(subject);
        input.value = '';
        this.renderStep(1);
    },
    
    addChapter(subjectIdx) {
        const input = document.getElementById(`chapter-input-${subjectIdx}`);
        const difficulty = document.getElementById(`difficulty-${subjectIdx}`).value;
        const chapter = input.value.trim();
        if (!chapter) return;
        
        if (!this.tempData.chapters) this.tempData.chapters = {};
        if (!this.tempData.chapters[subjectIdx]) this.tempData.chapters[subjectIdx] = [];
        this.tempData.chapters[subjectIdx].push({ name: chapter, difficulty });
        input.value = '';
        this.renderStep(2);
    },
    
    nextStep() {
        // Save current step data
        if (this.currentStep === 3) {
            this.tempData.examDate = document.getElementById('exam-date').value;
            this.tempData.priority = document.getElementById('priority').value;
        } else if (this.currentStep === 4) {
            this.tempData.dailyHours = parseInt(document.getElementById('daily-hours').value);
            this.tempData.studyTime = document.getElementById('study-time').value;
            this.tempData.daysOff = Array.from(document.querySelectorAll('.day-checkbox input:checked')).map(cb => parseInt(cb.value));
        }
        
        if (this.currentStep < this.totalSteps) {
            this.renderStep(this.currentStep + 1);
        }
    },
    
    prevStep() {
        if (this.currentStep > 1) {
            this.renderStep(this.currentStep - 1);
        }
    },
    
    generatePlan() {
        const plan = this.createStudyPlan();
        this.savePlan(plan);
        UserManager.updateOnboarding({ syllabusSetupCompleted: true });
        UserManager.completeStep(0);
        this.showSchedulerView();
    },
    
    createStudyPlan() {
        const tasks = [];
        const examDate = new Date(this.tempData.examDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysAvailable = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        const dailyHours = parseInt(this.tempData.dailyHours) || 4;
        
        let taskId = 0;
        let currentDate = new Date(today);
        let dailyHoursUsed = 0;
        
        // Calculate total hours needed
        let totalHoursNeeded = 0;
        this.tempData.subjects.forEach((subject, subjectIdx) => {
            const chapters = this.tempData.chapters[subjectIdx] || [];
            chapters.forEach(chapter => {
                const hoursNeeded = chapter.difficulty === 'hard' ? 3 : chapter.difficulty === 'medium' ? 2 : 1;
                totalHoursNeeded += hoursNeeded + 1; // learning + revision
            });
        });
        
        // Generate tasks for each chapter
        this.tempData.subjects.forEach((subject, subjectIdx) => {
            const chapters = this.tempData.chapters[subjectIdx] || [];
            chapters.forEach(chapter => {
                const hoursNeeded = chapter.difficulty === 'hard' ? 3 : chapter.difficulty === 'medium' ? 2 : 1;
                
                // Check if we need to move to next day
                if (dailyHoursUsed + hoursNeeded > dailyHours) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    dailyHoursUsed = 0;
                    // Skip days off
                    while (this.tempData.daysOff && this.tempData.daysOff.includes(currentDate.getDay())) {
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
                
                // Learning task
                tasks.push({
                    id: taskId++,
                    subject,
                    chapter: chapter.name,
                    type: 'learning',
                    difficulty: chapter.difficulty,
                    estimatedHours: hoursNeeded,
                    date: new Date(currentDate).toISOString().split('T')[0],
                    status: 'pending',
                    completedAt: null
                });
                
                dailyHoursUsed += hoursNeeded;
                
                // Revision 1 (schedule for later)
                const rev1Date = new Date(currentDate);
                rev1Date.setDate(rev1Date.getDate() + 2);
                while (this.tempData.daysOff && this.tempData.daysOff.includes(rev1Date.getDay())) {
                    rev1Date.setDate(rev1Date.getDate() + 1);
                }
                
                tasks.push({
                    id: taskId++,
                    subject,
                    chapter: chapter.name,
                    type: 'revision1',
                    difficulty: chapter.difficulty,
                    estimatedHours: 1,
                    date: rev1Date.toISOString().split('T')[0],
                    status: 'pending',
                    completedAt: null
                });
            });
        });
        
        // Add final revision week
        const finalRevDate = new Date(examDate);
        finalRevDate.setDate(finalRevDate.getDate() - 7);
        this.tempData.subjects.forEach(subject => {
            tasks.push({
                id: taskId++,
                subject,
                chapter: 'All Topics',
                type: 'final-revision',
                difficulty: 'medium',
                estimatedHours: 2,
                date: finalRevDate.toISOString().split('T')[0],
                status: 'pending',
                completedAt: null
            });
        });
        
        return {
            syllabus: {
                subjects: this.tempData.subjects,
                chapters: this.tempData.chapters,
                examDate: this.tempData.examDate,
                priority: this.tempData.priority
            },
            preferences: {
                dailyHours: this.tempData.dailyHours,
                studyTime: this.tempData.studyTime,
                daysOff: this.tempData.daysOff
            },
            tasks,
            createdAt: new Date().toISOString()
        };
    },
    
    savePlan(plan) {
        const user = UserManager.getCurrentUser();
        user.syllabus = plan.syllabus;
        user.studyPlan = { preferences: plan.preferences };
        user.tasks = plan.tasks;
        UserManager.updateCurrentUser(user);
    },
    
    renderScheduler() {
        const user = UserManager.getCurrentUser();
        this.renderProgress(user);
        this.renderSyllabusOverview(user);
        this.renderCalendar(user);
        this.renderTaskList(user);
    },
    
    renderSyllabusOverview(user) {
        const container = document.getElementById('syllabus-overview');
        if (!container) return;
        
        const syllabus = user.syllabus;
        if (!syllabus || !syllabus.subjects) return;
        
        container.innerHTML = `
            <div class="syllabus-card">
                <div class="syllabus-header">
                    <h2><i class="fas fa-book"></i> Your Syllabus</h2>
                    <button class="btn btn-sm btn-secondary" onclick="SyllabusScheduler.toggleSyllabusDetails()">
                        <i class="fas fa-eye"></i> <span id="toggle-text">Show Details</span>
                    </button>
                </div>
                <div class="syllabus-summary">
                    <div class="summary-stat">
                        <strong>${syllabus.subjects.length}</strong>
                        <span>Subjects</span>
                    </div>
                    <div class="summary-stat">
                        <strong>${Object.values(syllabus.chapters || {}).flat().length}</strong>
                        <span>Chapters</span>
                    </div>
                    <div class="summary-stat">
                        <strong>${new Date(syllabus.examDate).toLocaleDateString()}</strong>
                        <span>Exam Date</span>
                    </div>
                    <div class="summary-stat">
                        <strong>${syllabus.priority || 'N/A'}</strong>
                        <span>Priority</span>
                    </div>
                </div>
                <div id="syllabus-details" class="syllabus-details" style="display: none;">
                    ${syllabus.subjects.map((subject, idx) => {
                        const chapters = syllabus.chapters[idx] || [];
                        return `
                            <div class="subject-detail">
                                <h3><i class="fas fa-book-open"></i> ${subject}</h3>
                                <div class="chapters-list">
                                    ${chapters.map(ch => `
                                        <div class="chapter-detail ${ch.difficulty}">
                                            <span class="chapter-name">${ch.name}</span>
                                            <span class="chapter-difficulty">${ch.difficulty}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },
    
    toggleSyllabusDetails() {
        const details = document.getElementById('syllabus-details');
        const toggleText = document.getElementById('toggle-text');
        if (details.style.display === 'none') {
            details.style.display = 'block';
            toggleText.textContent = 'Hide Details';
        } else {
            details.style.display = 'none';
            toggleText.textContent = 'Show Details';
        }
    },
    
    renderProgress(user) {
        const container = document.getElementById('progress-section');
        const tasks = user.tasks || [];
        const completed = tasks.filter(t => t.status === 'completed').length;
        const total = tasks.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        const daysUntilExam = user.syllabus.examDate ? 
            Math.ceil((new Date(user.syllabus.examDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        
        container.innerHTML = `
            <div class="progress-cards">
                <div class="progress-card">
                    <div class="progress-icon"><i class="fas fa-tasks"></i></div>
                    <div class="progress-info">
                        <h3>${percentage}%</h3>
                        <p>Overall Progress</p>
                    </div>
                </div>
                <div class="progress-card">
                    <div class="progress-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="progress-info">
                        <h3>${completed}/${total}</h3>
                        <p>Tasks Completed</p>
                    </div>
                </div>
                <div class="progress-card">
                    <div class="progress-icon"><i class="fas fa-calendar-day"></i></div>
                    <div class="progress-info">
                        <h3>${daysUntilExam}</h3>
                        <p>Days Until Exam</p>
                    </div>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
        `;
    },
    
    renderCalendar(user) {
        const container = document.getElementById('calendar-view');
        const tasks = user.tasks || [];
        const today = new Date().toISOString().split('T')[0];
        
        // Group tasks by date
        const tasksByDate = {};
        tasks.forEach(task => {
            if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
            tasksByDate[task.date].push(task);
        });
        
        // Get next 7 days
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        container.innerHTML = `
            <div class="calendar-grid">
                ${dates.map(date => {
                    const dateTasks = tasksByDate[date] || [];
                    const isToday = date === today;
                    return `
                        <div class="calendar-day ${isToday ? 'today' : ''}">
                            <div class="day-header">
                                <span class="day-name">${new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                <span class="day-date">${new Date(date).getDate()}</span>
                            </div>
                            <div class="day-tasks">
                                ${dateTasks.map(task => `
                                    <div class="task-item ${task.status}" onclick="SyllabusScheduler.toggleTask(${task.id})">
                                        <i class="fas ${task.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}"></i>
                                        <span>${task.chapter}</span>
                                        <small>${task.estimatedHours}h</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    renderTaskList(user) {
        const container = document.getElementById('list-view');
        const tasks = user.tasks || [];
        const today = new Date().toISOString().split('T')[0];
        
        // Group by date
        const tasksByDate = {};
        tasks.forEach(task => {
            if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
            tasksByDate[task.date].push(task);
        });
        
        container.innerHTML = Object.keys(tasksByDate).sort().map(date => {
            const isToday = date === today;
            return `
                <div class="task-group">
                    <h3 class="task-date ${isToday ? 'today' : ''}">
                        ${isToday ? 'Today - ' : ''}${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <div class="task-list">
                        ${tasksByDate[date].map(task => `
                            <div class="task-card ${task.status}">
                                <div class="task-checkbox" onclick="SyllabusScheduler.toggleTask(${task.id})">
                                    <i class="fas ${task.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}"></i>
                                </div>
                                <div class="task-details">
                                    <h4>${task.chapter}</h4>
                                    <p>${task.subject} • ${task.type.replace('-', ' ')} • ${task.estimatedHours}h</p>
                                </div>
                                <div class="task-badge ${task.difficulty}">${task.difficulty}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    toggleTask(taskId) {
        const user = UserManager.getCurrentUser();
        const task = user.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;
            UserManager.updateCurrentUser(user);
            this.renderScheduler();
        }
    },
    
    switchView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        event.target.closest('.view-btn').classList.add('active');
        
        document.getElementById('calendar-view').style.display = view === 'calendar' ? 'block' : 'none';
        document.getElementById('list-view').style.display = view === 'list' ? 'block' : 'none';
    },
    
    setupEventListeners() {
        // Add any global event listeners here
    },
    
    attachStepListeners() {
        // Attach listeners for current step
        if (this.currentStep === 1 && this.tempData.subjects) {
            const list = document.getElementById('subjects-list');
            list.innerHTML = this.tempData.subjects.map((s, i) => `
                <div class="subject-chip">
                    ${s}
                    <i class="fas fa-times" onclick="SyllabusScheduler.removeSubject(${i})"></i>
                </div>
            `).join('');
        }
        
        if (this.currentStep === 2 && this.tempData.chapters) {
            Object.keys(this.tempData.chapters).forEach(idx => {
                const container = document.getElementById(`chapters-${idx}`);
                container.innerHTML = this.tempData.chapters[idx].map((ch, i) => `
                    <div class="chapter-chip ${ch.difficulty}">
                        ${ch.name}
                        <span class="difficulty-badge">${ch.difficulty}</span>
                        <i class="fas fa-times" onclick="SyllabusScheduler.removeChapter(${idx}, ${i})"></i>
                    </div>
                `).join('');
            });
        }
    },
    
    removeSubject(idx) {
        this.tempData.subjects.splice(idx, 1);
        if (this.tempData.chapters && this.tempData.chapters[idx]) {
            delete this.tempData.chapters[idx];
        }
        this.renderStep(1);
    },
    
    removeChapter(subjectIdx, chapterIdx) {
        this.tempData.chapters[subjectIdx].splice(chapterIdx, 1);
        this.renderStep(2);
    },
    
    resetScheduler() {
        if (confirm('Are you sure you want to reset your study plan? This cannot be undone.')) {
            const user = UserManager.getCurrentUser();
            user.syllabus = { subjects: [], chapters: {}, examDate: null, priority: null };
            user.studyPlan = {};
            user.tasks = [];
            UserManager.updateOnboarding({ syllabusSetupCompleted: false });
            UserManager.updateCurrentUser(user);
            this.tempData = {};
            this.currentStep = 1;
            this.showWizard();
        }
    },
    
    clearHistory() {
        if (!UserManager.isUserLoggedIn()) {
            alert('You must be logged in to perform this action');
            return;
        }
        
        if (confirm('This will completely clear your syllabus history and reset all onboarding progress. Continue?')) {
            if (confirm('⚠️ FINAL WARNING: All progress will be lost. Are you absolutely sure?')) {
                const userId = UserManager.getCurrentUserId();
                UserManager.resetUserOnboarding(userId);
                window.location.href = '../get-started.html';
            }
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    SyllabusScheduler.init();
});

window.SyllabusScheduler = SyllabusScheduler;
