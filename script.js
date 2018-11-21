const COLORS = ['#D5281B','#F6530D','#F69217','#FECD34','#CDF352','#8ED734','#4CB928','#1A9322'];
const NUM_BUTTONS = 8;
const NOTES_PER_OCTAVE = 10;
const WHITE_NOTES_PER_OCTAVE = 6;
let OCTAVES = 7;
const config = {
  whiteNoteWidth: 20,
  blackNoteWidth: 20,
  whiteNoteHeight: 70,
  blackNoteHeight: 2 * 70 / 3
}
const context = canvas.getContext('2d');
let contextHeight;
const heldButtonToMidiNote = new Map();
let notesToPaint = [];

// Start the drawing loop.
onWindowResize();
window.requestAnimationFrame(paintNotes);

// Fake the UI for now. This is where you would load the model instead.
setTimeout(() => {
  playBtn.textContent = 'Play';
  playBtn.removeAttribute('disabled');
  playBtn.classList.remove('loading');
}, 1500);

// Event listeners.
window.addEventListener('resize', onWindowResize);
document.addEventListener('keydown',onKeyDown);
controls.addEventListener('touchstart', () => buttonDown(event.target.dataset.id, true));
controls.addEventListener('touchend', () => buttonUp(event.target.dataset.id));
controls.addEventListener('mousedown', () => buttonDown(event.target.dataset.id, true));
controls.addEventListener('mouseup', () => buttonUp(event.target.dataset.id));
document.addEventListener('keyup', onKeyUp);




function showMainScreen() {
  document.querySelector('.splash').hidden = true;
  document.querySelector('.loaded').hidden = false;
}

function fakeModelSample() {
  // For now, pick a note at random to highlight it.
  const totalNotes = NOTES_PER_OCTAVE * OCTAVES;
  return Math.floor(Math.random() * totalNotes);
}

function buttonDown(button, fromKeyDown) {
  if (heldButtonToMidiNote.has(button)) {
    return;
  }
  document.getElementById(`btn${button}`).setAttribute('active', true);
  
  // Get a note from the model.
  const note = fakeModelSample();
  
  // Show the note on the piano roll.
  const rect = svg.querySelector(`rect[data-index="${note}"]`);
  rect.setAttribute('active', true);
  rect.setAttribute('class', `color-${button}`);
  
  const noteToPaint = {
      x: parseFloat(rect.getAttribute('x')), 
      y: contextHeight, 
      width: parseFloat(rect.getAttribute('width')),
      height: 0,
      color: COLORS[button],
      on: true
  };
  notesToPaint.push(noteToPaint);
  heldButtonToMidiNote.set(button, {rect:rect, note:note, noteToPaint:noteToPaint});
  
  if (!fromKeyDown) {
    setTimeout(() => buttonUp(button), 200);
  }
}

function buttonUp(button) {
  document.getElementById(`btn${button}`).removeAttribute('active');
  const thing = heldButtonToMidiNote.get(button);
  if (thing) {
    // Piano roll.
    thing.rect.removeAttribute('active');
    thing.rect.removeAttribute('class');
    
    // Floaty notes.
    thing.noteToPaint.on = false;
  }
  heldButtonToMidiNote.delete(button);
}

/*************************
 * Events
 ************************/
function onKeyDown(event) {
  // Keydown fires continuously and we don't want that.
  if (event.repeat) {
    return;
  }
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  buttonDown(button, true);
}

function onKeyUp(event) {
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  buttonUp(button);
}

function onWindowResize() {
  OCTAVES = window.innerWidth > 700 ? 7 : 3;
  const totalWhiteNotes = WHITE_NOTES_PER_OCTAVE * OCTAVES;
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
 * Draws a piano roll
 ************************/
function drawPiano() {
  const halfABlackNote = config.blackNoteWidth / 2;
  let x = 0;
  let y = 0;
  let index = 0;
  for (let o = 0; o < OCTAVES; o++) {
    for (let i = 0; i < WHITE_NOTES_PER_OCTAVE; i++) {
      makeRect(index, x, y, config.whiteNoteWidth, config.whiteNoteHeight, 'white', '#141E30');
      index++;
      
      // No black notes for 0, 3.
      if (i % WHITE_NOTES_PER_OCTAVE !== 0 && i % WHITE_NOTES_PER_OCTAVE !== 3) {
        makeRect(index, x - halfABlackNote, y, config.blackNoteWidth, config.blackNoteHeight, 'black');
        index++;
      }
      x += config.whiteNoteWidth;
    }
  }
}

function paintNotes() {
  const dy = 3;
  context.clearRect(0, 0, window.innerWidth, contextHeight);
  
  // Remove all the notes that will be off the page;
  notesToPaint = notesToPaint.filter((note) => note.on || note.y > 100);
    
  // Advance all the notes.
  for (let i = 0; i < notesToPaint.length; i++) {
    const note = notesToPaint[i];
    note.y -= dy;
    
    // If the note is still on, then its height goes up too.
    if (note.on) {
      note.height += dy;
    }
    context.globalAlpha = note.y / contextHeight;
    context.fillStyle = note.color;
    context.fillRect(note.x, note.y, note.width, note.height);
  }
  window.requestAnimationFrame(paintNotes);
};

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