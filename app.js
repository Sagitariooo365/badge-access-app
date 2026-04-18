// Classes et Données
class Badge {
    constructor(firstName, lastName, hireDate, employeeId, accessLevel) {
        this.id = Date.now();
        this.firstName = firstName;
        this.lastName = lastName;
        this.hireDate = hireDate;
        this.employeeId = employeeId;
        this.accessLevel = accessLevel;
        this.createdAt = new Date().toISOString();
    }

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    getQRData() {
        return JSON.stringify({
            id: this.id,
            name: this.getFullName(),
            employeeId: this.employeeId,
            accessLevel: this.accessLevel,
            hireDate: this.hireDate
        });
    }
}

class BadgeManager {
    constructor() {
        this.badges = [];
        this.loadFromLocalStorage();
    }

    addBadge(badge) {
        this.badges.push(badge);
        this.saveToLocalStorage();
    }

    removeBadge(badgeId) {
        this.badges = this.badges.filter(b => b.id !== badgeId);
        this.saveToLocalStorage();
    }

    updateBadge(badgeId, updates) {
        const badge = this.badges.find(b => b.id === badgeId);
        if (badge) {
            Object.assign(badge, updates);
            this.saveToLocalStorage();
        }
    }

    getBadge(badgeId) {
        return this.badges.find(b => b.id === badgeId);
    }

    getAllBadges() {
        return [...this.badges];
    }

    saveToLocalStorage() {
        localStorage.setItem('badges', JSON.stringify(this.badges));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('badges');
        this.badges = stored ? JSON.parse(stored) : [];
    }

    exportToJSON() {
        return JSON.stringify(this.badges, null, 2);
    }

    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data)) {
                this.badges = data;
                this.saveToLocalStorage();
                return true;
            }
        } catch (e) {
            console.error('Erreur lors de l'importation:', e);
        }
        return false;
    }
}

// Instances globales
const badgeManager = new BadgeManager();
let filteredBadges = [];

// DOM Elements
const badgeForm = document.getElementById('badgeForm');
const badgesList = document.getElementById('badgesList');
const searchInput = document.getElementById('searchInput');
const filterLevel = document.getElementById('filterLevel');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// Événements
document.addEventListener('DOMContentLoaded', () => {
    renderBadges();
    setupEventListeners();
});

function setupEventListeners() {
    badgeForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
    filterLevel.addEventListener('change', handleFilter);
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleImport);
}

// Gestion du formulaire
function handleFormSubmit(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const hireDate = document.getElementById('hireDate').value;
    const employeeId = document.getElementById('employeeId').value.trim();
    const accessLevel = document.getElementById('accessLevel').value;

    if (!firstName || !lastName || !hireDate || !employeeId || !accessLevel) {
        alert('Veuillez remplir tous les champs!');
        return;
    }

    // Vérifier les doublons
    if (badgeManager.badges.some(b => b.employeeId === employeeId)) {
        alert('Cet ID d'employé existe déjà!');
        return;
    }

    const badge = new Badge(firstName, lastName, hireDate, employeeId, accessLevel);
    badgeManager.addBadge(badge);

    badgeForm.reset();
    renderBadges();
    showNotification('✅ Badge créé avec succès!', 'success');
}

// Génération QR Code simple
function generateQRCode(text) {
    // Utiliser une API publique pour générer le code QR
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodedText}`;
}

// Rendu des badges
function renderBadges() {
    const badges = filteredBadges.length > 0 ? filteredBadges : badgeManager.getAllBadges();

    if (badges.length === 0) {
        badgesList.innerHTML = '<p class="empty-state">Aucun badge créé. Commencez par en ajouter un!</p>';
        return;
    }

    badgesList.innerHTML = badges.map(badge => `
        <div class="badge-card">
            <div class="badge-header">
                <div>
                    <div class="badge-name">${badge.firstName} ${badge.lastName}</div>
                    <div class="badge-id">ID: ${badge.employeeId}</div>
                </div>
            </div>

            <div class="badge-info">
                <div class="badge-info-item">
                    <strong>Embauche:</strong>
                    ${new Date(badge.hireDate).toLocaleDateString('fr-FR')}
                </div>
                <div class="badge-info-item">
                    <strong>Accès:</strong>
                    <span class="access-badge access-${badge.accessLevel.toLowerCase()}">
                        ${badge.accessLevel}
                    </span>
                </div>
            </div>

            <div class="badge-qr">
                <img src="${generateQRCode(badge.getQRData())}" alt="Code QR">
            </div>

            <div class="badge-actions">
                <button class="btn btn-warning btn-small" onclick="editBadge(${badge.id})">✏️ Modifier</button>
                <button class="btn btn-success btn-small" onclick="printBadge(${badge.id})">🖨️ Imprimer</button>
                <button class="btn btn-danger btn-small" onclick="deleteBadge(${badge.id})">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

// Recherche
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const allBadges = badgeManager.getAllBadges();

    filteredBadges = allBadges.filter(badge =>
        badge.firstName.toLowerCase().includes(query) ||
        badge.lastName.toLowerCase().includes(query) ||
        badge.employeeId.toLowerCase().includes(query)
    );

    renderBadges();
}

// Filtrage
function handleFilter(e) {
    const level = e.target.value;
    const allBadges = badgeManager.getAllBadges();

    if (level) {
        filteredBadges = allBadges.filter(badge => badge.accessLevel === level);
    } else {
        filteredBadges = [];
    }

    renderBadges();
}

// Supprimer un badge
function deleteBadge(badgeId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce badge?')) {
        badgeManager.removeBadge(badgeId);
        filteredBadges = [];
        renderBadges();
        showNotification('🗑️ Badge supprimé!', 'success');
    }
}

// Éditer un badge
function editBadge(badgeId) {
    const badge = badgeManager.getBadge(badgeId);
    if (!badge) return;

    document.getElementById('firstName').value = badge.firstName;
    document.getElementById('lastName').value = badge.lastName;
    document.getElementById('hireDate').value = badge.hireDate;
    document.getElementById('employeeId').value = badge.employeeId;
    document.getElementById('accessLevel').value = badge.accessLevel;

    // Ajouter un mode édition
    const submitBtn = badgeForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = '💾 Mettre à jour';
    submitBtn.onclick = (e) => {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const hireDate = document.getElementById('hireDate').value;
        const employeeId = document.getElementById('employeeId').value.trim();
        const accessLevel = document.getElementById('accessLevel').value;

        badgeManager.updateBadge(badgeId, { firstName, lastName, hireDate, employeeId, accessLevel });
        badgeForm.reset();
        submitBtn.textContent = originalText;
        submitBtn.onclick = null;
        badgeForm.dispatchEvent(new Event('submit'));
        showNotification('✅ Badge mis à jour!', 'success');
    };

    document.getElementById('firstName').focus();
}

// Imprimer un badge
function printBadge(badgeId) {
    const badge = badgeManager.getBadge(badgeId);
    if (!badge) return;

    const printWindow = window.open('', '', 'height=400,width=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Badge d'accès - ${badge.getFullName()}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .badge { 
                    border: 2px solid #2c3e50; 
                    padding: 20px; 
                    max-width: 400px;
                    text-align: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .badge h1 { margin: 0 0 10px 0; font-size: 24px; }
                .badge p { margin: 10px 0; font-size: 14px; }
                .qr { margin: 15px 0; }
                .qr img { width: 150px; }
                .footer { margin-top: 20px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="badge">
                <h1>BADGE D'ACCÈS</h1>
                <p><strong>${badge.getFullName()}</strong></p>
                <p>ID: ${badge.employeeId}</p>
                <p>Accès: ${badge.accessLevel}</p>
                <p>Depuis: ${new Date(badge.hireDate).toLocaleDateString('fr-FR')}</p>
                <div class="qr">
                    <img src="${generateQRCode(badge.getQRData())}" alt="Code QR">
                </div>
            </div>
            <div class="footer">
                <p>Imprimé le: ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Export des données
function handleExport() {
    const data = badgeManager.exportToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badges_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Données exportées!', 'success');
}

// Import des données
function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (badgeManager.importFromJSON(event.target.result)) {
            filteredBadges = [];
            renderBadges();
            showNotification('📤 Données importées avec succès!', 'success');
        } else {
            showNotification('❌ Erreur lors de l'importation!', 'error');
        }
    };
    reader.readAsText(file);
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);