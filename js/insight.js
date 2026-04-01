function generateInsight(dataMingguan) {
    if (!dataMingguan || dataMingguan.length === 0) {
        document.getElementById("insightText").innerText = "Data tidak tersedia untuk dianalisis.";
        return;
    }

    let totalKematian = 0;
    let totalVaksinasi = 0;

    // Variabel untuk melacak anomali (lonjakan/spikes)
    let spikeKematian = { minggu: null, prov: '', jumlah: -1 };
    let spikeVaksinasi = { minggu: null, prov: '', jumlah: -1 };

    // Proses data untuk mencari lonjakan tertinggi dan total keseluruhan
    dataMingguan.forEach(row => {
        let minggu = row[0];
        let provinsi = row[1];
        let kematian = row[2] || 0; // index 2 = kematian
        let vaksinasi = row[3] || 0; // index 3 = vaksinasi

        totalKematian += kematian;
        totalVaksinasi += vaksinasi;

        // Deteksi lonjakan kematian tertinggi
        if (kematian > spikeKematian.jumlah) {
            spikeKematian = { minggu: minggu, prov: provinsi, jumlah: kematian };
        }

        // Deteksi lonjakan vaksinasi tertinggi
        if (vaksinasi > spikeVaksinasi.jumlah) {
            spikeVaksinasi = { minggu: minggu, prov: provinsi, jumlah: vaksinasi };
        }
    });

    let rasioTotal = totalVaksinasi > 0 ? (totalKematian / totalVaksinasi) * 100 : 0;
    let insightStr = "";

    // 1. Analisis Spikes / Lonjakan Kematian (Bad News)
    if (spikeKematian.jumlah > 0) {
        insightStr += `Puncak Krisis (Spike): Terdapat anomali lonjakan kematian tertinggi yang memecah tren, terjadi pada Minggu ke-${spikeKematian.minggu} di wilayah ${spikeKematian.prov} dengan ${spikeKematian.jumlah.toLocaleString()} kasus. Titik ini mengindikasikan kemungkinan fasyankes kewalahan atau munculnya klaster baru yang fatal. `;
    }

    // 2. Analisis Spikes / Puncak Vaksinasi (Good News)
    if (spikeVaksinasi.jumlah > 0) {
        insightStr += `Sebagai pembanding, momentum akselerasi vaksinasi paling agresif tercatat di ${spikeVaksinasi.prov} pada Minggu ke-${spikeVaksinasi.minggu} (${spikeVaksinasi.jumlah.toLocaleString()} dosis), yang bisa diasumsikan sebagai respons intervensi terhadap krisis. `;
    }

    // 3. Analisis Kesimpulan Makro (Rasio)
    insightStr += `\nSecara makro, rasio kematian terhadap vaksinasi berada di angka ${rasioTotal.toFixed(2)}%. `;
    if (rasioTotal > 30) {
        insightStr += "Angka ini menyoroti bahwa kecepatan distribusi vaksin masih kalah cepat dibanding laju fatalitas, sehingga risiko kesehatan masyarakat saat ini berstatus KRITIS.";
    } else if (rasioTotal > 15) {
        insightStr += "Ini menunjukkan program vaksinasi mulai menekan angka kematian, meski belum mencapai titik aman (herd immunity) yang optimal.";
    } else {
        insightStr += "Ini membuktikan tren yang positif: daerah dengan cakupan vaksinasi yang konsisten tinggi berhasil meredam fatalitas dan menstabilkan grafik.";
    }

    // Tampilkan ke HTML
    document.getElementById("insightText").innerText = insightStr;
}