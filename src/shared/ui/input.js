export function bindInputs({ canvas, onClick, onStart, onRestart, onPauseToggle }) {
  if (!canvas) return () => {};

  function handleClick(event) {
    if (typeof onClick !== 'function') return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    onClick(x, y);
  }

  function handleKey(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      if (typeof onStart === 'function') onStart();
      return;
    }
    if (event.code === 'KeyR') {
      event.preventDefault();
      if (typeof onRestart === 'function') onRestart();
      return;
    }
    if (event.code === 'Escape') {
      event.preventDefault();
      if (typeof onPauseToggle === 'function') onPauseToggle();
    }
  }

  canvas.addEventListener('click', handleClick);
  window.addEventListener('keydown', handleKey);

  return () => {
    canvas.removeEventListener('click', handleClick);
    window.removeEventListener('keydown', handleKey);
  };
}
