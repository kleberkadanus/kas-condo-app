import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

let IntentLauncher: any = null;
try { IntentLauncher = require('expo-intent-launcher'); } catch {}

const GITHUB_RELEASES_API = 'https://api.github.com/repos/kleberkadanus/kas-condo-app/releases/latest';
const LOCAL_APK_PATH = FileSystem.documentDirectory + 'app-update.apk';

function parseVersion(v: string): number[] {
  return v.replace(/^v/, '').split('.').map(Number);
}

function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return false;
}

async function installApk(localUri: string): Promise<void> {
  if (!IntentLauncher) {
    Alert.alert('Erro', 'Módulo de instalação não disponível nesta versão.');
    return;
  }
  try {
    const contentUri = await FileSystem.getContentUriAsync(localUri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1,
      type: 'application/vnd.android.package-archive',
    });
  } catch (e) {
    Alert.alert('Erro', 'Não foi possível abrir o instalador. Tente reinstalar manualmente.');
  }
}

async function downloadAndInstall(apkUrl: string): Promise<void> {
  try {
    const existing = await FileSystem.getInfoAsync(LOCAL_APK_PATH);
    if (existing.exists) await FileSystem.deleteAsync(LOCAL_APK_PATH, { idempotent: true });

    const dl = FileSystem.createDownloadResumable(apkUrl, LOCAL_APK_PATH);
    const result = await dl.downloadAsync();
    if (!result?.uri) {
      Alert.alert('Erro', 'Falha ao baixar a atualização.');
      return;
    }
    await installApk(result.uri);
  } catch {
    Alert.alert('Erro', 'Falha ao baixar ou instalar a atualização.');
  }
}

export async function checkForUpdate(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return;

    const data = await res.json();
    const latestTag: string = data.tag_name ?? '';
    const currentVersion: string = Constants.expoConfig?.version ?? '1.0.0';

    if (!latestTag || !isNewer(latestTag, currentVersion)) return;

    const apkAsset = data.assets?.find((a: any) => a.name.endsWith('.apk'));
    const apkUrl: string = apkAsset?.browser_download_url ?? '';
    if (!apkUrl) return;

    Alert.alert(
      'Atualização disponível',
      `Nova versão ${latestTag} disponível!\n\nO download será feito automaticamente. Ao terminar, confirme a instalação.`,
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Atualizar',
          onPress: () => {
            Alert.alert('Baixando...', 'Aguarde. A instalação será iniciada automaticamente ao concluir.');
            downloadAndInstall(apkUrl);
          },
        },
      ],
    );
  } catch {
    // sem internet ou erro silencioso
  }
}
