// グローバル変数
let allData = [];
let allArchivedData = [];
let charts = {};
let deleteState = { id: null, type: null };

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadData();
});

function initializeApp() {
    // テーマ設定を読み込み
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️ ライトモード';
    }

    // 今日の日付をフォームに設定
    document.getElementById('date').valueAsDate = new Date();
}

function setupEventListeners() {
    // フォーム送信
    document.getElementById('dataForm').addEventListener('submit', handleFormSubmit);

    // タブ切り替え
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // テーマ切り替え
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // フィルター
    document.getElementById('filterBtn').addEventListener('click', applyFilters);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);

    // 一括操作
    document.getElementById('selectAllCheckbox').addEventListener('change', toggleSelectAll);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedData);
    document.getElementById('archiveSelectedBtn').addEventListener('click', archiveSelectedData);

    // アーカイブフィルター
    document.getElementById('archiveFilterBtn').addEventListener('click', applyArchiveFilters);
    document.getElementById('resetArchiveFilterBtn').addEventListener('click', resetArchiveFilters);

    // アーカイブ一括操作
    document.getElementById('selectAllArchiveCheckbox').addEventListener('change', toggleSelectAllArchive);
    document.getElementById('restoreSelectedBtn').addEventListener('click', restoreSelectedData);
    document.getElementById('deleteArchiveSelectedBtn').addEventListener('click', deleteArchiveSelectedData);

    // モーダル
    document.querySelector('.close').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
}

// フォーム送信
async function handleFormSubmit(e) {
    e.preventDefault();

    const data = {
        date: document.getElementById('date').value,
        sales: parseFloat(document.getElementById('sales').value),
        cost: parseFloat(document.getElementById('cost').value),
        category: document.getElementById('category').value || '未分類',
        memo: document.getElementById('memo').value
    };

    try {
        await db.addData(data);
        showNotification('データが保存されました', 'success');
        document.getElementById('dataForm').reset();
        document.getElementById('date').valueAsDate = new Date();
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

// データ読み込み
async function loadData() {
    try {
        allData = await db.getAllData();
        allData.sort((a, b) => new Date(b.date) - new Date(a.date));
        allArchivedData = await db.getAllArchivedData();
        allArchivedData.sort((a, b) => new Date(b.date) - new Date(a.date));

        renderDataTable(allData);
        renderArchiveTable(allArchivedData);
        updateAnalytics();
    } catch (error) {
        showNotification('データ読み込みエラー: ' + error.message, 'error');
    }
}

// テーブルをレンダリング
function renderDataTable(data) {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        document.getElementById('noDataMessage').style.display = 'block';
        document.getElementById('dataTable').style.display = 'none';
        return;
    }

    document.getElementById('noDataMessage').style.display = 'none';
    document.getElementById('dataTable').style.display = 'table';

    data.forEach(item => {
        const profit = item.sales - item.cost;
        const profitMargin = item.sales > 0 ? ((profit / item.sales) * 100).toFixed(2) : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-row-checkbox" data-id="${item.id}"></td>
            <td>${item.date}</td>
            <td>¥${item.sales.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>¥${item.cost.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>¥${profit.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${profitMargin}%</td>
            <td>${item.category}</td>
            <td>${item.memo || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-edit" onclick="editData(${item.id})">編集</button>
                    <button class="action-btn action-btn-delete" onclick="showDeleteModal(${item.id}, 'data')">削除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // チェックボックスリスナー
    document.querySelectorAll('.select-row-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateBulkActionButtons);
    });
}

// アーカイブテーブルをレンダリング
function renderArchiveTable(data) {
    const tbody = document.getElementById('archiveTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        document.getElementById('noArchiveDataMessage').style.display = 'block';
        document.getElementById('archiveTable').style.display = 'none';
        return;
    }

    document.getElementById('noArchiveDataMessage').style.display = 'none';
    document.getElementById('archiveTable').style.display = 'table';

    data.forEach(item => {
        const profit = item.sales - item.cost;
        const profitMargin = item.sales > 0 ? ((profit / item.sales) * 100).toFixed(2) : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-archive-row-checkbox" data-id="${item.id}"></td>
            <td>${item.date}</td>
            <td>¥${item.sales.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>¥${item.cost.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>¥${profit.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${profitMargin}%</td>
            <td>${item.category}</td>
            <td>${item.memo || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-restore" onclick="restoreData(${item.id})">復元</button>
                    <button class="action-btn action-btn-delete" onclick="showDeleteModal(${item.id}, 'archive')">削除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // チェックボックスリスナー
    document.querySelectorAll('.select-archive-row-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateArchiveBulkActionButtons);
    });
}

// 編集
function editData(id) {
    const item = allData.find(d => d.id === id);
    if (!item) return;

    document.getElementById('editId').value = id;
    document.getElementById('editDate').value = item.date;
    document.getElementById('editSales').value = item.sales;
    document.getElementById('editCost').value = item.cost;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editMemo').value = item.memo || '';

    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    document.getElementById('editForm').reset();
}

async function handleEditSubmit(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editId').value);
    const data = {
        date: document.getElementById('editDate').value,
        sales: parseFloat(document.getElementById('editSales').value),
        cost: parseFloat(document.getElementById('editCost').value),
        category: document.getElementById('editCategory').value || '未分類',
        memo: document.getElementById('editMemo').value
    };

    try {
        await db.updateData(id, data);
        showNotification('データが更新されました', 'success');
        closeEditModal();
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

// 削除確認モーダル
function showDeleteModal(id, type) {
    deleteState = { id, type };
    const item = type === 'data' ? allData.find(d => d.id === id) : allArchivedData.find(d => d.id === id);
    const message = `${item.date} - ¥${item.sales} を削除しますか？`;
    document.getElementById('deleteMessage').textContent = message;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
}

async function confirmDelete() {
    const { id, type } = deleteState;

    try {
        if (type === 'data') {
            await db.deleteData(id);
        } else {
            await db.deleteArchivedData([id]);
        }
        showNotification('データが削除されました', 'success');
        closeDeleteModal();
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

// フィルター
function applyFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const category = document.getElementById('filterCategory').value;

    let filtered = allData;

    if (startDate) {
        filtered = filtered.filter(item => item.date >= startDate);
    }

    if (endDate) {
        filtered = filtered.filter(item => item.date <= endDate);
    }

    if (category) {
        filtered = filtered.filter(item => item.category.includes(category));
    }

    renderDataTable(filtered);
}

function resetFilters() {
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('filterCategory').value = '';
    renderDataTable(allData);
}

// アーカイブフィルター
function applyArchiveFilters() {
    const startDate = document.getElementById('archiveFilterStartDate').value;
    const endDate = document.getElementById('archiveFilterEndDate').value;

    let filtered = allArchivedData;

    if (startDate) {
        filtered = filtered.filter(item => item.date >= startDate);
    }

    if (endDate) {
        filtered = filtered.filter(item => item.date <= endDate);
    }

    renderArchiveTable(filtered);
}

function resetArchiveFilters() {
    document.getElementById('archiveFilterStartDate').value = '';
    document.getElementById('archiveFilterEndDate').value = '';
    renderArchiveTable(allArchivedData);
}

// 一括操作
function toggleSelectAll(e) {
    document.querySelectorAll('.select-row-checkbox').forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
    updateBulkActionButtons();
}

function toggleSelectAllArchive(e) {
    document.querySelectorAll('.select-archive-row-checkbox').forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
    updateArchiveBulkActionButtons();
}

function updateBulkActionButtons() {
    const selectedIds = Array.from(document.querySelectorAll('.select-row-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    document.getElementById('deleteSelectedBtn').disabled = selectedIds.length === 0;
    document.getElementById('archiveSelectedBtn').disabled = selectedIds.length === 0;
}

function updateArchiveBulkActionButtons() {
    const selectedIds = Array.from(document.querySelectorAll('.select-archive-row-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    document.getElementById('restoreSelectedBtn').disabled = selectedIds.length === 0;
    document.getElementById('deleteArchiveSelectedBtn').disabled = selectedIds.length === 0;
}

async function deleteSelectedData() {
    const selectedIds = Array.from(document.querySelectorAll('.select-row-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    if (selectedIds.length === 0) return;

    if (!confirm(`${selectedIds.length}件のデータを削除しますか？`)) return;

    try {
        await db.deleteMultipleData(selectedIds);
        showNotification('データが削除されました', 'success');
        document.getElementById('selectAllCheckbox').checked = false;
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

async function archiveSelectedData() {
    const selectedIds = Array.from(document.querySelectorAll('.select-row-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    if (selectedIds.length === 0) return;

    try {
        await db.archiveData(selectedIds);
        showNotification('データがアーカイブされました', 'success');
        document.getElementById('selectAllCheckbox').checked = false;
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

async function restoreData(id) {
    try {
        await db.restoreData([id]);
        showNotification('データが復元されました', 'success');
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

async function restoreSelectedData() {
    const selectedIds = Array.from(document.querySelectorAll('.select-archive-row-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    if (selectedIds.length === 0) return;

    try {
        await db.restoreData(selectedIds);
        showNotification('データが復元されました', 'success');
        document.getElementById('selectAllArchiveCheckbox').checked = false;
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

async function deleteArchiveSelectedData() {
    const selectedIds = Array.from(document.querySelectorAll('.select-archive-row-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    if (selectedIds.length === 0) return;

    if (!confirm(`${selectedIds.length}件のアーカイブデータを削除しますか？`)) return;

    try {
        await db.deleteArchivedData(selectedIds);
        showNotification('データが削除されました', 'success');
        document.getElementById('selectAllArchiveCheckbox').checked = false;
        loadData();
    } catch (error) {
        showNotification('エラーが発生しました: ' + error.message, 'error');
    }
}

// タブ切り替え
function switchTab(tabName) {
    // タブボタン
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // タブコンテンツ
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // タブ別の処理
    if (tabName === 'analytics') {
        setTimeout(() => {
            updateAnalytics();
        }, 100);
    } else if (tabName === 'archive') {
        // アーカイブタブの場合、アーカイブテーブルを再レンダリング
        setTimeout(() => {
            renderArchiveTable(allArchivedData);
        }, 100);
    } else if (tabName === 'data') {
        // データタブの場合、データテーブルを再レンダリング
        setTimeout(() => {
            renderDataTable(allData);
        }, 100);
    }
}

// 分析・レポート
function updateAnalytics() {
    const data = allData;

    if (data.length === 0) {
        // サマリーをリセット
        document.getElementById('totalSales').textContent = '¥0';
        document.getElementById('totalCost').textContent = '¥0';
        document.getElementById('totalProfit').textContent = '¥0';
        document.getElementById('avgProfitMargin').textContent = '0%';
        document.getElementById('dataCount').textContent = '0';
        document.getElementById('avgSalesPerDay').textContent = '¥0';
        document.getElementById('maxSales').textContent = '¥0';
        document.getElementById('minSales').textContent = '¥0';

        // グラフをクリア
        if (charts.monthly) charts.monthly.destroy();
        if (charts.category) charts.category.destroy();
        return;
    }

    // 計算
    const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
    const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
    const totalProfit = totalSales - totalCost;
    const avgProfitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0;

    // サマリー表示
    document.getElementById('totalSales').textContent = `¥${totalSales.toLocaleString('ja-JP')}`;
    document.getElementById('totalCost').textContent = `¥${totalCost.toLocaleString('ja-JP')}`;
    document.getElementById('totalProfit').textContent = `¥${totalProfit.toLocaleString('ja-JP')}`;
    document.getElementById('avgProfitMargin').textContent = `${avgProfitMargin.toFixed(2)}%`;
    document.getElementById('dataCount').textContent = data.length;

    if (data.length > 0) {
        const avgSalesPerDay = totalSales / data.length;
        const salesAmounts = data.map(item => item.sales);
        const maxSales = Math.max(...salesAmounts);
        const minSales = Math.min(...salesAmounts);

        document.getElementById('avgSalesPerDay').textContent = `¥${avgSalesPerDay.toLocaleString('ja-JP')}`;
        document.getElementById('maxSales').textContent = `¥${maxSales.toLocaleString('ja-JP')}`;
        document.getElementById('minSales').textContent = `¥${minSales.toLocaleString('ja-JP')}`;
    }
}

// テーマ切り替え
function toggleTheme() {
    const body = document.body;
    const themeToggleBtn = document.getElementById('themeToggle');

    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        themeToggleBtn.textContent = '☀️ ライトモード';
        localStorage.setItem('darkMode', 'true');
    } else {
        themeToggleBtn.textContent = '🌙 ダークモード';
        localStorage.setItem('darkMode', 'false');
    }
}

// 通知表示
function showNotification(message, type = 'info') {
    // 既存の通知があれば削除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 通知要素を作成
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // スタイルを設定
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '4px',
        color: 'white',
        fontWeight: 'bold',
        zIndex: '10000',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out'
    });

    // タイプ別の背景色
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // DOMに追加
    document.body.appendChild(notification);

    // アニメーション表示
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // 3秒後に自動削除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}
