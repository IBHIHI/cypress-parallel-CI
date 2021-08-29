const { setWorldConstructor } = require("@cucumber/cucumber");
const path = require("path");
const childProcess = require("child_process");
const { PassThrough } = require("stream");
const { WritableStreamBuffer } = require("stream-buffers");

const projectPath = path.join(__dirname, "..", "..");

function combine(...streams) {
  return streams.reduce((combined, stream) => {
    stream.pipe(combined, { end: false });
    stream.once(
      "end",
      () => streams.every((s) => s.readableEnded) && combined.emit("end")
    );
    return combined;
  }, new PassThrough());
}

class World {
  async run(extraArgs = []) {
    const child = childProcess.spawn(
      path.join(projectPath, "bin", "cypress-parallel"),
      ["run", ...extraArgs],
      {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: this.tmpDir,
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
      }
    );

    const combined = combine(child.stdout, child.stderr);

    if (process.env.DEBUG) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }

    const stdoutBuffer = child.stdout.pipe(new WritableStreamBuffer());
    const stderrBuffer = child.stderr.pipe(new WritableStreamBuffer());
    const outputBuffer = combined.pipe(new WritableStreamBuffer());

    const exitCode = await new Promise((resolve) => {
      child.on("close", resolve);
    });

    const stdout = stdoutBuffer.getContentsAsString();
    const stderr = stderrBuffer.getContentsAsString();
    const output = outputBuffer.getContentsAsString();

    this.verifiedLastRunError = false;

    this.lastRun = {
      stdout,
      stderr,
      output,
      exitCode,
    };
  }
}

setWorldConstructor(World);
