// IndexedDB を使用したデータベース管理（ローカルストレージ推奨）
class SalesDB {
    constructor() {
        this.dbName = 'SalesDB';
        this.storeName = 'sales';
        this.archiveStoreName = 'archived_sales';
        this.initDB();
    }

    initDB() {
        // IndexedDB がサポートされている場合は使用
        if ('indexedDB' in window) {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.useLocalStorage = true;
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.useLocalStorage = false;
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // アクティブなデータストア
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('category', 'category', { unique: false });
                }

                // アーカイブデータストア
                if (!db.objectStoreNames.contains(this.archiveStoreName)) {
                    const archiveStore = db.createObjectStore(this.archiveStoreName, { keyPath: 'id', autoIncrement: true });
                    archiveStore.createIndex('date', 'date', { unique: false });
                    archiveStore.createIndex('category', 'category', { unique: false });
                }
            };
        } else {
            this.useLocalStorage = true;
            this.loadFromLocalStorage();
        }
    }

    // ローカルストレージから読み込み
    loadFromLocalStorage() {
        this.localData = JSON.parse(localStorage.getItem('salesData')) || [];
        this.localArchive = JSON.parse(localStorage.getItem('archiveData')) || [];
    }

    // ローカルストレージに保存
    saveToLocalStorage() {
        localStorage.setItem('salesData', JSON.stringify(this.localData));
        localStorage.setItem('archiveData', JSON.stringify(this.localArchive));
    }

    // データを追加
    addData(data) {
        return new Promise((resolve, reject) => {
            if (this.useLocalStorage) {
                data.id = Date.now();
                this.localData.push(data);
                this.saveToLocalStorage();
                resolve(data);
            } else {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.add(data);

                request.onsuccess = () => {
                    data.id = request.result;
                    resolve(data);
                };
                request.onerror = () => reject(request.error);
            }
        });
    }

    // すべてのデータを取得
    getAllData() {
        return new Promise((resolve, reject) => {
            if (this.useLocalStorage) {
                resolve([...this.localData]);
            } else {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            }
        });
    }

    // データを更新
    updateData(id, data) {
        return new Promise((resolve, reject) => {
            if (this.useLocalStorage) {
                const index = this.localData.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.localData[index] = { ...this.localData[index], ...data, id };
                    this.saveToLocalStorage();
                    resolve(this.localData[index]);
                } else {
                    reject(new Error('Data not found'));
                }
            } else {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                data.id = id;
                const request = store.put(data);

                request.onsuccess = () => resolve(data);
                request.onerror = () => reject(request.error);
            }
        });
    }

    // データを削除
    deleteData(id) {
        return new Promise((resolve, reject) => {
            if (this.useLocalStorage) {
                this.localData = this.localData.filter(item => item.id !== id);
                this.saveToLocalStorage();
                resolve();
            } else {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }
        });
    }

    // 複数のデータを削除
    deleteMultipleData(ids) {
        return new Promise((resolve, reject) => {
            if (this.useLocalStorage) {
                this.localData = this.localData.filter(item => !ids.includes(item.id));
                this.saveToLocalStorage();
                resolve();
            } else {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                let completed = 0;

                ids.forEach(id => {
                    const request = store.delete(id);
                    request.onsuccess = () => {
                        completed++;
                        if (completed === ids.length) resolve();
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        });
    }

    // アーカイブにデータを移動
    archiveData(ids) {
        return new Promise(async (resolve, reject) => {
            try {
                const allData = await this.getAllData();
                const dataToArchive = allData.filter(item => ids.includes(item.id));

                if (this.useLocalStorage) {
                    this.localArchive.push(...dataToArchive);
                    this.localData = this.localData.filter(item => !ids.includes(item.id));
                    this.saveToLocalStorage();
                    resolve();
                } else {
                    const transaction = this.db.transaction([this.archiveStoreName, this.storeName], 'readwrite');
                    const archiveStore = transaction.objectStore(this.archiveStoreName);
                    const mainStore = transaction.objectStore(this.storeName);

                    dataToArchive.forEach(item => {
                        archiveStore.add(item);
                    });

                    ids.forEach(id => {
                        mainStore.delete(id);
                    });

                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject(transaction.error);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // アーカイブされたすべてのデータを取得
    getAllArchivedData() {
        return new Promise((resolve, reject) => {
            if (this.useLocalStorage) {
                resolve([...this.localArchive]);
            } else {
                const transaction = this.db.transaction([this.archiveStoreName], 'readonly');
                const store = transaction.objectStore(this.archiveStoreName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            }
        });
    }

    // アーカイブからデータを復元
    restoreData(ids) {
        return new Promise(async (resolve, reject) => {
            try {
                const allArchived = await this.getAllArchivedData();
                const dataToRestore = allArchived.filter(item => ids.includes(item.id));

                if (this.useLocalStorage) {
                    this.localData.push(...dataToRestore);
                    this.localArchive = this.localArchive.filter(item => !ids.includes(item.id));
                    this.saveToLocalStorage();
                    resolve();
                } else {
                    const transaction = this.db.transaction([this.storeName, this.archiveStoreName], 'readwrite');
                    const mainStore = transaction.objectStore(this.storeName);
                    const archiveStore = transaction.objectStore(this.archiveStoreName);

                    dataToRestore.forEach(item => {
                        mainStore.add(item);
                    });

                    ids.forEach(id => {
                        archiveStore.delete(id);
                    });

                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject(transaction.error);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // アーカイブからデータを削除
    deleteArchivedData(ids) {
        return new Promise((resolve, reject) => {
            if (this.useLocalStorage) {
                this.localArchive = this.localArchive.filter(item => !ids.includes(item.id));
                this.saveToLocalStorage();
                resolve();
            } else {
                const transaction = this.db.transaction([this.archiveStoreName], 'readwrite');
                const store = transaction.objectStore(this.archiveStoreName);
                let completed = 0;

                ids.forEach(id => {
                    const request = store.delete(id);
                    request.onsuccess = () => {
                        completed++;
                        if (completed === ids.length) resolve();
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        });
    }
}

const db = new SalesDB();