# Pannellum Scene Transition Exercise

## Setup:
- clone this repo
- `npm install`
- `npm start` (`npm run dev` to watch for changes)
- visit `http://localhost:3000`
- done

## Problem:

When we move from one scene to another scene, we use method `transitionTo` in `VirtualTour` class (line `149` `virtualtour.js`) which internally calls pannellum's `loadScene` method.

Pannellum, then takes a snapshot of current frame (`pitch`, `yaw`, `hfov`) and displays that as an image on top of the container (`tourContainer`).
Then it loads the next scene, to which we are moving to, and fades away the image that was placed on top of the container.

Sometimes next scene is loaded but the snapshot image is not rendered yet. As a result we see next scene first, then quickly see the earlier scene  back again and then it fades away and then we see the next scene (jerky transition).


What should happen is that snapshot image should always be rendered before next scene is rendered.


## Task:

Write a method in `VirtualTour` class for smoother transitions (fade out current scene and reveal next scene) from one scene to another scene.
The fade animation/effect should work on firefox/chrome/safari/edge (last 2 version at-least).

You could e.g. solve it by fading in a black overlay over the scene smoothly but fast, then fade out current scene immediately with `sceneFadeDuration = 0` and change to the next scene (i.e use `transitionTo`), then fade out the black overlay. In a nutshell:
1. Show black overlay ==> "hiding the scene" (but don't hide video chat windows and other stuff, just the scene).
2. Transition to next scene using `transitionTo`.
3. Hide black overlay, after next scene has loaded.

## OR

Find a fix for pannellum's jerky transition when sceneFadeDuration > 0.
This fix should work on firefox/chrome/safari/edge (last 2 version at-least).

----

### Links:
[Pannellum Docs](https://pannellum.org/documentation/overview/)

[Pannellum Repo](https://github.com/mpetroff/pannellum)
