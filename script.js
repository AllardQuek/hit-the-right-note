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
const context = canvas.getContext('2d');
let contextHeight;
let notesToPaint = [];

onWindowResize();

//window.requestAnimationFrame(draw);

draw();

function draw() {
  context.fillStyle = 'red';
  context.fillRect(0, contextHeight, 100, 100);
  
  return;
  context.clearRect(0, 0, window.innerWidth, contextHeight);
  
  // Remove all the notes that will be off the page;
  notesToPaint = notesToPaint.filter((note) => note.y > 2);
    
  // Advance all the notes.
  for (let i = 0; i < notesToPaint.length; i++) {
    notesToPaint[i].y -= 1;
    context.rect(notesToPaint[i].x, notesToPaint[i].y, notesToPaint[i].width, 20);
  }
  //window.requestAnimationFrame(draw);
};

// Event listeners.
window.addEventListener('resize', onWindowResize);
document.addEventListener('keydown',onKeyDown);
document.addEventListener('keyup', onKeyUp);

function onKeyDown(event) {
  // Keydown fires continuously and we don't want that.
  if (event.repeat) {
    return;
  }
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  event.preventDefault();
  document.getElementById(`btn${button}`).setAttribute('active', true);
  const rectDown = update(button);
  
  // Start drawing a note column.
  
  setTimeout(() => {
    rectDown.removeAttribute('active');
    rectDown.removeAttribute('class');
  }, 1000);
}

function onKeyUp(event) {
  const button = event.keyCode - 49;
  if (button < 0 || button >= NUM_BUTTONS) {
    return;
  } 
  document.getElementById(`btn${button}`).removeAttribute('active');
}

function onWindowResize() {
  const totalWhiteNotes = NOTES_PER_OCTAVE * OCTAVES;
  config.whiteNoteWidth = window.innerWidth / totalWhiteNotes;
  config.blackNoteWidth = config.whiteNoteWidth * 2 / 3;
  svg.setAttribute('width', window.innerWidth);
  svg.setAttribute('height', config.whiteNoteHeight);
  
  // Do the canvas dance.
  ///const dpr = window.devicePixelRatio;
  canvas.width = window.innerWidth;
  canvas.height = (window.innerHeight - config.whiteNoteHeight - 20);
  contextHeight = window.innerHeight;
  //context.scale(dpr, dpr);

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
  
  notesToPaint.push({x: parseFloat(rect.getAttribute('x')), y: contextHeight, width: parseFloat(rect.getAttribute('width'))});
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