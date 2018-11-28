/*************************
 * Consts for everyone!
 ************************/
const COLORS = ['#EE2B29','#ff9800','#ffff00','#c6ff00','#00e5ff','#2979ff','#651fff','#d500f9'];
const NUM_BUTTONS = 8;
const NOTES_PER_OCTAVE = 12;
const WHITE_NOTES_PER_OCTAVE = 7;
let OCTAVES = 7;
let keyWhitelist;
const LOWEST_PIANO_KEY_MIDI_NOTE = 21;
const GENIE_CHECKPOINT = 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006';
let TEMPERATURE = getTemperature();

const config = {
  whiteNoteWidth: 20,
  blackNoteWidth: 20,
  whiteNoteHeight: 70,
  blackNoteHeight: 2 * 70 / 3
}

const heldButtonToVisualData = new Map();
const context = canvas.getContext('2d');
let contextHeight;
let floatyNotesToPaint = [];  // the notes floating on the screen.
let sustaining = false
let sustainingNotes = [];

const player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
const genie = new mm.PianoGenie(GENIE_CHECKPOINT);
const midiOut = [];

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
  
  // Before we resize, generate all the possible notes so we can load the samples.
  const seq = {notes:[]};
  for (let i = 0; i < NOTES_PER_OCTAVE * OCTAVES; i++) {
    seq.notes.push({pitch: LOWEST_PIANO_KEY_MIDI_NOTE + i});
  }
  player.loadSamples(seq);
  
  // Start the drawing loop.
  onWindowResize();
  window.requestAnimationFrame(paintNotes);
  
  // Event listeners.
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('orientationchange', onWindowResize);
  window.addEventListener('hashchange', () => TEMPERATURE = getTemperature());
  
  // Start up WebMidi.
  navigator.requestMIDIAccess()
  .then(
      (midi) => midiReady(midi),
      (err) => console.log('Something went wrong', err));
}

function showMainScreen() {
  document.querySelector('.splash').hidden = true;
  document.querySelector('.loaded').hidden = false;
  
  document.addEventListener('keydown',onKeyDown);
  controls.addEventListener('touchstart', () => buttonDown(event.target.dataset.id, true), {passive: true});
  controls.addEventListener('touchend', () => buttonUp(event.target.dataset.id), {passive: true});
  controls.addEventListener('mousedown', () => buttonDown(event.target.dataset.id, true));
  controls.addEventListener('mouseup', () => buttonUp(event.target.dataset.id));
  document.addEventListener('keyup', onKeyUp);
  
  // Slow to start up, so do a fake prediction to warm up the model.
  const note = genie.nextFromKeyWhitelist(0, keyWhitelist, TEMPERATURE);
  genie.resetState();
}

/*************************
 * Button actions
 ************************/
function buttonDown(button, fromKeyDown) {
  if (heldButtonToVisualData.has(button)) {
    return;
  }
  document.getElementById(`btn${button}`).setAttribute('active', true);
  const note = genie.nextFromKeyWhitelist(button, keyWhitelist, TEMPERATURE);
  
  mm.Player.tone.context.resume();
  player.playNoteDown({pitch:LOWEST_PIANO_KEY_MIDI_NOTE + note});
  
  // Show the note on the piano roll.
  const rect = svg.querySelector(`rect[data-index="${note}"]`);
  if (!rect) {
    console.log('couldnt find a rect for note', note);
    return;
  }
  rect.setAttribute('active', true);
  rect.setAttribute('class', `color-${button}`);
  
  const noteToPaint = {
      x: parseFloat(rect.getAttribute('x')), 
      y: 0,
      width: parseFloat(rect.getAttribute('width')),
      height: 0,
      color: COLORS[button],
      on: true
  };
  floatyNotesToPaint.push(noteToPaint);
  heldButtonToVisualData.set(button, {rect:rect, note:note, noteToPaint:noteToPaint});
  
  if (!fromKeyDown) {
    setTimeout(() => buttonUp(button), 300);
  }
}

function buttonUp(button) {
  document.getElementById(`btn${button}`).removeAttribute('active');
  const thing = heldButtonToVisualData.get(button);
  if (thing) {
    // Piano roll.
    thing.rect.removeAttribute('active');
    thing.rect.removeAttribute('class');
    
    // Floaty notes.
    thing.noteToPaint.on = false; 
    if (!sustaining) {
      player.playNoteUp({pitch:LOWEST_PIANO_KEY_MIDI_NOTE + thing.note});
    } else {
      sustainingNotes.push(LOWEST_PIANO_KEY_MIDI_NOTE + thing.note);
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
    sustainingNotes.forEach((note) => player.playNoteUp({pitch:note}));
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
  const totalNotes = NOTES_PER_OCTAVE * OCTAVES + 3 + 1; // starts on an A, ends on a C.
  const totalWhiteNotes = 2 + WHITE_NOTES_PER_OCTAVE * OCTAVES + 1; // starts on an A, ends on a C.
  keyWhitelist = Array(totalNotes).fill().map((x,i) => i);
  config.whiteNoteWidth = window.innerWidth / totalWhiteNotes;
  config.blackNoteWidth = config.whiteNoteWidth * 2 / 3;
  svg.setAttribute('width', window.innerWidth);
  svg.setAttribute('height', config.whiteNoteHeight);
  
  // Do the canvas dance.
  canvas.width = window.innerWidth;
  canvas.height = contextHeight = window.innerHeight - config.whiteNoteHeight - 20;
  context.lineWidth = 4;
  context.lineCap = 'round';
  
  drawPiano();
}

/*************************
 * Handle MIDI out
 ************************/
function midiReady(midi) {
  const outputs = midi.outputs.values();
  for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
    midiOut.push(output.value);
  }
}

function sendMidiNoteOn() {
  const noteOnMessage = [0x90, 60, 0x7f];    // note on, middle C, full velocity.
  
  for (let i = 0; i < midiOut.length; i++) {
    debugger
   // var output = midiAccess.outputs.get(portID);
  //output.send( noteOnMessage );  //omitting the timestamp means send immediately.
  //output.send( [0x80, 60, 0x40], window.performance.now() + 1000.0 ); // Inlined array creation- note off, middle C,
  }
  
}

/*************************
 * Draws a piano roll
 ************************/
function drawPiano() {
  const halfABlackNote = config.blackNoteWidth / 2;
  let x = 0;
  let y = 0;
  let index = 0;
  
  const blackNoteIndexes = [1, 3, 6, 8, 10];
  
  // First draw all the white notes.
  // Pianos start on an A:
  makeRect(0, x, y, config.whiteNoteWidth, config.whiteNoteHeight, 'white', '#141E30');
  makeRect(2, config.whiteNoteWidth, y, config.whiteNoteWidth, config.whiteNoteHeight, 'white', '#141E30');
  index = 3;
  x = 2 * config.whiteNoteWidth;
  for (let o = 0; o < OCTAVES; o++) {
    for (let i = 0; i < NOTES_PER_OCTAVE; i++) {
      if (blackNoteIndexes.indexOf(i) === -1) {
        makeRect(index, x, y, config.whiteNoteWidth, config.whiteNoteHeight, 'white', '#141E30');
        x += config.whiteNoteWidth;
      }
      index++;
    }
  }
  // And an extra C at the end
  makeRect(index, x, y, config.whiteNoteWidth, config.whiteNoteHeight, 'white', '#141E30');
  
  // Now draw all the black notes, so that they sit on top.
  // Pianos start on an A:
  makeRect(1, config.whiteNoteWidth - halfABlackNote, y, config.blackNoteWidth, config.blackNoteHeight, 'black');
  index = 3;
  x = config.whiteNoteWidth;
  
  for (let o = 0; o < OCTAVES; o++) {
    for (let i = 0; i < NOTES_PER_OCTAVE; i++) {
      if (blackNoteIndexes.indexOf(i) !== -1) {
        makeRect(index, x + config.whiteNoteWidth - halfABlackNote, y, config.blackNoteWidth, config.blackNoteHeight, 'black');
      } else {
        x += config.whiteNoteWidth;
      }
      index++;
    }
  }
}

/*************************
 * Floaty notes
 ************************/
function paintNotes() {
  const dy = 3;
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  // Remove all the notes that will be off the page;
  floatyNotesToPaint = floatyNotesToPaint.filter((note) => note.on || note.y < (contextHeight - 100));
 
  // Advance all the notes.
  for (let i = 0; i < floatyNotesToPaint.length; i++) {
    const note = floatyNotesToPaint[i];
    
    // If the note is still on, then its height goes up but it 
    // doesn't start sliding down yet.
    if (note.on) {
      note.height += dy;
    } else {
      note.y += dy;
    }
    
    context.globalAlpha = 1 - note.y / contextHeight;
    context.fillStyle = note.color;
    context.fillRect(note.x, note.y, note.width, note.height);
  }
  window.requestAnimationFrame(paintNotes);
};

/*************************
 * Utils and helpers
 ************************/
function makeRect(index, x, y, w, h, fill, stroke) {
  const svgNS = 'http://www.w3.org/2000/svg';
  
  const rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('data-index', index);
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', w);
  rect.setAttribute('height', h);
  rect.setAttribute('fill', fill);
  if (stroke) {
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', '3px');
  }
  svg.appendChild(rect);
  return rect;
}

const keyToButtonMap = [65,83,68,70,74,75,76,186];
function getButtonFromKeyCode(keyCode) {
  let button = keyCode - 49;
  if (button >= 0 && button < NUM_BUTTONS) {
    return button;
  } else {
    button = keyToButtonMap.indexOf(keyCode);
    if (button >= 0 && button < NUM_BUTTONS) {
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