import { describe, expect, test } from 'vitest';
import {
  canonicalCombo, comboMatches, formatCombo, isCheatSheetKey, isTypingTarget, normalizeCombo,
} from './keyboard';
import { DEFAULT_SHORTCUTS } from './shortcutDefaults';

type Target = { tagName: string; isContentEditable?: boolean } | null;

function key(
  value: string,
  {
    target = { tagName: 'BODY' } as Target, ctrl = false, shift = false, alt = false, meta = false,
    code = undefined as string | undefined,
  } = {},
) {
  return {
    key: value,
    code,
    ctrlKey: ctrl,
    shiftKey: shift,
    altKey: alt,
    metaKey: meta,
    // A real element always answers isContentEditable with a boolean.
    target: (target && { isContentEditable: false, ...target }) as unknown as EventTarget,
  };
}

const defaults = Object.values(DEFAULT_SHORTCUTS);

describe('normalizeCombo', () => {
  test('orders modifiers Ctrl, Shift, Alt, Meta and upper-cases a single character', () => {
    expect(normalizeCombo(key('c', { ctrl: true, shift: true }))).toBe('Ctrl+Shift+C');
    expect(normalizeCombo(key('i', { alt: true }))).toBe('Alt+I');
    expect(normalizeCombo(key('k', { meta: true, alt: true, shift: true, ctrl: true }), false)).toBe('Ctrl+Shift+Alt+Meta+K');
  });

  test('keeps named keys as they are', () => {
    expect(normalizeCombo(key('Escape'))).toBe('Escape');
    expect(normalizeCombo(key('F2', { shift: true }))).toBe('Shift+F2');
  });

  test('reports ? as Shift+?, the way the browser delivers it', () => {
    expect(normalizeCombo(key('?', { shift: true }))).toBe('Shift+?');
  });

  // What Chrome, Safari and Firefox on macOS (US layout) put in `key` while Option is held.
  test.each([
    ['¬', 'KeyL', 'Alt+L'],
    ['π', 'KeyP', 'Alt+P'],
    ['∂', 'KeyD', 'Alt+D'],
    ['ß', 'KeyS', 'Alt+S'],
    ['Dead', 'KeyI', 'Alt+I'],
    ['Dead', 'KeyN', 'Alt+N'],
    ['¡', 'Digit1', 'Alt+1'],
  ])('reads Option+%s on a Mac as the physical key', (produced, code, combo) => {
    expect(normalizeCombo(key(produced, { alt: true, code }), true)).toBe(combo);
  });

  test('Option+Shift on a Mac keeps both modifiers', () => {
    expect(normalizeCombo(key('Ç', { alt: true, shift: true, code: 'KeyC' }), true)).toBe('Shift+Alt+C');
  });

  test('a layout with no Latin letters still names the physical key', () => {
    expect(normalizeCombo(key('и', { ctrl: true, code: 'KeyB' }), false)).toBe('Ctrl+B');
  });

  test('a Latin layout that moves letters keeps the letter its user pressed', () => {
    // AZERTY: the key labelled A sits where QWERTY has Q.
    expect(normalizeCombo(key('a', { ctrl: true, code: 'KeyQ' }), false)).toBe('Ctrl+A');
  });

  test('records ⌘ as Ctrl on a Mac, so one saved shortcut works on both platforms', () => {
    expect(normalizeCombo(key('s', { meta: true, code: 'KeyS' }), true)).toBe('Ctrl+S');
    expect(normalizeCombo(key('c', { meta: true, shift: true, code: 'KeyC' }), true)).toBe('Ctrl+Shift+C');
    expect(normalizeCombo(key('s', { ctrl: true, code: 'KeyS' }), true)).toBe('Ctrl+S');
  });

  test('keeps the Windows key as Meta off a Mac', () => {
    expect(normalizeCombo(key('s', { meta: true }), false)).toBe('Meta+S');
  });
});

describe('canonicalCombo and comboMatches', () => {
  test('a Mac still matches ⌘ shortcuts saved as Meta before ⌘ meant Ctrl', () => {
    expect(canonicalCombo('Meta+K', true)).toBe('Ctrl+K');
    expect(canonicalCombo('Shift+Meta+K', true)).toBe('Ctrl+Shift+K');
    expect(comboMatches('Meta+K', 'Ctrl+K', true)).toBe(true);
  });

  test('leaves combos alone off a Mac, and combos without Meta on one', () => {
    expect(canonicalCombo('Meta+K', false)).toBe('Meta+K');
    expect(canonicalCombo('Alt+L', true)).toBe('Alt+L');
    expect(comboMatches('Meta+K', 'Ctrl+K', false)).toBe(false);
  });

  test('a + key is not mistaken for a separator', () => {
    expect(canonicalCombo('Meta++', true)).toBe('Ctrl++');
  });
});

describe('formatCombo', () => {
  test('shows Mac symbols in Apple order', () => {
    expect(formatCombo('Alt+L', true)).toBe('⌥L');
    expect(formatCombo('Ctrl+S', true)).toBe('⌘S');
    expect(formatCombo('Ctrl+Shift+C', true)).toBe('⇧⌘C');
    expect(formatCombo('Meta+K', true)).toBe('⌘K');
  });

  test('is unchanged off a Mac', () => {
    expect(formatCombo('Ctrl+Shift+C', false)).toBe('Ctrl+Shift+C');
  });
});

describe('isTypingTarget', () => {
  test.each(['INPUT', 'TEXTAREA', 'SELECT'])('a bare key in %s is typing', (tagName) => {
    expect(isTypingTarget(key('a', { target: { tagName } }))).toBe(true);
  });

  test('a bare key in a contenteditable element is typing', () => {
    expect(isTypingTarget(key('a', { target: { tagName: 'DIV', isContentEditable: true } }))).toBe(true);
  });

  test('a combo with Ctrl, Alt or Meta is a shortcut even inside a field', () => {
    const target = { tagName: 'INPUT' };
    expect(isTypingTarget(key('s', { target, ctrl: true }))).toBe(false);
    expect(isTypingTarget(key('i', { target, alt: true }))).toBe(false);
    expect(isTypingTarget(key('s', { target, meta: true }))).toBe(false);
  });

  test('Shift alone does not make it a shortcut', () => {
    expect(isTypingTarget(key('A', { target: { tagName: 'INPUT' }, shift: true }))).toBe(true);
  });

  test('keys outside a field, or with no target, are not typing', () => {
    expect(isTypingTarget(key('a', { target: { tagName: 'BUTTON' } }))).toBe(false);
    expect(isTypingTarget(key('a', { target: null }))).toBe(false);
  });
});

describe('isCheatSheetKey', () => {
  test('? on the page opens the cheat sheet', () => {
    expect(isCheatSheetKey(key('?', { shift: true }), defaults)).toBe(true);
  });

  test('? without Shift (a layout where it is unshifted) opens it too', () => {
    expect(isCheatSheetKey(key('?'), defaults)).toBe(true);
  });

  test('Shift+/ that does not produce ? on this layout does not', () => {
    expect(isCheatSheetKey(key('/', { shift: true }), defaults)).toBe(false);
  });

  test.each(['INPUT', 'TEXTAREA', 'SELECT'])('? typed into a %s is just a character', (tagName) => {
    expect(isCheatSheetKey(key('?', { target: { tagName }, shift: true }), defaults)).toBe(false);
  });

  test('? typed into a contenteditable element is just a character', () => {
    const target = { tagName: 'DIV', isContentEditable: true };
    expect(isCheatSheetKey(key('?', { target, shift: true }), defaults)).toBe(false);
  });

  test('? with Ctrl, Alt or Meta is some other shortcut', () => {
    expect(isCheatSheetKey(key('?', { shift: true, ctrl: true }), defaults)).toBe(false);
    expect(isCheatSheetKey(key('?', { shift: true, alt: true }), defaults)).toBe(false);
    expect(isCheatSheetKey(key('?', { shift: true, meta: true }), defaults)).toBe(false);
  });

  test('an action the user bound to Shift+? keeps the key', () => {
    expect(isCheatSheetKey(key('?', { shift: true }), [...defaults, 'Shift+?'])).toBe(false);
  });

  test('other keys never open it', () => {
    expect(isCheatSheetKey(key('h'), defaults)).toBe(false);
    expect(isCheatSheetKey(key('F1'), defaults)).toBe(false);
  });
});
