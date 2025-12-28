// Script untuk Viewer Data Gempa USGS

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting Earthquake App');

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

    console.log('✅ Basic elements found, setting up event listeners');

    loadBtn.addEventListener('click', loadEarthquakeData);

    // Initialize algorithm tooltips immediately for testing
    console.log('🎯 Setting up algorithm tooltips...');
    setTimeout(() => {
        setupAlgorithmTooltips();
    }, 500);

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
            document.getElementById('iterative-berbahaya').textContent = `${iterative.jumlah_berbahaya} (${iterative.persentase_berbahaya}%)`;
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
                document.getElementById('recursive-berbahaya').textContent = `${recursive.jumlah_berbahaya} (${recursive.persentase_berbahaya}%)`;
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

            // Hide table placeholder
            const tablePlaceholder = document.getElementById('table-placeholder');
            if (tablePlaceholder) tablePlaceholder.style.display = 'none';

            // Populate table
            data.earthquakes.forEach((eq, index) => {
                const row = document.createElement('tr');

                // Highlight dangerous earthquakes (magnitude >= 5.0)
                if (eq.magnitude >= 5.0) {
                    row.classList.add('dangerous-earthquake');
                }

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

            // Initialize interactive algorithm code explanations after results are displayed
            setTimeout(() => {
                setupAlgorithmTooltips();
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

    // Initialize interactive algorithm code explanations after data is loaded
    // This will be called in loadEarthquakeData after results are displayed

    // Also initialize immediately for testing (will be overridden after data loads)
    setTimeout(() => {
        setupAlgorithmTooltips();
    }, 1000);

});

function setupAlgorithmTooltips() {
    alert('🎯 SETUP: Starting algorithm tooltips setup...');

    // Find code blocks
    const codeBlocks = document.querySelectorAll('.algorithm-code pre code');
    alert('📝 FOUND: ' + codeBlocks.length + ' algorithm code blocks');

    if (codeBlocks.length === 0) {
        alert('❌ ERROR: No algorithm code blocks found!');
        return;
    }

    codeBlocks.forEach((block, index) => {
        const isIterative = index === 0;
        alert('🔧 SETTING UP: ' + (isIterative ? 'Iterative' : 'Recursive') + ' algorithm block');

        // Make block interactive
        block.style.cursor = 'crosshair';
        block.style.border = '2px solid #3182ce';
        block.style.borderRadius = '8px';
        block.style.padding = '10px';
        block.style.background = 'rgba(49, 130, 206, 0.05)';

        // Add click listener for testing
        block.addEventListener('click', () => {
            alert('🎯 CLICKED: Code block is interactive!');
        });

        // Add hover listener
        block.addEventListener('mouseenter', (e) => {
            alert('🎯 HOVER: Mouse entered code block');
            showSimpleTooltip(e, 'This code is interactive! Hover over lines for explanations.');
        });

        block.addEventListener('mouseleave', () => {
            alert('🚫 HOVER: Mouse left code block');
            hideCodeTooltip();
        });

        // Add mousemove for line detection
        block.addEventListener('mousemove', (event) => {
            handleSimpleLineHover(event, block, isIterative);
        });

        alert('✅ SUCCESS: Set up block ' + (index + 1));
    });

    alert('🎉 COMPLETE: Algorithm tooltips setup finished!');
}

function handleSimpleLineHover(event, codeBlock, isIterative) {
    const rect = codeBlock.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(codeBlock).lineHeight) || 20;
    const y = event.clientY - rect.top;
    const lineIndex = Math.floor(y / lineHeight);

    // Get lines
    const codeText = codeBlock.textContent;
    const lines = codeText.split('\n').filter(line => line.trim() !== '');

    if (lineIndex >= 0 && lineIndex < lines.length) {
        const explanations = getAlgorithmExplanations(isIterative);
        const explanation = explanations[lineIndex] || `Line ${lineIndex + 1} of ${isIterative ? 'iterative' : 'recursive'} algorithm`;

        alert('📍 LINE HOVER: Line ' + (lineIndex + 1) + ' - ' + explanation.substring(0, 50) + '...');
        showSimpleTooltip(event, explanation);
    }
}

function showSimpleTooltip(event, message) {
    // Remove existing
    hideCodeTooltip();

    // Create simple tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'code-tooltip';
    tooltip.textContent = message;
    tooltip.style.position = 'fixed';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
    tooltip.style.background = 'black';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.maxWidth = '300px';
    tooltip.style.zIndex = '10000';

    document.body.appendChild(tooltip);
    alert('💬 TOOLTIP: Created tooltip with message');
}

function showCodeTooltipForLine(event, tooltipData) {
    // Remove existing tooltip
    hideCodeTooltip();

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'code-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-content">${tooltipData.explanation}</div>
    `;

    // Position tooltip very close to cursor (inline style)
    let left = event.pageX + 8; // Very close to cursor
    let top = event.pageY + 8;  // Slightly below cursor

    // Adjust if tooltip would go off-screen
    const tooltipWidth = 350; // smaller width for inline feel
    const tooltipHeight = 60;  // smaller height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (left + tooltipWidth > windowWidth) {
        left = event.pageX - tooltipWidth - 8; // Show on left side
    }

    if (top + tooltipHeight > windowHeight) {
        top = event.pageY - tooltipHeight - 8; // Show above cursor
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.maxWidth = tooltipWidth + 'px';

    // Add to DOM
    document.body.appendChild(tooltip);

    // Trigger reflow for animation
    tooltip.offsetHeight;
    tooltip.classList.add('visible');
}

function getAlgorithmExplanations(isIterative) {
    if (isIterative) {
        return [
            "Fungsi utama yang menganalisis data gempa secara iteratif - O(n) waktu, O(1) ruang",
            "Menginisialisasi timer untuk mengukur performa eksekusi algoritma",
            "Variabel akumulator untuk total gempa - menggunakan memori tetap O(1)",
            "Variabel untuk menghitung rata-rata magnitudo - akumulasi linier",
            "Counter untuk gempa berbahaya (≥5.0) - logika kondisional sederhana",
            "Tracking nilai minimum magnitudo - inisialisasi dengan infinity",
            "Tracking nilai maksimum magnitudo - inisialisasi dengan negative infinity",
            "Variabel untuk menghitung variansi statistik - akumulasi kuadrat",
            "Loop utama O(n) - memproses setiap feature gempa secara berurutan",
            "Ekstraksi magnitudo dari data geoJSON - akses properti nested",
            "Inkrementasi counter total gempa - operasi atomik O(1)",
            "Akumulasi sum magnitudo untuk perhitungan rata-rata - O(1) per iterasi",
            "Akumulasi sum squares untuk perhitungan variansi - O(1) per iterasi",
            "Update minimum magnitudo menggunakan fungsi min - O(1) comparison",
            "Update maksimum magnitudo menggunakan fungsi max - O(1) comparison",
            "Kondisi untuk mendeteksi gempa berbahaya ≥5.0 - branching sederhana",
            "Perhitungan statistik final setelah loop selesai - O(1) operasi",
            "Rata-rata = total sum dibagi jumlah elemen - formula statistik standar",
            "Variansi = rata-rata kuadrat dikurangi kuadrat rata-rata - O(1)",
            "Standar deviasi = akar kuadrat variansi - menggunakan math library",
            "Persentase gempa berbahaya = (berbahaya/total) × 100 - O(1)",
            "Stop timer dan hitung waktu eksekusi total - performance measurement",
            "Return dictionary hasil analisis lengkap - struktur data O(1)"
        ];
    } else {
        return [
            "Fungsi rekursif untuk analisis data gempa - O(n) waktu, O(n) ruang stack",
            "Parameter index untuk tracking posisi saat ini dalam array - O(1)",
            "Parameter total_gempa untuk akumulasi counter - passed by value",
            "Parameter sum_magnitudo untuk akumulasi total - passed by value",
            "Parameter jumlah_berbahaya untuk tracking gempa ≥5.0 - passed by value",
            "Parameter sum_squares untuk perhitungan variansi - passed by value",
            "Parameter min_mag untuk tracking minimum - passed by value",
            "Parameter max_mag untuk tracking maksimum - passed by value",
            "Base case: jika index mencapai panjang array, hitung hasil final - O(1)",
            "Perhitungan rata-rata dari akumulasi sum - formula statistik",
            "Perhitungan variansi menggunakan formula: E[X²] - (E[X])² - O(1)",
            "Perhitungan standar deviasi sebagai akar variansi - math operation",
            "Perhitungan persentase gempa berbahaya - O(1) arithmetic",
            "Return struktur data hasil analisis - base case completion",
            "Ekstraksi magnitudo dari current feature - array access O(1)",
            "Update total gempa dengan increment - O(1) arithmetic",
            "Update sum magnitudo dengan akumulasi - O(1) arithmetic",
            "Update sum squares untuk variansi - O(1) arithmetic",
            "Update minimum magnitudo - comparison operation O(1)",
            "Update maksimum magnitudo - comparison operation O(1)",
            "Update counter gempa berbahaya dengan kondisi - ternary operator",
            "Recursive call dengan parameter terupdate - stack frame allocation O(1)",
            "Passing semua state ke recursive call berikutnya - O(1) per parameter"
        ];
    }
}

// Legacy function - kept for compatibility but not used in new implementation
function showCodeTooltip(event) {
    // This function is no longer used - replaced by showCodeTooltipForLine
    console.log('Legacy showCodeTooltip called - this should not happen');
}

function hideCodeTooltip() {
    // Remove existing tooltips
    const existingTooltips = document.querySelectorAll('.code-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());

    // Remove highlight from all lines
    const highlightedLines = document.querySelectorAll('.code-line-highlighted');
    highlightedLines.forEach(line => line.classList.remove('code-line-highlighted'));
}