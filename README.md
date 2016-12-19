# Arcade.js [![Powered by You](http://sapegin.github.io/powered-by-you/badge.svg)](http://sapegin.github.io/powered-by-you/)

> Arcade.js is a 2d game engine based on JavaScript and HTML5 Canvas.<br>
> Written 2010 by Martin Wendt, Licensed MIT.

ArcadeJS is a 2d game engine, written in pure JavaScript.
It requires HTML5, namely support for `<canvas>` and `<audio>` elements.
This package was developed during a summer hollyday 2010 and finished during 
winter 2010.
The goal of this fun project was to learn about HTML5 and implement a clone of 
the Rip-Off game. As a consequence I borrowed a lot (especially from processing.js),
reinvented some wheels, and stuck with rather simple vector graphics for the 
demo games.

**Note:** this project is not actively maintained.

The repository was [migrated from Google Code](https://code.google.com/p/arcade-js/) 2015-03-15,
because [Google Code Project Hosting was turned down](http://google-opensource.blogspot.de/2015/03/farewell-to-google-code.html).

The project consists of
  
  - lina.js<br>
    An independent, object oriented library for points, vectors, and homogeneous 
    transformations in 2D space.
    A polygon class helps with collision detection and hit testing.

  - arcade.js<br>
    A 2D game engine that provides a render loop and support for multiple
    moving objects.<br>
    Also sound, keyboard, mouse and touch events are supported.

  - arcade-controls.js<br>
    Some controls (button, joystick) for mouse and touch screens.

  - Playable demos


# Lina.js

An independent, object oriented library for points, vectors, and homogeneous 
transformations in 2D space.<br>
A polygon class helps with collision detection and hit testing.

  - [Read the tutorial](https://gitcdn.xyz/repo/mar10/arcade-js/master/doc/lina-js_tutorial.pdf)
  - [Read the API docs](https://gitcdn.xyz/repo/mar10/arcade-js/master/doc/jsdocs/lina.js/jsdoc/index.html)
  - [Run tests](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/lina.js/test/test.html)


# Arcade.js

A 2D game engine that provides a render loop and support for multiple moving objects.

  - [Read the tutorial](https://gitcdn.xyz/repo/mar10/arcade-js/master/doc/arcade-js_tutorial.pdf)
  - [Read the API docs](https://gitcdn.xyz/repo/mar10/arcade-js/master/doc/jsdocs/arcade.js/jsdoc/index.html).


# Demos

## Rip-Off

A port of the Rip-Off arcade game written by Tim Skelly / Cinematronix in 1980.
Rip-Off, was the first arcade game with two-player cooperative play. The *bandits* 
use some early 'artifical intelligence' / flocking behavior.

  - [Read about the algorithm](https://gitcdn.xyz/repo/mar10/arcade-js/master/doc/rip-off_spec.pdf)
  - [Play single player, dual player, or dual player split screen](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/rip-off/index.html)

[![Rip-Off demo](src/demos/rip-off/screenshot-1.png?raw=true)](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/rip-off/index.html)


## Asteroids

A remake of the famous arcade game.

[![Asteroids Demo](src/demos/asteroids/screenshot-3.png?raw=true)](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/asteroids/index.html) 
[![Asteroids Demo (mobile version)](src/demos/asteroids/screenshot-2.png?raw=true)](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/asteroids/index.html)


## Billiards

A simple JavaScript implementation of carambolage using arcade.js.

[![Billiards demo](src/demos/billiards/screenshot-1.png?raw=true)](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/billiards/jsBilliards.html)


## Quirks

A simple render loop with two reflecting points.

[![Quirks demo](src/demos/quirks/screenshot-1.png?raw=true)](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/quirks/jsQuirks.html)

[Desktop](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/quirks/jsQuirks.html)
&mdash; [Mobile](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/quirks/jsQuirks-mobile.html)


## Collisions

This sample shows how to implement moving objects, circle-circle and circle-polygon
collisions.

[![Collisions demo](src/demos/collisions/screenshot-1.png?raw=true)](https://gitcdn.xyz/repo/mar10/arcade-js/master/src/demos/collisions/game.html)
