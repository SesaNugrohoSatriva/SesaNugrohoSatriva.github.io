let currentPage = 1;
const recordsPerPage = 50;
let globalDataMingguan = []; // Untuk menyimpan data sementara agar bisa di-page

function generateDataTable(dataMingguan) {
    globalDataMingguan = dataMingguan; // Simpan data ke variabel global
    renderPage(1); // Render halaman pertama
}

function renderPage(page) {
    currentPage = page;
    const tableBody = document.getElementById("tableBodyData");
    const paginationRoot = document.getElementById("pagination");
    
    if (!tableBody) return;

    // Hitung index data
    const start = (page - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedData = globalDataMingguan.slice(start, end);

    // Render Baris Tabel
    let tableHTML = "";
    paginatedData.forEach((row) => {
        // Sesuaikan index row dengan data Anda (Minggu, Prov, Kem, Vak, Persen)
        let formatKematian = (row[2] || 0).toLocaleString('id-ID');
        let formatVaksinasi = (row[3] || 0).toLocaleString('id-ID');
        let formatPersen = (row[4] || 0).toFixed(2);

        tableHTML += `
            <tr>
                <td>${row[1] || "-"}</td>
                <td>2021</td>
                <td>-</td>
                <td>Minggu ke-${row[0]}</td>
                <td>${formatKematian}</td>
                <td>${formatVaksinasi}</td>
                <td style="font-weight:bold">${formatPersen}%</td>
            </tr>
        `;
    });
    tableBody.innerHTML = tableHTML;

    // Render Tombol Pagination
    renderPaginationButtons();
}

function renderPaginationButtons() {
    const paginationRoot = document.getElementById("pagination");
    const totalPages = Math.ceil(globalDataMingguan.length / recordsPerPage);
    
    let navHTML = `
        <button class="btn-page" ${currentPage === 1 ? 'disabled' : ''} onclick="renderPage(${currentPage - 1})">Prev</button>
        <span>Halaman ${currentPage} dari ${totalPages}</span>
        <button class="btn-page" ${currentPage === totalPages ? 'disabled' : ''} onclick="renderPage(${currentPage + 1})">Next</button>
    `;
    
    paginationRoot.innerHTML = navHTML;
}