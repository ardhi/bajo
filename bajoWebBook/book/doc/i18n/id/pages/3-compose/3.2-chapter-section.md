Bab atau seksi sebuah buku pada prinsipnya adalah kategori yang berjenjang. Ini mirip dengan konsep direktori dan berkas dalam komputer, dimana berbagai berkas disimpan didalam sebuah direktori. Selain berkas, didalam direktor juga bisa memuat direktori pula yang didalamnya kembali memuat berkas dan sub direktori. Demikian seterusnya sehingga menciptakan satu kesatuan pohon besar.

Jika dianalogikan dalam buku, maka bab/seksi adalah direktori. Sementara berkas adalah halaman buku.

#### Perbedaan bab dan seksi

Dalam definisi kami, **bab** (_Chapter_ dalam bahasa inggris) adalah seksi pertama dalam buku yang memiliki level utama (level 1, 2, 3 dst).

Sementara **seksi** (_Section_ dalam bahasa inggris) adalah kategori dibawah bab yang direpresentasikan sebagai anak level utama, contoh: 1.1, 2.3.2 dst.

#### Anatomi bab dan seksi

Seperti dijelaskan di halaman sebelumnya; semua bab, seksi, halaman dan berkas-berkas aset lainnya disimpan didalam direktori **pages** dalam sebuah buku.

Bab dan seksi dalam Bajo Web Book selalu direpresentasikan sebagai direktori berjenjang. Level dan judul akan dibuat secara otomatis yang diambil dari nama direktory ybs sesuai dengan format berikut:

```sh
<level>-<nama bab/seksi>
```

Judul bab/seksi, normalnya, dibuat secara otomatis. Jika dikehendaki judul yang spesifik, bisa dilakukan melalui file [.metadata.json](book#metadata):

```json
{
  ...
  "pages": {
    "<file-path>": {
      "title": "Babak Baru"
    }
    ...
  }
}
```

#### Contoh

Berikut adalam sebuah pohon direktori sebuah buku:

```sh
bukuku
  .metadata.json                          // menyimpan semua metadata dari sebuah buku
  pages                                   // semua bab/seksi/berkas/asset masuk disini
    1-bab-satu                            // ditampikan sbg: 1. Bab Satu
      1.1-seksi-satu-dari-bab-satu        // seksi: 1.1 Seksi Satu Dari Bab Satu
        1.1.1-pendahuluan.md              // halaman: 1.1.1 Pendahuluan
        1.1.2-materi-awal.md
      1.2-seksi-lanjutan                  // seksi: 1.2 Lanjutan (judul diubah via .metadata.json)
        1.2.1-halaman-lanjutan.md
```