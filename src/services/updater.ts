import { Platform, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

const GITHUB_RELEASES_API = 'https://api.github.com/repos/kleberkadanus/kas-condo-app/releases/latest';

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
      `Nova versão ${latestTag} disponível! O download será feito pelo navegador. Ao concluir, toque na notificação para instalar.`,
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Atualizar',
          onPress: () => Linking.openURL(apkUrl),
        },
      ],
    );
  } catch {
    // sem internet ou erro silencioso
  }
}
