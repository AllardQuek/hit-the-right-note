const COLORS = ['#D5281B','#F6530D','#F69217','#FECD34','#CDF352','#8ED734','#4CB928','#1A9322'];
const NUM_BUTTONS = 8;
const NOTES_PER_OCTAVE = 7;
const OCTAVES = 7;
const config = {
  whiteNoteWidth: 20,
  blackNoteWidth: 20,
  whiteNoteHeight: 70,
  blackNoteHeight: 2 * 70 / 3
}
const floatingNotes = new p5(sketch);

onWindowResize();

// Event listeners.
window.addEventListener('resize', onWindowResize);
document.addEventListener('keydown',onKeyDown);
document.addEventListener('keyup', onKeyUp);

let rectDown;   
function onKeyDown(event) {
  // TODO: note, this keeps on firing. should it?
  console.log('keydown')
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  document.getElementById(`btn${button}`).setAttribute('active', true);
  rectDown = update(button);
}

function onKeyUp(event) {
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  document.getElementById(`btn${button}`).removeAttribute('active');
  
  rectDown.removeAttribute('active');
  rectDown.removeAttribute('class');
}

function onWindowResize() {
  const totalWhiteNotes = NOTES_PER_OCTAVE * OCTAVES;
  config.whiteNoteWidth = window.innerWidth / totalWhiteNotes;
  config.blackNoteWidth = config.whiteNoteWidth * 2 / 3;
  svg.setAttribute('width', window.innerWidth);
  svg.setAttribute('height', config.whiteNoteHeight);
  
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
    for (let i = 0; i < NOTES_PER_OCTAVE; i++) {
      makeRect(index, x, y, config.whiteNoteWidth, config.whiteNoteHeight, 'white', '#141E30');
      index++;
      
      // No black notes for 0, 3.
      if (i % NOTES_PER_OCTAVE !== 0 && i % NOTES_PER_OCTAVE !== 3) {
        makeRect(index, x - halfABlackNote, y, config.blackNoteWidth, config.blackNoteHeight, 'black');
        index++;
      }
      x += config.whiteNoteWidth;
    }
  }
}

function update(button) {
  // For now, pick a note at random to highlight it.
  const totalNotes = 84;
  const note = Math.floor(Math.random() * totalNotes);
  const rect = svg.querySelector(`rect[data-index="${note}"]`);
  rect.setAttribute('active', true);
  rect.setAttribute('class', `color-${button}`);
  return rect;
}

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

/*************************
 * P5.js floaty notes bit
 ************************/

function sketch(p) {
  p.setup = function() {
    p.windowResized();
    p.noStroke();
    console.log('setup');
  };
  
  p.windowResized = function () {
    p.createCanvas(p.windowWidth, p.windowHeight - config.whiteNoteHeight - 20);
  }
}