const p5Canvas = new p5(sketch, 'container');

function sketch(p) {
  const NOTES_PER_OCTAVE = 7;
  const OCTAVES = 7;
  
  let whiteNoteWidth;
  let blackNoteWidth;
  let whiteNoteHeight = 100;
  let blackNoteHeight = 2 * whiteNoteHeight / 3;
  
  p.setup = function() {
    console.log('setup');
    p.windowResized();
  };
  
  p.windowResized = function () {
    console.log('resized');
    
    const totalWhiteNotes = NOTES_PER_OCTAVE * OCTAVES;

    whiteNoteWidth = Math.floor(p.windowWidth / totalWhiteNotes);
    blackNoteWidth = Math.floor(whiteNoteWidth * 2 / 3);
    
    p.createCanvas(p.windowWidth, p.windowHeight);
    drawPiano();
  }
  
  function drawPiano() {
    let x = 0;
    let y = p.height - whiteNoteHeight;
    const halfABlackNote = blackNoteWidth / 2;
    
    for (let o = 0; o < OCTAVES; o++) {
      for (let i = 0; i < NOTES_PER_OCTAVE; i++) {
        p.stroke('black');
        p.fill('white');
        p.rect(x, y, whiteNoteWidth, whiteNoteHeight);

        // No black notes for 0, 3
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

