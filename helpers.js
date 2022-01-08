const CONSTANTS = {
  COLORS : ['#000000', '#FF0018','#FFA52C','#ffff00','#008018','#0000F9','#86007D', '#ffffff'],
  NUM_BUTTONS : 8,
  NOTES_PER_OCTAVE : 12,
  WHITE_NOTES_PER_OCTAVE : 7,
  LOWEST_PIANO_KEY_MIDI_NOTE : 21,
  HTRN_CHECKPOINT : 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',  
}

/*************************
 * MIDI or Magenta player
 ************************/
class Player {
  constructor() {
    this.player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
    this.loadAllSamples();
  }
  
  loadAllSamples() {
    const seq = {notes:[]};
    for (let i = 0; i < CONSTANTS.NOTES_PER_OCTAVE * OCTAVES; i++) {
      seq.notes.push({pitch: CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + i});
    }
    this.player.loadSamples(seq);
  }
  
  playNoteDown(pitch, button) {
    // Play with the Magenta player.
    mm.Player.tone.context.resume();
    this.player.playNoteDown({pitch:pitch});
  }
  
  playNoteUp(pitch, button) {
    // Play with the Magenta player.
    this.player.playNoteUp({pitch:pitch});
  }
}

/*************************
 * Floaty notes
 ************************/
class FloatyNotes {
  constructor() {
    this.notes = [];  // the notes floating on the screen.
    
    this.canvas = document.getElementById('canvas')
    this.context = this.canvas.getContext('2d');
    this.context.lineWidth = 4;
    this.context.lineCap = 'round';
    
    this.contextHeight = 0;
  }
  
  resize(whiteNoteHeight) {
    this.canvas.width = window.innerWidth;
    this.canvas.height = this.contextHeight = window.innerHeight - whiteNoteHeight - 20;
  }
  
  addNote(button, x, width) {
    const noteToPaint = {
        x: parseFloat(x),
        y: 0,
        width: parseFloat(width),
        height: 0,
        color: CONSTANTS.COLORS[button],
        on: true
    };
    this.notes.push(noteToPaint);
    return noteToPaint;
  }
  
  stopNote(noteToPaint) {
    noteToPaint.on = false;
  }
  
  // * Draws the duration of the note being played
  drawLoop() {
    const speed = 4.5;
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Remove all the notes that will be off the page;
    this.notes = this.notes.filter((note) => note.on || note.y < (this.contextHeight - 100));

    // Advance all the notes.
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];

      // If the note is still on, then its height goes up but it
      // doesn't start sliding down yet.
      if (note.on) {
        note.height += speed;
      } else {
        note.y += speed;
      }
      
      this.context.globalAlpha = 1 - note.y / this.contextHeight;
      this.context.fillStyle = note.color;
      this.context.fillRect(note.x, note.y, note.width, note.height);
    }
    window.requestAnimationFrame(() => this.drawLoop());
  }
}

class Piano {
  constructor() {
    this.config = {
      whiteNoteWidth: document.width * 0.1,
      blackNoteWidth: document.height * 0.1,
      whiteNoteHeight: 70,
      blackNoteHeight: 2 * 70 / 3
    }
    
    this.svg = document.getElementById('unicorns');
    this.svgNS = 'http://www.w3.org/2000/svg';
  }
  
  draw() {
    const halfABlackNote = this.config.blackNoteWidth / 2;
    var x = 0;
    let y = 0;
    let index = 0;

    let unicorns = document.getElementsByClassName("unicorn");

    for (var i = 0; i < unicorns.length; i++) { 
      console.log(`AM I EVENMAKING ${x}`);
      this.makeRect(i, (i + 1) * 2 * this.config.whiteNoteWidth, y, this.config.whiteNoteWidth, this.config.whiteNoteHeight, 'white', '#141E30');
      index++;
      // x = 2 * this.config.whiteNoteWidth;
    }
  }
  
  highlightNote(note, button) {
    // Show the note on the piano roll.
    const rect = this.svg.querySelector(`rect[data-index="${button}"]`);
    // const rect = document.getElementById(`unicorn-${button}`);
    if (!rect) {
      console.log('couldnt find a rect for note', note);
      return;
    }
    rect.setAttribute('active', true);
    rect.setAttribute('class', `color-${button}`);
    return rect;
  }
  
  clearNote(rect) {
    rect.removeAttribute('active');
    rect.removeAttribute('class');
  }
  
  makeRect(index, x, y, w, h, fill, stroke) {
    const rect = document.createElementNS(this.svgNS, 'rect');
    console.log(`MAKING: ${x}`);
    console.log(x);
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
    this.svg.appendChild(rect);
    return rect;
  }
}