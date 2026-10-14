// Yerel .env (varsa); diğer modüller env'i okumadan önce ilk import olarak yüklenir.
// --env-file-if-exists, --watch-path ile birlikte sonsuz yeniden başlatma döngüsüne giriyor.
try {
  process.loadEnvFile();
} catch {}
