import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

const VPS_VERSION_URL = 'https://interfone.suporttechcuritiba.com.br/admin/app-version';
const VPS_APK_URL = 'https://interfone.suporttechcuritiba.com.br/admin/download/app';

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

async function downloadAndInstall(version: string): Promise<void> {
  const dest = `${FileSystem.cacheDirectory}kas-update-${version.replace(/\./g, '_')}.apk`;

  Alert.alert('Baixando atualização...', `Versão ${version} — aguarde, pode demorar alguns segundos.`);

  try {
    const { uri } = await FileSystem.downloadAsync(VPS_APK_URL, dest);
    const contentUri = await FileSystem.getContentUriAsync(uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1,
      type: 'application/vnd.android.package-archive',
    });
  } catch (e) {
    console.error('[Updater] Erro ao baixar/instalar:', e);
    Alert.alert('Erro', 'Não foi possível baixar a atualização. Tente novamente mais tarde.');
  }
}

export async function checkForUpdate(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const currentVersion: string = Constants.expoConfig?.version ?? '1.0.0';

  try {
    const res = await fetch(VPS_VERSION_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) return;

    const data = await res.json();
    const latestVersion: string = data.version ?? '';

    if (!latestVersion || !isNewer(latestVersion, currentVersion)) return;

    Alert.alert(
      'Atualização disponível',
      `Nova versão ${latestVersion} disponível! (atual: ${currentVersion})`,
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Atualizar', onPress: () => downloadAndInstall(latestVersion) },
      ],
    );
  } catch {
    // sem internet ou servidor indisponível — silencioso
  }
}
