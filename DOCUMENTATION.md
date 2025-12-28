# 🌍 Web Deteksi Gempa - Analisis Kompleksitas Algoritma

## 📋 Daftar Isi
1. [Ringkasan Proyek](#ringkasan-proyek)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [File dan Struktur Proyek](#file-dan-struktur-proyek)
4. [Backend (Flask)](#backend-flask)
5. [Frontend (HTML/CSS/JavaScript)](#frontend-htmlcssjavascript)
6. [Algoritma Analisis](#algoritma-analisis)
7. [Fitur Utama](#fitur-utama)
8. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
9. [Instalasi dan Setup](#instalasi-dan-setup)
10. [Cara Penggunaan](#cara-penggunaan)

---

## 🎯 Ringkasan Proyek

**Web Deteksi Gempa** adalah platform analisis data seismik yang membandingkan performa algoritma iteratif vs rekursif dalam menganalisis data gempa dari USGS (United States Geological Survey). Aplikasi ini mendemonstrasikan pentingnya optimisasi algoritma untuk dataset besar dan menampilkan analisis kompleksitas waktu serta ruang.

### Tujuan Utama:
- ✅ Membandingkan performa algoritma iteratif vs rekursif
- ✅ Mendemonstrasikan stack overflow pada algoritma rekursif
- ✅ Menampilkan analisis kompleksitas O(n) waktu dan O(1) vs O(n) ruang
- ✅ Memberikan interface yang user-friendly untuk eksplorasi data seismik

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐    HTTP/Flask    ┌─────────────────┐
│   Frontend      │◄────────────────►│    Backend      │
│   (HTML/CSS/JS) │                  │    (Python)     │
└─────────────────┘                  └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                  ┌─────────────────┐
│   Browser       │                  │   USGS API      │
│   (Chart.js)    │                  │   (REST API)    │
└─────────────────┘                  └─────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   Cache System  │
                                    │   (JSON files)  │
                                    └─────────────────┘
```

---

## 📁 File dan Struktur Proyek

```
deteksi-gempa-web/
├── backend/
│   ├── app.py                 # Server Flask utama
│   └── requirements.txt       # Dependencies Python
├── frontend/
│   ├── dashboard.html         # Halaman dashboard
│   ├── index.html            # Halaman analysis tool
│   ├── script.js             # JavaScript interaktivitas
│   ├── style.css             # Styling dan CSS
│   ├── alifito.JPG           # Foto developer
│   └── nadisha.jpg           # Foto developer
├── cache/
│   ├── all_*.json            # Cache data gempa
│   └── analysis_*.json       # Cache hasil analisis
├── .gitignore                # Git ignore rules
└── DOCUMENTATION.md          # Dokumentasi ini
```

---

## 🔧 Backend (Flask)

### `backend/app.py` - Server Utama

#### Konfigurasi Dasar:
```python
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)  # Cross-Origin Resource Sharing
```

#### Route Utama:

##### 1. `/` - Dashboard
```python
@app.route('/')
def index():
    return app.send_static_file('dashboard.html')
```

##### 2. `/analysis` - Analysis Tool
```python
@app.route('/analysis')
def analysis():
    return app.send_static_file('index.html')
```

##### 3. `/earthquakes` - API Data Gempa
```python
@app.route('/earthquakes', methods=['GET'])
def get_earthquakes():
    # Parameter: size, sort, continent
    # Return: JSON dengan data gempa + analisis
```

#### Sistem Cache:
- **Lokasi:** `cache/` directory
- **Format:** JSON compressed dengan gzip
- **Durasi:** 1 jam (3600 detik)
- **Versi:** `v9` untuk force invalidation

#### Keamanan:
```python
# Content Security Policy
response.headers['Content-Security-Policy'] = "..."

# Security Headers
response.headers['X-Content-Type-Options'] = 'nosniff'
response.headers['X-Frame-Options'] = 'DENY'
response.headers['X-XSS-Protection'] = '1; mode=block'
response.headers['Strict-Transport-Security'] = 'max-age=31536000'
```

---

## 🎨 Frontend (HTML/CSS/JavaScript)

### `frontend/dashboard.html` - Halaman Dashboard

#### Struktur:
- **Header:** Navigasi dan branding
- **Hero Section:** Deskripsi platform
- **Features:** Keunggulan sistem
- **Metrics:** Statistik performa
- **Team:** Informasi developer

#### Navigasi:
```html
<nav>
    <a href="index.html">Go to Analysis Tool</a>
</nav>
```

### `frontend/index.html` - Halaman Analysis Tool

#### Komponen Utama:
1. **Controls Section:** Form input parameter
2. **Loading Indicator:** Progress bar dan status
3. **Results Section:** Tabel data + analisis
4. **Algorithm Comparison:** Side-by-side comparison

#### Form Controls:
```html
<select id="size-select"> <!-- 1, 10, 25, 50, 100, ... -->
<select id="sort-select"> <!-- time, magnitude -->
<button id="load-btn">Load Earthquake Data</button>
```

### `frontend/script.js` - JavaScript Interaktif

#### Fungsi Utama:

##### 1. `loadEarthquakeData()`
- Fetch data dari `/earthquakes` API
- Update UI dengan loading states
- Populate tabel dan chart

##### 2. `plotCurrentSizeChart()`
- Render Chart.js bar chart
- Bandingkan waktu eksekusi iteratif vs rekursif

##### 3. Table Population
```javascript
// Highlight dangerous earthquakes
if (eq.magnitude >= 5.0) {
    row.classList.add('dangerous-earthquake');
}
```

##### 4. `getMagnitudeClass()`
- Return CSS class berdasarkan magnitudo:
  - `minor`: < 4.0
  - `light`: 4.0-4.9
  - `moderate`: 5.0-5.9
  - `strong`: 6.0-6.9
  - `major`: ≥ 7.0

### `frontend/style.css` - Styling

#### Fitur CSS:
- **Responsive Design:** Mobile-first approach
- **Animations:** Fade-in, slide-in effects
- **Color Scheme:** Professional blue theme
- **Typography:** Inter font family

#### Dangerous Earthquake Styling:
```css
.dangerous-earthquake {
    background-color: #fee2e2 !important;
    border-left: 4px solid #dc3545;
}
```

---

## 🧮 Algoritma Analisis

### Algoritma Iteratif - O(n) Time, O(1) Space

```python
def analyze_earthquakes_iterative(features):
    start_time = time.time()
    total_gempa = 0
    sum_magnitudo = 0.0
    jumlah_berbahaya = 0
    min_mag = float('inf')
    max_mag = float('-inf')
    sum_squares = 0.0

    for feature in features:  # O(n) - Loop iteratif
        magnitudo = feature['properties']['mag']
        total_gempa += 1
        sum_magnitudo += magnitudo
        sum_squares += magnitudo ** 2
        min_mag = min(min_mag, magnitudo)
        max_mag = max(max_mag, magnitudo)
        if magnitudo >= 5.0:
            jumlah_berbahaya += 1

    # Perhitungan statistik
    rata_rata_magnitudo = sum_magnitudo / total_gempa
    variansi = (sum_squares / total_gempa - rata_rata_magnitudo ** 2)
    std_dev = variansi ** 0.5
    persentase_berbahaya = (jumlah_berbahaya / total_gempa * 100)

    execution_time = time.time() - start_time

    return {
        'total_gempa': total_gempa,
        'rata_rata_magnitudo': round(rata_rata_magnitudo, 3),
        'min_magnitudo': round(min_mag, 1),
        'max_magnitudo': round(max_mag, 1),
        'standar_deviasi': round(std_dev, 3),
        'jumlah_berbahaya': jumlah_berbahaya,
        'persentase_berbahaya': round(persentase_berbahaya, 2),
        'waktu_eksekusi': round(execution_time, 6)
    }
```

#### Karakteristik:
- ✅ **Kompleksitas Waktu:** O(n) - Linear
- ✅ **Kompleksitas Ruang:** O(1) - Konstanta
- ✅ **Stabilitas:** Tidak ada stack overflow
- ✅ **Skalabilitas:** Menangani dataset hingga 20,000+ records

### Algoritma Rekursif - O(n) Time, O(n) Space

```python
def analyze_earthquakes_recursive(features, index=0, total_gempa=0, sum_magnitudo=0.0, jumlah_berbahaya=0, sum_squares=0.0, min_mag=float('inf'), max_mag=float('-inf')):
    if index >= len(features):  # Base case
        rata_rata_magnitudo = sum_magnitudo / total_gempa if total_gempa > 0 else 0.0
        variansi = (sum_squares / total_gempa - rata_rata_magnitudo ** 2) if total_gempa > 1 else 0.0
        std_dev = variansi ** 0.5 if variansi > 0 else 0.0
        persentase_berbahaya = (jumlah_berbahaya / total_gempa * 100) if total_gempa > 0 else 0.0
        return {
            'total_gempa': total_gempa,
            'rata_rata_magnitudo': round(rata_rata_magnitudo, 3),
            'min_magnitudo': round(min_mag, 1) if min_mag != float('inf') else 0.0,
            'max_magnitudo': round(max_mag, 1) if max_mag != float('-inf') else 0.0,
            'standar_deviasi': round(std_dev, 3),
            'jumlah_berbahaya': jumlah_berbahaya,
            'persentase_berbahaya': round(persentase_berbahaya, 2),
            'waktu_eksekusi': 0  # akan diukur di luar
        }

    magnitudo = features[index]['properties']['mag']
    new_total_gempa = total_gempa + 1
    new_sum_magnitudo = sum_magnitudo + magnitudo
    new_sum_squares = sum_squares + magnitudo ** 2
    new_min_mag = min(min_mag, magnitudo)
    new_max_mag = max(max_mag, magnitudo)
    new_jumlah_berbahaya = jumlah_berbahaya + (1 if magnitudo >= 5.0 else 0)

    return analyze_earthquakes_recursive(
        features, index + 1, new_total_gempa, new_sum_magnitudo,
        new_jumlah_berbahaya, new_sum_squares, new_min_mag, new_max_mag
    )
```

#### Karakteristik:
- ✅ **Kompleksitas Waktu:** O(n) - Linear (teoritis)
- ❌ **Kompleksitas Ruang:** O(n) - Linear (stack frames)
- ❌ **Stabilitas:** Stack overflow pada n > 1200
- ❌ **Skalabilitas:** Terbatas oleh recursion limit Python (~3000)

### Perbandingan Performa:

| Ukuran Input | Iteratif (detik) | Rekursif (detik) | Status Rekursif |
|-------------|------------------|------------------|------------------|
| n ≤ 100     | ~0.0001         | ~0.0001         | ✅ Berhasil     |
| n = 500     | ~0.001          | ~0.002          | ✅ Berhasil     |
| n = 1200    | ~0.004          | ~0.015          | ✅ Berhasil     |
| n = 2000    | ~0.008          | ❌ Stack Overflow | ❌ Gagal       |
| n = 10000   | ~0.035          | ❌ Stack Overflow | ❌ Gagal       |

---

## 🚀 Fitur Utama

### 1. **Real-time Data Integration**
- Fetch data langsung dari USGS Earthquake API
- Support hingga 20,000+ records
- Cache system untuk performa optimal

### 2. **Algorithm Comparison**
- Side-by-side comparison iteratif vs rekursif
- Visual chart dengan Chart.js
- Detailed complexity analysis

### 3. **Interactive Data Table**
- Sortable by time/magnitude
- Highlight dangerous earthquakes (M ≥ 5.0)
- Responsive design untuk mobile

### 4. **Performance Analytics**
- Execution time measurement
- Memory usage analysis
- Statistical calculations (mean, std dev, min/max)

### 5. **Security & Performance**
- Content Security Policy
- Rate limiting (200/day, 50/hour)
- CORS enabled
- Input validation

---

## 🛠️ Teknologi yang Digunakan

### Backend:
- **Flask 3.0+:** Web framework Python
- **Requests:** HTTP client untuk USGS API
- **Flask-CORS:** Cross-origin resource sharing
- **Flask-Limiter:** Rate limiting
- **Gzip:** Data compression
- **Threading:** Background cache updates

### Frontend:
- **HTML5:** Semantic markup
- **CSS3:** Modern styling dengan animations
- **JavaScript (ES6+):** DOM manipulation
- **Chart.js:** Data visualization
- **Inter Font:** Professional typography

### Infrastructure:
- **Git:** Version control
- **GitHub:** Repository hosting
- **VSCode:** Development environment
- **USGS API:** Data source

---

## 📦 Instalasi dan Setup

### Prerequisites:
- Python 3.8+
- pip
- Git
- Modern web browser

### Langkah Instalasi:

```bash
# 1. Clone repository
git clone https://github.com/alifitorabbani/web-deteksi-gempa-kompleksitas-algoritma.git
cd web-deteksi-gempa-kompleksitas-algoritma

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Jalankan server
python3 backend/app.py

# 4. Akses web
# Dashboard: http://localhost:5001
# Analysis: http://localhost:5001/analysis
```

### Setup Development:
```bash
# Install extension VSCode
# - GitHub Pull Requests and Issues
# - GitLens (optional)

# Setup GitHub authentication
# F1 → "GitHub Pull Requests: Sign in to GitHub"
```

---

## 📖 Cara Penggunaan

### 1. **Akses Dashboard**
- Buka `http://localhost:5001`
- Baca informasi platform
- Klik "Go to Analysis Tool"

### 2. **Konfigurasi Analisis**
- **Sample Size:** Pilih jumlah data (1-20,000)
- **Sort By:** Time (terbaru) atau Magnitude (tertinggi)
- Klik "Load Earthquake Data"

### 3. **Melihat Hasil**
- **Tabel Data:** Scroll untuk melihat semua gempa
- **Baris Merah:** Gempa berbahaya (M ≥ 5.0)
- **Chart Performa:** Bandingkan waktu eksekusi
- **Statistik:** Analisis komprehensif

### 4. **Mengubah Parameter**
- Pilih sample size berbeda
- Sort ulang data
- Load data baru

---

## 👥 Tim Developer

### Alifito Rabbani Cahyono
- **Role:** Software Architect, QA Engineer, Fullstack Developer & Analytics Engineer
- **Kontribusi:** Flask backend, algorithm optimization, QA testing, scalability, code quality

### Nadisha Auliandini Nurhizah
- **Role:** Project Manager, UI/UX Designer & Data Scientist
- **Kontribusi:** Project management, UI/UX design, data visualization, seismic analysis

---

## 📊 Metrik Performa

- **Response Time:** < 0.1 detik untuk cache hit
- **Data Processing:** Hingga 20,000 records
- **Memory Usage:** O(1) untuk algoritma iteratif
- **API Rate Limit:** 200 requests/day, 50/hour
- **Cache Duration:** 1 jam
- **Uptime:** 24/7 (dengan background caching)

---

## 🔒 Keamanan

### Content Security Policy:
```
default-src 'self'
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
connect-src 'self' https://earthquake.usgs.gov https://cdn.jsdelivr.net
```

### Rate Limiting:
- 200 requests per hari
- 50 requests per jam
- Per IP address

### Input Validation:
- Size parameter: 1-20000
- Sort parameter: time/magnitude
- Continent filter: all (global)

---

## 🚀 Deployment

### Local Development:
```bash
python3 backend/app.py
# Access: http://localhost:5001
```

### Production (Vercel/Replit):
- Static files di `frontend/`
- Backend sebagai serverless function
- Environment variables untuk configuration

### Docker (Optional):
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "backend/app.py"]
```

---

## 📈 Roadmap

### Fitur Mendatang:
- [ ] Multi-language support
- [ ] Advanced filtering (location, date range)
- [ ] Export data (CSV, JSON)
- [ ] Real-time notifications
- [ ] Historical trend analysis
- [ ] Machine learning predictions

### Optimisasi:
- [ ] Database integration (PostgreSQL)
- [ ] Redis caching
- [ ] CDN untuk static files
- [ ] Load balancing
- [ ] Monitoring dan logging

---

## 📞 Support

**Repository:** [GitHub](https://github.com/alifitorabbani/web-deteksi-gempa-kompleksitas-algoritma)

**Issues:** Buat issue di GitHub untuk bug reports atau feature requests

**Documentation:** File `DOCUMENTATION.md` ini

---

## 📄 Lisensi

Copyright © 2025 Earthquake Data Analysis Platform. All rights reserved.

Dikembangkan oleh Alifito Rabbani Cahyono & Nadisha Auliandini Nurhizah sebagai proyek akademik untuk mendemonstrasikan konsep algoritma dan analisis kompleksitas dalam konteks data seismik real-world.

---

*Dokumen ini dibuat secara otomatis dan mencakup semua aspek teknis dari Web Deteksi Gempa - Analisis Kompleksitas Algoritma.*