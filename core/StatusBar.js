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
    this.clear();
    this.enabled = false;
  }

  setValue(status) {
    this.status = status;
    if (this.enabled) {
      this.render();
    }
  }

  render() {
    if (!this.enabled) return;

    this.clear();
    process.stdout.write(`[STATUS] ${this.status}`);
  }

  clear() {
    if (!this.enabled) return;
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
  }
}
