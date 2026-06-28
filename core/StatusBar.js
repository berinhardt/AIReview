import readline from 'readline';

export class StatusBar {
  constructor() {
    this.status = '';
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
    this.render();
  }

  disable() {
    this.enabled = false;
    this.clear();
  }

  update(status) {
    this.status = status;
    if (this.enabled) {
      this.render();
    }
  }

  render() {
    if (!this.enabled) return;
    
    // Save cursor
    process.stdout.write('\x1b[s');
    
    // Move to last line
    readline.cursorTo(process.stdout, 0, process.stdout.rows - 1);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(`[STATUS] ${this.status}`);
    
    // Restore cursor
    process.stdout.write('\x1b[u');
  }

  clear() {
    // Move to last line
    readline.cursorTo(process.stdout, 0, process.stdout.rows - 1);
    readline.clearLine(process.stdout, 0);
  }
}
