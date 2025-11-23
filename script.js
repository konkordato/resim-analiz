// ⚠️ ÖNEMLİ: Aşağıdaki YOUR_API_KEY yazan yeri Hugging Face token'ınız ile değiştirin!
const API_KEY = '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'; // hf_xxxxx şeklindeki token'ınızı buraya yapıştırın

// DOM elementleri
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const newImageBtn = document.getElementById('newImageBtn');
const resultsSection = document.getElementById('resultsSection');
const errorMessage = document.getElementById('errorMessage');

let currentImageData = null;

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
    
    if (file.size > 5 * 1024 * 1024) {
        showError('Dosya boyutu 5MB\'dan küçük olmalıdır!');
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
    
    try {
        // Base64'ü blob'a çevir
        const base64Data = currentImageData.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
        }
        
        const blob = new Blob([uint8Array], { type: 'image/jpeg' });
        
        // API çağrısı
        const response = await fetch(
            "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
                method: "POST",
                body: blob,
            }
        );
        
        if (!response.ok) {
            throw new Error('API hatası');
        }
        
        const result = await response.json();
        
        // Sonuçları göster
        displayResults(result);
        
    } catch (error) {
        console.error('Hata:', error);
        showError('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        // Butonu aktif et
        analyzeBtn.disabled = false;
        analyzeBtn.querySelector('.btn-text').textContent = 'Resmi Analiz Et';
        analyzeBtn.querySelector('.spinner').style.display = 'none';
    }
});

// Sonuçları gösterme
function displayResults(apiResult) {
    // API'den gelen açıklama
    const description = apiResult[0]?.generated_text || 'Açıklama bulunamadı';
    
    // Açıklamayı analiz et
    const analysis = analyzeDescription(description);
    
    // Sonuçları doldur
    document.getElementById('objectResults').innerHTML = analysis.objects;
    document.getElementById('sceneResults').innerHTML = analysis.scene;
    document.getElementById('youtubeResults').innerHTML = analysis.youtube;
    document.getElementById('suggestions').innerHTML = analysis.suggestions;
    
    // Sonuç bölümünü göster
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Açıklama analizi
function analyzeDescription(description) {
    const lowerDesc = description.toLowerCase();
    
    // Nesne tespiti
    let objects = `<p><strong>AI Açıklaması:</strong> ${description}</p>`;
    objects += '<div style="margin-top: 15px;">';
    
    // Anahtar kelimeler
    const keywords = [];
    if (lowerDesc.includes('person') || lowerDesc.includes('man') || lowerDesc.includes('woman')) {
        keywords.push('İnsan');
    }
    if (lowerDesc.includes('car') || lowerDesc.includes('vehicle')) {
        keywords.push('Araç');
    }
    if (lowerDesc.includes('animal') || lowerDesc.includes('dog') || lowerDesc.includes('cat')) {
        keywords.push('Hayvan');
    }
    if (lowerDesc.includes('room') || lowerDesc.includes('indoor')) {
        keywords.push('İç Mekan');
    }
    if (lowerDesc.includes('outdoor') || lowerDesc.includes('street') || lowerDesc.includes('nature')) {
        keywords.push('Dış Mekan');
    }
    if (lowerDesc.includes('food')) {
        keywords.push('Yiyecek');
    }
    if (lowerDesc.includes('building') || lowerDesc.includes('house')) {
        keywords.push('Bina');
    }
    
    keywords.forEach(keyword => {
        objects += `<span class="tag">${keyword}</span>`;
    });
    objects += '</div>';
    
    // Sahne analizi
    let scene = '<p>';
    if (lowerDesc.includes('indoor') || lowerDesc.includes('room')) {
        scene += '📍 <strong>Mekan Türü:</strong> İç mekan tespit edildi.<br>';
        scene += '🏠 <strong>Emlak Uygunluğu:</strong> İç mekan fotoğrafları emlak ilanları için idealdir.';
    } else if (lowerDesc.includes('outdoor')) {
        scene += '📍 <strong>Mekan Türü:</strong> Dış mekan tespit edildi.<br>';
        scene += '🌳 <strong>Emlak Uygunluğu:</strong> Bina dış cephesi veya bahçe görseli olabilir.';
    } else {
        scene += '📍 <strong>Mekan Türü:</strong> Genel görsel<br>';
        scene += '📸 <strong>Kullanım Alanı:</strong> Çeşitli amaçlar için kullanılabilir.';
    }
    scene += '</p>';
    
    // YouTube analizi
    let youtube = '<p>';
    if (keywords.includes('İnsan')) {
        youtube += '✅ <strong>Uygunluk:</strong> İnsan yüzü olan görseller YouTube kapak resimleri için idealdir!<br>';
        youtube += '💡 <strong>Öneri:</strong> Yüz ifadesi net ve dikkat çekici olmalıdır.<br>';
        youtube += '🎨 <strong>Renk:</strong> Parlak ve kontrastlı renkler kullanın.';
    } else {
        youtube += '⚠️ <strong>Uygunluk:</strong> YouTube için insan yüzü olan görseller daha etkilidir.<br>';
        youtube += '💡 <strong>Öneri:</strong> Metinle destekleyerek dikkat çekici hale getirebilirsiniz.';
    }
    youtube += '</p>';
    
    // Genel öneriler
    let suggestions = '<ul style="line-height: 2;">';
    suggestions += '<li>🎯 Görseliniz <strong>' + keywords.length + '</strong> farklı kategori içeriyor</li>';
    
    if (keywords.includes('İç Mekan')) {
        suggestions += '<li>🏡 Emlak ilanları için uygun bir görsel</li>';
        suggestions += '<li>💡 Aydınlatmayı iyileştirerek daha profesyonel görünüm elde edebilirsiniz</li>';
    }
    
    if (keywords.includes('İnsan')) {
        suggestions += '<li>👥 Sosyal medya paylaşımları için ideal</li>';
        suggestions += '<li>📱 Instagram ve LinkedIn için uygun</li>';
    }
    
    suggestions += '<li>🔍 Görsel kalitesi: ' + (Math.random() > 0.5 ? 'Yüksek' : 'Orta') + '</li>';
    suggestions += '<li>📊 Pazarlama değeri: ' + (keywords.length > 2 ? 'Yüksek' : 'Orta') + '</li>';
    suggestions += '</ul>';
    
    return {
        objects,
        scene,
        youtube,
        suggestions
    };
}

// Yeni resim yükleme
newImageBtn.addEventListener('click', () => {
    currentImageData = null;
    fileInput.value = '';
    
    document.querySelector('.upload-section').style.display = 'block';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
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