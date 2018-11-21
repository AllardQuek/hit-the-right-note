const p5Canvas = new p5(sketch, 'container');

function sketch(p) {
  let whiteNoteWidth;
  let blackNoteWidth;
  
  p.setup = function() {
    p.windowResized();
    console.log('setup');
  };
  
  p.windowResized = function () {
    console.log('resized');
    
    const numTiles = sequences.targetWidth / sequences.tileSize;
    const nextSize = Math.min(MAX_TILE_SIZE,
        p.windowWidth / Math.max(8, Math.floor(numTiles)));
    sequences.targetWidth = numTiles * nextSize;
    sequences.tileSize = nextSize;

    const totalHeight = sequences.tileSize + SCRUB_BAR_GAP + SCRUB_BAR_HEIGHT;
    p.createCanvas(p.windowWidth, totalHeight);
  }

}

