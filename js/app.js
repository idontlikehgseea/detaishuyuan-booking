/**
 * 德泰书院预约系统 - 前端应用
 * 使用 localStorage 存储数据，适合静态部署
 */

// ==================== 配置 ====================
const CONFIG = {
    // 开放时间设置
    OPEN_DAYS: [1, 2, 3, 4, 5], // 周一到周五
    OPEN_TIME: '17:00-21:00',
    START_DATE: '2026-05-06',

    // 管理员密码（实际生产环境应使用后端验证）
    ADMIN_PASSWORD: 'admin123',

    // 每天最大预约数
    MAX_BOOKINGS_PER_DAY: 20,

    // 法定节假日（2026年示例）
    HOLIDAYS: [
        '2026-01-01', // 元旦
        '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23', // 春节
        '2026-04-04', '2026-04-05', '2026-04-06', // 清明
        '2026-05-01', '2026-05-02', '2026-05-03', // 劳动节
        '2026-06-19', '2026-06-20', '2026-06-21', // 端午
        '2026-09-25', '2026-09-26', '2026-09-27', // 中秋
        '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', // 国庆
    ]
};

// ==================== 状态管理 ====================
const state = {
    currentStep: 1,
    selectedDate: null,
    selectedType: null,
    bookingData: {},
    currentMonth: new Date(2026, 4, 1), // 2026年5月
    isAdmin: false,
    bookings: [],
    editingId: null
};

// ==================== 工具函数 ====================
const utils = {
    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 格式化日期
    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    // 格式化显示日期
    formatDisplayDate(dateStr) {
        const d = new Date(dateStr);
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
    },

    // 检查是否是周末
    isWeekend(dateStr) {
        const d = new Date(dateStr);
        const day = d.getDay();
        return day === 0 || day === 6;
    },

    // 检查是否是节假日
    isHoliday(dateStr) {
        return CONFIG.HOLIDAYS.includes(dateStr);
    },

    // 检查是否可预约
    isBookable(dateStr) {
        const d = new Date(dateStr);
        const day = d.getDay();

        // 检查是否在开放日
        if (!CONFIG.OPEN_DAYS.includes(day)) return false;

        // 检查是否是节假日
        if (CONFIG.HOLIDAYS.includes(dateStr)) return false;

        // 检查是否早于开始日期
        if (new Date(dateStr) < new Date(CONFIG.START_DATE)) return false;

        return true;
    },

    // 获取某天的预约数
    getBookingCount(dateStr) {
        const bookings = storage.getBookings();
        return bookings.filter(b => b.date === dateStr && b.status !== 'cancelled').length;
    },

    // 检查某天是否已满
    isFull(dateStr) {
        return utils.getBookingCount(dateStr) >= CONFIG.MAX_BOOKINGS_PER_DAY;
    },

    // 生成核销码
    generateCheckinCode(bookingId) {
        return 'DT' + bookingId.slice(-6).toUpperCase();
    }
};

// ==================== 存储管理 ====================
const storage = {
    // 获取预约列表
    getBookings() {
        try {
            return JSON.parse(localStorage.getItem('dt_bookings') || '[]');
        } catch {
            return [];
        }
    },

    // 保存预约
    saveBooking(booking) {
        const bookings = this.getBookings();
        bookings.push(booking);
        localStorage.setItem('dt_bookings', JSON.stringify(bookings));
        return booking;
    },

    // 更新预约
    updateBooking(id, updates) {
        const bookings = this.getBookings();
        const index = bookings.findIndex(b => b.id === id);
        if (index !== -1) {
            bookings[index] = { ...bookings[index], ...updates };
            localStorage.setItem('dt_bookings', JSON.stringify(bookings));
            return bookings[index];
        }
        return null;
    },

    // 删除预约
    deleteBooking(id) {
        const bookings = this.getBookings();
        const filtered = bookings.filter(b => b.id !== id);
        localStorage.setItem('dt_bookings', JSON.stringify(filtered));
    },

    // 通过核销码查找预约
    findByCheckinCode(code) {
        const bookings = this.getBookings();
        return bookings.find(b => b.checkinCode === code && b.status !== 'cancelled');
    }
};

// ==================== UI 组件 ====================
const ui = {
    // 显示 Toast
    toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `${icons[type] || 'ℹ️'} <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // 显示弹窗
    showModal(title, content, onConfirm, onCancel) {
        const overlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const btnConfirm = document.getElementById('modalConfirm');
        const btnCancel = document.getElementById('modalCancel');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        overlay.classList.remove('hidden');

        const handleConfirm = () => {
            overlay.classList.add('hidden');
            if (onConfirm) onConfirm();
            cleanup();
        };

        const handleCancel = () => {
            overlay.classList.add('hidden');
            if (onCancel) onCancel();
            cleanup();
        };

        const cleanup = () => {
            btnConfirm.removeEventListener('click', handleConfirm);
            btnCancel.removeEventListener('click', handleCancel);
            document.getElementById('modalClose').removeEventListener('click', handleCancel);
        };

        btnConfirm.addEventListener('click', handleConfirm);
        btnCancel.addEventListener('click', handleCancel);
        document.getElementById('modalClose').addEventListener('click', handleCancel);
    },

    // 显示预约详情
    showBookingDetail(booking) {
        const overlay = document.getElementById('detailModal');
        const detailBody = document.getElementById('detailBody');

        const typeMap = { activity: '活动预约', study: '自习预约' };
        const statusMap = { pending: '待核销', checked: '已核销', cancelled: '已取消' };

        detailBody.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">预约编号</div>
                    <div class="detail-value">${booking.id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">核销码</div>
                    <div class="detail-value" style="font-family: monospace; font-size: 1.1rem;">${booking.checkinCode}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">预约日期</div>
                    <div class="detail-value">${utils.formatDisplayDate(booking.date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">预约类型</div>
                    <div class="detail-value">${typeMap[booking.type] || booking.type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">姓名</div>
                    <div class="detail-value">${booking.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">学号</div>
                    <div class="detail-value">${booking.studentId}</div>
                </div>
                ${booking.type === 'activity' ? `
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">活动内容</div>
                    <div class="detail-value">${booking.activityContent || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">承办部门</div>
                    <div class="detail-value">${booking.department || '-'}</div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <div class="detail-label">联系电话</div>
                    <div class="detail-value">${booking.phone || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">邮箱</div>
                    <div class="detail-value">${booking.email || '-'}</div>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">备注</div>
                    <div class="detail-value">${booking.notes || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">状态</div>
                    <div class="detail-value"><span class="status-badge status-${booking.status}">${statusMap[booking.status]}</span></div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">预约时间</div>
                    <div class="detail-value">${new Date(booking.createdAt).toLocaleString()}</div>
                </div>
            </div>
        `;

        overlay.classList.remove('hidden');

        // 删除按钮
        document.getElementById('btnDelete').onclick = () => {
            ui.showModal('确认删除', '确定要删除这条预约吗？此操作不可恢复。', () => {
                storage.deleteBooking(booking.id);
                ui.toast('预约已删除', 'success');
                overlay.classList.add('hidden');
                admin.refreshBookings();
            });
        };

        // 关闭按钮
        const closeDetail = () => overlay.classList.add('hidden');
        document.getElementById('detailClose').onclick = closeDetail;
        document.getElementById('detailCloseBtn').onclick = closeDetail;
    }
};

// ==================== 日历组件 ====================
const calendar = {
    init() {
        this.render();

        document.getElementById('prevMonth').addEventListener('click', () => {
            state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
            this.render();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
            this.render();
        });
    },

    render() {
        const year = state.currentMonth.getFullYear();
        const month = state.currentMonth.getMonth();

        document.getElementById('calendarTitle').textContent = `${year}年${month + 1}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const container = document.getElementById('calendarDays');
        container.innerHTML = '';

        // 填充前面的空白
        for (let i = 0; i < startPadding; i++) {
            const empty = document.createElement('div');
            container.appendChild(empty);
        }

        // 生成日期
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = utils.formatDate(new Date(year, month, day));
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';

            const isBookable = utils.isBookable(dateStr);
            const isFull = utils.isFull(dateStr);
            const isSelected = state.selectedDate === dateStr;
            const isToday = dateStr === utils.formatDate(new Date());

            if (!isBookable) {
                if (utils.isWeekend(dateStr)) {
                    dayEl.classList.add('weekend');
                } else if (utils.isHoliday(dateStr)) {
                    dayEl.classList.add('holiday');
                } else {
                    dayEl.classList.add('disabled');
                }
            } else if (isFull) {
                dayEl.classList.add('full');
            }

            if (isSelected) {
                dayEl.classList.add('selected');
            }

            let statusText = '';
            if (!isBookable) {
                if (utils.isWeekend(dateStr)) statusText = '周末';
                else if (utils.isHoliday(dateStr)) statusText = '假日';
                else statusText = '不可';
            } else if (isFull) {
                statusText = '已满';
            } else {
                const count = utils.getBookingCount(dateStr);
                statusText = count > 0 ? `${count}人` : '可约';
            }

            dayEl.innerHTML = `
                <span class="day-number">${day}</span>
                <span class="day-status">${statusText}</span>
            `;

            if (isBookable && !isFull) {
                dayEl.addEventListener('click', () => {
                    state.selectedDate = dateStr;
                    this.render();
                    booking.updateStepIndicator();
                });
            }

            container.appendChild(dayEl);
        }
    }
};

// ==================== 预约流程 ====================
const booking = {
    init() {
        // 类型选择
        document.querySelectorAll('.type-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                state.selectedType = card.dataset.type;

                // 显示/隐藏活动字段
                const activityFields = document.getElementById('activityFields');
                if (state.selectedType === 'activity') {
                    activityFields.classList.remove('hidden');
                    document.getElementById('activityContent').required = true;
                    document.getElementById('department').required = true;
                } else {
                    activityFields.classList.add('hidden');
                    document.getElementById('activityContent').required = false;
                    document.getElementById('department').required = false;
                }
            });
        });

        // 按钮事件
        document.getElementById('btnNext').addEventListener('click', () => this.nextStep());
        document.getElementById('btnPrev').addEventListener('click', () => this.prevStep());
    },

    updateStepIndicator() {
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < state.currentStep) {
                step.classList.add('completed');
            } else if (index + 1 === state.currentStep) {
                step.classList.add('active');
            }
        });
    },

    validateStep(step) {
        switch(step) {
            case 1:
                if (!state.selectedDate) {
                    ui.toast('请先选择预约日期', 'warning');
                    return false;
                }
                return true;
            case 2:
                if (!state.selectedType) {
                    ui.toast('请先选择预约类型', 'warning');
                    return false;
                }
                return true;
            case 3:
                const form = document.getElementById('bookingForm');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return false;
                }
                // 保存表单数据
                const formData = new FormData(form);
                state.bookingData = {
                    name: formData.get('name'),
                    studentId: formData.get('studentId'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    notes: formData.get('notes'),
                    activityContent: formData.get('activityContent'),
                    department: formData.get('department')
                };
                return true;
            case 4:
                return true;
            default:
                return false;
        }
    },

    updateConfirmPage() {
        document.getElementById('confirmDate').textContent = utils.formatDisplayDate(state.selectedDate);
        document.getElementById('confirmType').textContent = state.selectedType === 'activity' ? '活动预约' : '自习预约';
        document.getElementById('confirmName').textContent = state.bookingData.name;
        document.getElementById('confirmStudentId').textContent = state.bookingData.studentId;

        const activityItems = document.querySelectorAll('.activity-only');
        if (state.selectedType === 'activity') {
            activityItems.forEach(el => el.classList.remove('hidden'));
            document.getElementById('confirmActivity').textContent = state.bookingData.activityContent;
            document.getElementById('confirmDepartment').textContent = state.bookingData.department;
        } else {
            activityItems.forEach(el => el.classList.add('hidden'));
        }
    },

    generateQR(bookingId) {
        const checkinCode = utils.generateCheckinCode(bookingId);
        const qrContainer = document.getElementById('bookingQR');

        // 使用简单的 SVG 二维码表示（实际项目可使用 qrcode.js 库）
        qrContainer.innerHTML = `
            <div style="text-align: center;">
                <div style="font-family: monospace; font-size: 0.7rem; background: white; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; width: 120px; margin: 0 auto;">
                        ${Array(49).fill(0).map(() => 
                            `<div style="width: 14px; height: 14px; background: ${Math.random() > 0.5 ? '#8B4513' : 'white'}; border-radius: 1px;"></div>`
                        ).join('')}
                    </div>
                </div>
                <p style="font-weight: bold; color: var(--primary); font-size: 1rem;">${checkinCode}</p>
                <p style="font-size: 0.75rem; color: var(--text-light);">请保存此二维码</p>
            </div>
        `;
    },

    nextStep() {
        if (!this.validateStep(state.currentStep)) return;

        if (state.currentStep === 3) {
            this.updateConfirmPage();
        }

        if (state.currentStep === 4) {
            // 提交预约
            this.submitBooking();
            return;
        }

        // 切换步骤
        document.getElementById(`step${state.currentStep}`).classList.remove('active');
        state.currentStep++;
        document.getElementById(`step${state.currentStep}`).classList.add('active');

        this.updateStepIndicator();

        // 更新按钮
        document.getElementById('btnPrev').style.display = 'inline-block';
        if (state.currentStep === 4) {
            document.getElementById('btnNext').textContent = '确认提交';
        }
    },

    prevStep() {
        document.getElementById(`step${state.currentStep}`).classList.remove('active');
        state.currentStep--;
        document.getElementById(`step${state.currentStep}`).classList.add('active');

        this.updateStepIndicator();

        if (state.currentStep === 1) {
            document.getElementById('btnPrev').style.display = 'none';
        }
        document.getElementById('btnNext').textContent = '下一步';
    },

    submitBooking() {
        const bookingId = utils.generateId();
        const checkinCode = utils.generateCheckinCode(bookingId);

        const booking = {
            id: bookingId,
            date: state.selectedDate,
            type: state.selectedType,
            ...state.bookingData,
            status: 'pending',
            checkinCode: checkinCode,
            createdAt: new Date().toISOString()
        };

        storage.saveBooking(booking);

        // 生成二维码
        this.generateQR(bookingId);

        ui.toast('预约成功！请保存二维码', 'success');

        // 重置按钮
        document.getElementById('btnNext').textContent = '完成';
        document.getElementById('btnNext').onclick = () => {
            location.reload();
        };
    }
};

// ==================== 管理后台 ====================
const admin = {
    init() {
        // 登录
        document.getElementById('btnLogin').addEventListener('click', () => {
            const password = document.getElementById('adminPassword').value;
            if (password === CONFIG.ADMIN_PASSWORD) {
                state.isAdmin = true;
                document.getElementById('adminLogin').classList.add('hidden');
                document.getElementById('adminPanel').classList.remove('hidden');
                this.refreshBookings();
                ui.toast('登录成功', 'success');
            } else {
                ui.toast('密码错误', 'error');
            }
        });

        // 刷新
        document.getElementById('btnRefresh').addEventListener('click', () => {
            this.refreshBookings();
            ui.toast('数据已刷新', 'success');
        });

        // 核销
        document.getElementById('btnCheckin').addEventListener('click', () => this.handleCheckin());
        document.getElementById('checkinCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCheckin();
        });

        // 筛选
        document.getElementById('filterDate').addEventListener('change', () => this.refreshBookings());
        document.getElementById('filterType').addEventListener('change', () => this.refreshBookings());
        document.getElementById('filterSearch').addEventListener('input', () => this.refreshBookings());
    },

    refreshBookings() {
        let bookings = storage.getBookings();

        // 筛选
        const filterDate = document.getElementById('filterDate').value;
        const filterType = document.getElementById('filterType').value;
        const filterSearch = document.getElementById('filterSearch').value.toLowerCase();

        if (filterDate) {
            bookings = bookings.filter(b => b.date === filterDate);
        }
        if (filterType) {
            bookings = bookings.filter(b => b.type === filterType);
        }
        if (filterSearch) {
            bookings = bookings.filter(b => 
                b.name.toLowerCase().includes(filterSearch) || 
                b.studentId.toLowerCase().includes(filterSearch)
            );
        }

        // 更新统计
        const allBookings = storage.getBookings();
        const today = utils.formatDate(new Date());
        document.getElementById('totalBookings').textContent = allBookings.length;
        document.getElementById('todayBookings').textContent = allBookings.filter(b => b.date === today).length;
        document.getElementById('pendingCheckin').textContent = allBookings.filter(b => b.status === 'pending').length;

        // 渲染表格
        const tbody = document.getElementById('bookingsTableBody');
        tbody.innerHTML = '';

        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-light);">暂无预约记录</td></tr>';
            return;
        }

        // 按日期倒序
        bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const typeMap = { activity: '活动', study: '自习' };
        const statusMap = { pending: '待核销', checked: '已核销', cancelled: '已取消' };
        const statusClass = { pending: 'status-pending', checked: 'status-checked', cancelled: 'status-cancelled' };

        bookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${b.date}</td>
                <td>${typeMap[b.type] || b.type}</td>
                <td>${b.name}</td>
                <td>${b.studentId}</td>
                <td><span class="status-badge ${statusClass[b.status]}">${statusMap[b.status]}</span></td>
                <td>
                    <button class="btn-view" data-id="${b.id}">查看</button>
                    <button class="btn-delete" data-id="${b.id}">删除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // 绑定按钮事件
        tbody.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => {
                const booking = bookings.find(b => b.id === btn.dataset.id);
                if (booking) ui.showBookingDetail(booking);
            });
        });

        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const booking = bookings.find(b => b.id === btn.dataset.id);
                if (booking) {
                    ui.showModal('确认删除', `确定要删除 ${booking.name} 的预约吗？`, () => {
                        storage.deleteBooking(booking.id);
                        ui.toast('预约已删除', 'success');
                        this.refreshBookings();
                    });
                }
            });
        });
    },

    handleCheckin() {
        const code = document.getElementById('checkinCode').value.trim().toUpperCase();
        const resultDiv = document.getElementById('checkinResult');

        if (!code) {
            ui.toast('请输入核销码', 'warning');
            return;
        }

        const booking = storage.findByCheckinCode(code);

        if (!booking) {
            resultDiv.className = 'checkin-result error';
            resultDiv.innerHTML = '<strong>❌ 核销失败</strong><br>未找到该预约，请检查核销码是否正确。';
            ui.toast('未找到预约', 'error');
            return;
        }

        if (booking.status === 'checked') {
            resultDiv.className = 'checkin-result error';
            resultDiv.innerHTML = '<strong>⚠️ 已核销</strong><br>该预约已于 ' + new Date(booking.checkedAt).toLocaleString() + ' 核销。';
            ui.toast('该预约已核销', 'warning');
            return;
        }

        if (booking.status === 'cancelled') {
            resultDiv.className = 'checkin-result error';
            resultDiv.innerHTML = '<strong>❌ 已取消</strong><br>该预约已被取消，无法核销。';
            ui.toast('预约已取消', 'error');
            return;
        }

        // 核销成功
        storage.updateBooking(booking.id, { 
            status: 'checked', 
            checkedAt: new Date().toISOString() 
        });

        resultDiv.className = 'checkin-result success';
        resultDiv.innerHTML = `
            <strong>✅ 核销成功</strong><br>
            姓名：${booking.name}<br>
            学号：${booking.studentId}<br>
            日期：${booking.date}<br>
            类型：${booking.type === 'activity' ? '活动' : '自习'}
        `;

        ui.toast('核销成功！', 'success');
        document.getElementById('checkinCode').value = '';
        this.refreshBookings();
    }
};

// ==================== 导航 ====================
const navigation = {
    init() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.showPage(target);

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    },

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');

        // 如果是管理页面且已登录，刷新数据
        if (pageId === 'admin' && state.isAdmin) {
            admin.refreshBookings();
        }
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    calendar.init();
    booking.init();
    admin.init();
    navigation.init();

    // 添加一些示例数据（首次访问时）
    if (!localStorage.getItem('dt_initialized')) {
        const sampleBookings = [
            {
                id: utils.generateId(),
                date: '2026-05-07',
                type: 'study',
                name: '张三',
                studentId: '202301001',
                phone: '13800138001',
                email: 'zhangsan@example.com',
                status: 'pending',
                checkinCode: 'DTABC123',
                createdAt: new Date('2026-05-01').toISOString()
            },
            {
                id: utils.generateId(),
                date: '2026-05-08',
                type: 'activity',
                name: '李四',
                studentId: '202301002',
                phone: '13800138002',
                activityContent: '读书分享会：经典文学导读',
                department: '文学社',
                status: 'checked',
                checkinCode: 'DTDEF456',
                createdAt: new Date('2026-05-02').toISOString(),
                checkedAt: new Date('2026-05-08').toISOString()
            }
        ];
        localStorage.setItem('dt_bookings', JSON.stringify(sampleBookings));
        localStorage.setItem('dt_initialized', 'true');
    }

    console.log('德泰书院预约系统已加载');
});
