export type LicenseState = { activated: boolean; machineId: string; licenseKey: string };

export function getMachineId(): string {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const raw = [nav?.userAgent, nav?.platform, nav?.language, typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : ''].join('|');
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return `HB-${(h >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

export function validateOfflineLicense(key: string, machineId = getMachineId()): boolean {
  // Offline format: HB1-<8 hex machine id>-<8 hex checksum>.
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length !== 3 || parts[0] !== 'HB1' || parts[1] !== machineId.replace('HB-', '')) return false;
  let h = 2166136261;
  const input = `HAPPY-BINGO-OFFLINE-LICENSE|${parts[1]}|2026`;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return parts[2] === (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}
