// Script untuk Viewer Data Gempa USGS

document.addEventListener('DOMContentLoaded', function() {
    const loadBtn = document.getElementById('load-btn');
    const sizeSelect = document.getElementById('size-select');
    const sortSelect = document.getElementById('sort-select');
    const tableContainer = document.querySelector('.table-container');
    const tbody = document.getElementById('earthquake-tbody');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const results = document.getElementById('results');

    // Add null checks
    if (!loadBtn || !sizeSelect || !sortSelect) {
        console.error('Required elements not found');
        return;
    }


    loadBtn.addEventListener('click', loadEarthquakeData);

    async function loadEarthquakeData() {
        // Show loading, hide table and error
        loading.style.display = 'block';
        tableContainer.style.display = 'none';
        errorDiv.style.display = 'none';

        // Get parameters with null checks
        const size = sizeSelect ? sizeSelect.value : '20000';
        const sort = sortSelect ? sortSelect.value : 'time';
        const continent = 'all'; // Always process global data

        // Show progress bar only for large datasets (>1000)
        const progressContainer = document.getElementById('progress-container');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const sizeNum = parseInt(size);


        // Ultra-realistic progress bar based on actual system performance
        const startTime = Date.now();
        let estimatedTime;

        // Ultra-fast loading with minimal UI delay
        document.getElementById('loading-text').textContent = `Memuat data gempa...`;

        let progress = 0;
        const progressInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;

            // Realistic progress curve based on actual loading patterns
            if (elapsed < 0.1) {
                progress = elapsed * 1000; // Fast initial progress
            } else if (elapsed < 0.5) {
                progress = 10 + (elapsed - 0.1) * 200; // Medium speed
            } else {
                // Slow down for larger datasets
                const slowdown = sizeNum > 1000 ? 0.5 : 1;
                progress += (Math.random() * 5 + 2) * slowdown;
            }

            // Never exceed 90% until completion
            if (progress > 90) progress = 90;

            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }, 50); // More frequent updates for smoothness

        try {
            const response = await fetch(`http://localhost:5001/earthquakes?size=${size}&sort=${sort}&continent=${continent}`);

            // Complete progress bar
            if (parseInt(size) > 1000) {
                progressFill.style.width = '100%';
                progressText.textContent = '100%';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 500);
            }
            if (!response.ok) {
                throw new Error('Gagal mengambil data');
            }

            const data = await response.json();

            // Show cache indicator if data came from cache
            const cacheIndicator = document.getElementById('cache-indicator');
            if (data.cached) {
                cacheIndicator.style.display = 'block';
                document.getElementById('loading-text').textContent = 'Memuat data dari cache...';
            } else {
                cacheIndicator.style.display = 'none';
                document.getElementById('loading-text').textContent = 'Mengambil data terbaru dari USGS...';
            }

            // Complete progress bar
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 500);

            // Display analysis results
            const analysis = data.analysis;

            // Iterative results
            const iterative = analysis.iterative;
            document.getElementById('iterative-total').textContent = iterative.total_gempa;
            document.getElementById('iterative-rata-rata').textContent = iterative.rata_rata_magnitudo;
            document.getElementById('iterative-min').textContent = iterative.min_magnitudo;
            document.getElementById('iterative-max').textContent = iterative.max_magnitudo;
            document.getElementById('iterative-std').textContent = iterative.standar_deviasi;
            document.getElementById('iterative-berbahaya').textContent = iterative.jumlah_berbahaya;
            document.getElementById('iterative-persen').textContent = iterative.persentase_berbahaya;
            document.getElementById('iterative-waktu').textContent = iterative.waktu_eksekusi;

            // Recursive results
            const recursiveDiv = document.getElementById('recursive-results');
            const recursiveErrorDiv = document.getElementById('recursive-error');

            let recursiveTime = null;
            if (analysis.recursive.error) {
                recursiveDiv.style.display = 'none';
                recursiveErrorDiv.style.display = 'block';
                document.getElementById('recursive-error-msg').textContent = analysis.recursive.error;
            } else {
                recursiveDiv.style.display = 'block';
                recursiveErrorDiv.style.display = 'none';
                const recursive = analysis.recursive;
                document.getElementById('recursive-total').textContent = recursive.total_gempa;
                document.getElementById('recursive-rata-rata').textContent = recursive.rata_rata_magnitudo;
                document.getElementById('recursive-min').textContent = recursive.min_magnitudo;
                document.getElementById('recursive-max').textContent = recursive.max_magnitudo;
                document.getElementById('recursive-std').textContent = recursive.standar_deviasi;
                document.getElementById('recursive-berbahaya').textContent = recursive.jumlah_berbahaya;
                document.getElementById('recursive-persen').textContent = recursive.persentase_berbahaya;
                document.getElementById('recursive-waktu').textContent = recursive.waktu_eksekusi;
                recursiveTime = recursive.waktu_eksekusi;
            }

            // Plot performance chart for current size
            plotCurrentSizeChart(iterative.waktu_eksekusi, recursiveTime, size);

            // Complexity analysis
            const complexity = analysis.complexity_analysis;
            document.getElementById('iterative-best').textContent = complexity.iterative.best_case;
            document.getElementById('iterative-worst').textContent = complexity.iterative.worst_case;
            document.getElementById('iterative-average').textContent = complexity.iterative.average_case;
            document.getElementById('iterative-space').textContent = complexity.iterative.space_complexity;
            document.getElementById('iterative-suitability').textContent = complexity.iterative.suitability;

            document.getElementById('recursive-best').textContent = complexity.recursive.best_case;
            document.getElementById('recursive-worst').textContent = complexity.recursive.worst_case;
            document.getElementById('recursive-average').textContent = complexity.recursive.average_case;
            document.getElementById('recursive-space').textContent = complexity.recursive.space_complexity;
            document.getElementById('recursive-suitability').textContent = complexity.recursive.suitability;

            // Clear previous data
            tbody.innerHTML = '';

            // Populate table
            data.earthquakes.forEach((eq, index) => {
                const row = document.createElement('tr');

                // Numbering column
                const numCell = document.createElement('td');
                numCell.textContent = index + 1;
                numCell.style.fontWeight = 'bold';
                numCell.style.textAlign = 'center';

                const magCell = document.createElement('td');
                magCell.textContent = eq.magnitude ? eq.magnitude.toFixed(1) : 'N/A';
                magCell.className = getMagnitudeClass(eq.magnitude || 0);

                const locCell = document.createElement('td');
                locCell.textContent = eq.location || 'Unknown';

                const timeCell = document.createElement('td');
                timeCell.textContent = new Date(eq.time).toLocaleString();

                const latCell = document.createElement('td');
                latCell.textContent = eq.latitude ? eq.latitude.toFixed(2) : 'N/A';

                const lonCell = document.createElement('td');
                lonCell.textContent = eq.longitude ? eq.longitude.toFixed(2) : 'N/A';

                const depthCell = document.createElement('td');
                depthCell.textContent = eq.depth ? eq.depth.toFixed(1) : 'N/A';

                row.appendChild(numCell);
                row.appendChild(magCell);
                row.appendChild(locCell);
                row.appendChild(timeCell);
                row.appendChild(latCell);
                row.appendChild(lonCell);
                row.appendChild(depthCell);

                tbody.appendChild(row);
            });

            // Show results and table
            loading.style.display = 'none';
            results.style.display = 'block';
            tableContainer.style.display = 'block';

            // Plot chart after a short delay to ensure DOM is ready
            setTimeout(() => {
                plotCurrentSizeChart(iterative.waktu_eksekusi, recursiveTime, size);
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            loading.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    }

    function plotCurrentSizeChart(iterativeTime, recursiveTime, size) {
        const canvas = document.getElementById('currentSizeChart');
        if (!canvas) {
            console.error('Canvas currentSizeChart not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (window.currentSizeChartInstance) {
            window.currentSizeChartInstance.destroy();
        }

        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            return;
        }

        const labels = ['Iteratif', 'Rekursif'];
        const times = [iterativeTime, recursiveTime || 0];
        const backgroundColors = ['rgba(75, 192, 192, 0.8)', recursiveTime ? 'rgba(255, 99, 132, 0.8)' : 'rgba(128, 128, 128, 0.8)'];

        try {
            window.currentSizeChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Waktu Eksekusi (detik) untuk n=${size}`,
                        data: times,
                        backgroundColor: backgroundColors,
                        borderColor: ['rgba(75, 192, 192, 1)', recursiveTime ? 'rgba(255, 99, 132, 1)' : 'rgba(128, 128, 128, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `Perbandingan Waktu Eksekusi Algoritma (n=${size})`
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataIndex === 1 && !recursiveTime) {
                                        return 'Gagal (Stack Overflow)';
                                    }
                                    return context.dataset.label + ': ' + context.raw + ' detik';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Waktu Eksekusi (detik)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(8);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }

    function getMagnitudeClass(mag) {
        if (!mag) return 'minor';
        if (mag >= 7.0) return 'major';
        if (mag >= 6.0) return 'strong';
        if (mag >= 5.0) return 'moderate';
        if (mag >= 4.0) return 'light';
        return 'minor';
    }

    // Scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-on-scroll');
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.container, .algorithm-card, footer, .performance-chart');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Parallax effect for header
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('header');
        if (header) {
            header.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

});