export function buildResultShareText(result) {
  const rank = result?.rank ?? 'Bronze';
  const score = result?.score ?? 0;
  return `Stress Bubble - ${rank} - Score ${score}`;
}

function fallbackCopyWithSelection(text) {
  if (typeof document === 'undefined' || !document.body) return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch (err) {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

export async function copyResultText(text) {
  if (!text) return { ok: false, kind: 'error' };

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, kind: 'copied' };
    } catch (err) {
      // fall through to browser-safe fallback
    }
  }

  if (fallbackCopyWithSelection(text)) {
    return { ok: true, kind: 'copied' };
  }

  if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
    window.prompt('Copy result', text);
    return { ok: true, kind: 'manual' };
  }

  return { ok: false, kind: 'error' };
}

export async function shareResultText({ title, text }) {
  if (!text) return { ok: false, kind: 'error' };

  if (navigator?.share) {
    try {
      await navigator.share({ title, text });
      return { ok: true, kind: 'shared' };
    } catch (err) {
      if (err?.name === 'AbortError') {
        return { ok: false, kind: 'cancelled' };
      }
    }
  }

  const copied = await copyResultText(text);
  if (copied.kind === 'copied') {
    return { ok: true, kind: 'shared_via_copy' };
  }
  if (copied.kind === 'manual') {
    return { ok: true, kind: 'manual' };
  }
  return { ok: false, kind: 'error' };
}
