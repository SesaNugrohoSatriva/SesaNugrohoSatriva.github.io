let db;

async function loadDatabase() {

    const SQL = await initSqlJs({

        locateFile: file =>
            "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/" + file

    });

    const response =
        await fetch("data/dataset.xlsx");

    const buffer =
        await response.arrayBuffer();

    const workbook =
        XLSX.read(buffer);

    const sheet =
        workbook.Sheets[
        workbook.SheetNames[0]
        ];

    const json =
        XLSX.utils.sheet_to_json(sheet);

    db = new SQL.Database();

    db.run(`

        CREATE TABLE data (

            tahun INTEGER,
            minggu INTEGER,

            kode_provinsi TEXT,
            nama_provinsi TEXT,

            jumlah_kematian INTEGER,
            jumlah_vaksinasi INTEGER,

            persentase_perbandingan REAL,

            minggu_normal TEXT,
            tanggal TEXT,
            bulan TEXT

        );

    `);

    json.forEach(row => {

        db.run(

            `
            INSERT INTO data
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                row.tahun ?? null,
                row.minggu ?? null,
                row.kode_provinsi ?? null,
                row.nama_provinsi ?? null,
                row.jumlah_kematian ?? null,
                row.jumlah_vaksinasi ?? null,
                row.persentase_perbandingan_kematian_vs_vaksinasi ?? null,
                row.minggu_normal ?? null,
                row.tanggal ?? null,
                row.bulan ?? null
            ]

        );

    });

}