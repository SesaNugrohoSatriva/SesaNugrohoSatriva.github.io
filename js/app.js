function updateDashboard(resMingguan, resProvinsi) {
    if (!resMingguan.length || !resProvinsi.length) return;

    let rowsMingguan = resMingguan[0].values;
    let rowsProvinsi = resProvinsi[0].values;

    let totalKematian = 0;
    let totalVaksinasi = 0;

    // Hitung Total untuk Kartu di Atas menggunakan data per Provinsi
    rowsProvinsi.forEach(r => {
        totalKematian += r[1];
        totalVaksinasi += r[2];
    });

    document.getElementById("totalKematian").innerText = totalKematian.toFixed(2);
    document.getElementById("totalVaksinasi").innerText = totalVaksinasi.toFixed(2);

    let rasio = totalVaksinasi > 0 ? (totalKematian / totalVaksinasi) * 100 : 0;
    document.getElementById("rasio").innerText = rasio.toFixed(2);

    // PANGGIL FUNGSI CHART.JS YANG BARU!
    render4Charts(rowsMingguan, rowsProvinsi);
    generateInsight(rowsMingguan);
    // generateDataTable(rowsMingguan);
}

window.onload = async function () {

    await loadDatabase();
    populateFilters();
    applyFilter();

};
