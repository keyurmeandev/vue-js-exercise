import {
  getElementById,
  preloadImage,
  fetchAndCreateObjectURL
} from '../shared/utils.js';

import {
  setFloorPlanSize,
  renderFloorPlan,
  toggleOrientationControlButton,
  setPropertyName
} from '../shared/helpers.js';


export class VirtualTour {

  /**
   * Construct virtual tour.
   * @param {string} path
   * @param {boolean} has_control
   */
  constructor(path, has_control) {

    this.route = path || null;
    this.has_control = has_control || false;

    this.config = null;
    this.property_list = [];
    this.property_id = null;
    this.property_floor_id = null;
    this.floor_plan_state = 'none';

    this.viewer = null;
    this.is_first_scene_loaded = false;
  }


  // Public API

  /**
   * Initialise viewer & attach listeners.
   * @param {string | HTMLElement} container
   * @param {function} onSceneChange
   * @param {function} onPositionChange
   * @param {function} onMouseMove
   */
  init(container, onSceneChange = null, onPositionChange = null, onMouseMove = null) {

    const self = this;
    const route = self.route;
    const xhttp = new XMLHttpRequest();

    if (!route) {
      self.setErrorResponse();
      return;
    }

    xhttp.onreadystatechange = function () {

      // success
      if (this.readyState == 4 && this.status == 200) {

        const serverResponse = this.response;

        if (!serverResponse || !serverResponse.config || !serverResponse.property_list.length) {
          self.setErrorResponse();
          return;
        }

        self.config = serverResponse.config;
        self.property_list = serverResponse.property_list;

        // setup defaults and start guided tour
        self._setDefaultsAndStartTour(container, onSceneChange, onPositionChange, onMouseMove);
      }

      // error
      if (this.readyState == 4 && this.status != 200) {
        self.setErrorResponse();
        return;
      }
    }

    xhttp.open('POST', self.route, true);
    xhttp.responseType = 'json';
    xhttp.send();
  }

  /**
   * Give / Get control.
   * @param {boolean} control_state
   */
  toggleControl(control_state) {

    if (this.is_touch_pointing_enabled) {
      return;
    }

    this.has_control = control_state;

    const config = this.getPannellumConfig();

    config.draggable = this.has_control;
    config.virtualTourControl = this.has_control;

    // Toggle orientation control button if needed
    toggleOrientationControlButton(this.has_control);

    // Disable orientation if active
    if (!this.has_control && this.viewer.isOrientationActive()) {
      this.viewer.stopOrientation();
    }

    return true;
  }

  /**
   * Get current scene's Id, pitch, yaw, hfov.
   */
  getPosition() {

    const sceneId = this.viewer.getScene();
    const pitch = this.viewer.getPitch();
    const yaw = this.viewer.getYaw();
    const hfov = this.viewer.getHfov();

    return { sceneId, pitch, yaw, hfov };
  }

  /**
   * Change current scene's pitch, yaw, hfov with speed in ms.
   * @param {number | string} pitch
   * @param {number | string} yaw
   * @param {number} hfov
   * @param {number} speed
   */
  lookAt(pitch = null, yaw = null, hfov = 120, speed = 1000) {

    this.viewer.lookAt(pitch, yaw, hfov, speed);
  }

  /**
   * Transition to a scene according to the provided `sceneId`.
   * @param {string} sceneId
   * @param {number} pitch
   * @param {number} yaw
   * @param {number} hfov
   */
  transitionTo(newSceneId, pitch = null, yaw = null, hfov = 120) {
    //Added By Keyur
    // Get current scene to apply overally effect
    const currentScene = document.getElementsByClassName('pnlm-dragfix')[0];
    const currentSceneId = this.viewer.getScene();
    this.viewer.fadeScene(currentSceneId, currentScene, newSceneId, pitch, yaw, hfov ); 
  }

  /**
   * Save pitch and yaw mouse position for animation
   * @param {number} pitch
   * @param {number} yaw
   */
  addMyMousePosition(pitch, yaw) {
    this.my_mouse_positions.push({ pitch, yaw });
  }

  /**
   * Save pitch and yaw mouse position for animation
   * @param {number} pitch
   * @param {number} yaw
   */
  addTheirMousePosition(pitch, yaw) {
    this.their_mouse_positions.push({ pitch, yaw });
  }

  /**
   * Transition to firstScene of current tour
   */
  transitionToFirstScene() {

    if (!this.viewer) return;

    const current_tour = this.getCurrentTour();
    const { firstScene } = current_tour.default;
    const { pitch, yaw, hfov } = this.getPosition();

    this.transitionTo(firstScene, pitch, yaw, hfov);
  }

  /**
   * Set property_id, property_floor_id
   * Transition to firstScene of current tour
   * @param {string} property_id
   * @param {string} property_floor_id
   * @param {boolean} transition default `false`
   */
  setPropertyIdAndPropertyFloorId(property_id, property_floor_id, transition = true) {

    let current_property_id = this.property_id;
    let current_property_floor_id = this.property_floor_id;

    if (
      !property_id ||
      !property_floor_id ||
      (property_id === current_property_id &&
        property_floor_id === current_property_floor_id)
    ) return;

    // set property_id, property_floor_id
    this.property_id = property_id;
    this.property_floor_id = property_floor_id;

    const current_property_floor = this.getCurrentPropertyFloor();

    // set property name (using property floor name)
    setPropertyName(current_property_floor.name);

    if (!transition) return;

    this.transitionToFirstScene();
  }


  // Utils

  /**
   * Get pannellum config
   */
  getPannellumConfig() {

    return this.viewer.getConfig();
  }

  /**
   * Get current property
   */
  getCurrentProperty() {

    return this.property_list.find(property => {
      return property._id === this.property_id;
    });
  }

  /**
   * Get current property floor
   */
  getCurrentPropertyFloor() {

    const current_property = this.getCurrentProperty();
    if (!current_property) return;

    return current_property.floorList.find(item => {
      return item._id === this.property_floor_id;
    });
  }

  /**
   * Get current tour
   */
  getCurrentTour() {

    const current_property_floor = this.getCurrentPropertyFloor();
    if (!current_property_floor || !current_property_floor.virtual_tour) return;

    return current_property_floor.virtual_tour;
  }

  /**
   * Get pitch and yaw from MouseEvent
   * @param {MouseEvent} event
   */
  getCoordsfromMouseEvent(event) {

    const coords = this.viewer.mouseEventToCoords(event);

    return {
      pitch: coords[0],
      yaw: coords[1]
    };
  }

  /**
   * Get canvas (HTMLElement) used to render scenes
   */
  getCanvas() {

    return this.viewer.getRenderer().getCanvas();
  }

  /**
   * Get floor plan state, image, scale of current tour
   */
  getCurrentFloorPlan() {

    const current_tour = this.getCurrentTour();
    if (!current_tour) return;

    return {
      state: this.floor_plan_state,
      image: current_tour.floorPlanImage,
      scale: current_tour.floorPlanPointScale
    };
  }

  /**
   * Set current state of floor plan canvas
   * @param {string} value `none`, `mini` or `full`
   */
  setFloorPlanState(value) {

    this.floor_plan_state = value;
  }

  /**
   * Hide loading and show error alert (uif-guided.js usage)
   */
  setErrorResponse() {

    window.vt_error_response = 'We could not load virtual tour for this property.';
    window.is_tour_loaded = false;
  }

  /**
  * Apply smooth transition effect
  */ 
  smoothTransition() {
    this.viewer.setOverlay();
  }


  // Private API

  /**
   * Preload floor plan images
   * Save image ref on each property's `virtual_tour`
   */
  _preloadFloorPlanImages() {

    this.property_list = this.property_list.map(property => {
      const floorList = property.floorList.map(item => {
        if (
          !item.virtual_tour ||
          !item.virtual_tour.floorPlan ||
          item.virtual_tour.floorPlanImage
        ) return item;

        const image = preloadImage(item.virtual_tour.floorPlan);
        item.virtual_tour.floorPlanImage = image;

        return item;
      });

      property.floorList = floorList;
      return property;
    });
  }

  /**
   * Preload virtual tour panorama images
   * @param {object} config
   * @param {boolean} firstScene
   * @param {boolean} hotSpots hot spots for `firstScene`
   */
  async _preloadPanoramaImages(config, firstScene = false, hotSpots = false) {

    // Get scenes (keys)
    let scenes = Object.keys(config.scenes);

    // Get firstScene and all scenes that are hot spots of firstScene
    if (firstScene && hotSpots) {
      scenes = scenes.filter(scene => {
        // if scene is the `firstScene`
        if (scene === config.default.firstScene) {
          return scene;
        }

        // if `firstScene` has no hot spots
        if (!config.scenes[config.default.firstScene].hotSpots) {
          return false;
        }

        // Find hot spot in `firstScene` with `sceneKey === scene`
        const hotspot = config.scenes[config.default.firstScene].hotSpots.find(hotspot => {
          return scene === hotspot.sceneKey;
        });

        // if scene is a hot spot of `firstScene`
        if (hotspot && hotspot.sceneKey && scene === hotspot.sceneKey) {
          return scene;
        }
      });
      // Get firstScene
    } else if (firstScene) {
      scenes = scenes.filter(scene => scene === config.default.firstScene);
      // Get all that have non blob url as panorama (i.e not already loaded)
    } else {
      scenes = scenes.filter(scene => {
        const panorama = config.scenes[scene].panorama;

        if (panorama.indexOf('blob:') < 0) {
          return scene
        } else {
          return false;
        }
      });
    }

    // Fetch all not already loaded, convert to Object URLs
    // Update config as they arrive
    if (!firstScene) {
      scenes.forEach(scene => {
        fetchAndCreateObjectURL(config.scenes[scene].panorama)
          .then(objectURL => {
            config.scenes[scene].panorama = objectURL;
          })
          .catch(console.error);
      });

      return;
    }

    // Fetch images of `firstScene` and/or hot spots, convert to Object URLs
    let objectURLS;
    try {
      objectURLS = await Promise.all(
        scenes.map(scene => fetchAndCreateObjectURL(config.scenes[scene].panorama))
      );
    } catch (err) {
      console.error(err.message);
    }

    // Replace all panorama URLs with Object URLs
    scenes.forEach((scene, i) => {
      config.scenes[scene].panorama = objectURLS[i];
    });

    return config;
  }

  /**
   * Preload virtual tour panorama images with a web worker
   * @param {object} config
   */
  _preloadPanoramaImagesWithWorker(config) {

    let worker;

    if (window.Worker) {
      worker = new Worker('/js/shared/image-preload-worker.js');
    } else {
      return;
    }

    // Get scenes (keys)
    let scenes = Object.keys(config.scenes);

    // Get all that have non blob url as panorama (i.e not already loaded)
    scenes = scenes.filter(scene => {
      const panorama = config.scenes[scene].panorama;

      if (panorama.indexOf('blob:') < 0) {
        return scene
      } else {
        return false;
      }
    });

    const concurrent_connections = [];

    // Load image
    const interval = setInterval(() => {
      // if no scene
      if (scenes.length === 0) {
        clearInterval(interval);
        return;
      }

      // if more than 4 concurrent connections
      if (concurrent_connections.length >= 4) {
        return;
      }

      const scene = scenes.shift();
      const panorama = config.scenes[scene].panorama;

      // Send url to web worker to load image
      worker.postMessage({ scene, url: panorama });
      // update concurrent connections
      concurrent_connections.push(scene);
    }, 1000);

    // Update config as images arrive
    worker.addEventListener('message', e => {
      const blob = e.data.blob;
      const scene = e.data.scene;

      // Convert blob to Object URL
      // Replace panorama url with Object URL
      config.scenes[scene].panorama = URL.createObjectURL(blob);
      // update concurrent connections
      concurrent_connections.shift();
    });
  }

  /**
   * Render viewer window
   * @param {object} config
   * @param {string | HTMLElement} container
   */
  _renderViewer(config, container) {

    if (!pannellum) {
      console.error('Could not load pannellum!');
      return;
    }
    if (!container) {
      console.error('Missing required params!');
      return;
    }

    this.viewer = pannellum.viewer(container, config);
    // Set initial state of orientation control button
    toggleOrientationControlButton(this.has_control);
    // Set tour load state
    window.is_tour_loaded = true;
  }

  /**
   * Attach event listeners
   * @param {function} onSceneChange
   * @param {function} onPositionChange
   * @param {function} onMouseMove
   */
  _attachListeners(onSceneChange = null, onPositionChange = null, onMouseMove = null) {

    // Fired when a panorama finishes loading.
    if (onSceneChange) {
      this.viewer.on('load', onSceneChange);
    }
    // Fired when any movements / animations finish,
    // i.e. when the renderer stops rendering new frames.
    if (onPositionChange) {
      this.viewer.on('animatefinished', onPositionChange);
    }
    // Fired on mouse movements on currently rendered scene
    if (onMouseMove) {
      // For some reason, this element overlays the actual rendered canvas
      const dragFix = document.getElementsByClassName('pnlm-dragfix')[0];
      dragFix.addEventListener('mousemove', onMouseMove);
    }

    // Re-render floor plan on scene load
    this.viewer.on('load', () => {
      const canvas = getElementById('floor-plan');

      const current_tour = this.getCurrentTour();
      const { sceneId } = this.getPosition();
      const { image, scale } = this.getCurrentFloorPlan();

      // Set floor plan mode to mini (first render)
      if (!this.is_first_scene_loaded) {
        setFloorPlanSize(image, 'mini');
        this.setFloorPlanState('mini');
        this.is_first_scene_loaded = true;
      }

      renderFloorPlan(current_tour, sceneId, canvas, image, scale);
    });
  }

  /**
   * Set `clickHandlerFunc` && `clickHandlerArgs` for each `hotSpot`
   * of type `scene`.
   * @param {object} config
   * @param {VirtualTour} self
   */
  async _setClickHandlers(config, self) {

    // Get scenes (keys)
    Object.keys(config.scenes).map(key => {
      // Modify hotspots for scene
      const hotspots = config.scenes[key].hotSpots.map(hotspot => {
        if (!hotspot.sceneKey || hotspot.type !== 'scene') {
          return hotspot;
        }

        // Add an event handler for the hot spot’s click event.
        hotspot.clickHandlerFunc = self._clickHandlerFunc;

        // Set arguments to pass to hot spot's `clickHandlerFunc`
        hotspot.clickHandlerArgs = {
          self: self,
          yaw: hotspot.yaw,
          sceneId: hotspot.sceneKey,
          targetYaw: hotspot.targetYaw,
          targetPitch: hotspot.targetPitch,
          targetHfov: hotspot.targetHfov
        };

        return hotspot;
      });

      // config.scenes[key] = { ...config.scenes[key], hotSpots: hotspots };
      // Fix for Microsoft Edge
      // Windows 10, Version 1909, OS Build 18363.778
      // Edge 44.18362.449.0, EdgeHTML 18.18363
      config.scenes[key].hotSpots = hotspots;
    });

    return config;
  }

  /**
   * Event handler for the hot spot’s `click` event.
   * @param {KeyboardEvent} e
   * @param {clickHandlerArgs} args
   */
  _clickHandlerFunc(e, { self, yaw, sceneId, targetPitch, targetYaw, targetHfov }) {

    if (!self.has_control) {
      return;
    }

    // Transition using current angles
    self.transitionTo(sceneId, 'same', 'sameAzimuth', 'same');

  }

  /**
   * Set `createTooltipFunc` && `createTooltipArgs` for each `hotSpot`
   * of type `info`.
   * @param {object} config
   * @param {VirtualTour} self
   */
  async _setCreateTooltipFunc(config, self) {

    // Get scenes (keys)
    Object.keys(config.scenes).map(key => {
      // Modify hotspots for scene
      const hotspots = config.scenes[key].hotSpots.map(hotspot => {
        if (!hotspot.id || hotspot.type !== 'info') {
          return hotspot;
        }

        // Set function to create the hot spot's tooltip DOM
        hotspot.createTooltipFunc = self._createTooltipFunc;

        // Set arguments to pass to hot spot's `createTooltipFunc`
        hotspot.createTooltipArgs = {
          id: hotspot.id,
          title: hotspot.title,
          text: hotspot.text
        };

        return hotspot;
      });

      // config.scenes[key] = { ...config.scenes[key], hotSpots: hotspots };
      // Fix for Microsoft Edge
      // Windows 10, Version 1909, OS Build 18363.778
      // Edge 44.18362.449.0, EdgeHTML 18.18363
      config.scenes[key].hotSpots = hotspots;
    });

    return config;
  }

  /**
   * Create the hot spot's tooltip DOM
   * @param {HTMLElement} container
   * @param {createTooltipArgs} args
   */
  _createTooltipFunc(container, { id, title, text }) {

    container.dataset.tagId = id;
    container.dataset.tagTitle = title;

    const textNodes = text.replace(/\n?\r|\n/g, '\n').split('\n')
    container.dataset.tagTextNodes = textNodes.length;

    textNodes.map((node, i) => {
      if (!node) return;
      container.dataset['text' + i] = node;
    });

    container.dataset.toggle = 'modal';
    container.dataset.target = '#custom-tag-content-modal'
  }

  /**
   * Initialise viewer & attach listeners.
   * @param {string | HTMLElement} container
   * @param {function} onSceneChange
   * @param {function} onPositionChange
   * @param {function} onMouseMove
   */
  _setDefaultsAndStartTour(container, onSceneChange, onPositionChange, onMouseMove) {

    // we only need to call this method once
    if (this.viewer) return;
    // we do not have guided tour data
    if (!this.config || !this.property_list) {
      this.setErrorResponse();
      return;
    }

    const config = this.config;

    // set default tour control
    config.draggable = this.has_control;
    config.virtualTourControl = this.has_control;

    // preload floor plan images
    this._preloadFloorPlanImages();

    // Set default property_id, property_floor_id
    this.setPropertyIdAndPropertyFloorId(config.property_id, config.property_floor_id, false);

    // Preload firstScene panorama images
    this._preloadPanoramaImages(config, true)
      // Set `clickHandlerFunc` && `clickHandlerArgs`
      .then(config => {
        return this._setClickHandlers(config, this);
      })
      // Set `createTooltipFunc` && `createTooltipArgs`
      .then(config => {
        return this._setCreateTooltipFunc(config, this);
      })
      // Render viewer window
      .then(config => {
        this._renderViewer(config, container);
        return;
      })
      // Attach event listeners
      .then(() => {
        this._attachListeners(onSceneChange, onPositionChange, onMouseMove);
        return;
      })
      // Preload remaining panorama images
      .then(() => {
        const config = this.getPannellumConfig();

        this._preloadPanoramaImagesWithWorker(config);
      });
  }

}
