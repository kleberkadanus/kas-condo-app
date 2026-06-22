import { Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';

const GITHUB_RELEASES_API = 'https://api.github.com/repos/kleberkadanus/kas-condo-app/releases/latest';
const APK_DOWNLOAD_URL = 'https://interfone.suporttechcuritiba.com.br/admin/download/app';

function parseVersion(v: string): number[] {
  return v.replace(/^v/, '').split('.').map(Number);
}

function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return false;
}

export async function checkForUpdate(): Promise<void> {
  if (Platform.OS !== 'android') return; // APK é só Android

  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return;

    const data = await res.json();
    const latestTag: string = data.tag_name ?? '';
    const currentVersion: string = Constants.expoConfig?.version ?? '1.0.0';

    if (latestTag && isNewer(latestTag, currentVersion)) {
      Alert.alert(
        '🆕 Atualização disponível',
        `Nova versão ${latestTag} disponível!\n\nDeseja baixar agora?`,
        [
          { text: 'Agora não', style: 'cancel' },
          {
            text: 'Baixar',
            onPress: () => Linking.openURL(APK_DOWNLOAD_URL),
          },
        ],
      );
    }
  } catch {
    // silencioso — sem internet ou erro de rede não interrompe o app
  }
}
