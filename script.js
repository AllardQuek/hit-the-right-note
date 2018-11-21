const p5Canvas = new p5(sketch, 'container');

function sketch(p) {
  const NOTES_PER_OCTAVE = 7;
  const OCTAVES = 7;
  
  let whiteNoteWidth;
  let blackNoteWidth;
  let whiteNoteHeight = 120;
  let blackNoteHeight = 2 * 120 / 3;
  
  p.setup = function() {
    p.windowResized();
    console.log('setup');
  };
  
  p.windowResized = function () {
    console.log('resized');
    
    const totalWhiteNotes = NOTES_PER_OCTAVE * OCTAVES;

    whiteNoteWidth = Math.floor(p.windowWidth / totalWhiteNotes);
    blackNoteWidth = Math.floor(whiteNoteWidth * 2 / 3);
    
    p.createCanvas(p.windowWidth, whiteNoteHeight + 100);
  }
  
  function drawPiano() {
    let x = 0;
    let y = 0;
    for (let i = 0; i < NOTES_PER_OCTAVE; i++) {
      p.rect(x, y, whiteNoteWidth, whiteNoteHeight);
      p.rect((x -  , y, blackNoteWidth, blackNoteHeight);
    }
  }
    
  /*
  <rect class="white" x="0" y="0" width="20" height="120"/>
          <rect class="white" x="20" y="0" width="20" height="120"/>
          <rect class="white" x="40" y="0" width="20" height="120"/>
          <rect class="white" x="60" y="0" width="20" height="120"/>
          <rect class="white" x="80" y="0" width="20" height="120"/>
          <rect class="white" x="100" y="0" width="20" height="120"/>
          <rect class="white" x="120" y="0" width="20" height="120"/>

          <!-- 20 - 14/2 -->
          <rect class="black" x="13" y="0" width="14" height="80"/>
          <rect class="black" x="33" y="0" width="14" height="80"/>
          <!-- skip a note -->
          <rect class="black" x="73" y="0" width="14" height="80"/>
          <rect class="black" x="93" y="0" width="14" height="80"/>
          <rect class="black" x="113" y="0" width="14" height="80"/>
          */

}

