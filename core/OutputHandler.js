import { Transform } from "stream";
import readline from "readline";

export class OutputHandler extends Transform {
  constructor(output) {
    super();
    this.output = output;
    this.isTTY = !!output.isTTY;
    this.buffer = "";
    this.statusBar = this.isTTY;
    this.status = "";
  }
  setStatus(status) {
    const v = `[STATUS] ${status}`;
    if (this.isTTY) this.status = v;
    else process.stderr.write(`${v}\n`);
    this.renderStatusBar();
  }
  showStatusBar(show) {
    if (!show) this.clearStatusBar();
    this.statusBar = this.isTTY && show;
    this.renderStatusBar();
  }
  clearStatusBar() {
    if (!this.statusBar) return;
    readline.clearLine(this.output, 0);
    readline.cursorTo(this.output, 0);
  }
  renderStatusBar() {
    if (!this.status) return;
    this.clearStatusBar();
    this.output.write(this.status);
  }
  _transform(chunk, encoding, callback) {
    const nlpos = chunk.indexOf("\n");
    if (nlpos != -1) {
      this.buffer += chunk.toString().substring(0, nlpos + 1);
      this.clearStatusBar();
      this.output.write(this.buffer);
      this.renderStatusBar();
      this.buffer = "";
      chunk = chunk.toString().substring(nlpos + 1);
      if (chunk.length > 0) return this._transform(chunk, encoding, callback)
    } else {
      this.buffer += chunk.toString();
    }
    callback();
  }
  _flush(callback) {
    if (this.buffer.length > 0) {
      this.clearStatusBar();
      this.output.write(this.buffer + "\n");
      this.renderStatusBar();
    }
    callback();
  }
  _destroy(error, callback) {
    if (this.output != process.stdout) this.output.end();
    callback(error);
  }
}
