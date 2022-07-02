/* SPDX-License-Identifier: GPL-3.0-or-later */

"use strict";

var jsptb = {
  ret: null,
  events: [],
  debugMessage: "",
  flipTime: -1,
  flipTimeStamps: [],
  kbWait: null,
  kbState: {
    get keys() {
      return Object.keys(this);
    },
    get length() {
      return this.keys.length;
    },
  },
  mouseWait: null,
  mouseXY: [-1, -1],
  mouseButtons: 0,
  mouseTimeStamp: -1,
  get audioCtx() {
    let audioCtx = this._audioCtx || new window.AudioContext();
    if (audioCtx.state == "suspended") audioCtx.resume();
    this._audioCtx = audioCtx;
    return audioCtx;
  },
  ENABLED_KEYS: ["Escape", "F5", "F11", "F12"],
  eventListeners: {
    keydown: _keyHandler,
    keyup: _keyHandler,
    pointerdown: _mouseHandler,
    pointerup: _mouseHandler,
    pointercancel: _mouseHandler,
    pointermove: _mouseMove,
    dragstart: _ignoreEvent,
    beforeunload: _ignoreEvent,
    contextmenu: _ignoreEvent,
    focus: _logEvent,
    blur: _logEvent,
    resize: _logEvent,
  },
};

Object.defineProperties(jsptb.kbState, {
  keys: { enumerable: false },
  length: { enumerable: false },
});

async function Flip(when = 0) {
  return new Promise((r) => {
    jsptb.flipTime = Math.max(0, when);
    jsptb.ret = r;
  });
}

function GetMillis() {
  return performance.now();
}

async function WaitSecs(secs) {
  return WaitMillis(1000 * secs);
}

async function WaitMillis(millis) {
  return new Promise((r) => setTimeout(r, Math.floor(millis)));
}

async function GetMouse() {
  return new Promise((r) =>
    _queueMacrotask(() => r([...jsptb.mouseXY, jsptb.mouseButtons]))
  );
}

async function MouseWait(areas = [], timeout = 0) {
  let promises = [
    new Promise((r) => {
      if (areas[0] && !Array.isArray(areas[0])) areas = [areas];
      jsptb.mouseWait = areas;
      jsptb.ret = r;
    }),
  ];
  if (timeout > 0) promises.push(_waitTimeout(timeout));
  return Promise.race(promises);
}

async function KbCheck() {
  return new Promise((r) =>
    _queueMacrotask(() => r(CopyObject(jsptb.kbState)))
  );
}

async function KbWait(keys = true, timeout = 0) {
  // if wait for any/none keys depressed, check and return immediately if satisfied
  if (keys === (jsptb.kbState.length != 0)) return {};

  let promises = [
    new Promise((r) => {
      if (typeof keys == "string") keys = [keys];
      jsptb.kbWait = keys;
      jsptb.ret = r;
    }),
  ];
  if (timeout > 0) promises.push(_waitTimeout(timeout));
  return Promise.race(promises);
}

function OpenWindow(
  width,
  height,
  color = "#000",
  bgColor = color,
  debug = false
) {
  let body = document.body,
    html = document.documentElement;
  html.style = "display:table; width:100%; height:100%";
  body.style = `display:table-cell; width:100%; height:100%; text-align:center; vertical-align:middle; background-color:${bgColor}; overflow:hidden; touch-action:none`;

  if (debug) {
    let dbgdiv = document.createElement("div");
    dbgdiv.style =
      "position:absolute; top:0; left:0; color:cyan; text-align:left";
    body.appendChild(dbgdiv);
    jsptb.dbgdiv = dbgdiv;
  }

  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let canvas2 = canvas.cloneNode();
  body.appendChild(canvas);
  body.appendChild(canvas2);
  jsptb.canvas = canvas;
  jsptb.canvas2 = canvas2;
  jsptb.color = color;
  _flip();
  _flip();

  _registerEventListeners(true);
  jsptb.rafID = window.requestAnimationFrame(_raf);
}

function CloseWindow() {
  let body = document.body;
  body.removeChild(jsptb.canvas);
  body.removeChild(jsptb.canvas2);
  _registerEventListeners(false);
  window.cancelAnimationFrame(jsptb.rafID);
}

function ShowCursor(show = true) {
  const style = show ? "pointer" : "none";
  jsptb.canvas.style.cursor = style;
  jsptb.canvas2.style.cursor = style;
}

function HideCursor() {
  ShowCursor(false);
}

function GetWindowResolution() {
  return [window.innerWidth, window.innerHeight];
}

function GetScreenResolution() {
  return [window.screen.width, window.screen.height];
}

function CopyObject(obj) {
  return Object.defineProperties({}, Object.getOwnPropertyDescriptors(obj));
}

async function WaitEvent(elem, event) {
  return new Promise((r) => elem.addEventListener(event, r, { once: true }));
}

function Logger(message, ...extra) {
  console.log(message);
  let timeStamp = performance.now();
  jsptb.events.push({ timeStamp, message, extra });
}

function FillRect(x, y, w, h, color) {
  let ctx = jsptb.ctx2d;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function FrameRect(x, y, w, h, color, width = 1) {
  let ctx = jsptb.ctx2d;
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, w, h);
}

function DrawOval(x, y, rX, rY, color, fill, width) {
  let ctx = jsptb.ctx2d;
  ctx.beginPath();
  ctx.ellipse(x, y, rX, rY, 0, 0, 2 * Math.PI);
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}

function FillOval(x, y, rX, rY, color) {
  DrawOval(x, y, rX, rY, color, true);
}

function FrameOval(x, y, rX, rY, color, width = 1) {
  DrawOval(x, y, rX, rY, color, false, width);
}

function DrawLine(x0, y0, x1, y1, color, width = 1) {
  let ctx = jsptb.ctx2d;
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.closePath();
  ctx.stroke();
}

function DrawDots(x, y, r, color) {
  let ctx = jsptb.ctx2d;
  [x, y] = [x, y].map((i) => (Array.isArray(i) ? i : [i]));
  [r, color] = [r, color].map((i) =>
    Array.isArray(i) ? i : Array(x.length).fill(i)
  );
  for (let i = 0; i < x.length; i++) {
    ctx.beginPath();
    ctx.arc(x[i], y[i], r[i], 0, 2 * Math.PI);
    ctx.fillStyle = color[i];
    ctx.fill();
  }
}

function DrawImage(img, src = [], dst = [], rotation = 0) {
  let ctx = jsptb.ctx2d;
  let w = img.videoWidth || img.naturalWidth || img.width,
    h = img.videoHeight || img.naturalHeight || img.height;
  if (!src || !src.length) src = [0, 0, w, h];
  if (!dst || !dst.length) dst = [0, 0];
  if (dst.length == 2) {
    let [dx, dy] = dst;
    dst = [dx, dy, src[2], src[3]];
  }
  let [sx, sy, sWidth, sHeight] = src;
  let [dx, dy, dWidth, dHeight] = dst;
  ctx.save();
  ctx.setTransform();
  if (rotation) {
    ctx.translate(dx + dWidth / 2, dy + dHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    dx = -dWidth / 2;
    dy = -dHeight / 2;
  }
  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  ctx.restore();
}

// see also: github.com/geongeorge/Canvas-Txt
function DrawText(
  text,
  x,
  y,
  color,
  align = "left",
  size = 30,
  font = "Arial",
  width = undefined,
  spacing = 1.2
) {
  let ctx = jsptb.ctx2d;
  ctx.font = `${size}px ${font}`;
  ctx.textBaseline = align == "center" ? "middle" : "top";
  ctx.fillStyle = color;
  ctx.textAlign = align;
  if (!width) {
    for (let line of text.split("\n")) {
      ctx.fillText(line, x, y);
      y += spacing * size;
    }
    return;
  }

  let punct = /['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~'\u3000-\u303f\uff01-\uff0f\uff1a-\uff1f\s]/;
  for (let line of text.split("\n")) {
    let t, m, i;
    if (!line)
      // empty line
      y += spacing * size;
    while (line) {
      let b = null; // last word boundary
      for (
        i = 1;
        i <= line.length &&
        (m = ctx.measureText(line.slice(0, i))).width <= width;
        i++
      )
        if (line[i - 1].match(/\s/)) b = i;
      if (i < line.length && b) i = b;
      while (i < line.length && line[i].match(punct)) i++;
      t = line.slice(0, i);
      // console.log(m, t);
      ctx.fillText(t, x, y);
      y += spacing * size;
      line = line.slice(i);
    }
  }
}

async function GetCanvasImageBlob(front = true, type = "image/png") {
  let canvas = front ? jsptb.canvas : jsptb.canvas2;
  return new Promise((r) => canvas.toBlob(r));
}

function ArrayToCSV(data, cols) {
  // add UTF-8 BOM (TODO: escape commas)
  return `\ufeff${cols.join()}
${data.map((row) => cols.map((c) => row[c]).join()).join("\n")}`;
}

function SaveFile(data, filename, type) {
  if (!(data instanceof Blob)) {
    if (!Array.isArray(data)) data = [data];
    data = new Blob(data, { type: type });
  }
  let url = URL.createObjectURL(data);

  let a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  _queueMacrotask(() => window.URL.revokeObjectURL(url));
}

async function UploadFile(body, url, method, headers = {}) {
  const init = { body, method, headers };
  const r = await fetch(url, init);
  return [r.ok, await r.text()];
}

async function UploadJSON(data, url, method = "PUT", headers) {
  headers = new Headers(headers);
  headers.set("Content-Type", "application/json");
  return await UploadFile(JSON.stringify(data), url, method, headers);
}

async function LoadScript(url) {
  let script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);
  await WaitEvent(script, "load");
  return script;
}

// set cors=false for local files
async function LoadImage(url, cors = true) {
  let img = new Image();
  //https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
  if (cors) img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();
  return img;
}

async function GetImageData(img, sx = 0, sy = 0, sw, sh) {
  img = await createImageBitmap(img);
  let w = img.videoWidth || img.naturalWidth || img.width,
    h = img.videoHeight || img.naturalHeight || img.height;
  let canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(sx, sy, sw ?? w, sh ?? h).data;
}

async function LoadMedia(type, url, preload = true) {
  let media = document.createElement(type);

  if (preload) {
    let blob = await fetch(url).then((r) => r.blob());
    let urlSource = URL.createObjectURL(blob);
    media.src = urlSource;
    _queueMacrotask(() => window.URL.revokeObjectURL(urlSource));
  } else {
    media.src = url;
  }
  await WaitEvent(media, "loadeddata");
  return media;
}

async function LoadVideo(url, preload = true) {
  return LoadMedia("video", url, preload);
}

async function LoadAudio(url, preload = true) {
  return LoadMedia("audio", url, preload);
}

async function LoadAudioBuffer(url) {
  let { audioCtx } = jsptb;
  let buffer = await fetch(url).then((r) => r.arrayBuffer());
  let source = audioCtx.createBufferSource();
  source.buffer = await jsptb.audioCtx.decodeAudioData(buffer);
  source.connect(audioCtx.destination);
  return source;
}

function Beeper(freq = 440, volume = 1, duration = 1, delay = 0) {
  let { audioCtx } = jsptb;
  let oscillator = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  gain.gain.value = volume;

  let t = audioCtx.currentTime;
  oscillator.frequency.value = freq;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(t + delay);
  oscillator.stop(t + delay + duration);
  return oscillator;
}

function RandInt(a = 0, b = 1) {
  return a + Math.floor((1 + b - a) * Math.random());
}

function RandChoice(a) {
  return a[Math.floor(a.length * Math.random())];
}

function Shuffle(a) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor((i + 1) * Math.random());
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function MakeGabor(
  size, // in pixels
  deg, // orientation in degrees
  std, // standard deviation in pixels of the Gaussian envelope
  freq, //  in cycles/pixel
  phase = 0, // 0-1
  color1 = [0, 0, 0],
  color2 = [255, 255, 255],
  envelope = "gaussian"
) {
  let rad = (deg / 180) * math.PI;
  let X = math.matrixFromFunction([size, size], ([i, j]) => size / 2 - i);
  let Y = math.matrixFromFunction([size, size], ([i, j]) => size / 2 - j);
  let T = math.add(
    math.multiply(X, math.cos(rad)),
    math.multiply(Y, math.sin(rad))
  );
  let Z = math
    .chain(T)
    .multiply(freq * 2 * math.PI)
    .add(phase * math.PI)
    .sin()
    .multiply(0.5)
    .add(0.5)
    .flatten()
    .done();

  let R = math.chain(math.add(math.square(X), math.square(Y))).flatten();
  let A = null;
  if (envelope == "gaussian") {
    A = R.divide(-2 * std * std)
      .exp()
      .done();
  } else if (envelope == "linear") {
    A = R.sqrt()
      .divide(-size / 2)
      .add(1)
      .done();
  } else if (envelope == "circle") {
    A = R.sqrt()
      .add(-size / 2)
      .multiply(-1)
      .sign()
      .done();
  }

  const [r1, g1, b1] = color1,
    [r2, g2, b2] = color2;
  let arr = new Uint8ClampedArray(4 * size * size);
  for (let i = 0, p = 0; i < size * size; i++) {
    let a = Z[i],
      b = 1 - a;
    arr[p++] = a * r1 + b * r2;
    arr[p++] = a * g1 + b * g2;
    arr[p++] = a * b1 + b * b2;
    arr[p++] = A ? 255 * A[i] : 255;
  }
  let imgData = new ImageData(arr, size);
  return await createImageBitmap(imgData);
}

// internal functions

function _queueMacrotask(f) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate#Notes
  window.addEventListener("message", f, { once: true });
  postMessage(null);
}

function _busyWait(ms) {
  for (let t0 = performance.now(); performance.now() - t0 < ms; );
}

function _waitTimeout(timeout) {
  return new Promise((r) => {
    jsptb.timeoutID = setTimeout(() => {
      jsptb.kbWait = jsptb.mouseWait = null;
      r({ timeout: true, timeStamp: performance.now() });
    }, Math.floor(timeout));
  });
}

function _ignoreEvent(event) {
  event.preventDefault();
  event.returnValue = "";
}

function _logEvent(event) {
  Logger(`Event ${event.type}`);
}

function _mouseMove(event) {
  let x = event.pageX - jsptb.canvas.offsetLeft,
    y = event.pageY - jsptb.canvas.offsetTop;
  //Logger(`Mouse-Move ${event.type} ${event.buttons} (${x},${y})`);
  jsptb.mouseXY = [x, y];
  jsptb.mouseTimeStamp = event.timeStamp;
}

function _mouseHandler(event) {
  let { type, buttons, timeStamp } = event;
  let mousedown = type == "pointerdown",
    x = event.pageX - jsptb.canvas.offsetLeft,
    y = event.pageY - jsptb.canvas.offsetTop;
  Logger(`Mouse ${type} ${buttons} (${x},${y})`);
  event.preventDefault();

  jsptb.mouseXY = [x, y];
  jsptb.mouseButtons = buttons;
  jsptb.mouseTimeStamp = timeStamp;

  if (mousedown && jsptb.mouseWait) {
    let which = jsptb.mouseWait
      .map(([x0, y0, w, h]) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h)
      .indexOf(true);

    if (which >= 0 || jsptb.mouseWait.length == 0) {
      jsptb.mouseWait = null;
      clearTimeout(jsptb.timeoutID);
      queueMicrotask(() => jsptb.ret({ which, x, y, buttons, timeStamp }));
      return;
    }
  }
}

function _keyHandler(event) {
  let { type, code, timeStamp } = event;

  if (event.repeat) return;
  Logger(`Keyboard ${type} ${code} ${timeStamp}`);
  if (jsptb.ENABLED_KEYS.indexOf(code) < 0) event.preventDefault();

  if (type == "keydown") {
    jsptb.kbState[code] = timeStamp;
  } else {
    delete jsptb.kbState[code];
  }

  if (jsptb.kbWait !== null) {
    if (
      (Array.isArray(jsptb.kbWait) && jsptb.kbWait.includes(code)) ||
      jsptb.kbWait === (jsptb.kbState.length != 0) // any or none
    ) {
      jsptb.kbWait = null;
      clearTimeout(jsptb.timeoutID);
      queueMicrotask(() => jsptb.ret({ code, timeStamp }));
    }
  }
}

function _registerEventListeners(add = true) {
  let f = (add ? addEventListener : removeEventListener).bind(window);
  for (let i in jsptb.eventListeners) f(i, jsptb.eventListeners[i]);
}

function _flip() {
  [jsptb.canvas, jsptb.canvas2] = [jsptb.canvas2, jsptb.canvas];
  jsptb.canvas.style.display = "";
  jsptb.canvas2.style.display = "none";
  jsptb.ctx2d = jsptb.canvas2.getContext("2d", { alpha: false });
  jsptb.ctx2d.setTransform();
  jsptb.ctx2d.clearRect(0, 0, jsptb.canvas.width, jsptb.canvas.height);
  jsptb.ctx2d.fillStyle = jsptb.color;
  jsptb.ctx2d.fillRect(0, 0, jsptb.canvas.width, jsptb.canvas.height);
}

function _raf(ts) {
  jsptb.rafID = window.requestAnimationFrame(_raf);
  jsptb.flipTimeStamps.push(ts);

  const N = 10;
  let len = jsptb.flipTimeStamps.length;
  if (len > N + 1) {
    let fps = 1000 / ((ts - jsptb.flipTimeStamps[len - N - 1]) / N);
    if (jsptb.dbgdiv) {
      let [w, h] = GetWindowResolution();
      jsptb.dbgdiv.innerText = `fps=${fps.toFixed(3)} win=(${w},${h})
mouse=${jsptb.mouseButtons} key=${jsptb.kbState.keys.join()}
${jsptb.debugMessage}`;
    }
  }

  if (jsptb.flipTime >= 0 && ts > jsptb.flipTime) {
    _flip();
    jsptb.flipTime = -1;
    _queueMacrotask(() => jsptb.ret(ts));
  } else {
    // force repaint (otherwise Firefox may have timing issues)
    // see https://stackoverflow.com/a/3485654
    jsptb.canvas.style.display = "none";
    jsptb.canvas.offsetHeight;
    jsptb.canvas.style.display = "";
  }
}
