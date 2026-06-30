import { Transform } from "stream";

export class OutputHandler extends Transform {
   constructor(statusBar) {
      super();
      this.statusBar = statusBar;
      this.buffer = "";
   }

   _transform(chunk, encoding, callback) {
      const nlpos = chunk.indexOf("\n");
      if (nlpos != -1) {
         this.buffer += chunk.toString().substring(0, nlpos + 1);
         this.statusBar?.clear();
         process.stdout.write(this.buffer);
         this.statusBar?.render();
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
         this.statusBar?.clear();
         process.stdout.write(this.buffer + "\n");
         this.statusBar?.render();
      }
   }
}
