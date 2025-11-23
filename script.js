// ML5.js - API ANAHTARI GEREKMEZ! 
console.log('ML5.js Resim Analiz Sistemi Başlatılıyor...');

// DOM elementleri
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const newImageBtn = document.getElementById('newImageBtn');
const resultsSection = document.getElementById('resultsSection');
const loadingSection = document.getElementById('loadingSection');
const errorMessage = document.getElementById('errorMessage');

let classifier;
let currentImageData = null;

// ML5 modelini yükle
async function loadModel() {
    try {
        console.log('MobileNet modeli yükleniyor...');
        classifier = await ml5.imageClassifier('MobileNet');
        console.log('Model başarıyla yüklendi!');
        return true;
    } catch (error) {
        console.error('Model yükleme hatası:', error);
        showError('AI modeli yüklenemedi. Lütfen sayfayı yenileyin.');
        return false;
    }
}

// Sayfa yüklendiğinde modeli hazırla
window.addEventListener('load', () => {
    loadModel();
});

// Upload box'a tıklama
uploadBox.addEventListener('click', () => {
    fileInput.click();
});

// Drag & Drop olayları
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Dosya seçimi
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Dosya işleme
function handleFile(file) {
    // Dosya kontrolü
    if (!file.type.startsWith('image/')) {
        showError('Lütfen bir resim dosyası seçin!');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showError('Dosya boyutu 10MB\'dan küçük olmalıdır!');
        return;
    }
    
    // Resmi önizleme
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageData = e.target.result;
        previewImage.src = currentImageData;
        
        // Bölümleri göster/gizle
        document.querySelector('.upload-section').style.display = 'none';
        previewSection.style.display = 'block';
        resultsSection.style.display = 'none';
        loadingSection.style.display = 'none';
        errorMessage.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Analiz butonu
analyzeBtn.addEventListener('click', async () => {
    if (!currentImageData) {
        showError('Lütfen önce bir resim yükleyin!');
        return;
    }
    
    // Butonu devre dışı bırak
    analyzeBtn.disabled = true;
    analyzeBtn.querySelector('.btn-text').textContent = 'Analiz ediliyor...';
    analyzeBtn.querySelector('.spinner').style.display = 'inline-block';
    
    // Loading göster
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    try {
        // Model yüklü değilse yükle
        if (!classifier) {
            const modelLoaded = await loadModel();
            if (!modelLoaded) {
                throw new Error('Model yüklenemedi');
            }
        }
        
        // Resmi analiz et
        const results = await classifier.classify(previewImage);
        console.log('Analiz sonuçları:', results);
        
        // Sonuçları göster
        displayResults(results);
        
    } catch (error) {
        console.error('Analiz hatası:', error);
        showError('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        // Butonu aktif et
        analyzeBtn.disabled = false;
        analyzeBtn.querySelector('.btn-text').textContent = 'Resmi Analiz Et';
        analyzeBtn.querySelector('.spinner').style.display = 'none';
        loadingSection.style.display = 'none';
    }
});

// Sonuçları gösterme
function displayResults(predictions) {
    // Nesne sonuçları
    let objectHTML = '<div class="predictions">';
    predictions.forEach((prediction, index) => {
        const confidence = (prediction.confidence * 100).toFixed(1);
        const turkishLabel = translateLabel(prediction.label);
        
        objectHTML += `
            <div class="prediction-item">
                <span class="prediction-label">${index + 1}. ${turkishLabel}</span>
                <span class="prediction-confidence">${confidence}%</span>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                </div>
            </div>
        `;
    });
    objectHTML += '</div>';
    document.getElementById('objectResults').innerHTML = objectHTML;
    
    // Detaylı analiz
    const topPrediction = predictions[0];
    const category = categorizeImage(topPrediction.label);
    
    let detailHTML = `
        <p><strong>🎯 Ana Tespit:</strong> ${translateLabel(topPrediction.label)}</p>
        <p><strong>📊 Güven Skoru:</strong> %${(topPrediction.confidence * 100).toFixed(1)}</p>
        <p><strong>🏷️ Kategori:</strong> ${category}</p>
        <div style="margin-top: 15px;">
    `;
    
    // Kategoriye göre etiketler
    if (category.includes('Hayvan')) {
        detailHTML += '<span class="tag">🐾 Hayvan</span>';
    }
    if (category.includes('Araç')) {
        detailHTML += '<span class="tag">🚗 Araç</span>';
    }
    if (category.includes('İnsan')) {
        detailHTML += '<span class="tag">👤 İnsan İlgili</span>';
    }
    if (category.includes('Doğa')) {
        detailHTML += '<span class="tag">🌿 Doğa</span>';
    }
    if (category.includes('Yapı')) {
        detailHTML += '<span class="tag">🏢 Yapı/Mekan</span>';
    }
    if (category.includes('Nesne')) {
        detailHTML += '<span class="tag">📦 Nesne</span>';
    }
    
    detailHTML += '</div>';
    document.getElementById('detailResults').innerHTML = detailHTML;
    
    // Sosyal medya analizi
    const socialAnalysis = analyzeSocialMedia(predictions[0]);
    document.getElementById('socialResults').innerHTML = socialAnalysis;
    
    // Emlak analizi
    const realEstateAnalysis = analyzeRealEstate(predictions[0]);
    document.getElementById('realEstateResults').innerHTML = realEstateAnalysis;
    
    // Sonuç bölümünü göster
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Etiket çevirisi
function translateLabel(label) {
    // En yaygın etiketler için Türkçe çeviri
    const translations = {
        'house': 'Ev/Bina',
        'car': 'Araba',
        'dog': 'Köpek',
        'cat': 'Kedi',
        'person': 'İnsan',
        'computer': 'Bilgisayar',
        'phone': 'Telefon',
        'food': 'Yiyecek',
        'furniture': 'Mobilya',
        'room': 'Oda',
        'kitchen': 'Mutfak',
        'bedroom': 'Yatak Odası',
        'bathroom': 'Banyo',
        'living room': 'Salon',
        'office': 'Ofis',
        'garden': 'Bahçe',
        'street': 'Sokak',
        'building': 'Bina',
        'window': 'Pencere',
        'door': 'Kapı'
    };
    
    // Çeviri varsa kullan, yoksa orijinal etiketi göster
    const lowerLabel = label.toLowerCase();
    for (let key in translations) {
        if (lowerLabel.includes(key)) {
            return translations[key];
        }
    }
    
    // Çeviri yoksa orijinali döndür (ilk harfi büyük)
    return label.charAt(0).toUpperCase() + label.slice(1);
}

// Görsel kategorileme
function categorizeImage(label) {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('dog') || lowerLabel.includes('cat') || lowerLabel.includes('animal')) {
        return '🐾 Hayvan';
    } else if (lowerLabel.includes('car') || lowerLabel.includes('vehicle') || lowerLabel.includes('truck')) {
        return '🚗 Araç';
    } else if (lowerLabel.includes('person') || lowerLabel.includes('people')) {
        return '👤 İnsan İlgili';
    } else if (lowerLabel.includes('house') || lowerLabel.includes('building') || lowerLabel.includes('room')) {
        return '🏢 Yapı/Mekan';
    } else if (lowerLabel.includes('tree') || lowerLabel.includes('plant') || lowerLabel.includes('flower')) {
        return '🌿 Doğa';
    } else {
        return '📦 Nesne';
    }
}

// Sosyal medya analizi
function analyzeSocialMedia(prediction) {
    const confidence = (prediction.confidence * 100).toFixed(1);
    let html = '<div>';
    
    if (confidence > 80) {
        html += `
            <p>✅ <strong>YouTube Kapak Resmi:</strong> Yüksek kalite tespit edildi!</p>
            <p>📸 <strong>Instagram:</strong> Paylaşım için uygun</p>
            <p>💼 <strong>LinkedIn:</strong> Profesyonel kullanım için değerlendirilebilir</p>
        `;
    } else if (confidence > 60) {
        html += `
            <p>⚠️ <strong>YouTube Kapak Resmi:</strong> Orta düzey uygunluk</p>
            <p>💡 <strong>Öneri:</strong> Metin ve grafik ekleyerek güçlendirin</p>
            <p>📸 <strong>Instagram:</strong> Filtre kullanımı önerilir</p>
        `;
    } else {
        html += `
            <p>🔄 <strong>YouTube Kapak Resmi:</strong> Daha net bir görsel önerilir</p>
            <p>💡 <strong>Öneri:</strong> Yüksek çözünürlüklü yeni görsel kullanın</p>
            <p>🎨 <strong>Düzenleme:</strong> Profesyonel düzenleme gerekebilir</p>
        `;
    }
    
    html += `
        <div style="margin-top: 15px;">
            <span class="tag">Güven: %${confidence}</span>
            <span class="tag">AI Analizi</span>
            <span class="tag">Otomatik</span>
        </div>
    </div>`;
    
    return html;
}

// Emlak analizi
function analyzeRealEstate(prediction) {
    const label = prediction.label.toLowerCase();
    let html = '<div>';
    
    if (label.includes('house') || label.includes('building') || label.includes('room')) {
        html += `
            <p>🏡 <strong>Emlak Uygunluğu:</strong> Mükemmel!</p>
            <p>✅ <strong>İlan Kullanımı:</strong> Direkt kullanılabilir</p>
            <p>📍 <strong>Tespit:</strong> Gayrimenkul içeriği algılandı</p>
            <ul style="margin-top: 10px; line-height: 1.8;">
                <li>• İç/dış mekan fotoğrafı olarak kullanılabilir</li>
                <li>• İlan kalitesini artırır</li>
                <li>• Müşteri ilgisini çeker</li>
            </ul>
        `;
    } else if (label.includes('furniture') || label.includes('kitchen') || label.includes('bathroom')) {
        html += `
            <p>🏠 <strong>Emlak Uygunluğu:</strong> Uygun</p>
            <p>✅ <strong>İlan Kullanımı:</strong> Detay fotoğrafı olarak ideal</p>
            <p>💡 <strong>Öneri:</strong> İç mekan özelliklerini vurgular</p>
        `;
    } else {
        html += `
            <p>📸 <strong>Emlak Uygunluğu:</strong> Dolaylı kullanım</p>
            <p>💡 <strong>Öneri:</strong> Çevre/lokasyon görseli olarak kullanılabilir</p>
            <p>🎯 <strong>Alternatif:</strong> Sosyal medya paylaşımları için ideal</p>
        `;
    }
    
    html += '</div>';
    return html;
}

// Yeni resim yükleme
newImageBtn.addEventListener('click', () => {
    currentImageData = null;
    fileInput.value = '';
    
    document.querySelector('.upload-section').style.display = 'block';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    loadingSection.style.display = 'none';
    errorMessage.style.display = 'none';
});

// Hata mesajı gösterme
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Sistem hazır mesajı
console.log('✅ ML5.js Resim Analiz Sistemi Hazır!');
console.log('📌 API Anahtarı Gerekmez - Tamamen Ücretsiz');
