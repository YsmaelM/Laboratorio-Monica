import fs from 'fs';
import path from 'path';

async function main() {
  // 1. Resolve path to firebase-tools config
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const configPath = path.join(homeDir, '.config', 'configstore', 'firebase-tools.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`Error: No se encontró la sesión de Firebase CLI en: ${configPath}`);
    console.log('Por favor ejecuta: firebase login');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const accessToken = config.tokens?.access_token;
  
  if (!accessToken) {
    console.error('Error: No se encontró el token de acceso. Ejecuta: firebase login');
    process.exit(1);
  }

  // 2. Read bucket name from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: No se encontró el archivo .env.local');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const bucketMatch = envContent.match(/VITE_FIREBASE_STORAGE_BUCKET=(.+)/);
  if (!bucketMatch || !bucketMatch[1]) {
    console.error('Error: VITE_FIREBASE_STORAGE_BUCKET no está definido en .env.local');
    process.exit(1);
  }

  const bucket = bucketMatch[1].trim();
  console.log(`Configurando CORS para el bucket: ${bucket}...`);

  // 3. Make PATCH request to Google Cloud Storage API
  const corsRes = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucket}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      cors: [
        {
          origin: ["*"],
          method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          responseHeader: ["Content-Type", "Authorization", "x-firebase-storage-version"],
          maxAgeSeconds: 3600
        }
      ]
    })
  });

  const corsData = await corsRes.json();
  if (!corsRes.ok) {
    console.error('Error al configurar CORS:', corsData);
    if (corsData.error?.code === 404 || corsData.error?.code === 403) {
      console.log('\nTIP: Asegúrate de haber iniciado sesión con la cuenta de Google correcta que tiene acceso a este proyecto.');
      console.log('Puedes cambiar de cuenta ejecutando:');
      console.log('  firebase logout');
      console.log('  firebase login');
    }
    process.exit(1);
  }

  console.log('¡CORS configurado exitosamente!');
}

main().catch(console.error);
