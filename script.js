/* =========================================================
   Undangan Pernikahan — script.js
   Bagian yang biasanya perlu diubah ada di objek PENGATURAN.
   ========================================================= */

   const PENGATURAN = {
    namaMempelai: "Asta & Ikrom",
    tanggalAcara: "2026-10-04T04:00:00+07:00",
    selesaiAcara: "2026-10-04T04:00:00+07:00",
    lokasi: "Balai Kartini, Jl. Gatot Subroto Kav. 37, Jakarta Selatan",
    // Isi dengan URL Google Apps Script / Formspree bila ingin ucapan tersimpan.
    urlRsvp: ""
  };
  
  /* ---------------------------------------------------------
     1. Nama tamu dari URL  →  index.html?to=Budi%20Santoso
     --------------------------------------------------------- */
  (function isiNamaTamu() {
    const param = new URLSearchParams(location.search);
    const nama = param.get("to") || param.get("kepada");
    if (nama) {
      document.getElementById("nama-tamu").textContent = decodeURIComponent(nama);
    }
  })();
  
  /* ---------------------------------------------------------
     2. Membuka sampul
     --------------------------------------------------------- */
  const sampul = document.getElementById("sampul");
  const tombolBuka = document.getElementById("tombol-buka");
  const audio = document.getElementById("audio");
  const tombolMusik = document.getElementById("tombol-musik");
  const navigasi = document.getElementById("navigasi");
  
  tombolBuka.addEventListener("click", () => {
    sampul.classList.add("terbuka");
    document.body.classList.remove("terkunci");
    window.scrollTo(0, 0);
  
    tombolMusik.hidden = false;
    navigasi.hidden = false;
  
    // Audio hanya boleh diputar setelah interaksi pengguna.
    audio.volume = 0.45;
    audio.play()
      .then(() => tombolMusik.classList.add("berputar"))
      .catch(() => { /* file lagu belum ada atau diblokir browser */ });
  
    setTimeout(() => sampul.classList.add("selesai"), 1300);
  });
  
  /* ---------------------------------------------------------
     3. Tombol musik
     --------------------------------------------------------- */
  tombolMusik.addEventListener("click", () => {
    if (audio.paused) {
      audio.play()
        .then(() => tombolMusik.classList.add("berputar"))
        .catch(() => tampilkanNotif("Lagu belum tersedia."));
    } else {
      audio.pause();
      tombolMusik.classList.remove("berputar");
    }
  });
  
  /* ---------------------------------------------------------
     4. Hitung mundur
     --------------------------------------------------------- */
  (function hitungMundur() {
    const target = new Date(PENGATURAN.tanggalAcara).getTime();
    const el = {
      hari: document.getElementById("hari"),
      jam: document.getElementById("jam-nya"),
      menit: document.getElementById("menit"),
      detik: document.getElementById("detik")
    };
    const wadah = document.getElementById("jam");
    const pesan = document.getElementById("jam-pesan");
  
    const dua = (n) => String(n).padStart(2, "0");
  
    function perbarui() {
      const sisa = target - Date.now();
  
      if (sisa <= 0) {
        wadah.hidden = true;
        pesan.hidden = false;
        clearInterval(timer);
        return;
      }
  
      const detikTotal = Math.floor(sisa / 1000);
      el.hari.textContent = dua(Math.floor(detikTotal / 86400));
      el.jam.textContent = dua(Math.floor((detikTotal % 86400) / 3600));
      el.menit.textContent = dua(Math.floor((detikTotal % 3600) / 60));
      el.detik.textContent = dua(detikTotal % 60);
    }
  
    perbarui();
    const timer = setInterval(perbarui, 1000);
  })();
  
  /* ---------------------------------------------------------
     5. Simpan ke Google Calendar
     --------------------------------------------------------- */
  (function siapkanKalender() {
    const tombol = document.getElementById("tombol-kalender");
    const format = (iso) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
  
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", "Pernikahan " + PENGATURAN.namaMempelai);
    url.searchParams.set("dates", format(PENGATURAN.tanggalAcara) + "/" + format(PENGATURAN.selesaiAcara));
    url.searchParams.set("location", PENGATURAN.lokasi);
    url.searchParams.set("details", "Undangan pernikahan " + PENGATURAN.namaMempelai);
  
    tombol.href = url.toString();
    tombol.target = "_blank";
    tombol.rel = "noopener";
  })();
  
  /* ---------------------------------------------------------
     6. Animasi muncul saat digulir
     --------------------------------------------------------- */
  (function animasiGulir() {
    const item = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      item.forEach((el) => el.classList.add("tampil"));
      return;
    }
  
    const pengamat = new IntersectionObserver((entri) => {
      entri.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("tampil");
          pengamat.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  
    item.forEach((el) => pengamat.observe(el));
  })();
  
  /* ---------------------------------------------------------
     7. Navigasi bawah — menandai bagian yang sedang dilihat
     --------------------------------------------------------- */
  (function navigasiAktif() {
    const tautan = document.querySelectorAll("[data-nav]");
    const bagian = [...tautan].map((a) => document.querySelector(a.getAttribute("href")));
  
    const pengamat = new IntersectionObserver((entri) => {
      entri.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = bagian.indexOf(e.target);
        tautan.forEach((a, n) => a.classList.toggle("aktif", n === i));
      });
    }, { threshold: 0.35 });
  
    bagian.forEach((s) => s && pengamat.observe(s));
  })();
  
  /* ---------------------------------------------------------
     8. Salin nomor rekening / alamat
     --------------------------------------------------------- */
  document.querySelectorAll(".salin").forEach((tombol) => {
    tombol.addEventListener("click", async () => {
      const teks = document.getElementById(tombol.dataset.target).textContent.trim();
      try {
        await navigator.clipboard.writeText(teks);
        tampilkanNotif("Berhasil disalin.");
      } catch {
        // Cadangan untuk browser lama atau halaman non-HTTPS.
        const tmp = document.createElement("textarea");
        tmp.value = teks;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
        tampilkanNotif("Berhasil disalin.");
      }
    });
  });
  
  /* ---------------------------------------------------------
     9. Formulir RSVP
     --------------------------------------------------------- */
  (function rsvp() {
    const form = document.getElementById("form-rsvp");
    const status = document.getElementById("form-status");
    const daftar = document.getElementById("daftar-ucapan");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const nama = form.nama.value.trim();
      const pesan = form.pesan.value.trim();
      const hadir = form.hadir.value;
  
      if (!nama || !pesan) {
        status.textContent = "Nama dan ucapan belum diisi.";
        return;
      }
  
      status.textContent = "Mengirim…";
  
      if (PENGATURAN.urlRsvp) {
        try {
          await fetch(PENGATURAN.urlRsvp, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nama, pesan, hadir, waktu: new Date().toISOString() })
          });
        } catch {
          status.textContent = "Gagal mengirim. Periksa koneksi lalu coba lagi.";
          return;
        }
      }
  
      tambahUcapan(nama, pesan, hadir);
      form.reset();
      status.textContent = "Terima kasih, ucapan Anda sudah kami terima.";
      tampilkanNotif("Ucapan terkirim.");
    });
  
    function tambahUcapan(nama, pesan, hadir) {
      const item = document.createElement("article");
      item.className = "ucapan__item";
  
      const judul = document.createElement("p");
      judul.className = "ucapan__nama";
      judul.textContent = nama;
  
      const tanda = document.createElement("span");
      tanda.className = "ucapan__tanda";
      tanda.textContent = hadir;
      judul.appendChild(tanda);
  
      const teks = document.createElement("p");
      teks.className = "ucapan__teks";
      teks.textContent = pesan;
  
      item.append(judul, teks);
      daftar.prepend(item);
    }
  })();
  
  /* ---------------------------------------------------------
     10. Foto yang belum ada → tampilkan penanda
     --------------------------------------------------------- */
  document.querySelectorAll(".mempelai__foto img, .galeri__item img").forEach((img) => {
    img.addEventListener("error", () => img.parentElement.classList.add("kosong"));
    if (img.complete && img.naturalWidth === 0) img.parentElement.classList.add("kosong");
  });
  
  /* ---------------------------------------------------------
     11. Notifikasi kecil
     --------------------------------------------------------- */
  let waktuNotif;
  function tampilkanNotif(teks) {
    const notif = document.getElementById("notif");
    notif.textContent = teks;
    notif.classList.add("tampil");
    clearTimeout(waktuNotif);
    waktuNotif = setTimeout(() => notif.classList.remove("tampil"), 2200);
  }