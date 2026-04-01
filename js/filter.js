// Fungsi untuk buka/tutup dropdown secara bergantian (akordeon)
function toggleDropdown(id) {
    // 1. Ambil elemen dropdown yang sedang diklik
    let targetDropdown = document.getElementById(id);
    // 2. Cek apakah dropdown yang diklik ini sedang dalam keadaan terbuka
    let isCurrentlyOpen = targetDropdown.style.display === "block";

    // 3. Tutup SEMUA dropdown yang ada di halaman
    const allDropdowns = document.querySelectorAll('.dropdown-content');
    allDropdowns.forEach(dropdown => {
        dropdown.style.display = "none";
    });

    // 4. Jika dropdown yang diklik sebelumnya tertutup, maka buka.
    // (Jika sebelumnya sudah terbuka, dia akan tetap tertutup karena langkah 3)
    if (!isCurrentlyOpen) {
        targetDropdown.style.display = "block";
    }
}
// Fungsi pembantu untuk fitur "Pilih Semua"
function setupPilihSemua(idPilihSemua, classCheckbox) {
    const cbSemua = document.getElementById(idPilihSemua);
    cbSemua.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll(`.${classCheckbox}`);
        checkboxes.forEach(cb => {
            cb.checked = cbSemua.checked;
        });
    });
}

// Fungsi helper ambil value
function getCheckedValues(className) {
    const checkboxes = document.querySelectorAll(`.${className}:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function populateFilters() {
    // 1. Tahun
    const resTahun = db.exec("SELECT DISTINCT tahun FROM data ORDER BY tahun ASC");
    const divTahun = document.getElementById("listTahun");
    divTahun.innerHTML = `<label><input type="checkbox" id="allTahun"> <b>Pilih Semua</b></label><hr style="margin:5px 0">`;
    if (resTahun.length > 0) {
        resTahun[0].values.forEach(row => {
            if (row[0] !== null) divTahun.innerHTML += `<label><input type="checkbox" class="check-tahun" value="${row[0]}"> ${row[0]}</label>`;
        });
    }
    setupPilihSemua('allTahun', 'check-tahun');

    // 2. Bulan
    const resBulan = db.exec("SELECT DISTINCT bulan FROM data ORDER BY bulan ASC");
    const divBulan = document.getElementById("listBulan");
    divBulan.innerHTML = `<label><input type="checkbox" id="allBulan"> <b>Pilih Semua</b></label><hr style="margin:5px 0">`;
    if (resBulan.length > 0) {
        resBulan[0].values.forEach(row => {
            if (row[0] !== null) divBulan.innerHTML += `<label><input type="checkbox" class="check-bulan" value="${row[0]}"> ${row[0]}</label>`;
        });
    }
    setupPilihSemua('allBulan', 'check-bulan');

    // 3. Provinsi
    const resProvinsi = db.exec("SELECT DISTINCT nama_provinsi FROM data ORDER BY nama_provinsi ASC");
    const divProvinsi = document.getElementById("listProvinsi");
    divProvinsi.innerHTML = `<label><input type="checkbox" id="allProv"> <b>Pilih Semua</b></label><hr style="margin:5px 0">`;
    if (resProvinsi.length > 0) {
        resProvinsi[0].values.forEach(row => {
            if (row[0] !== null) divProvinsi.innerHTML += `<label><input type="checkbox" class="check-provinsi" value="${row[0]}"> ${row[0]}</label>`;
        });
    }
    setupPilihSemua('allProv', 'check-provinsi');
}

function applyFilter() {
    // 1. Ambil nilai yang dicentang
    let tahun = getCheckedValues("check-tahun");
    let bulan = getCheckedValues("check-bulan");
    let provinsi = getCheckedValues("check-provinsi");

    // 2. Hitung total opsi yang ada di masing-masing dropdown
    let totalTahun = document.querySelectorAll(".check-tahun").length;
    let totalBulan = document.querySelectorAll(".check-bulan").length;
    let totalProvinsi = document.querySelectorAll(".check-provinsi").length;

    // 3. Logika teks untuk Kotak Info
    // Jika tidak ada yang dicentang (0) ATAU semua dicentang (sama dengan total), tampilkan "Semua"
    let textTahun = (tahun.length === 0 || tahun.length === totalTahun) ? "Semua Tahun" : tahun.join(', ');
    let textBulan = (bulan.length === 0 || bulan.length === totalBulan) ? "Semua Bulan" : bulan.join(', ');
    let textProvinsi = (provinsi.length === 0 || provinsi.length === totalProvinsi) ? "Semua Provinsi" : provinsi.join(', ');

    const infoBox = document.getElementById("infoFilterAktif");
    infoBox.innerHTML = `<strong>Filter Diterapkan:</strong><br>
                         📅 Tahun: ${textTahun} <br>
                         🗓️ Bulan: ${textBulan} <br>
                         📍 Provinsi: ${textProvinsi}`;
    infoBox.style.display = "block";

    // 4. Query Database
    let baseKondisi = " WHERE 1=1";

    // Optimasi Query: Hanya gunakan filter IN (...) jika ada yang dicentang TAPI tidak semuanya.
    // Jika semua dicentang, kita tidak perlu memfilter (sama dengan memanggil semua data).
    if (tahun.length > 0 && tahun.length < totalTahun) {
        baseKondisi += ` AND tahun IN (${tahun.map(t => `'${t}'`).join(',')})`;
    }
    if (bulan.length > 0 && bulan.length < totalBulan) {
        baseKondisi += ` AND bulan IN (${bulan.map(b => `'${b}'`).join(',')})`;
    }
    if (provinsi.length > 0 && provinsi.length < totalProvinsi) {
        baseKondisi += ` AND nama_provinsi IN (${provinsi.map(p => `'${p}'`).join(',')})`;
    }

    // --- TAMBAHAN BARU: Tutup semua dropdown setelah tombol ditekan ---
    const allDropdowns = document.querySelectorAll('.dropdown-content');
    allDropdowns.forEach(dropdown => {
        dropdown.style.display = "none";
    });

    let queryMingguan = `
        SELECT minggu, nama_provinsi, SUM(jumlah_kematian), SUM(jumlah_vaksinasi), AVG(persentase_perbandingan) 
        FROM data ${baseKondisi} GROUP BY minggu, nama_provinsi ORDER BY minggu ASC
    `;
    let queryProvinsi = `
        SELECT nama_provinsi, SUM(jumlah_kematian), SUM(jumlah_vaksinasi) 
        FROM data ${baseKondisi} GROUP BY nama_provinsi ORDER BY nama_provinsi ASC
    `;

    const resultMingguan = db.exec(queryMingguan);
    const resultProvinsi = db.exec(queryProvinsi);
    let statusProvinsiUntukPeta = (provinsi.length === 0 || provinsi.length === totalProvinsi) ? "All" : provinsi;

    updateDashboard(resultMingguan, resultProvinsi, statusProvinsiUntukPeta);
}

// --- FITUR BARU: Bersihkan Semua Filter ---
function clearFilters() {
    // Hilangkan semua centang pada checkbox
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(cb => cb.checked = false);

    // Sembunyikan kotak info
    document.getElementById("infoFilterAktif").style.display = "none";

    // Terapkan ulang filter (karena semua centang hilang, otomatis menampilkan "Semua" data)
    applyFilter();
}