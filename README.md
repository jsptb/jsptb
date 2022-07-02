# jsPTB

jsPTB is an open source JavaScript library that makes it easier to build web-based psychological experiments. It allows you to write simple, direct JavaScript code in a Psychtoolbox-esque style, and gives you precise and flexible control over stimulus presentation, timing, and response collection.

## Features

- Supports a variety of stimuli (basic shapes, Gabor patches, images, audio and video) and inputs (keyboard, mouse and touchscreen).
- Works on modern desktop and mobile browsers.
- Can be used online as well as offline (without internet).
- No need to deal with HTML, CSS, JavaScript dependencies, callbacks, timelines or schedulers. Write JavaScript code with a minimum of fuss.

## Demos

[Check out the demonstrations](https://jsptb.github.io/demos) for a showcase of jsPTB in action and how to use it.

## Usage

### Prerequisites

- A modern browser (recent releases of Firefox or Chromium-based browsers, desktop or mobile)
- A reasonable knowledge of the JavaScript language ([Recommended tutorial](https://javascript.info/))

### Getting started

- Download the `jsptb.js` library
- Create a boilerplate HTML page:

```html
<!DOCTYPE html>
<head>
  <meta charset="utf-8" />
  <script src="jsptb.js"></script>
  <script>
    window.onload = async function () {
      /* Insert your code here */
    };
  </script>
</head>
```

- For a minimum "Hello, world!" example:

```js
OpenWindow(400, 400, "gray");
DrawText("Hello, world!", 200, 200, "white", "center");
await Flip();
```

- Open the HTML file in a browser
- Check out the [demos](https://github.com/jsptb/demos) and [API reference](api.md) to learn more

### Debugging

- Use the [developer console](https://javascript.info/devtools) to see error messages.
- Some functions (e.g. `Flip`, `WaitSecs`, and `LoadImage`) return a [Promise](https://javascript.info/promise-basics) that resolves when the job is done. Make sure to `await` it.

### API Reference

jsPTB implements a set of API that is loosely modelled after [Psychtoolbox](http://psychtoolbox.org/). Despite the similarity, most functions are _not_ drop-in compatible. See [API reference](api.md) for details.

**Disclaimer:** The project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Psychtoolbox.
