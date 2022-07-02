# jsPTB API Reference

## Window basics

### OpenWindow

`OpenWindow(width, height, color = "#000", bgColor = color, debug = false)`

Open a window (an HTML canvas) with specified `width` and `height` and
register event listeners. `color` (in the format of a
[CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value))
specifies the background color of the canvas,
and `bgColor` specifies the background color for the rest of the Web page.
Set `debug` to `true` to display debugging messages at the top-left corner of the page.

**Remarks:**
Only one window can be opened, and it is positioned at the center of the page.
A window consists of two canvases (front and back buffers). Stimuli are drawn
into the back buffer while the front buffer is shown on the screen.

### CloseWindow

`CloseWindow()`

Close the window and unregister event listeners.

### _async_ Flip

`t = await Flip(when = 0)`

Flip the front and back buffers, and clear the back buffer to background color.
`when` specifies when to flip, which defaults to 0 (i.e., as soon as possible).
It accepts a timestamp (in milliseconds) and will flip at the first possible
repaint after the timestamp has been reached. Returns the timestamp of the flip.

**Remarks:**
`Flip` returns a [Promise](https://javascript.info/promise-basics) that resolves
with the timestamp when the flip is done. Therefore, `t = await Flip()`
will wait until the flip is done, and store the flip timestamp to the variable `t`.

The timestamps are [DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp),
milliseconds elapsed since the time origin, same as `GetMillis()`.
Under the hood, `Flip` uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).

### GetMillis

`t = GetMillis()`

Return the milliseconds elapsed since the time origin.

### _async_ WaitMillis

`await WaitMillis(millis)`

Wait specified time (in milliseconds).

**Remarks:**
`WaitMillis` returns a Promise that resolves when the specified time is elapsed.
It must be used with `await`.

### _async_ WaitSecs

`await WaitSecs(secs)`

Wait specified time (in seconds).

### ShowCursor

`ShowCursor(show = true)`

Show the mouse cursor within the canvas.

### HideCursor

`HideCursor()`

Hide the mouse cursor within the canvas.

### GetWindowResolution

`[width, height] = GetWindowResolution()`

Get the interior width and height of the browser window in pixels.

### GetScreenResolution

`[width, height] = GetScreenResolution()`

Get the width and height of the screen in pixels.

### _async_ GetCanvasImageBlob

`blob = await GetCanvasImageBlob(front = true, type = "image/png")`

Get the front or back canvas image as a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob).

**Remarks:**
Use `SaveFile(blob)` to save as a local file.
Use `await GetImageData(blob)` to get the underlying pixel data.

### _async_ GetImageData

`imageData = await GetImageData(img, sx = 0, sy = 0, sw, sh)`

Returns an [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData)
object of the underlying pixel data of a specified area of an image.

## Response collection

### _async_ GetMouse

`[x, y, buttons] = await GetMouse()`

Get current mouse state.

**Remarks:**
`x` and `y` are relative to the canvas top-left origin.
[`buttons`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons) indicates which buttons are pressed.
This function is _async_ so that the browser can process new events in a `GetMouse()` loop.

### _async_ MouseWait

`{timeout, which, x, y, buttons, timeStamp} = await MouseWait(areas = [], timeout = 0)`

Wait for any mouse button (or touchscreen) to be pressed within the specified `areas`.
The optional argument `areas` defaults to `[]`, which means anywhere within the page.
It can also be an area specified in the format of `[x, y, w, h]`, or an Array of areas
(`areas=[[x0, y0, w0, h0], ...]`).

If `timeout` occurred (specified in milliseconds, defaults to 0, i.e., no timeout),
the returned `timeout` will be set to `true`. Otherwise, `which` is set to the index
of the clicked regions.

### _async_ KbCheck

`keys = await KbCheck()`

Get current keyboard state. Returns an object whose keys are currently pressed keys,
with values being the respective timestamps of the key presses. The object also has
a `keys` property that is an Array of pressed keys, and a `length` property that is
the length of the array.

### _async_ KbWait

`{timeout, code, timeStamp} = await KbWait(keys = true, timeout = 0)`

Wait for key press. Set `keys` to `true` to wait for any key to be pressed, or
`false` to wait for all keys to be released. `keys` can also be a single
key code (e.g., `keys='Space'`) or an Array of codes (e.g., `keys=['KeyA', 'Digit1']`).

**Remarks:**

See [here](https://javascript.info/keyboard-events) for a detailed specification of
`code`. Please note it is case sensitive and depends on the key's location on the keyboard.
When `keys` is set to `true` or `false` (i.e., wait for any key pressed or all
keys released), `KbWait` returns an empty object (i.e., `{}`) immediately if the
condition is already satisfied.

## Visual stimuli

### FillRect

`FillRect(x, y, w, h, color)`

Draw a rectangle whose starting point is at `(x, y)` and whose size is specified
by `w` and `h`, filled in `color`.

### FrameRect

`FrameRect(x, y, w, h, color, width = 1)`

Draw a rectangle outline whose starting point is at `(x, y)` and whose size is
specified by `w` and `h`, with the specified line `color` and `width`.

### FillOval

`FillOval(x, y, rX, rY, color)`

Draw an ellipse centered at `(x, y)` with the radii `rX` and `rY`, filled in `color`.

### FrameOval

`FrameOval(x, y, rX, rY, color, width = 1)`

Draw an ellipse outline centered at `(x, y)` with the radii `rX` and `rY`, with the specified line `color` and `width`.

### DrawLine

`DrawLine(x0, y0, x1, y1, color, width = 1)`

Draw a straight line from `(x0, y0)` to `(x1, y1)` with the specified line `color` and `width`.

### DrawDots

`DrawDots(x, y, r, color)`

Draw dots centered at `(x, y)` with radius `r` and filled in `color`.
`x` and `y` can be a number (for drawing one dot), or an Array of numbers.
`r` and `color` can be a single value that is common for all dots, or an Array
that specifies a different radius and color for each dot.

### DrawImage

`DrawImage(img, src = [], dst = [], rotation = 0)`

Draw an image. The optional `src` (in the format of `[x, y, width, height]`)
specifies a rectangular part of the image to be drawn (defaults to the full image).
`dst` (in the format of `[x, y, width, height]` or `[x, y]` if use the same
width and height as source) specifies where the image should be drawn
(defaults to the top-left origin of the canvas). `rotation` specifies the
rotation angle in degrees.

### DrawText

`DrawText(text, x, y, color, align = "left", size = 30, font = "Arial", width = undefined, spacing = 1.2)`

Draw text. `x` and `y` specifies the location of the text: If `align` is
set to `center`, the text will be horizontally and vertically centered at
`(x, y)`. Otherwise, `(x, y)` specifies the top-left location of the text.
`font` can be set to a [CSS font string](https://developer.mozilla.org/en-US/docs/Web/CSS/font).
The optional `width` specifies the maximum width of the text area. If set,
long lines will be broken into multiple lines.

## Loading resources

### _async_ LoadScript

`await LoadScript(url)`

Load a JavaScript script and wait until it is loaded.

### _async_ LoadImage

`image = await LoadImage(url, cors = true)`

Load an image and wait until it is loaded.
For local files, `cors` must be set to `false`.

**Remarks:**
Use `await GetImageData(blob)` to get the underlying pixel data.
If an [non-CORS image](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image)
is drawn into a canvas, the canvas becomes tainted, and `GetCanvasImageBlob()` and
`GetImageData()` no longer works.

### _async_ LoadVideo

`video = await LoadVideo(url, preload = true)`

Load a video file. Set `preload` to `true` to download the whole video file in advance.
For local files, `preload` must be set to `false`.

### _async_ LoadAudio

`audio = await LoadAudio(url, preload = true)`

Load an audio file. Set `preload` to `true` to download the whole audio file in advance.
For local files, `preload` must be set to `false`.

### _async_ LoadAudioBuffer

`source = await LoadAudioBuffer(url)`

Load an audio file and create an [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createBufferSource).
The source node can start playing with `source.play(when)`.

## Auxiliary functions

### Beeper

`Beeper(freq = 440, volume = 1, duration = 1, delay = 0)`

Play a beep sound at specified frequency, volume, and duration.

### SaveFile

`SaveFile(data, filename, type)`

Save (download) `data` to a local file.
`data` can be a string, a Blob, or an Array of such.

### _async_ UploadFile

`[ok, text] = await UploadFile(body, url, method, headers)`

Upload file to `url` with specified HTTP `method` (e.g., POST or PUT).
`body` can be a string, a Blob, or an Array of such.
Returns if the response code is `ok` and the response body in `text`.

### _async_ UploadJSON

`[ok, text] = UploadJSON(data, url, method = "PUT", headers)`

Upload an Object `data` as JSON to `url`.

### RandInt

`n = RandInt(a = 0, b = 1)`

Return a random integer n such that `a <= n <= b`.

### RandChoice

`b = RandChoice(a)`

Return a random element from the Array `a`.

### Shuffle

`Shuffle(a)`

Shuffle the Array `a` _in place_.

### ArrayToCSV

`csv = ArrayToCSV(data, cols)`

Converts columns `cols` of a `data` Array into CSV (with UTF-8 BOM and header row).
`cols` should be an Array of strings (column names), and `data` should be an Array
of Objects, each of which has keys specified in `cols`.

### CopyObject

`copy = CopyObject(obj)`

Make a shallow copy of the JavaScript object `obj`.

### _async_ WaitEvent

`await WaitEvent(elem, event)`

Wait for the specified `event` of the HTML element `elem`.

### Logger

`Logger(message, ...extra)`

Log the message to developer console, and save to internal event logs as well.

### _async_ MakeGabor

`gabor = await MakeGabor(size, deg, std, freq, phase = 0, color1 = [0, 0, 0], color2 = [255, 255, 255], envelope = "gaussian")`

Make a Gabor patch of specified `size` (in pixels), orientation (`deg`, in degrees),
standard deviation (`std`, in pixels) of the Gaussian envelope, frequency (`freq`,
in cycles/pixel), and phase (0 to 1). `envelope` can be `"gaussian"`, `"linear"`,
`"circle"`, or `"none"`.

This function requires [math.js](https://mathjs.org/), which can be loaded by
`await LoadScript("https://unpkg.com/mathjs/lib/browser/math.js")`.
