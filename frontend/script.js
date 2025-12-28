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

    // Algorithm tooltips removed as per user request

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
            
                console.log('🔧 Setting up algorithm tooltips...');
            
                // Find code blocks
                const codeBlocks = document.querySelectorAll('.algorithm-code pre code');
                console.log('📝 Found code blocks:', codeBlocks.length);
            
                codeBlocks.forEach((block, index) => {
                    const isIterative = index === 0;
            
                    // Add pointer cursor to indicate clickable
                    block.style.cursor = 'pointer';
                    block.style.transition = 'background-color 0.2s ease';
            
                    // Add event listeners
                    block.addEventListener('mouseenter', (e) => {
                        block.style.backgroundColor = 'rgba(49, 130, 206, 0.05)';
                    });
            
                    block.addEventListener('mouseleave', (e) => {
                        block.style.backgroundColor = '';
                    });
            
                    // Add click for detailed comment display
                    block.addEventListener('click', (event) => {
                        const rect = block.getBoundingClientRect();
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
            
                        // Only process if click is within the text area
                        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                            // Estimate which line based on Y position
                            const lineHeight = 20;
                            const lineIndex = Math.floor(y / lineHeight);
            
                            // Get code content
                            const codeText = block.textContent || block.innerText;
                            const lines = codeText.split('\n').filter(line => line.trim().length > 0);
            
                            if (lineIndex >= 0 && lineIndex < lines.length) {
                                const explanations = getAlgorithmExplanations(isIterative);
                                const commentObj = explanations[lineIndex];
                                if (commentObj) {
                                    showDetailedCommentModal(event, commentObj);
                                }
                            }
                        }
                    });
                });
            
                console.log('🎉 All algorithm tooltips setup complete');
            }
            
            function handleSimpleLineHover(event, codeBlock, isIterative) {
                // Get mouse position relative to code block
                const rect = codeBlock.getBoundingClientRect();
                const relativeY = event.clientY - rect.top;
            
                // Estimate line height (typical monospace font)
                const lineHeight = 20; // Fixed height for reliability
                const lineIndex = Math.floor(relativeY / lineHeight);
            
                // Get code lines
                const codeText = codeBlock.textContent || codeBlock.innerText;
                const lines = codeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
                // Check if we're over a valid line
                if (lineIndex >= 0 && lineIndex < lines.length && relativeY >= 0) {
                    const currentLine = lines[lineIndex];
            
                    // Only show tooltip if mouse is actually over text (not empty space)
                    if (currentLine && currentLine.length > 0) {
                        const explanations = getAlgorithmExplanations(isIterative);
                        const explanation = explanations[lineIndex] || `Baris ${lineIndex + 1}: ${currentLine.substring(0, 30)}...`;
            
                        showInlineTooltip(event, explanation);
                    }
                } else {
                    hideCodeTooltip();
                }
            }
            
            function showInlineTooltip(event, message) {
                // Remove existing tooltip
                hideCodeTooltip();
            
                // Create tooltip that appears right next to cursor
                const tooltip = document.createElement('div');
                tooltip.className = 'inline-tooltip';
                tooltip.textContent = message;
            
                // Position next to cursor
                tooltip.style.position = 'fixed';
                tooltip.style.left = (event.pageX + 12) + 'px';
                tooltip.style.top = (event.pageY - 8) + 'px';
            
                // Blue theme styling with fade in animation
                tooltip.style.background = 'rgba(49, 130, 206, 0.95)';
                tooltip.style.color = 'white';
                tooltip.style.padding = '8px 12px';
                tooltip.style.borderRadius = '6px';
                tooltip.style.fontSize = '13px';
                tooltip.style.fontWeight = '500';
                tooltip.style.maxWidth = '350px';
                tooltip.style.zIndex = '10000';
                tooltip.style.boxShadow = '0 3px 10px rgba(49, 130, 206, 0.3)';
                tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(5px)';
                tooltip.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
                // Smart positioning - adjust if off-screen
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
            
                // If tooltip would go off right edge, show on left
                if (event.pageX + 12 + 350 > windowWidth) {
                    tooltip.style.left = (event.pageX - 362) + 'px';
                }
            
                // If tooltip would go off bottom, show above
                if (event.pageY - 8 + 60 > windowHeight) {
                    tooltip.style.top = (event.pageY - 68) + 'px';
                }
            
                document.body.appendChild(tooltip);
            
                // Trigger fade in animation
                requestAnimationFrame(() => {
                    tooltip.style.opacity = '1';
                    tooltip.style.transform = 'translateY(0)';
                });
            }
            
            function showDetailedCommentModal(event, commentObj) {
                // Remove existing modals
                hideCodeTooltip();
            
                // Create backdrop with blur
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop';
                backdrop.style.position = 'fixed';
                backdrop.style.top = '0';
                backdrop.style.left = '0';
                backdrop.style.width = '100%';
                backdrop.style.height = '100%';
                backdrop.style.background = 'transparent';
                backdrop.style.backdropFilter = 'blur(2px)';
                backdrop.style.zIndex = '10000';
            
                // Create modal overlay
                const modal = document.createElement('div');
                modal.className = 'comment-modal';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.zIndex = '10001';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.style.pointerEvents = 'none'; // Allow clicks to pass through to backdrop
            
                // Create modal content
                const content = document.createElement('div');
                content.style.background = 'white';
                content.style.padding = '20px';
                content.style.borderRadius = '8px';
                content.style.maxWidth = '600px';
                content.style.maxHeight = '80vh';
                content.style.overflow = 'auto';
                content.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                content.style.position = 'relative';
                content.style.pointerEvents = 'auto'; // Enable interaction with content
            
                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.textContent = '×';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '10px';
                closeBtn.style.right = '10px';
                closeBtn.style.background = 'none';
                closeBtn.style.border = 'none';
                closeBtn.style.fontSize = '24px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.color = '#666';
                closeBtn.onclick = () => {
                    modal.remove();
                    document.body.style.filter = '';
                    document.body.style.pointerEvents = '';
                };
            
                // Title
                const title = document.createElement('h3');
                title.textContent = 'Penjelasan Kode';
                title.style.marginTop = '0';
                title.style.color = '#2c3e50';
            
                // Explanation
                const expTitle = document.createElement('h4');
                expTitle.textContent = 'Penjelasan:';
                expTitle.style.color = '#34495e';
                expTitle.style.marginBottom = '5px';
                const expText = document.createElement('p');
                expText.textContent = commentObj.explanation;
                expText.style.marginBottom = '15px';
            
                // Function
                const funcTitle = document.createElement('h4');
                funcTitle.textContent = 'Fungsi:';
                funcTitle.style.color = '#34495e';
                funcTitle.style.marginBottom = '5px';
                const funcText = document.createElement('p');
                funcText.textContent = commentObj.function;
                funcText.style.marginBottom = '15px';
            
                // Example
                const exTitle = document.createElement('h4');
                exTitle.textContent = 'Contoh Implementasi:';
                exTitle.style.color = '#34495e';
                exTitle.style.marginBottom = '5px';
                const exText = document.createElement('pre');
                exText.textContent = commentObj.example;
                exText.style.background = '#f8f9fa';
                exText.style.padding = '10px';
                exText.style.borderRadius = '4px';
                exText.style.fontFamily = 'monospace';
                exText.style.fontSize = '14px';
                exText.style.overflow = 'auto';
            
                // Append all
                content.appendChild(closeBtn);
                content.appendChild(title);
                content.appendChild(expTitle);
                content.appendChild(expText);
                content.appendChild(funcTitle);
                content.appendChild(funcText);
                content.appendChild(exTitle);
                content.appendChild(exText);
                modal.appendChild(content);
            
                // Close on overlay click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                        document.body.style.filter = '';
                        document.body.style.pointerEvents = '';
                    }
                });
            
                document.body.appendChild(modal);
            }
            
            // Old function - replaced by showSimpleTooltip
            
            function getAlgorithmExplanations(isIterative) {
                if (isIterative) {
                    return [
                        {
                            explanation: "Mendefinisikan fungsi utama analisis gempa dengan pendekatan iteratif",
                            function: "Fungsi ini menganalisis array data gempa menggunakan loop for untuk menghitung statistik",
                            example: "analyze_earthquakes_iterative([{'properties': {'mag': 5.2}}, {'properties': {'mag': 4.1}}])"
                        },
                        {
                            explanation: "Memulai timer untuk mengukur waktu eksekusi algoritma",
                            function: "Menggunakan time.time() untuk mendapatkan timestamp awal sebelum eksekusi",
                            example: "start_time = time.time()  # Mengembalikan waktu dalam detik sejak epoch"
                        },
                        {
                            explanation: "Inisialisasi variabel counter untuk menghitung total gempa",
                            function: "Variabel ini akan diincrement untuk setiap feature yang diproses",
                            example: "total_gempa = 0  # Akan menjadi 2 setelah memproses 2 gempa"
                        },
                        {
                            explanation: "Inisialisasi variabel untuk menghitung jumlah total magnitudo",
                            function: "Akumulator untuk menjumlahkan semua nilai magnitudo gempa",
                            example: "sum_magnitudo = 0.0  # Akan menjadi 9.3 setelah menjumlahkan 5.2 + 4.1"
                        },
                        {
                            explanation: "Inisialisasi counter untuk gempa dengan magnitudo ≥5.0",
                            function: "Menghitung jumlah gempa yang dianggap berbahaya (magnitudo tinggi)",
                            example: "jumlah_berbahaya = 0  # Akan menjadi 1 jika ada gempa dengan mag >= 5.0"
                        },
                        {
                            explanation: "Inisialisasi variabel minimum magnitudo dengan nilai tak terhingga",
                            function: "Menggunakan float('inf') sebagai nilai awal untuk menemukan magnitudo terkecil",
                            example: "min_mag = float('inf')  # Akan diperbarui menjadi 4.1 setelah perbandingan"
                        },
                        {
                            explanation: "Inisialisasi variabel maksimum magnitudo dengan nilai negatif tak terhingga",
                            function: "Menggunakan float('-inf') sebagai nilai awal untuk menemukan magnitudo terbesar",
                            example: "max_mag = float('-inf')  # Akan diperbarui menjadi 5.2 setelah perbandingan"
                        },
                        {
                            explanation: "Inisialisasi variabel untuk menghitung kuadrat magnitudo",
                            function: "Diperlukan untuk perhitungan variansi statistik menggunakan formula E[X²]",
                            example: "sum_squares = 0.0  # Akan menjadi 27.25 + 16.81 = 44.06"
                        },
                        {
                            explanation: "Memulai loop untuk memproses setiap data gempa dalam array",
                            function: "Iterasi melalui setiap feature dalam array dengan kompleksitas O(n)",
                            example: "for feature in features:  # features adalah list dari geoJSON features"
                        },
                        {
                            explanation: "Mengekstrak nilai magnitudo dari objek geoJSON feature",
                            function: "Mengakses nested dictionary untuk mendapatkan nilai magnitudo",
                            example: "magnitudo = feature['properties']['mag']  # Mengambil nilai 5.2 dari properties"
                        },
                        {
                            explanation: "Menambah counter total gempa sebesar 1",
                            function: "Increment counter untuk setiap gempa yang diproses",
                            example: "total_gempa += 1  # Dari 0 menjadi 1, kemudian 2, dst."
                        },
                        {
                            explanation: "Menambahkan magnitudo ke total sum untuk perhitungan rata-rata",
                            function: "Akumulasi nilai magnitudo untuk perhitungan mean",
                            example: "sum_magnitudo += magnitudo  # 0.0 + 5.2 = 5.2, kemudian + 4.1 = 9.3"
                        },
                        {
                            explanation: "Menambahkan kuadrat magnitudo untuk perhitungan variansi",
                            function: "Menghitung sum dari kuadrat nilai untuk formula variansi",
                            example: "sum_squares += magnitudo ** 2  # 5.2² = 27.04, kemudian + 4.1² = 16.81"
                        },
                        {
                            explanation: "Memperbarui nilai minimum jika magnitudo lebih kecil",
                            function: "Membandingkan dan mengupdate nilai minimum menggunakan min()",
                            example: "min_mag = min(min_mag, magnitudo)  # min(inf, 5.2) = 5.2, kemudian min(5.2, 4.1) = 4.1"
                        },
                        {
                            explanation: "Memperbarui nilai maksimum jika magnitudo lebih besar",
                            function: "Membandingkan dan mengupdate nilai maksimum menggunakan max()",
                            example: "max_mag = max(max_mag, magnitudo)  # max(-inf, 5.2) = 5.2, kemudian max(5.2, 4.1) = 5.2"
                        },
                        {
                            explanation: "Menambah counter gempa berbahaya jika magnitudo ≥5.0",
                            function: "Conditional increment untuk gempa dengan magnitudo tinggi",
                            example: "if magnitudo >= 5.0: jumlah_berbahaya += 1  # Jika 5.2 >= 5.0, counter +1"
                        },
                        {
                            explanation: "Mengakhiri loop dan memulai perhitungan statistik final",
                            function: "Setelah semua data diproses, hitung statistik akhir",
                            example: "# Loop selesai, sekarang hitung rata-rata, variansi, dll."
                        },
                        {
                            explanation: "Menghitung rata-rata magnitudo dari total sum",
                            function: "Mean = total sum dibagi jumlah data, dengan pengecekan pembagian nol",
                            example: "rata_rata = 9.3 / 2 = 4.65  # Jika total_gempa > 0"
                        },
                        {
                            explanation: "Menghitung variansi menggunakan formula statistik",
                            function: "Variansi = E[X²] - (E[X])² untuk mengukur sebaran data",
                            example: "variansi = (44.06 / 2) - (4.65 ** 2) = 22.03 - 21.6225 = 0.4075"
                        },
                        {
                            explanation: "Menghitung standar deviasi sebagai akar kuadrat variansi",
                            function: "Std dev = sqrt(variansi) untuk mengukur deviasi standar",
                            example: "std_dev = math.sqrt(0.4075) ≈ 0.638  # Akar kuadrat variansi"
                        },
                        {
                            explanation: "Menghitung persentase gempa berbahaya dari total",
                            function: "Persentase = (jumlah berbahaya / total) * 100",
                            example: "persentase = (1 / 2) * 100 = 50.0%  # 1 dari 2 gempa berbahaya"
                        },
                        {
                            explanation: "Menghentikan timer dan menghitung total waktu eksekusi",
                            function: "Mengukur waktu yang dibutuhkan algoritma untuk menyelesaikan",
                            example: "execution_time = time.time() - start_time  # Total waktu dalam detik"
                        },
                        {
                            explanation: "Mengembalikan objek hasil analisis lengkap",
                            function: "Return dictionary berisi semua statistik yang dihitung",
                            example: "return {'total_gempa': 2, 'rata_rata_magnitudo': 4.65, ...}"
                        }
                    ];
                } else {
                    return [
                        {
                            explanation: "Mendefinisikan fungsi rekursif untuk analisis data gempa",
                            function: "Fungsi dengan multiple parameters untuk akumulasi state rekursif",
                            example: "analyze_earthquakes_recursive(features, 0, 0, 0.0, 0, 0.0, inf, -inf)"
                        },
                        {
                            explanation: "Parameter index untuk melacak posisi dalam array",
                            function: "Menunjukkan elemen mana yang sedang diproses dalam rekursi",
                            example: "index=0  # Memproses elemen pertama, kemudian 1, 2, dst."
                        },
                        {
                            explanation: "Parameter total_gempa untuk akumulasi counter",
                            function: "Menghitung total gempa yang telah diproses",
                            example: "total_gempa=0  # Akan bertambah 1 setiap rekursi"
                        },
                        {
                            explanation: "Parameter sum_magnitudo untuk akumulasi total magnitudo",
                            function: "Menjumlahkan semua magnitudo yang telah diproses",
                            example: "sum_magnitudo=0.0  # Akumulasi nilai magnitudo"
                        },
                        {
                            explanation: "Parameter jumlah_berbahaya untuk menghitung gempa ≥5.0",
                            function: "Counter untuk gempa dengan magnitudo tinggi",
                            example: "jumlah_berbahaya=0  # Increment jika mag >= 5.0"
                        },
                        {
                            explanation: "Parameter sum_squares untuk perhitungan variansi",
                            function: "Akumulasi kuadrat magnitudo untuk statistik",
                            example: "sum_squares=0.0  # Sum dari magnitudo^2"
                        },
                        {
                            explanation: "Parameter min_mag untuk tracking nilai minimum",
                            function: "Menyimpan magnitudo terkecil yang ditemukan",
                            example: "min_mag=float('inf')  # Akan diperbarui ke nilai terkecil"
                        },
                        {
                            explanation: "Parameter max_mag untuk tracking nilai maksimum",
                            function: "Menyimpan magnitudo terbesar yang ditemukan",
                            example: "max_mag=float('-inf')  # Akan diperbarui ke nilai terbesar"
                        },
                        {
                            explanation: "Memeriksa base case: apakah telah mencapai akhir array",
                            function: "Condition untuk menghentikan rekursi ketika semua elemen diproses",
                            example: "if index >= len(features):  # Jika index = 2, len = 2, maka stop"
                        },
                        {
                            explanation: "Menghitung rata-rata dari total sum magnitudo",
                            function: "Mean = sum dibagi total gempa dengan safety check",
                            example: "rata_rata = 9.3 / 2 = 4.65 jika total_gempa > 0"
                        },
                        {
                            explanation: "Menghitung variansi menggunakan formula E[X²] - (E[X])²",
                            function: "Variansi = rata-rata kuadrat - kuadrat rata-rata",
                            example: "variansi = (44.06/2) - (4.65)^2 = 22.03 - 21.62 = 0.41"
                        },
                        {
                            explanation: "Menghitung standar deviasi sebagai akar kuadrat variansi",
                            function: "Std dev = sqrt(variansi) untuk mengukur sebaran",
                            example: "std_dev = math.sqrt(0.41) ≈ 0.64"
                        },
                        {
                            explanation: "Menghitung persentase gempa berbahaya",
                            function: "Persentase = (berbahaya / total) * 100",
                            example: "persentase = (1 / 2) * 100 = 50.0%"
                        },
                        {
                            explanation: "Mengembalikan objek hasil analisis lengkap",
                            function: "Return dictionary dengan semua statistik terhitung",
                            example: "return {'total_gempa': 2, 'rata_rata_magnitudo': 4.65, ...}"
                        },
                        {
                            explanation: "Mengekstrak magnitudo dari feature saat ini",
                            function: "Mengambil nilai magnitudo dari elemen array yang sedang diproses",
                            example: "magnitudo = features[index]['properties']['mag']  # Ambil mag dari elemen ke-index"
                        },
                        {
                            explanation: "Menambah counter total gempa",
                            function: "Increment total counter untuk setiap elemen yang diproses",
                            example: "new_total_gempa = total_gempa + 1  # 0 + 1 = 1"
                        },
                        {
                            explanation: "Menambahkan magnitudo ke sum untuk rata-rata",
                            function: "Akumulasi magnitudo untuk perhitungan mean",
                            example: "new_sum_magnitudo = sum_magnitudo + magnitudo  # 0.0 + 5.2 = 5.2"
                        },
                        {
                            explanation: "Menambahkan kuadrat magnitudo untuk variansi",
                            function: "Menghitung sum kuadrat untuk formula variansi",
                            example: "new_sum_squares = sum_squares + magnitudo ** 2  # 0.0 + 27.04 = 27.04"
                        },
                        {
                            explanation: "Memperbarui nilai minimum magnitudo",
                            function: "Update min_mag jika magnitudo saat ini lebih kecil",
                            example: "new_min_mag = min(min_mag, magnitudo)  # min(inf, 5.2) = 5.2"
                        },
                        {
                            explanation: "Memperbarui nilai maksimum magnitudo",
                            function: "Update max_mag jika magnitudo saat ini lebih besar",
                            example: "new_max_mag = max(max_mag, magnitudo)  # max(-inf, 5.2) = 5.2"
                        },
                        {
                            explanation: "Menambah counter gempa berbahaya jika memenuhi syarat",
                            function: "Increment counter jika magnitudo >= 5.0",
                            example: "new_jumlah_berbahaya = jumlah_berbahaya + (1 if magnitudo >= 5.0 else 0)"
                        },
                        {
                            explanation: "Melakukan pemanggilan rekursif dengan parameter terbaru",
                            function: "Rekursi dengan index + 1 dan state terupdate",
                            example: "return analyze_earthquakes_recursive(features, 1, 1, 5.2, 1, 27.04, 5.2, 5.2)"
                        },
                        {
                            explanation: "Meneruskan semua state ke pemanggilan rekursif berikutnya",
                            function: "Mengirim semua variabel terupdate ke rekursi berikutnya",
                            example: "# Semua parameter dikirim ke call berikutnya untuk melanjutkan akumulasi"
                        }
                    ];
                }
            }
            
            // Legacy functions removed - using showInlineTooltip now
            
            function hideCodeTooltip() {
                // Remove existing tooltips and modals
                const existingTooltips = document.querySelectorAll('.code-tooltip, .inline-tooltip, .comment-modal');
                existingTooltips.forEach(tooltip => tooltip.remove());
            }
            // Show results and table
            loading.style.display = 'none';
            results.style.display = 'block';
            tableContainer.style.display = 'block';

            // Initialize interactive algorithm code explanations after data is loaded
            setupAlgorithmTooltips();

            // Initialize chart display after results are displayed
            setTimeout(() => {
                plotCurrentSizeChart(iterative.waktu_eksekusi, recursiveTime, size);
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            loading.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    }

    function setupAlgorithmTooltips() {
        console.log('🔧 Setting up algorithm tooltips...');

        // Find code blocks
        const codeBlocks = document.querySelectorAll('.algorithm-code pre code');
        console.log('📝 Found code blocks:', codeBlocks.length);

        codeBlocks.forEach((block, index) => {
            const isIterative = index === 0;

            // Add pointer cursor to indicate clickable
            block.style.cursor = 'pointer';
            block.style.transition = 'background-color 0.2s ease';

            // Add event listeners
            block.addEventListener('mouseenter', (e) => {
                block.style.backgroundColor = 'rgba(49, 130, 206, 0.05)';
            });

            block.addEventListener('mouseleave', (e) => {
                block.style.backgroundColor = '';
            });

            // Add click for detailed comment display
            block.addEventListener('click', (event) => {
                const rect = block.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                // Only process if click is within the text area
                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    // Estimate which line based on Y position
                    const lineHeight = 20;
                    const lineIndex = Math.floor(y / lineHeight);

                    // Get code content
                    const codeText = block.textContent || block.innerText;
                    const lines = codeText.split('\n').filter(line => line.trim().length > 0);

                    if (lineIndex >= 0 && lineIndex < lines.length) {
                        const explanations = getAlgorithmExplanations(isIterative);
                        const commentObj = explanations[lineIndex];
                        if (commentObj) {
                            showDetailedCommentModal(event, commentObj);
                        }
                    }
                }
            });
        });

        console.log('🎉 All algorithm tooltips setup complete');
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