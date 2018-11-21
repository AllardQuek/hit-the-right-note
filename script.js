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

windowResized();


window.addEventListener('resize', windowResized);
document.addEventListener('keydown', (event) => {
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  document.getElementById(`btn${button}`).setAttribute('active', true);
  
  p5Canvas.update(button);
});

document.addEventListener('keyup', (event) => {
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  document.getElementById(`btn${button}`).removeAttribute('active');
});

function windowResized() {
  const totalWhiteNotes = NOTES_PER_OCTAVE * OCTAVES;
  config.whiteNoteWidth = window.innerWidth / totalWhiteNotes;
  config.blackNoteWidth = config.whiteNoteWidth * 2 / 3;
  svg.setAttribute('width', window.innerWidth);
  svg.setAttribute('height', config.whiteNoteHeight);
  
  drawPiano();
}
function drawPiano() {
  let x = 0;
  let y = 0; //p.height - whiteNoteHeight - 20;
  const halfABlackNote = config.blackNoteWidth / 2;
  const index = 0;
  for (let o = 0; o < OCTAVES; o++) {
    for (let i = 0; i < NOTES_PER_OCTAVE; i++) {
      makeRect(i, x, y, config.whiteNoteWidth, config.whiteNoteHeight, 'white', '#141E30');
      
      // No black notes for 0, 3.
      if (i % NOTES_PER_OCTAVE !== 0 && i % NOTES_PER_OCTAVE !== 3) {
        makeRect(x - halfABlackNote, y, config.blackNoteWidth, config.blackNoteHeight, 'black');
      }
      x += config.whiteNoteWidth;
    }
  }
}

function makeRect(x, y, w, h, fill, stroke) {
  const svgNS = 'http://www.w3.org/2000/svg';
  
  const rect = document.createElementNS(svgNS, 'rect');
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