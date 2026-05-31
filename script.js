// ======================= НАСТРОЙКИ GOOGLE ФОРМЫ =======================
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSccnBHI1QIxX1DviApZ5qH0x0ZE1qSkHGX38Kgk3TS7QmCPXw/formResponse';
const FIELD_NAME = 'entry.37272608';
const FIELD_TYPE = 'entry.1956650580';
const FIELD_COMPANIONS = 'entry.809521327';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyB9nX9ulgr_uBVCV78QIP7Kbx8ycvagB9a5VUNM5kWkFH2mhs8S6uQOitOmruTOY8xlQ/exec';
const COLUMN_NAME = 'Имя';
const COLUMN_ATTENDING = 'Тип ответа';
const COLUMN_COMPANIONS = 'Кто с вами?';

let isFirstLoad = true;

// Функция уведомления
function showNotification(message, isError = false) {
    const notif = document.createElement('div');
    notif.className = `notification ${isError ? 'error' : ''}`;
    notif.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 400);
    }, 3000);
}

// Отправка в Google Форму
function submitToGoogleForm(data) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.name = 'hidden_google_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = GOOGLE_FORM_ACTION;
        form.target = 'hidden_google_iframe';
        form.style.display = 'none';
        for (const [key, value] of Object.entries(data)) {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
            document.body.removeChild(form);
            document.body.removeChild(iframe);
            resolve();
        }, 1000);
    });
}

// ---------- ТАЙМЕР ----------
function updateCountdown() {
    const target = new Date(2026, 5, 20, 14, 0, 0).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    if (diff <= 0) {
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        if (daysEl) daysEl.innerText = '00';
        if (hoursEl) hoursEl.innerText = '00';
        if (minutesEl) minutesEl.innerText = '00';
        if (secondsEl) secondsEl.innerText = '00';
        return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (86400000)) / (3600000));
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    if (daysEl) daysEl.innerText = days < 10 ? '0'+days : days;
    if (hoursEl) hoursEl.innerText = hours < 10 ? '0'+hours : hours;
    if (minutesEl) minutesEl.innerText = mins < 10 ? '0'+mins : mins;
    if (secondsEl) secondsEl.innerText = secs < 10 ? '0'+secs : secs;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ---------- ЯНДЕКС КАРТА ----------
const mapLat = 56.070675;
const mapLng = 47.398042;
let yandexMap = null;

function initYandexMap() {
    const mapContainer = document.getElementById('yandexMap');
    if (!mapContainer) {
        console.warn('Контейнер карты yandexMap не найден');
        return;
    }
    if (typeof ymaps === 'undefined') {
        console.warn('Яндекс.Карты не загружены');
        return;
    }
    ymaps.ready(() => {
        yandexMap = new ymaps.Map('yandexMap', {
            center: [mapLat, mapLng],
            zoom: 16,
            controls: ['zoomControl', 'fullscreenControl']
        });
        const placemark = new ymaps.Placemark([mapLat, mapLng], {
            balloonContent: '<strong>🎉 Заимка Карины</strong><br>Кукшумская ул., 47А, д. Чиршкасы'
        }, {
            preset: 'islands#redIcon',
            iconColor: '#f39c12'
        });
        yandexMap.geoObjects.add(placemark);
        window.addEventListener('resize', () => {
            if (yandexMap) yandexMap.container.fitToViewport();
        });
    });
}

// ---------- ЗАГРУЗКА ГОСТЕЙ ----------
async function loadGuests() {
    const container = document.getElementById('guestListContainer');
    if (!container) return;
    if (isFirstLoad) {
        container.innerHTML = '<div style="color:#8b7a5e;">Загрузка списка гостей...</div>';
    }
    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const guests = await response.json();
        if (!guests || !guests.length) {
            container.innerHTML = '<div style="color:#8b7a5e; text-align: center;">✨ Пока никто не ответил, будьте первым! ✨</div>';
            isFirstLoad = false;
            return;
        }
        const confirmedGuests = guests.filter(guest => guest[COLUMN_ATTENDING] && guest[COLUMN_ATTENDING] !== 'Откажусь');
        if (confirmedGuests.length === 0) {
            container.innerHTML = '<div style="color:#8b7a5e; text-align: center;">✨ Ждём первых подтверждений! ✨</div>';
            isFirstLoad = false;
            return;
        }
        confirmedGuests.reverse();
        container.innerHTML = confirmedGuests.map(guest => {
            const name = escapeHtml(guest[COLUMN_NAME] || 'Гость');
            const companions = guest[COLUMN_COMPANIONS];
            let companionsHtml = '';
            if (companions && companions.trim() !== '') {
                companionsHtml = `<span class="guest-companions"><i class="fas fa-users"></i> ${escapeHtml(companions)}</span>`;
            }
            return `
                <div class="guest-card">
                    <i class="fas fa-heart" style="color: #e67e22; font-size: 1rem;"></i>
                    <span class="guest-name">${name}</span>
                    ${companionsHtml}
                </div>
            `;
        }).join('');
        isFirstLoad = false;
    } catch (error) {
        console.error('Ошибка загрузки гостей:', error);
        if (isFirstLoad || container.innerHTML.trim() === '') {
            container.innerHTML = '<div style="color:#e67e22;">Не удалось загрузить список. Проверьте интернет или URL скрипта.</div>';
        }
        isFirstLoad = false;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}

// ---------- ИНИЦИАЛИЗАЦИЯ ВСЕХ КОМПОНЕНТОВ ПОСЛЕ ЗАГРУЗКИ DOM ----------
document.addEventListener('DOMContentLoaded', () => {
    // --- Модальные окна и отправка формы ---
    const modal = document.getElementById('responseModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalName = document.getElementById('modalName');
    const modalExtra = document.getElementById('modalExtraField');
    const modalCompanions = document.getElementById('modalCompanions');
    const modalConfirm = document.getElementById('modalConfirmBtn');
    const modalError = document.getElementById('modalError');
    const closeModalSpan = document.querySelector('#responseModal .modal-close');
    
    const declineModal = document.getElementById('confirmDeclineModal');
    const closeDecline = document.getElementById('closeDeclineModal');
    const confirmYes = document.getElementById('confirmDeclineYes');
    const confirmNo = document.getElementById('confirmDeclineNo');
    
    let currentType = null;
    let isSending = false;
    
    function openModal(type) {
        if (!modal) return;
        currentType = type;
        if (modalName) modalName.value = '';
        if (modalCompanions) modalCompanions.value = '';
        if (modalError) modalError.innerText = '';
        if (modalExtra && modalCompanions) {
            if (type === 'solo') {
                modalTitle.innerText = '✨ Отлично! Напишите ваше имя: ✨';
                modalExtra.style.display = 'none';
            } else if (type === 'plus') {
                modalTitle.innerText = '🎉 Напишите ваше имя и компанию: 🎉';
                modalExtra.style.display = 'block';
            } else if (type === 'no') {
                modalTitle.innerText = '😢 Жаль, но спасибо за честность. Напишите ваше имя:';
                modalExtra.style.display = 'none';
            }
        }
        modal.style.display = 'flex';
    }
    
    function closeModal() {
        if (modal) modal.style.display = 'none';
    }
    
    async function sendFormAndClose() {
        if (isSending || !modalConfirm || !modalName) return;
        isSending = true;
        const name = modalName.value.trim();
        if (!name) {
            if (modalError) modalError.innerText = 'Пожалуйста, укажите ваше имя 😊';
            isSending = false;
            return;
        }
        let typeText = '', companions = '';
        if (currentType === 'solo') {
            typeText = 'Приду один(а)';
        } else if (currentType === 'plus') {
            typeText = 'Приду с гостями';
            if (modalCompanions) companions = modalCompanions.value.trim();
        } else if (currentType === 'no') {
            typeText = 'Откажусь';
        }
        const formData = {
            [FIELD_NAME]: name,
            [FIELD_TYPE]: typeText,
            [FIELD_COMPANIONS]: companions
        };
        const originalBtnText = modalConfirm.innerText;
        modalConfirm.disabled = true;
        modalConfirm.innerText = 'Отправка...';
        try {
            await submitToGoogleForm(formData);
            showNotification(`🎉 Спасибо, ${name}! Ваш ответ отправлен 🎉`);
            closeModal();
            loadGuests();
        } catch (err) {
            if (modalError) modalError.innerText = 'Ошибка при отправке. Попробуйте ещё раз.';
            modalConfirm.disabled = false;
            modalConfirm.innerText = originalBtnText;
            isSending = false;
            return;
        }
        isSending = false;
        modalConfirm.disabled = false;
        modalConfirm.innerText = originalBtnText;
    }
    
    if (closeModalSpan) closeModalSpan.onclick = closeModal;
    if (window) window.onclick = (e) => { if (e.target === modal) closeModal(); };
    
    const modalNameInput = document.getElementById('modalName');
    const modalCompanionsTextarea = document.getElementById('modalCompanions');
    function onEnterHandler(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendFormAndClose();
        }
    }
    if (modalNameInput) modalNameInput.addEventListener('keypress', onEnterHandler);
    if (modalCompanionsTextarea) modalCompanionsTextarea.addEventListener('keypress', onEnterHandler);
    if (modalConfirm) modalConfirm.onclick = () => sendFormAndClose();
    
    const declineBtn = document.getElementById('declineBtn');
    if (declineBtn) declineBtn.addEventListener('click', () => { if (declineModal) declineModal.style.display = 'flex'; });
    if (confirmYes) confirmYes.onclick = () => { if (declineModal) declineModal.style.display = 'none'; openModal('no'); };
    
    const choiceModal = document.getElementById('choiceModal');
    const closeChoiceModal = document.getElementById('closeChoiceModal');
    const choiceSolo = document.getElementById('choiceSoloBtn');
    const choicePlus = document.getElementById('choicePlusBtn');
    if (closeChoiceModal) closeChoiceModal.onclick = () => { if (choiceModal) choiceModal.style.display = 'none'; };
    if (choiceModal) choiceModal.onclick = (e) => { if (e.target === choiceModal) choiceModal.style.display = 'none'; };
    if (choiceSolo) choiceSolo.onclick = () => { if (choiceModal) choiceModal.style.display = 'none'; openModal('solo'); };
    if (choicePlus) choicePlus.onclick = () => { if (choiceModal) choiceModal.style.display = 'none'; openModal('plus'); };
    
    if (confirmNo) confirmNo.onclick = () => {
        if (declineModal) declineModal.style.display = 'none';
        if (choiceModal) choiceModal.style.display = 'flex';
    };
    if (closeDecline) closeDecline.onclick = () => { if (declineModal) declineModal.style.display = 'none'; };
    if (window) window.onclick = (e) => { if (declineModal && e.target === declineModal) declineModal.style.display = 'none'; };
    
    const soloBtn = document.getElementById('soloBtn');
    const plusBtn = document.getElementById('plusBtn');
    if (soloBtn) soloBtn.addEventListener('click', () => openModal('solo'));
    if (plusBtn) plusBtn.addEventListener('click', () => openModal('plus'));
    
    // --- Лайтбокс ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightbox = document.querySelector('.lightbox-close');
    if (lightbox && lightboxImg && closeLightbox) {
        document.querySelectorAll('.gallery-card').forEach(card => {
            const img = card.querySelector('.gallery-img');
            if (img) {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const src = img.getAttribute('src');
                    if (src) {
                        lightboxImg.src = src;
                        lightbox.classList.add('active');
                    }
                });
            }
        });
        closeLightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
            setTimeout(() => { lightboxImg.src = ''; }, 300);
        });
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                setTimeout(() => { lightboxImg.src = ''; }, 300);
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
                setTimeout(() => { lightboxImg.src = ''; }, 300);
            }
        });
    }
    
    // --- Плавная прокрутка к карте ---
    const mapSection = document.getElementById('map');
    const mapLink = document.querySelector('a[href="#map"]');
    if (mapLink && mapSection) {
        mapLink.addEventListener('click', (e) => {
            e.preventDefault();
            const rect = mapSection.getBoundingClientRect();
            const scrollTop = window.scrollY || window.pageYOffset;
            const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
            window.scrollTo({ top: targetY, behavior: 'smooth' });
        });
    }
    
    // --- Кнопки маршрута и копирования ---
    const buildRouteBtn = document.getElementById('buildRouteBtn');
    const copyAddressBtn = document.getElementById('copyAddressBtn');
    const fullAddress = "Кукшумская ул., 47А, д. Чиршкасы (Синьяльское сельское поселение), Чебоксарский район";
    if (buildRouteBtn) {
        buildRouteBtn.addEventListener('click', () => {
            window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(fullAddress)}&mode=routes`, '_blank');
        });
    }
    if (copyAddressBtn) {
        copyAddressBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(fullAddress);
                const fb = document.getElementById('copyFeedback');
                if (fb) {
                    fb.innerHTML = '<span style="color:#2ecc71;">✓ Скопировано!</span>';
                    setTimeout(() => fb.innerHTML = '', 2000);
                } else {
                    showNotification('Адрес скопирован!');
                }
            } catch (err) {
                showNotification('Не удалось скопировать адрес', true);
            }
        });
    }
    
    // --- Анимация появления ---
    const faders = document.querySelectorAll('.fade-up');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    faders.forEach(el => obs.observe(el));
    
    // --- Загрузка гостей ---
    loadGuests();
    setInterval(loadGuests, 30000);
    
    // --- Карта (после загрузки API) ---
    if (typeof ymaps !== 'undefined') {
        initYandexMap();
    } else {
        window.addEventListener('load', () => { if (typeof ymaps !== 'undefined') initYandexMap(); });
    }
});
