import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export class Exporter {
  canvas: HTMLCanvasElement;
  recorder: MediaRecorder | null = null;
  chunks: Blob[] = [];
  ffmpeg: FFmpeg | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initFFmpeg() {
    if (this.ffmpeg) return;
    this.ffmpeg = new FFmpeg();
    await this.ffmpeg.load();
  }

  startRecording() {
    this.chunks = [];
    const stream = this.canvas.captureStream(30); // 30 FPS

    // Check supported formats
    let options = { mimeType: "video/webm;codecs=vp9" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm;codecs=vp8" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }

    this.recorder = new MediaRecorder(stream, options);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };
    this.recorder.start();
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder) return resolve(new Blob());

      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: "video/webm" });
        resolve(blob);
      };
      this.recorder.stop();
    });
  }

  async convertToMP4(webmBlob: Blob): Promise<Blob> {
    await this.initFFmpeg();
    if (!this.ffmpeg) throw new Error("FFmpeg not initialized");

    const inputName = 'input.webm';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    
    // Convert to MP4
    await this.ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', '-b:a', '192k', outputName]);
    
    const data = await this.ffmpeg.readFile(outputName);
    return new Blob([data], { type: 'video/mp4' });
  }

  download(blob: Blob, filename: string = "animation.webm") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
