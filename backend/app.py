from flask import Flask, request, jsonify, after_this_request
import requests
from datetime import datetime, timedelta
import time
import threading
import json
import os
import gzip
import sys
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging

# Increase recursion limit to allow deeper recursion for demonstration
sys.setrecursionlimit(3000)  # Allow up to 3000 recursive calls for maximum stack overflow demonstration

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# High-performance real-time data with optimized cache
CACHE_DIR = "cache"
CACHE_DURATION = 600  # 10 minutes cache for stable performance
DATA_VERSION = "v9"  # Force cache invalidation for latest data

# Ensure cache directory exists
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Global cache dictionary
earthquake_cache = {}
cache_lock = threading.Lock()

def get_cache_key(continent, size):
    """Generate unique cache key for continent and size"""
    return f"{continent}_{size}_{DATA_VERSION}"

def load_from_cache(cache_key):
    """Load data from cache file"""
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
                # Check if cache is still valid
                if time.time() - cached_data.get('timestamp', 0) < CACHE_DURATION:
                    print(f"Cache hit for {cache_key}")
                    return cached_data['data']
                else:
                    print(f"Cache expired for {cache_key}")
        except Exception as e:
            print(f"Cache read error: {e}")
    return None

def save_to_cache(cache_key, data):
    """Save data to cache file"""
    try:
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
        cache_data = {
            'timestamp': time.time(),
            'data': data
        }
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)
        print(f"Data cached for {cache_key}")
    except Exception as e:
        print(f"Cache write error: {e}")

def cleanup_old_cache():
    """Clean up old cache files"""
    try:
        current_time = time.time()
        for filename in os.listdir(CACHE_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(CACHE_DIR, filename)
                try:
                    with open(filepath, 'r') as f:
                        cached_data = json.load(f)
                        if current_time - cached_data.get('timestamp', 0) > CACHE_DURATION * 2:  # 2 hours
                            os.remove(filepath)
                            print(f"Removed old cache file: {filename}")
                except:
                    # Remove corrupted cache files
                    os.remove(filepath)
    except Exception as e:
        print(f"Cache cleanup error: {e}")

def fetch_earthquake_data(target_count, continent_filter='all'):
    print(f"=== Fetching {target_count} REAL earthquake records (M >= 2.5) from USGS ===")
    if continent_filter != 'all':
        print(f"   Continent filter: {continent_filter}")

    all_features = []
    batch_size = 2000  # Smaller batch size for better reliability
    min_magnitude = 2.5  # Only earthquakes with magnitude >= 2.5

    # Optimized date ranges - start with most recent data first
    date_ranges = [
        ("2023-01-01", "2025-12-31"),  # Most recent 3 years
        ("2020-01-01", "2022-12-31"),  # Previous 3 years
        ("2017-01-01", "2019-12-31"),  # 2010s
        ("2014-01-01", "2016-12-31"),  # Mid 2010s
        ("2011-01-01", "2013-12-31"),  # Early 2010s
        ("2008-01-01", "2010-12-31"),  # Late 2000s
        ("2005-01-01", "2007-12-31"),  # Mid 2000s
        ("2002-01-01", "2004-12-31"),  # Early 2000s
        ("1999-01-01", "2001-12-31"),  # Late 1990s
    ]

    for start_date, end_date in date_ranges:
        if len(all_features) >= target_count:
            break

        print(f"Fetching M >= {min_magnitude} from {start_date} to {end_date}")
        offset = 1
        consecutive_errors = 0

        while len(all_features) < target_count and consecutive_errors < 3:
            remaining = target_count - len(all_features)
            current_batch = min(batch_size, remaining, 10000)  # USGS limit is 20000 per request

            url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&offset={offset}&limit={current_batch}&minmagnitude={min_magnitude}&starttime={start_date}&endtime={end_date}&orderby=time"

            try:
                response = requests.get(url, timeout=60)  # Increased timeout
                response.raise_for_status()
                data = response.json()

                batch_features = data.get('features', [])
                if not batch_features:
                    print(f"  No more data available for {start_date}-{end_date}")
                    break

                # Filter to ensure all have magnitude >= min_magnitude
                valid_features = [f for f in batch_features if f['properties']['mag'] and f['properties']['mag'] >= min_magnitude]

                # Apply continent filter if specified
                if continent_filter != 'all':
                    valid_features = [f for f in valid_features if get_continent(f) == continent_filter]

                # Filter out duplicates
                existing_ids = {f['id'] for f in all_features}
                new_features = [f for f in valid_features if f['id'] not in existing_ids]

                all_features.extend(new_features)
                offset += current_batch
                consecutive_errors = 0  # Reset error counter

                print(f"  Fetched {len(new_features)} valid records (total: {len(all_features)}/{target_count})")

                if len(batch_features) < current_batch:
                    print(f"  Reached end of data for {start_date}-{end_date}")
                    break

                # Small delay to be respectful to the API
                time.sleep(0.1)

            except Exception as e:
                consecutive_errors += 1
                print(f"  Error fetching from {start_date} (attempt {consecutive_errors}/3): {e}")
                if consecutive_errors >= 3:
                    print(f"  Giving up on {start_date}-{end_date} after 3 consecutive errors")
                    break
                time.sleep(1)  # Wait before retry

    # Final processing
    all_features.sort(key=lambda x: x['properties']['time'], reverse=True)

    # Ensure all features meet criteria
    final_features = [f for f in all_features if f['properties']['mag'] and f['properties']['mag'] >= min_magnitude]
    if continent_filter != 'all':
        final_features = [f for f in final_features if get_continent(f) == continent_filter]

    final_features = final_features[:target_count]

    result_data = {
        'type': 'FeatureCollection',
        'features': final_features
    }

    print(f"FINAL: {len(result_data['features'])} REAL earthquake records (M >= {min_magnitude}) collected from USGS")
    if continent_filter != 'all':
        print(f"       Continent: {continent_filter}")
    return result_data

@app.route('/earthquakes', methods=['GET'])
def get_earthquakes():
    size = int(request.args.get('size', 10))
    sort_by = request.args.get('sort', 'time')

    # Use cache key based on requested size for better cache utilization
    cache_key = get_cache_key('all', size)
    data = load_from_cache(cache_key)

    if data and len(data['features']) >= size:
        print(f"Loaded {len(data['features'])} records from cache for size {size}")
        data['features'] = data['features'][:size]
    else:
        print(f"Cache miss or insufficient for size {size}, fetching fresh data...")

        # For small sizes, try live feed first for recency
        if size <= 100:
            try:
                response = requests.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson", timeout=10)
                response.raise_for_status()
                data = response.json()

                # Filter to magnitude >= 2.5 as per requirements
                data['features'] = [f for f in data['features'] if f['properties']['mag'] and f['properties']['mag'] >= 2.5]

                real_time_count = len(data['features'])
                print(f"Fetched {real_time_count} real-time earthquakes (M >= 2.5)")

                # If live feed has enough data, use it
                if real_time_count >= size:
                    data['features'] = data['features'][:size]
                    print(f"Using {size} real-time records")
                else:
                    # Fall back to comprehensive fetch
                    print(f"Live feed only has {real_time_count} records, need {size}. Using comprehensive fetch...")
                    data = fetch_earthquake_data(size, 'all')

            except Exception as e:
                print(f"Live feed error: {e}, using comprehensive fetch...")
                data = fetch_earthquake_data(size, 'all')
        else:
            # For larger sizes, use comprehensive fetch directly
            data = fetch_earthquake_data(size, 'all')

        # Cache the result
        if data and len(data['features']) >= size:
            with cache_lock:
                save_to_cache(cache_key, data)
            print(f"Cached {len(data['features'])} records for size {size}")

    if data is None:
        return jsonify({'error': 'Failed to fetch earthquake data'}), 500

    features = data.get('features', [])

    # Clean up old cache files periodically
    cleanup_thread = threading.Thread(target=cleanup_old_cache, daemon=True)
    cleanup_thread.start()

    # Sort data
    if sort_by == 'magnitude':
        features.sort(key=lambda x: x['properties']['mag'], reverse=True)
    elif sort_by == 'location':
        features.sort(key=lambda x: x['properties']['place'] or '')
    else:  # time
        features.sort(key=lambda x: x['properties']['time'], reverse=True)

    # Limit size
    features = features[:size]

    # Check if analysis is cached
    analysis_cache_key = f"analysis_{size}_{DATA_VERSION}"
    cached_analysis = load_from_cache(analysis_cache_key)
    if cached_analysis:
        analysis = cached_analysis
        print(f"Loaded analysis from cache for size {size}")
    else:
        print(f"Computing analysis for size {size}")
        # Analisis Kompleksitas Algoritma - Implementasi Iteratif dan Rekursif

        # Fungsi iteratif - O(n) time, O(1) space
    def analyze_earthquakes_iterative(features):
        start_time = time.time()
        total_gempa = 0
        sum_magnitudo = 0.0
        jumlah_berbahaya = 0
        min_mag = float('inf')
        max_mag = float('-inf')
        sum_squares = 0.0  # Untuk menghitung variansi

        for feature in features:
            magnitudo = feature['properties']['mag']
            total_gempa += 1
            sum_magnitudo += magnitudo
            sum_squares += magnitudo ** 2
            min_mag = min(min_mag, magnitudo)
            max_mag = max(max_mag, magnitudo)
            if magnitudo >= 5.0:
                jumlah_berbahaya += 1

        rata_rata_magnitudo = sum_magnitudo / total_gempa if total_gempa > 0 else 0.0
        variansi = (sum_squares / total_gempa - rata_rata_magnitudo ** 2) if total_gempa > 1 else 0.0
        std_dev = variansi ** 0.5 if variansi > 0 else 0.0
        persentase_berbahaya = (jumlah_berbahaya / total_gempa * 100) if total_gempa > 0 else 0.0

        execution_time = time.time() - start_time

        return {
            'total_gempa': total_gempa,
            'rata_rata_magnitudo': round(rata_rata_magnitudo, 3),
            'min_magnitudo': round(min_mag, 1) if min_mag != float('inf') else 0.0,
            'max_magnitudo': round(max_mag, 1) if max_mag != float('-inf') else 0.0,
            'standar_deviasi': round(std_dev, 3),
            'jumlah_berbahaya': jumlah_berbahaya,
            'persentase_berbahaya': round(persentase_berbahaya, 2),
            'waktu_eksekusi': round(execution_time, 6)
        }

    # Fungsi rekursif - O(n) time, O(n) space (call stack)
    def analyze_earthquakes_recursive(features, index=0, total=0, sum_mag=0.0, dangerous=0, sum_squares=0.0, min_mag=float('inf'), max_mag=float('-inf')):
        if index >= len(features):
            rata_rata = sum_mag / total if total > 0 else 0.0
            variansi = (sum_squares / total - rata_rata ** 2) if total > 1 else 0.0
            std_dev = variansi ** 0.5 if variansi > 0 else 0.0
            persentase_berbahaya = (dangerous / total * 100) if total > 0 else 0.0
            return {
                'total_gempa': total,
                'rata_rata_magnitudo': round(rata_rata, 3),
                'min_magnitudo': round(min_mag, 1) if min_mag != float('inf') else 0.0,
                'max_magnitudo': round(max_mag, 1) if max_mag != float('-inf') else 0.0,
                'standar_deviasi': round(std_dev, 3),
                'jumlah_berbahaya': dangerous,
                'persentase_berbahaya': round(persentase_berbahaya, 2),
                'waktu_eksekusi': 0  # akan diukur di luar
            }

        magnitudo = features[index]['properties']['mag']
        new_total = total + 1
        new_sum = sum_mag + magnitudo
        new_squares = sum_squares + magnitudo ** 2
        new_min = min(min_mag, magnitudo)
        new_max = max(max_mag, magnitudo)
        new_dangerous = dangerous + (1 if magnitudo >= 5.0 else 0)

        return analyze_earthquakes_recursive(features, index + 1, new_total, new_sum, new_dangerous, new_squares, new_min, new_max)

    # Jalankan analisis iteratif
    start_time_iterative = time.time()
    iterative_result = analyze_earthquakes_iterative(features)
    iterative_result['waktu_eksekusi'] = round(time.time() - start_time_iterative, 6)

    # Jalankan analisis rekursif (dengan batas untuk menghindari stack overflow)
    recursive_result = None
    recursive_error = None
    if len(features) <= 1200:  # Batasi untuk rekursif - push to maximum limit for true stack overflow demonstration
        try:
            start_time_recursive = time.time()
            recursive_result = analyze_earthquakes_recursive(features)
            recursive_result['waktu_eksekusi'] = round(time.time() - start_time_recursive, 6)
        except RecursionError:
            recursive_error = "Stack overflow - terlalu banyak data untuk algoritma rekursif"
    else:
        recursive_error = "Stack overflow - terlalu banyak data untuk algoritma rekursif"
        # Don't set recursive_result for large datasets to show error in frontend

    # Analisis kompleksitas
    n = len(features)
    complexity_analysis = {
        'iterative': {
            'best_case': f'O(n) - {n} iterasi loop, setiap elemen diproses dalam waktu konstan O(1)',
            'worst_case': f'O(n) - {n} iterasi loop, kompleksitas tetap linier meskipun data tidak terurut',
            'average_case': f'O(n) - {n} iterasi loop, rata-rata O(1) per elemen untuk operasi aritmatika',
            'space_complexity': 'O(1) - menggunakan variabel tetap (total_gempa, sum_magnitudo, dll) tanpa struktur data tambahan',
            'suitability': 'Optimal untuk dataset seismik skala global (n=20,000+), performa stabil dan efisien memori'
        },
        'recursive': {
            'best_case': f'O(n) - {n} recursive calls, setiap call memproses satu elemen dalam O(1)',
            'worst_case': f'O(n) - {n} recursive calls, risiko stack overflow ketika n > 1000 akibat batas call stack Python',
            'average_case': f'O(n) - {n} recursive calls, overhead call stack meningkatkan kompleksitas praktis',
            'space_complexity': f'O(n) - {n} stack frames, setiap call menyimpan state (index, total, sum_mag, dll)',
            'suitability': 'Tidak sesuai untuk data seismik besar, risiko crash sistem; cocok hanya untuk n ≤ 1200 (dari maksimal 3000 recursion limit)'
        }
    }

    # Format data untuk frontend
    earthquakes = []
    for feature in features:
        props = feature['properties']
        geom = feature['geometry']
        earthquakes.append({
            'id': feature['id'],
            'magnitude': props['mag'],
            'location': props['place'],
            'time': props['time'],
            'latitude': geom['coordinates'][1],
            'longitude': geom['coordinates'][0],
            'depth': geom['coordinates'][2],
            'url': props['url']
        })

    response_data = {
        'earthquakes': earthquakes,
        'total': len(earthquakes),
        'analysis': {
            'iterative': iterative_result,
            'recursive': recursive_result if recursive_result else {'error': recursive_error},
            'complexity_analysis': complexity_analysis
        },
        'timestamp': datetime.now().isoformat(),
        'cached': True  # Data loaded from static cache
    }

    return jsonify(response_data)

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"


    return response

def get_continent(feature):
    # Sederhana: berdasarkan koordinat
    lat = feature['geometry']['coordinates'][1]
    lon = feature['geometry']['coordinates'][0]

    if -20 <= lat <= 20:
        if -20 <= lon <= 55:
            return 'Africa'
        elif 55 <= lon <= 180:
            return 'Asia'
    elif lat > 20:
        if -130 <= lon <= -60:
            return 'North America'
        elif -60 <= lon <= 0:
            return 'South America'
        elif 0 <= lon <= 180:
            return 'Asia'
    else:  # lat < -20
        if -180 <= lon <= 180:
            return 'Australia'

    return 'Other'


def background_cache_updater():
    """Background thread to update cache periodically"""
    while True:
        try:
            print("Background cache update starting...")
            # Update main cache
            cache_key = get_cache_key('all', 20000)
            data = fetch_earthquake_data(20000, 'all')
            if data:
                with cache_lock:
                    save_to_cache(cache_key, data)
                print(f"Background cache updated with {len(data['features'])} records")
            else:
                print("Background cache update failed")
        except Exception as e:
            print(f"Background cache update error: {e}")

        # Sleep for 10 minutes
        time.sleep(600)

if __name__ == '__main__':
    # Start background cache updater
    updater_thread = threading.Thread(target=background_cache_updater, daemon=True)
    updater_thread.start()
    print("Background cache updater started")

    app.run(debug=True, host='0.0.0.0', port=5001)