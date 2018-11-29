const CONSTANTS = {
  COLORS : ['#EE2B29','#ff9800','#ffff00','#c6ff00','#00e5ff','#2979ff','#651fff','#d500f9'],
  NUM_BUTTONS : 8,
  NOTES_PER_OCTAVE : 12,
  WHITE_NOTES_PER_OCTAVE : 7,
  LOWEST_PIANO_KEY_MIDI_NOTE : 21,
  GENIE_CHECKPOINT : 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',  
}

class Player {
  constructor() {
    this.player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
    this.midiOut = [];
    this.usingMidiOut = false;
    this.selectElement = document.getElementById('selectOut');
    this.loadAllSamples();
  }
  
  loadAllSamples() {
    const seq = {notes:[]};
    for (let i = 0; i < CONSTANTS.NOTES_PER_OCTAVE * OCTAVES; i++) {
      seq.notes.push({pitch: CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + i});
    }
    this.player.loadSamples(seq);
  }
  
  playNoteDown(pitch) {
    // Send to MIDI out or play with the Magenta player.
    if (this.usingMidiOut) {
      this.sendMidiNoteOn(pitch);
    } else {
      mm.Player.tone.context.resume();
      this.player.playNoteDown({pitch:pitch});
    }
  }
  
  playNoteUp(pitch) {
    // Send to MIDI out or play with the Magenta player.
    if (this.usingMidiOut) {
      this.sendMidiNoteOff(pitch);
    } else {
      this.player.playNoteUp({pitch:pitch});
    }
  }
  
  // MIDI bits.
  midiReady(midi) {
    // Also react to device changes.
    midi.addEventListener('statechange', (event) => this.initDevices(event.target));
    this.initDevices(midi);

    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
      this.midiOut.push(output.value);
    }
  }

  initDevices(midi) {
    this.midiOut = [];

    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
      this.midiOut.push(output.value);
    }
    this.selectElement.innerHTML = this.midiOut.map(device => `<option>${device.name}</option>`).join('');
  }

  sendMidiNoteOn(pitch) {
    const msg = [0x90, pitch, 0x7f];    // note on, full velocity.
    this.midiOut[this.selectElement.selectedIndex].send(msg);
  }

  sendMidiNoteOff(pitch) {
    const msg = [0x80, pitch, 0x7f];    // note on, middle C, full velocity.
    this.midiOut[this.selectElement.selectedIndex].send(msg);
  }
}

class FloatyNotes {
  constructor() {
    this.notes = [];  // the notes floating on the screen.
  }
  
  addNote(note) {
    this.notes.push(note);
  }
  
  drawLoop() {
    const dy = 3;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Remove all the notes that will be off the page;
    this.notes = this.notes.filter((note) => note.on || note.y < (contextHeight - 100));

    // Advance all the notes.
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];

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
    window.requestAnimationFrame(this.drawLoop);
  }
}