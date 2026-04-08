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
            dKem.push(row ? row[2] : null);
            dVak.push(row ? row[3] : null);

            // --- FIX PERSENTASE MINGGUAN ---
            let rawPer = row ? row[4] : null;
            if (rawPer !== null) {
                if (typeof rawPer === 'string' && rawPer.includes('%')) {
                    rawPer = parseFloat(rawPer); // Jika string "5%" -> jadikan 5
                } else {
                    let num = parseFloat(rawPer);
                    // Jika bentuk desimal Excel (misal 0.05), kalikan 100 agar jadi 5
                    rawPer = (num <= 1 && num > 0) ? num * 100 : num;
                }
            }
            dPer.push(rawPer);
        });

        let baseStyle = {
            label: prov,
            borderColor: excelColors[i % excelColors.length],
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false,
            tension: 0
        };

        dsKematian.push({ ...baseStyle, data: dKem });
        dsPersen.push({ ...baseStyle, data: dPer });
        dsVaksinasi.push({ ...baseStyle, data: dVak });
    });

    const getCommonOptions = (title, isPercent = false) => ({
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { right: 15 }
        },
        plugins: {
            title: { display: true, text: title, font: { size: 14, weight: '600' }, padding: { bottom: 15 } },
            legend: {
                position: 'right',
                align: 'start',
                labels: {
                    boxWidth: 8,
                    font: { size: 9 },
                    usePointStyle: false,
                    padding: 6
                }
            },
            tooltip: {
                mode: 'nearest',
                intersect: false,
                bodyFont: { size: 11 },
                titleFont: { size: 12 },
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            // Format angka tooltip agar desimalnya rapi
                            label += isPercent ? context.parsed.y.toFixed(2) + '%' : context.parsed.y.toLocaleString();
                        }
                        return label;
                    }
                }
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

    const ctx1 = document.getElementById("chartKematian").getContext("2d");
    chartKematianInst = new Chart(ctx1, { type: "line", data: { labels: listMinggu, datasets: dsKematian }, options: getCommonOptions("Jumlah Kematian Per Minggu") });

    const ctx2 = document.getElementById("chartPersentase").getContext("2d");
    chartPersenInst = new Chart(ctx2, { type: "line", data: { labels: listMinggu, datasets: dsPersen }, options: getCommonOptions("Persentase Perbandingan Kematian vs Vaksinasi", true) });

    const ctx3 = document.getElementById("chartVaksinasi").getContext("2d");
    chartVaksinasiInst = new Chart(ctx3, { type: "line", data: { labels: listMinggu, datasets: dsVaksinasi }, options: getCommonOptions("Jumlah Vaksinasi Per Minggu") });

    // --- 2. PROSES & RENDER GRAFIK GABUNGAN ---
    let labelsProv = dataProvinsi.map(r => r[0]);
    let dataKemTotal = dataProvinsi.map(r => r[1]);
    let dataVaksTotal = dataProvinsi.map(r => r[2]);

    const ctx4 = document.getElementById("chartTotalGabungan").getContext("2d");
    chartGabunganInst = new Chart(ctx4, {
        type: "line",
        data: {
            labels: labelsProv,
            datasets: [
                { label: "Total jumlah Vaksinasi", data: dataVaksTotal, borderColor: "#ED7D31", borderWidth: 2, pointRadius: 2, fill: false, tension: 0 },
                { label: "Total jumlah Kematian", data: dataKemTotal, borderColor: "#4472C4", borderWidth: 2, pointRadius: 2, fill: false, tension: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: { display: true, text: "Jumlah Vaksinasi dan Kematian", font: { size: 14, weight: '600' } },
                legend: { position: 'bottom', labels: { boxWidth: 15, font: { size: 11 } } },
                tooltip: { intersect: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, font: { size: 9 } } },
                y: { ticks: { font: { size: 10 } } }
            }
        }
    });

    const renderMap = () => {
        const features = inaGeoJson.features;

        const aliasProvinsi = {
            "PROBANTEN": "BANTEN",
            "DI. ACEH": "ACEH",
            "NANGGROE ACEH DARUSSALAM": "ACEH",
            "DAERAH ISTIMEWA YOGYAKARTA": "DI YOGYAKARTA",
            "D.I. YOGYAKARTA": "DI YOGYAKARTA",
            "DAERAH KHUSUS IBUKOTA JAKARTA": "DKI JAKARTA",
            "NUSATENGGARA BARAT": "NUSA TENGGARA BARAT",
            "IRIAN JAYA BARAT": "PAPUA BARAT",
            "IRIAN JAYA": "PAPUA",
            "IRIAN JAYA TIMUR": "PAPUA",
            "IRIAN JAYA TENGAH": "PAPUA",
            "BANGKA BELITUNG": "KEPULAUAN BANGKA BELITUNG",
        };

        const mapData = features.map(f => {
            let rawGeoName = (f.properties.Propinsi || f.properties.name || "").toUpperCase();
            let geoProvName = aliasProvinsi[rawGeoName] || rawGeoName;

            // Cari data provinsi
            let rowData = dataProvinsi.find(r => r[0].toUpperCase() === geoProvName);

            let isSelected = false;
            if (selectedProvinsi === "All") {
                isSelected = true;
            } else if (Array.isArray(selectedProvinsi)) {
                isSelected = rowData ? selectedProvinsi.includes(rowData[0]) : false;
            }

            // Ambil angka kematian dan vaksinasi
            let totalKematian = rowData ? rowData[1] : 0;
            let totalVaksinasi = rowData ? rowData[2] : 0;

            // --- KALKULASI PERSENTASE OTOMATIS DI SINI ---
            // Rumus: (Total Kematian / Total Vaksinasi) * 100
            let finalPer = 0;
            if (totalVaksinasi > 0) {
                finalPer = (totalKematian / totalVaksinasi) * 100;
            }

            return {
                feature: f,
                provinsiAsli: geoProvName,
                kematian: totalKematian,
                vaksinasi: totalVaksinasi,
                persentase: finalPer, // Masukkan hasil kalkulasi ke sini
                isSelected: isSelected
            };
        });

        const ctxMap = document.getElementById("chartMap").getContext("2d");
        if (chartMapInst) chartMapInst.destroy();

        chartMapInst = new Chart(ctxMap, {
            type: 'choropleth',
            data: {
                labels: mapData.map(d => d.provinsiAsli),
                datasets: [{
                    label: 'Provinsi',
                    outline: inaGeoJson,
                    data: mapData.map(d => ({
                        feature: d.feature,
                        value: d.kematian,
                        extra: d
                    })),
                    backgroundColor: (context) => {
                        const rawData = context.raw ? context.raw.extra : null;
                        if (!rawData || !rawData.isSelected) return '#e0e0e0';
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
                                    `Total Kematian: ${d.kematian.toLocaleString()}`, // toLocaleString agar ada pemisah ribuan
                                    `Total Vaksinasi: ${d.vaksinasi.toLocaleString()}`,
                                    `Rata-rata Persentase Kematian vs Vaksinasi: ${d.persentase.toFixed(2)}%` // Desimal dibatasi 2 digit
                                ];
                            }
                        }
                    }
                },
                scales: {
                    projection: { axis: 'x', projection: 'mercator' },
                    color: { axis: 'x', display: false }
                }
            }
        });
    };

    if (!inaGeoJson) {
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