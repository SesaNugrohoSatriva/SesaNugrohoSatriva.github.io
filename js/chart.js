let chartKematianInst, chartPersenInst, chartVaksinasiInst, chartGabunganInst, chartMapInst;
let inaGeoJson = null;

// Palet warna standar yang mirip dengan Microsoft Excel
const excelColors = [
    '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47', '#264478', '#9E480E', '#636363', '#997300',
    '#255E91', '#43682B', '#698ED0', '#F1975A', '#B7B7B7', '#FFCD33', '#82B3E1', '#8ECA65', '#162948', '#5E2B08',
    '#3B3B3B', '#5C4500', '#163857', '#283E1A', '#A3BCE6', '#F6BE96', '#D1D1D1', '#FFE07D', '#B1D1ED', '#BFE0A6'
];

// Ubah font bawaan Chart.js agar lebih rapi
Chart.defaults.font.family = "'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif";
Chart.defaults.color = '#595959';

function render4Charts(dataMingguan, dataProvinsi, selectedProvinsi) {
    // Bersihkan chart lama saat filter diterapkan
    if (chartKematianInst) chartKematianInst.destroy();
    if (chartPersenInst) chartPersenInst.destroy();
    if (chartVaksinasiInst) chartVaksinasiInst.destroy();
    if (chartGabunganInst) chartGabunganInst.destroy();
    if (chartMapInst) chartMapInst.destroy();

    // --- 1. PROSES DATA MINGGUAN ---
    let listMinggu = [...new Set(dataMingguan.map(r => r[0]))].sort((a, b) => a - b);
    let listProvinsi = [...new Set(dataMingguan.map(r => r[1]))].sort();

    let dsKematian = [], dsPersen = [], dsVaksinasi = [];

    listProvinsi.forEach((prov, i) => {
        let dKem = [], dPer = [], dVak = [];

        listMinggu.forEach(m => {
            let row = dataMingguan.find(r => r[0] === m && r[1] === prov);
            // Gunakan 'null' jika data tidak ada, agar garis terputus rapi, bukan anjlok ke 0
            dKem.push(row ? row[2] : null);
            dVak.push(row ? row[3] : null);
            dPer.push(row ? row[4] : null);
        });

        let baseStyle = {
            label: prov,
            borderColor: excelColors[i % excelColors.length],
            borderWidth: 1.5,
            pointRadius: 0, // Hilangkan titik (dots) agar garis bersih seperti Excel
            pointHoverRadius: 4,
            fill: false,
            tension: 0 // Garis lurus patah-patah, bukan melengkung
        };

        dsKematian.push({ ...baseStyle, data: dKem });
        dsPersen.push({ ...baseStyle, data: dPer });
        dsVaksinasi.push({ ...baseStyle, data: dVak });
    });
    // --- TEMPLATE PENGATURAN UNTUK 3 GRAFIK MINGGUAN ---
    const getCommonOptions = (title, isPercent = false) => ({
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { right: 15 } // Memberi ruang ekstra di sisi kanan agar legenda tidak mepet
        },
        plugins: {
            title: { display: true, text: title, font: { size: 14, weight: '600' }, padding: { bottom: 15 } },
            legend: {
                position: 'right',
                align: 'start',
                labels: {
                    boxWidth: 8,       // Ukuran kotak warna diperkecil
                    font: { size: 9 },
                    usePointStyle: false,
                    padding: 6         // Jarak antar nama provinsi dirapatkan
                }
            },
            tooltip: {
                mode: 'nearest',   // <--- HANYA TAMPILKAN YANG DI-HOVER
                intersect: false,   // <--- Harus tepat menyentuh garis untuk muncul
                bodyFont: { size: 11 },
                titleFont: { size: 12 }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 10 }, maxRotation: 0 }
            },
            y: {
                grid: { color: '#f0f0f0' },
                ticks: {
                    font: { size: 10 },
                    callback: function (value) { return isPercent ? value + '%' : value; }
                }
            }
        },
        interaction: { mode: 'nearest', axis: 'xy', intersect: false }
    });

    // RENDER GRAFIK 1, 2, 3
    const ctx1 = document.getElementById("chartKematian").getContext("2d");
    chartKematianInst = new Chart(ctx1, { type: "line", data: { labels: listMinggu, datasets: dsKematian }, options: getCommonOptions("Jumlah Kematian Per Minggu") });

    const ctx2 = document.getElementById("chartPersentase").getContext("2d");
    chartPersenInst = new Chart(ctx2, { type: "line", data: { labels: listMinggu, datasets: dsPersen }, options: getCommonOptions("Persentase Perbandingan Kematian vs Vaksinasi", true) });

    const ctx3 = document.getElementById("chartVaksinasi").getContext("2d");
    chartVaksinasiInst = new Chart(ctx3, { type: "line", data: { labels: listMinggu, datasets: dsVaksinasi }, options: getCommonOptions("Jumlah Vaksinasi Per Minggu") });


    // --- 2. PROSES & RENDER GRAFIK GABUNGAN (TOTAL PROVINSI) ---
    let labelsProv = dataProvinsi.map(r => r[0]);
    let dataKemTotal = dataProvinsi.map(r => r[1]);
    let dataVaksTotal = dataProvinsi.map(r => r[2]);

    const ctx4 = document.getElementById("chartTotalGabungan").getContext("2d");
    chartGabunganInst = new Chart(ctx4, {
        type: "line",
        data: {
            labels: labelsProv,
            datasets: [
                { label: "Jumlah Vaksinasi", data: dataVaksTotal, borderColor: "#ED7D31", borderWidth: 2, pointRadius: 2, fill: false, tension: 0 },
                { label: "Jumlah Kematian", data: dataKemTotal, borderColor: "#4472C4", borderWidth: 2, pointRadius: 2, fill: false, tension: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: 'index',
                intersect: false
            },

            plugins: {
                title: { display: true, text: "Jumlah Vaksinasi dan Kematian", font: { size: 14, weight: '600' } },
                legend: { position: 'bottom', labels: { boxWidth: 15, font: { size: 11 } } },

                // --- TAMBAHKAN TOOLTIP DI SINI ---
                tooltip: {
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, minRotation: 45, font: { size: 9 } }
                },
                y: { ticks: { font: { size: 10 } } }
            }
        }
    });
    const renderMap = () => {
        const features = inaGeoJson.features;

        // 1. BUAT KAMUS ALIAS PROVINSI
        // Kiri: Nama di GeoJSON | Kanan: Nama di dataset.xlsx Anda
        const aliasProvinsi = {
            "PROBANTEN": "BANTEN",
            "DI. ACEH": "ACEH",
            "NANGGROE ACEH DARUSSALAM": "ACEH", // Jaga-jaga jika formatnya begini
            "DAERAH ISTIMEWA YOGYAKARTA": "DI YOGYAKARTA",
            "D.I. YOGYAKARTA": "DI YOGYAKARTA",
            "DAERAH KHUSUS IBUKOTA JAKARTA": "DKI JAKARTA",
            "KEPULAUAN BANGKA BELITUNG": "BANGKA BELITUNG",
            "NUSATENGGARA BARAT": "NUSA TENGGARA BARAT",
            "IRIAN JAYA BARAT": "PAPUA BARAT",
            "IRIAN JAYA": "PAPUA", 
            "IRIAN JAYA TIMUR": "PAPUA",
            "IRIAN JAYA TENGAH": "PAPUA",
            "BANGKA BELITUNG" :"SUMATERA SELATAN"
            // Silakan tambahkan sendiri di sini jika nanti ada provinsi lain yang abu-abu!
        };

        // 2. Petakan data BERDASARKAN GeoJSON
        const mapData = features.map(f => {
            // Ambil nama dari file GeoJSON dan jadikan huruf besar semua
            let rawGeoName = (f.properties.Propinsi || f.properties.name || "").toUpperCase();

            // 3. TERJEMAHKAN NAMA (KUNCI PENYELESAIANNYA)
            // Cek apakah rawGeoName ada di kamus. Jika ada, pakai nama terjemahan. Jika tidak, pakai nama aslinya.
            let geoProvName = aliasProvinsi[rawGeoName] || rawGeoName;

            // Cari di dataProvinsi (Ingat, dataset Anda bentuknya Array [nama, kematian, vaksinasi])
            let rowData = dataProvinsi.find(r => r[0].toUpperCase() === geoProvName);

            // Cek filter checkbox
            let isSelected = false;
            if (selectedProvinsi === "All") {
                isSelected = true;
            } else if (Array.isArray(selectedProvinsi)) {
                isSelected = rowData ? selectedProvinsi.includes(rowData[0]) : false;
            }

            return {
                feature: f,
                provinsiAsli: geoProvName, // Sekarang namanya sudah bersih (misal: "BANTEN", bukan "PROBANTEN")
                kematian: rowData ? rowData[1] : 0,
                vaksinasi: rowData ? rowData[2] : 0,
                isSelected: isSelected
            };
        });

        const ctxMap = document.getElementById("chartMap").getContext("2d");

        // Bersihkan kanvas jika sudah ada peta sebelumnya
        if (chartMapInst) chartMapInst.destroy();

        chartMapInst = new Chart(ctxMap, {
            type: 'choropleth',
            data: {
                labels: mapData.map(d => d.provinsiAsli),
                datasets: [{
                    label: 'Provinsi',
                    outline: inaGeoJson, // Bingkai peta wilayah Indonesia
                    data: mapData.map(d => ({
                        feature: d.feature,
                        value: d.kematian, // Nilai yang dipakai untuk warna gradien (opsional)
                        extra: d // Menyimpan data kita sendiri untuk dipanggil di tooltip
                    })),
                    backgroundColor: (context) => {
                        const rawData = context.raw ? context.raw.extra : null;

                        // Jika di luar filter atau data tidak ada di dataset.xlsx
                        if (!rawData || !rawData.isSelected) return '#e0e0e0';

                        // Warna Biru khas Excel jika ada datanya
                        return rawData.kematian > 0 ? '#4472C4' : '#A3BCE6';
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: "Peta Persebaran Data Provinsi", font: { size: 14, weight: '600' } },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const d = context.raw.extra;
                                if (!d || !d.isSelected) return `${d.provinsiAsli} (Di luar filter)`;

                                return [
                                    `Provinsi: ${d.provinsiAsli}`,
                                    // Gunakan toFixed(2) agar angka desimal rapi seperti di kartu atas
                                    `Total Kematian: ${d.kematian.toFixed(2)}`,
                                    `Total Vaksinasi: ${d.vaksinasi.toFixed(2)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    projection: {
                        axis: 'x',
                        projection: 'mercator'
                    },
                    color: {
                        axis: 'x',
                        display: false // Sembunyikan batang warna biru
                    }
                }
            }
        });
    };
    // Proses Fetching GeoJSON (Hanya berjalan sekali berkat variabel cache 'inaGeoJson')
    if (!inaGeoJson) {
        // Menggunakan repositori GeoJSON Indonesia publik yang stabil
        fetch('https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json')
            .then(res => res.json())
            .then(data => {
                inaGeoJson = data;
                renderMap();
            })
            .catch(err => console.error("Gagal memuat peta: ", err));
    } else {
        renderMap();
    }
}