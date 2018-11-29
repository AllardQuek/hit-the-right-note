/*************************
 * Consts for everyone!
 ************************/
let OCTAVES = 7;
let keyWhitelist;
let TEMPERATURE = getTemperature();

const heldButtonToVisualData = new Map();

let sustaining = false
let sustainingNotes = [];

const player = new Player();
const genie = new mm.PianoGenie(CONSTANTS.GENIE_CHECKPOINT);
const painter = new FloatyNotes();
const piano = new Piano();

initEverything();

/*************************
 * Basic UI bits
 ************************/
function initEverything() {
  genie.initialize().then(() => {
    console.log('🧞‍♀️ready!');
    playBtn.textContent = 'Play';
    playBtn.removeAttribute('disabled');
    playBtn.classList.remove('loading');
  });

  // Start the drawing loop.
  onWindowResize();
  window.requestAnimationFrame(() => painter.drawLoop());

  // Event listeners.
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('orientationchange', onWindowResize);
  window.addEventListener('hashchange', () => TEMPERATURE = getTemperature());
}

function showMainScreen() {
  document.querySelector('.splash').hidden = true;
  document.querySelector('.loaded').hidden = false;

  document.addEventListener('keydown',onKeyDown);
  controls.addEventListener('touchstart', () => buttonDown(event.target.dataset.id, true), {passive: true});
  controls.addEventListener('touchend', () => buttonUp(event.target.dataset.id), {passive: true});
  controls.addEventListener('mousedown', () => buttonDown(event.target.dataset.id, true));
  controls.addEventListener('mouseup', () => buttonUp(event.target.dataset.id));
  radioMidiYes.addEventListener('click', () => {
    usingMidiOut = true;
    midiOutBox.hidden = false;
  });
  radioMidiNo.addEventListener('click', () => {
    usingMidiOut = false;
    midiOutBox.hidden = true;
  });
  
  // Figure out if WebMidi works.
  if (navigator.requestMIDIAccess) {
    midiNotSupported.hidden = true;
    midiSupported.hidden = false;
    navigator.requestMIDIAccess()
      .then(
          (midi) => player.midiReady(midi),
          (err) => console.log('Something went wrong', err));
  } else {
    midiNotSupported.hidden = false;
    midiSupported.hidden = true;
  }

  document.addEventListener('keyup', onKeyUp);

  // Slow to start up, so do a fake prediction to warm up the model.
  const note = genie.nextFromKeyWhitelist(0, keyWhitelist, TEMPERATURE);
  genie.resetState();
}

/*************************
 * Button actions
 ************************/
function buttonDown(button, fromKeyDown) {
  // If we're already holding this button down, nothing new to do.
  if (heldButtonToVisualData.has(button)) {
    return;
  }
  
  const el = document.getElementById(`btn${button}`);
  if (!el)
    return;
  el.setAttribute('active', true);
  
  const note = genie.nextFromKeyWhitelist(button, keyWhitelist, TEMPERATURE);
  const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + note;

  // Hear it.
  player.playNoteDown(pitch);
  
  // See it.
  const rect = piano.highlightNote(note, button);
  
  // Float it.
  const noteToPaint = painter.addNote(button, rect.getAttribute('x'), rect.getAttribute('width'));
  heldButtonToVisualData.set(button, {rect:rect, note:note, noteToPaint:noteToPaint});

  if (!fromKeyDown) {
    setTimeout(() => buttonUp(button), 300);
  }
}

function buttonUp(button) {
  const el = document.getElementById(`btn${button}`);
  if (!el)
    return;
  el.removeAttribute('active');
  
  const thing = heldButtonToVisualData.get(button);
  if (thing) {
    // Don't see it.
    piano.clearNote(thing.rect);
    
    // Stop holding it down.
    painter.stopNote(thing.noteToPaint);
    
    // Maybe stop hearing it.
    const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + thing.note;
    if (!sustaining) {
      player.playNoteUp(pitch);
    } else {
      sustainingNotes.push(CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + thing.note);
    }
  }
  heldButtonToVisualData.delete(button);
}

/*************************
 * Events
 ************************/
function onKeyDown(event) {
  // Keydown fires continuously and we don't want that.
  if (event.repeat) {
    return;
  }
  if (event.keyCode === 32) {  // sustain pedal
    sustaining = true;
  } else {
    const button = getButtonFromKeyCode(event.keyCode);
    if (button != null) {
      buttonDown(button, true);
    }
  }
}

function onKeyUp(event) {
  if (event.keyCode === 32) {  // sustain pedal
    sustaining = false;
    // Release everything.

    sustainingNotes.forEach((note) => player.playNoteUp(note));
    sustainingNotes = [];
  } else {
    const button = getButtonFromKeyCode(event.keyCode);
    if (button != null) {
      buttonUp(button);
    }
  }
}

function onWindowResize() {
  OCTAVES = window.innerWidth > 700 ? 7 : 3;
  const totalNotes = CONSTANTS.NOTES_PER_OCTAVE * OCTAVES + 3 + 1; // starts on an A, ends on a C.
  const totalWhiteNotes = 2 + CONSTANTS.WHITE_NOTES_PER_OCTAVE * OCTAVES + 1; // starts on an A, ends on a C.
  keyWhitelist = Array(totalNotes).fill().map((x,i) => i);
  
  piano.resize(totalWhiteNotes);
  painter.resize(piano.config.whiteNoteHeight);
  piano.draw();
}

/*************************
 * Utils and helpers
 ************************/
const keyToButtonMap = [65,83,68,70,74,75,76,186];
function getButtonFromKeyCode(keyCode) {
  let button = keyCode - 49;
  if (button >= 0 && button < CONSTANTS.NUM_BUTTONS) {
    return button;
  } else {
    button = keyToButtonMap.indexOf(keyCode);
    if (button >= 0 && button < CONSTANTS.NUM_BUTTONS) {
      return button;
    }
  }
  return null;
}

function getTemperature() {
  const hash = parseFloat(parseHashParameters()['temperature']) || 0;
  const newTemp = Math.min(1, hash);
  console.log('🧞‍♀️ changed to ', newTemp);
}

function parseHashParameters() {
  const hash = window.location.hash.substring(1);
  const params = {}
  hash.split('&').map(hk => {
    let temp = hk.split('=');
    params[temp[0]] = temp[1]
  });
  return params;
}
