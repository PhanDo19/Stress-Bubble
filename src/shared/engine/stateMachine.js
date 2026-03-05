const STATES = {
  HOME: 'HOME',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  RESULT: 'RESULT',
};

const TRANSITIONS = {
  [STATES.HOME]: new Set([STATES.PLAYING]),
  [STATES.PLAYING]: new Set([STATES.RESULT, STATES.PAUSED]),
  [STATES.PAUSED]: new Set([STATES.PLAYING]),
  [STATES.RESULT]: new Set([STATES.HOME, STATES.PLAYING]),
};

function canTransition(fromState, toState) {
  const allowed = TRANSITIONS[fromState];
  return Boolean(allowed && allowed.has(toState));
}

export function createStateMachine(initialState = STATES.HOME) {
  let currentState = initialState;

  function setState(nextState) {
    if (nextState === currentState) return currentState;
    if (!canTransition(currentState, nextState)) return currentState;
    currentState = nextState;
    return currentState;
  }

  function getState() {
    return currentState;
  }

  function isPlaying() {
    return currentState === STATES.PLAYING;
  }

  return {
    setState,
    getState,
    isPlaying,
  };
}

export { STATES };
