# Server Windows

Kelola server Windows di samping server Linux Anda: jalankan PowerShell, baca dan tulis file, salin file, serta mulai dan hentikan service.

Halaman ini membahas server Windows yang dikelola komando. Untuk menjalankan komando itu sendiri di komputer Windows, lihat [Instal di Windows](install.md#install-on-windows).

## Menambah server Windows

```bash
komando host add win1 Administrator@10.0.0.9 --os windows --ask-password
komando test win1                                   # bisakah komando login? apakah user ini administrator?
komando facts win1                                  # versi Windows, dukungan, update, port
```

Jika diketik tanpa argumen di terminal Anda, `komando host add` menanyakan setiap bagian, termasuk apa yang dijalankan server dan, untuk Windows, apakah komando menjangkaunya lewat OpenSSH atau WinRM.

komando menjangkau Windows lewat OpenSSH atau WinRM. Keduanya memberi perintah yang sama; pilih WinRM bila server sudah menyalakannya, misalnya untuk Ansible.

### Lewat OpenSSH

OpenSSH sudah ada di Windows Server 2019 dan yang lebih baru. Nyalakan sekali di server (sebagai administrator, di PowerShell):

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd; Set-Service sshd -StartupType Automatic
```

Lalu tambahkan server dengan `--os windows`. Semua lainnya sama seperti server Linux: key (`--key`), kata sandi (`--ask-password` atau `--password-ref`), `--via` bastion, `--protected`.

```bash
komando host add win3 deploy@corp.local@10.0.0.10 --os windows --key deploy --via bastion
komando host edit win3 --os windows        # server yang Anda tambahkan sebelumnya
```

User domain ditulis `user@domain`, misalnya `deploy@corp.local@10.0.0.10`.

### Lewat WinRM

Berikan alamat sebagai `winrm://USER@HOST` dan sebuah kata sandi. komando memakai HTTPS (port 5986), memeriksa sertifikat server, dan login dengan NTLM, yang tidak pernah mengirim kata sandinya sendiri.

```bash
komando host add win2 winrm://Administrator@10.0.0.9 --ask-password
komando host add win3 'winrm://deploy@corp.local@win3.corp.local' --password-ref secret:win3-pass --via bastion
komando host edit win2 --address 'winrm://10.0.0.9?ca=secret:corp-ca'   # sertifikat server berasal dari CA Anda sendiri
```

Opsi ditulis setelah `?`, digabung dengan `&`:

| Opsi | Artinya |
|------|---------|
| `ca=secret:NAME` | sertifikat berasal dari CA Anda sendiri: simpan PEM-nya dengan `komando secret set NAME < ca.crt` (pemeriksaan tetap menyala) |
| `auth=basic` | login Basic (hanya akun lokal) sebagai ganti NTLM; lewat HTTP polos (`tls=off`) ditolak (`WINRM_INSECURE`) |
| `tls=skip-verify` | sertifikat tidak diperiksa (komando memperingatkan: siapa pun di tengah bisa menyamar sebagai server) |
| `tls=off` | HTTP polos di port 5985: perintah dan output berjalan tanpa enkripsi, dan server harus mengizinkannya |
| `:PORT` | port selain 5986 (5985 dengan `tls=off`) |

`auth=basic`, `tls=skip-verify`, dan `tls=off` melepas satu perlindungan kata sandi atau pemeriksaan server, jadi agen AI yang mengaturnya (dengan `host add`, `host edit --address`, atau `import`) butuh jawaban ya dari Anda di jendela komando (kalau tidak, `SAFETY_SETTING`). Server yang sudah memiliki pengaturan itu tidak bertanya lagi.

`--via` berfungsi: koneksi lewat bastion atau VPN. WinRM hanya membawa perintah, jadi `shell`, tunnel, `host trust`, `login`, dan `host ssh-command` butuh OpenSSH. Untuk mengembalikan server ke SSH: `komando host edit win2 --unset transport`. Pakai NTLM dengan user domain, lewat HTTPS (lihat [Batasan](#limits) untuk hal yang tidak dilakukan WinRM).

Di server, `winrm quickconfig -transport:https` (sebagai administrator) menyalakan WinRM lewat HTTPS.

### Memilih server Windows

Untuk memilih hanya server Windows, atau semua yang lain, pakai `os:windows` dan `os:linux`:

```bash
komando facts os:windows
komando exec 'all,!os:windows' --read-only -- uptime
```

## Menjalankan PowerShell

Di server Windows, `exec` dan `exec --script` menjalankan PowerShell (Windows PowerShell, `powershell.exe`, yang ada di setiap Windows Server).

```bash
komando exec win1 --read-only -- 'Get-Service | Where-Object Status -eq Running'
```

```bash
komando exec win1 -e APP_ENV=prod -C 'C:\app' -- '.\migrate.exe'
komando exec win1 --script ./deploy.ps1 --arg staging  # nilai --arg masuk ke param( ) atau $args
```

- Exit code bekerja seperti di sh: `exit 3` memberi 3, dan perintah terakhir yang gagal (error, atau program yang keluar dengan kode bukan nol) membuatnya bukan nol.
- `--read-only` hanya menerima perintah baca yang sederhana di Windows (lihat di bawah).
- Input dari `--stdin-file` dibaca dengan `[Console]::In.ReadToEnd()`.
- Windows tidak punya sudo: `--sudo` dan `--pty` ditolak. Login sebagai user yang punya hak yang dibutuhkan pekerjaannya (administrator untuk service).
- Satu perintah ditulis untuk satu shell, jadi target yang memilih server Windows dan Linux sekaligus ditolak (`MIXED_OS`). Jalankan dua kali, dengan `TARGET,os:windows` dan `TARGET,!os:windows`.

### `--read-only` di Windows

`--read-only` di server Windows gagal dengan aman: komando hanya menerima sebagian kecil PowerShell yang dibacanya persis seperti PowerShell membacanya, dan menolak yang lain, bahkan perintah yang hanya akan membaca. Perintah yang diterimanya tidak pernah mengubah apa pun, jadi server yang dilindungi tidak meminta `--yes`.

Yang diterimanya:

- Perintah dari daftar tetap, digabung dengan `|` dan dipisahkan dengan `;` atau baris baru:
  - file dan registry: `Get-ChildItem`, `Get-Item`,
    `Get-ItemProperty`, `Get-ItemPropertyValue`, `Get-Content`,
    `Get-Location`, `Get-PSDrive`, `Get-PSProvider`, `Get-Acl`,
    `Get-FileHash`, `Test-Path`, `Select-String`, `Set-Location`,
    `Push-Location`, `Pop-Location`;
  - sistem: `Get-Process`, `Get-Service`, `Get-EventLog`,
    `Get-WinEvent`, `Get-HotFix`, `Get-ComputerInfo`, `Get-Date`,
    `Get-TimeZone`, `Get-Culture`, `Get-Uptime`, `Get-Counter`,
    `Get-CimInstance`, `Get-CimClass`, `Get-WmiObject`,
    `Get-ScheduledTask`, `Get-ScheduledTaskInfo`, `Get-WindowsFeature`,
    `Get-LocalUser`, `Get-LocalGroup`, `Get-LocalGroupMember`, `Get-Disk`,
    `Get-Volume`, `Get-Partition`, `Get-PhysicalDisk`, `Get-SmbShare`,
    `Get-Website`, `Get-WebBinding`, `Get-IISSite`, `Get-IISAppPool`;
  - jaringan: `Get-NetTCPConnection`, `Get-NetUDPEndpoint`,
    `Get-NetIPAddress`, `Get-NetIPConfiguration`, `Get-NetAdapter`,
    `Get-NetRoute`, `Get-NetFirewallRule`, `Get-NetFirewallProfile`,
    `Get-DnsClientServerAddress`, `Get-DnsClientCache`, `Resolve-DnsName`,
    `Test-Connection`, `Test-NetConnection`;
  - PowerShell sendiri: `Get-Command`, `Get-Member`, `Get-Alias`,
    `Get-Module`, `Get-ExecutionPolicy`, `Get-Host`, `Get-History`;
  - membentuk output: `Select-Object`, `Where-Object`, `ForEach-Object`,
    `Sort-Object`, `Group-Object`, `Measure-Object`, `Get-Unique`,
    `Format-Table`, `Format-List`, `Format-Wide`, `Out-String`, `Out-Host`,
    `Out-Null`, `ConvertTo-Json`, `ConvertTo-Csv`, `Write-Output`,
    `Write-Host`;
  - alias yang lazim untuk semuanya (`gci`, `ls`, `dir`, `gc`, `cat`, `gsv`, `gps`,
    `select`, `where`, `?`, `%`, `sort`, `ft`, `fl`, ...);
  - `hostname`, `quser`, serta `whoami`, `ipconfig`, `systeminfo`,
    `tasklist`, `netstat` dengan switch yang hanya menampilkan sesuatu
    (`ipconfig /all`, `netstat -ano`, `whoami /groups`).
- Argumen berupa nilai biasa: kata seperti `C:\inetpub`, `W3SVC`, `*.log`, atau `50`; string `'...'` dan `"..."` tanpa `$` di dalamnya; koma di antara nilai (`Select-Object Name, Status`); parameter yang ditulis lengkap dari daftar yang aman (`-Recurse`, `-Tail`, `-First`, `-Property`, `-LogName`, `-Filter`, `-Force`, `-eq`, ...).
- Dua jenis script block: `Where-Object { $_.Status -eq 'Running' }` (properti `$_` dibandingkan dengan sebuah nilai, digabung dengan `-and` atau `-or`) dan `ForEach-Object { $_.Name }`.

```bash
komando exec win1 --read-only -- 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5'
komando exec win1 --read-only -- 'Get-Content C:\app\web.config -Tail 50'
komando exec win1 --read-only -- 'Get-WinEvent -LogName System -MaxEvents 20 | Format-List'
komando exec win1 --read-only -- 'Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion'
```

Yang ditolaknya (`READ_ONLY_VIOLATION`, dengan alasannya): `$` apa pun (variabel, `$( )`), backtick, `@` (here-string, splatting), `&`, redirection (`>`, `2>$null`), komentar, `( )`, `[ ]` dan panggilan .NET, `=`, keyword (`if`, `foreach`, `exit`), `.\script.ps1` dan program lewat path, perintah, alias, dan parameter yang tidak ada di daftar (juga nama parameter yang dipersingkat, `-Name:value`, `-ComputerName`, `-Credential`, `-ScriptBlock`), `ForEach-Object Name` (sebuah nama bisa memanggil method), path ke komputer lain (`\\server\share`), dan karakter apa pun di luar ASCII biasa (tanda kutip dan tanda hubung tipografis).

Bila sebuah perintah ditolak, jalankan tanpa `--read-only`: komando lalu memperlakukannya sebagai perubahan, jadi server yang dilindungi bertanya sebelum menjalankannya.

Aturan keamanan punya bentuk Windows: `Remove-Item -Recurse C:\`, `Format-Volume`, `Stop-Computer`, `Restart-Computer`, `Stop-Service sshd` (atau WinRM), dan lainnya butuh `--allow-dangerous`, seperti `rm -rf /`.

## File

Path adalah path Windows: `C:\inetpub\app.config` atau `C:/inetpub/app.config`. `~` dan path kosong adalah folder profil user yang dipakai login. Taruh path dengan backslash di dalam tanda kutip tunggal di shell Anda.

```bash
komando fs list win1 'C:\inetpub\logs' -r --limit 200
komando fs stat win1 'C:\app\web.config' --sha256
komando fs cat win1 'C:\app\app.log' --tail 50
komando fs write win1 'C:\app\web.config' --from ./web.config --backup --if-changed
komando upload os:windows ./tool.exe 'C:\tools\'
komando download win1 'C:\app\app.log' --to ./logs/
```

- `fs list` tidak menampilkan file tersembunyi kecuali `--all`.
- `fs write` menulis file baru di samping yang lama, lalu menukarnya dalam satu langkah, sehingga file mempertahankan izinnya (ACL). `--backup`, `-p`, `--append`, `--if-changed`, `--no-follow`, dan `--validate` berfungsi. `--validate` menerima PowerShell, dengan `%s` untuk file baru, dan berjalan di PowerShell tersendiri: `--validate 'Test-Json (Get-Content %s -Raw)'`. Untuk membatalkan, salin `.bak` kembali dengan `komando exec win1 -- Copy-Item ...`; `fs restore` belum berfungsi di Windows.
- `upload`, `download`, dan `cp` menyalin satu file. Folder (`-r`), `--sudo`, `--mode`, dan `--owner` belum berfungsi di Windows.

## Service

```bash
komando svc list win1 --state running         # running, stopped, atau --failed
komando svc status win1 W3SVC sshd
komando svc restart win1 W3SVC --wait 10s     # gagal kecuali berjalan dalam 10 detik
komando svc enable win1 MyApp --now           # mulai otomatis, dan mulai sekarang
```

Namanya adalah nama service (`W3SVC`) atau display name-nya. `--failed` mencantumkan service yang seharusnya mulai otomatis tetapi berhenti dengan error. `svc reload`, `svc daemon-reload`, dan `svc logs` tidak punya bentuk Windows.

## Yang berfungsi di Windows

| Berfungsi | Belum |
|-----------|-------|
| `test`, `facts`, `exec` (juga `--script`), `shell` | `pkg`, `user`, `cron`, `logs`, `docker`, `net`, `cert check`, `recipe run`, `reboot` |
| `fs list`, `stat`, `cat`, `write` | `fs replace`, `fs restore`, `fs rm`, `mkdir`, `mv`, `chmod`, `sync` |
| `upload`, `download`, `cp` (satu file) | `job`, `cp -r`, `svc reload`, `svc daemon-reload`, `svc logs` |
| `svc status`, `list`, `start`, `stop`, `restart`, `enable`, `disable` | `--sudo`, `--pty`, `--mode`, `--owner` |
| `host trust`, `login`, `tunnel`, `--via` lewat server Windows (hanya SSH) | `shell`, tunnel, `host trust` lewat WinRM |

Perintah yang belum tersedia berhenti dengan `NOT_SUPPORTED` sebelum apa pun berjalan; `fs restore` berhenti dengan error penggunaan (`USAGE`) yang menyebut `Copy-Item`. Sebagai gantinya, jalankan PowerShell dengan `exec`, misalnya `Get-WinEvent -LogName System -MaxEvents 50` untuk log, atau `Restart-Computer` (dengan `--allow-dangerous`) untuk restart.

## Batasan

- Script PowerShell komando diuji dengan PowerShell 7 di Linux, bukan di server Windows sungguhan: Windows PowerShell 5.1, OpenSSH Windows, WinRM dengan NTLM, service, dan Windows Update belum dijalankan di sana. Laporkan apa pun yang tidak berfungsi.
- WinRM hanya login dengan kata sandi: `--key`, `--identity`, dan `--proxy-command` ditolak. Pakai `--via` untuk lewat bastion.
- `fs write --backup` menyimpan backup, tetapi `fs restore` tidak berfungsi di Windows: salin backup kembali dengan `komando exec SERVER -- Copy-Item ...`.
- Kerberos, CredSSP, sertifikat klien, dan enkripsi pesan milik WinRM sendiri lewat HTTP polos tidak didukung.
- WinRM hanya membawa perintah: `shell`, tunnel, `host trust`, `login`, dan `host ssh-command` butuh OpenSSH.
- Windows tidak punya sudo: `--sudo` dan `--pty` ditolak.
- Target yang memilih server Windows dan server lain sekaligus ditolak untuk `exec` (`MIXED_OS`).
- `--read-only` hanya menerima sebagian kecil PowerShell yang tercantum di atas.
- komando menjalankan PowerShell tanpa profil Anda (`-NoProfile`).

## Pemecahan masalah

| Kode error | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `NOT_SUPPORTED` | perintah belum berfungsi di server Windows | jalankan PowerShell dengan `komando exec SERVER -- ...`, atau kecualikan: `TARGET,!os:windows` |
| `MIXED_OS` | target memilih server Windows dan server lain | jalankan dua kali, dengan `TARGET,os:windows` dan `TARGET,!os:windows` |
| `READ_ONLY_VIOLATION` | PowerShell-nya tidak termasuk bagian kecil yang diterima `--read-only` | hilangkan `--read-only`; server yang dilindungi lalu bertanya dulu |
| `POWERSHELL_FAILED` | komando bisa login tetapi PowerShell tidak menjawab | periksa bahwa `powershell.exe` ada di PATH user yang dipakai login |
| `WINRM_TLS` | sertifikat WinRM server tidak tepercaya | dari CA perusahaan Anda: tambahkan `?ca=secret:NAME` ke alamat |
| `WINRM_INSECURE` | login Basic lewat HTTP polos akan mengirim kata sandi tanpa enkripsi | pakai HTTPS, atau NTLM (hilangkan `auth=basic`) |
| `AUTH_FAILED` lewat WinRM | user atau kata sandi salah, atau user tidak boleh memakai WinRM | periksa keduanya; login Basic hanya untuk akun lokal, dan user harus administrator atau anggota Remote Management Users |
| `USAGE` dari `fs restore` | `fs restore` tidak berfungsi di Windows | `komando exec SERVER -- Copy-Item ...` |

- **`pending updates unknown`** di `facts`: Windows tidak mengizinkan banyak login jarak jauh mencari di Windows Update. Update terakhir yang terinstal tetap ditampilkan.
- **Perintah berfungsi di PowerShell Anda sendiri tetapi tidak lewat komando**: komando menjalankan PowerShell tanpa profil Anda (`-NoProfile`), jadi alias dan modul dari profil Anda tidak ada di sana.
