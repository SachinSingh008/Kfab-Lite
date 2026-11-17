type KeyEventLike = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey' | 'target'> &
  Partial<Pick<KeyboardEvent, 'code'>>;

/** Whether this browser runs on Apple hardware, where ⌘ plays the part Ctrl plays elsewhere. */
export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

/**
 * Whether the keystroke is someone typing rather than reaching for a shortcut.
 *
 * The listener is on `window`, so it sees every keystroke in the app including
 * the ones going into an invoice line. A combo carrying Ctrl/Alt/Meta is still
 * honoured there — Ctrl+S from inside a field is the whole point of Ctrl+S —
 * but a bare key is indistinguishable from typing, and a user who remaps an
 * action onto one would otherwise fire it on every matching character.
 */
export function isTypingTarget(e: KeyEventLike): boolean {
  if (e.ctrlKey || e.altKey || e.metaKey) {
    return false;
  }
  const target = e.target as HTMLElement | null;
  if (!target) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * The key name a combo is stored under.
 *
 * Normally the character the key produced, so a layout that moves letters
 * around (AZERTY) still means what its user sees on the keycap. But Option on
 * a Mac turns L into ¬ and I into a dead key, and a Hindi or Cyrillic layout
 * produces no Latin letter at all — there the physical key is the only thing
 * that still says which letter was meant.
 */
function keyName(e: KeyEventLike): string {
  const { key } = e;
  const transformed = key === 'Dead' || (key.length === 1 && (e.altKey || key.charCodeAt(0) > 127));
  if (transformed) {
    const physical = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(e.code ?? '');
    if (physical) return physical[1] ?? physical[2];
  }
  return key.length === 1 ? key.toUpperCase() : key;
}

/**
 * The shortcut string a keystroke is stored and matched as, e.g. `Ctrl+Shift+C`.
 *
 * On a Mac, ⌘ is recorded as `Ctrl`: the stored combo names the platform's
 * primary modifier, so one saved shortcut is ⌘S on a MacBook and Ctrl+S on a
 * Windows PC for the same user.
 */
export function normalizeCombo(e: KeyEventLike, mac: boolean = isMacPlatform()): string {
  const parts: string[] = [];
  const ctrl = mac ? e.ctrlKey || e.metaKey : e.ctrlKey;
  if (ctrl) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.metaKey && !mac) parts.push('Meta');
  parts.push(keyName(e));
  return parts.join('+');
}

const MODIFIER_ORDER = ['Ctrl', 'Shift', 'Alt', 'Meta'] as const;

function splitCombo(combo: string): { mods: Set<string>; key: string } {
  const mods = new Set<string>();
  let rest = combo;
  for (const mod of MODIFIER_ORDER) {
    // The key itself can be `+`, so only peel a modifier while something follows it.
    if (rest.startsWith(`${mod}+`) && rest.length > mod.length + 1) {
      mods.add(mod);
      rest = rest.slice(mod.length + 1);
    }
  }
  return { mods, key: rest };
}

/**
 * A stored combo in the form `normalizeCombo` produces on this platform.
 *
 * Before ⌘ was folded into `Ctrl`, a Mac recorded it as `Meta`; those saved
 * shortcuts still have to match the ⌘ keystroke that made them.
 */
export function canonicalCombo(combo: string, mac: boolean = isMacPlatform()): string {
  if (!mac) return combo;
  const { mods, key } = splitCombo(combo);
  if (!mods.delete('Meta')) return combo;
  mods.add('Ctrl');
  return [...MODIFIER_ORDER.filter((m) => mods.has(m)), key].join('+');
}

/** Whether a stored combo is the one a keystroke normalised to. */
export function comboMatches(stored: string, pressed: string, mac: boolean = isMacPlatform()): boolean {
  return canonicalCombo(stored, mac) === pressed;
}

const MAC_SYMBOLS: Record<string, string> = { Ctrl: '⌘', Alt: '⌥', Shift: '⇧' };

/** A combo as the user should read it: `⌥L` and `⌘⇧C` on a Mac, unchanged elsewhere. */
export function formatCombo(combo: string, mac: boolean = isMacPlatform()): string {
  if (!mac) return combo;
  const { mods, key } = splitCombo(canonicalCombo(combo, mac));
  // Apple's order: ⌥ ⇧ ⌘, then the key.
  const symbols = ['Alt', 'Shift', 'Ctrl'].filter((m) => mods.has(m)).map((m) => MAC_SYMBOLS[m]);
  return symbols.join('') + key;
}

/**
 * Whether the keystroke should open the shortcut cheat sheet.
 *
 * Matches on the produced character rather than Shift+/, so it works on
 * layouts where `?` sits elsewhere. A bare `?` while typing is just a question
 * mark, and if the user has bound an action to the same combo, the action wins.
 */
export function isCheatSheetKey(
  e: KeyEventLike,
  boundCombos: Iterable<string>,
  mac: boolean = isMacPlatform(),
): boolean {
  if (e.key !== '?' || e.ctrlKey || e.altKey || e.metaKey) {
    return false;
  }
  if (isTypingTarget(e)) {
    return false;
  }
  const combo = normalizeCombo(e, mac);
  for (const bound of boundCombos) {
    if (comboMatches(bound, combo, mac)) return false;
  }
  return true;
}
