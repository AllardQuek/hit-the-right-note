const p5Canvas = new p5(sketch, 'container');
const colours = ['#D5281B','#F6530D','#F69217','#FECD34','#CDF352','#8ED734','#4CB928','#1A9322'];

/****************
 * p5 canvas, draws:
 * - a pianoroll.
 ****************/

function sketch(p) {
  const NOTES_PER_OCTAVE = 7;
  const OCTAVES = 7;
  
  let whiteNoteWidth;
  let blackNoteWidth;
  let whiteNoteHeight = 70;
  let blackNoteHeight = 2 * whiteNoteHeight / 3;
  
  p.setup = function() {
    p.windowResized();
  };
  
  p.windowResized = function () {
    const totalWhiteNotes = NOTES_PER_OCTAVE * OCTAVES;

    whiteNoteWidth = p.windowWidth / totalWhiteNotes;
    blackNoteWidth = whiteNoteWidth * 2 / 3;
    
    p.createCanvas(p.windowWidth, p.windowHeight);
    drawPiano();
  }
  
  function drawPiano() {
    let x = 0;
    let y = p.height - whiteNoteHeight - 20;
    const halfABlackNote = blackNoteWidth / 2;
    
    for (let o = 0; o < OCTAVES; o++) {
      for (let i = 0; i < NOTES_PER_OCTAVE; i++) {
        p.strokeWeight(3);
        p.stroke('#141E30');
        p.fill('white');
        p.rect(x, y, whiteNoteWidth, whiteNoteHeight);

        // No black notes for 0, 3.
        if (i % NOTES_PER_OCTAVE !== 0 && i % NOTES_PER_OCTAVE !== 3) {
          p.fill('black');
          p.noStroke();
          p.rect(x - halfABlackNote, y, blackNoteWidth, blackNoteHeight);
        }
        x += whiteNoteWidth;
      }
    }
  }
}

