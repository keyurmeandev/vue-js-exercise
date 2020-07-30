import { VirtualTour } from './virtualtour.js';

import {
  getElementById,
  sortByNearestToYaw
} from '../shared/utils.js';

import {
  setFloorPlanSize,
  renderFloorPlan,
  hideFloorPlan
} from '../shared/helpers.js';


const tourContainer = getElementById('tour-container');
const floorPlanCanvas = getElementById('floor-plan');


const tour = new VirtualTour('http://localhost:3000/', true);

// Initialise viewer in a container (HTMLElement or Id of HTMLElement)
tour.init(
  tourContainer,
  // on every scene change
  focusTourContainer
);


// How to survive zombie apocalypse?
// Everything's here. No seriously, just go look
attachEventHandlers();


// Helper functions
// TODO: move into helper files

function focusTourContainer() {
  tourContainer.focus();
}

function populateTagContentModal(e) {
  const tag = $(e.relatedTarget);

  const title = tag.data('tag-title');
  let text_nodes = tag.data('tag-text-nodes');
  text_nodes = Number(text_nodes);

  // Inject title
  const modal = $(this);
  modal.find('#custom-tag-title').text(title);

  // if no text
  if (text_nodes === 1 && !tag.data('text0')) {
    modal.find('.media-divider').addClass('d-none');
    modal.find('#custom-tag-text').addClass('d-none');
    return;
  }

  modal.find('.media-divider').removeClass('d-none');
  modal.find('#custom-tag-text').removeClass('d-none');

  // Inject text
  for (let i = 0; i < text_nodes; i++) {
    const text = tag.data('text' + i);
    let elem;

    if (text) {
      elem = document.createElement('p');
      elem.classList.add('mb-0')
      elem.innerHTML = text;
    } else {
      elem = document.createElement('br')
    }

    modal.find('#custom-tag-text').append(elem);
  }
}

function onKeydownTourContainer(e) {
  if (e.key !== 'ArrowUp' || !tour.has_control) {
    return;
  }

  const { sceneId, pitch: currentPitch, yaw: currentYaw, hfov: currentHfov } = tour.getPosition();
  const config = tour.getCurrentTour();

  const searchYaw1 = currentYaw + (currentHfov / 2);
  const searchYaw2 = currentYaw - (currentHfov / 2);

  const searchYawMin = Math.min(searchYaw1, searchYaw2);
  const searchYawMax = Math.max(searchYaw1, searchYaw2);

  // Get all hotspots in-view of type `scene`
  const hotspotsInView = config.scenes[sceneId].hotSpots.filter(hotspot => {
    if (!hotspot.sceneKey || hotspot.type !== 'scene') {
      return false;
    }

    const yaw = hotspot.yaw;

    if (searchYawMin < -180) {
      return (yaw >= -180 && yaw <= searchYawMax) || (yaw >= (searchYawMin + 360) && yaw <= 180);
    }
    else if (searchYawMax > 180) {
      return (yaw >= searchYawMin && yaw <= 180) || (yaw >= -180 && yaw <= (searchYawMax - 360));
    }
    else {
      return yaw >= searchYawMin && yaw <= searchYawMax;
    }
  });

  // Find the hotspot nearest to currentYaw
  let nearestHotspot = null;
  if (hotspotsInView.length === 1) {
    nearestHotspot = hotspotsInView[0];
  } else {
    nearestHotspot = sortByNearestToYaw(hotspotsInView, currentYaw)[0];
  }

  if (!nearestHotspot) {
    return;
  }

  const { sceneKey } = nearestHotspot;

  tour.transitionTo(sceneKey, 'same', 'sameAzimuth', currentHfov);
}

function onClickFloorPlanCanvas(e) {
  if (!tour.has_control) {
    return;
  }

  const config = tour.getCurrentTour();
  const { sceneId: currentScene } = tour.getPosition();
  const { image, scale } = tour.getCurrentFloorPlan();

  const scaleX = floorPlanCanvas.offsetWidth / floorPlanCanvas.width;
  const scaleY = floorPlanCanvas.offsetHeight / floorPlanCanvas.height;

  const point_width = (image.width / 18) * scaleX * scale;
  const point_height = (image.width / 18) * scaleY * scale;

  Object.keys(config.scenes).map(key => {
    const scene = config.scenes[key];

    const x = scene.floorPlanX * scaleX;
    const y = scene.floorPlanY * scaleY;

    if (
      (Math.abs(x - e.offsetX) < (point_width / 2)) &&
      (Math.abs(y - e.offsetY) < (point_height / 2))
    ) {
      // if clicked on current scene
      if (currentScene === key) {
        return;
      }

      // default params for clicked scene
      let targetPitch = 0;
      let targetYaw = 0;
      let targetHfov = 120;

      // check if current scene has a hotSpot for the clicked scene
      const hotspot = config.scenes[currentScene].hotSpots.find(hotspot => {
        return hotspot.sceneKey === key
      });

      // if hotSpot found then use target params and smoother transition
      if (hotspot) {
        targetPitch = hotspot.targetPitch || 0;
        targetYaw = hotspot.targetYaw || 0;
        targetHfov = hotspot.targetHfov || 120;
      }

      tour.transitionTo(key, targetPitch, targetYaw, targetHfov);
    }
  });

  focusTourContainer();
}

function onMousemoveFloorPlanCanvas(e) {
  floorPlanCanvas.style.cursor = 'default';

  if (!tour.has_control) {
    return;
  }

  const config = tour.getCurrentTour();
  const { image, scale } = tour.getCurrentFloorPlan();

  const scaleX = floorPlanCanvas.offsetWidth / floorPlanCanvas.width;
  const scaleY = floorPlanCanvas.offsetHeight / floorPlanCanvas.height;

  const point_width = (image.width / 18) * scaleX * scale;
  const point_height = (image.width / 18) * scaleY * scale;

  Object.keys(config.scenes).map(key => {
    const scene = config.scenes[key];

    const x = scene.floorPlanX * scaleX;
    const y = scene.floorPlanY * scaleY;

    if (
      (Math.abs(x - e.offsetX) < (point_width / 2)) &&
      (Math.abs(y - e.offsetY) < (point_height / 2))
    ) {
      floorPlanCanvas.style.cursor = 'pointer';
    }
  });
}

function closeFloorPlan() {
  hideFloorPlan();
  tour.setFloorPlanState('none');
  focusTourContainer();
}

function toggleFloorPlan() {
  if (!tour.viewer) return;

  const config = tour.getCurrentTour();
  const { sceneId: currentScene } = tour.getPosition();
  const { state, image, scale } = tour.getCurrentFloorPlan();

  const canvas = getElementById('floor-plan');

  switch (state) {
    case 'none': {
      setFloorPlanSize(image, 'mini');
      tour.setFloorPlanState('mini');
      break;
    }

    case 'mini': {
      setFloorPlanSize(image, 'full');
      tour.setFloorPlanState('full');
      break;
    }

    default:
      hideFloorPlan();
      tour.setFloorPlanState('none');
      break;
  }

  renderFloorPlan(config, currentScene, canvas, image, scale);
  focusTourContainer();
}

function resizeFloorPlan() {
  if (!tour.viewer) return;

  const config = tour.getCurrentTour();
  const { sceneId: currentScene } = tour.getPosition();
  const { state, image, scale } = tour.getCurrentFloorPlan();

  const canvas = getElementById('floor-plan');

  switch (state) {
    case 'mini': {
      setFloorPlanSize(image, 'mini');
      break;
    }

    case 'full': {
      setFloorPlanSize(image, 'full');
      break;
    }

    default:
      break;
  }

  renderFloorPlan(config, currentScene, canvas, image, scale);
}

function attachEventHandlers() {
  // Show / Hide floor plan
  window.toggleFloorPlan = toggleFloorPlan;
  // Hide floor plan
  window.closeFloorPlan = closeFloorPlan;

  // mouse move event handler
  floorPlanCanvas.addEventListener('mousemove', onMousemoveFloorPlanCanvas);
  // click event handler
  floorPlanCanvas.addEventListener('click', onClickFloorPlanCanvas);

  // Transition to nearest hotspot (among those in-view) with up arrow key
  tourContainer.addEventListener('keydown', onKeydownTourContainer);

  // Set data in Custom Tag Content Modal
  $('#custom-tag-content-modal').on('show.bs.modal', populateTagContentModal);
  // Focus tour container when Custom Tag Content Modal is hidden
  $('#custom-tag-content-modal').on('hidden.bs.modal', function (e) {
    const modal = $(this);
    modal.find('#custom-tag-text').empty();
  });

  // Focus tour container when a modal is hidden
  $('body').on('hidden.bs.modal', focusTourContainer);
  // Focus tour container when a cam icon is clicked
  $('#cam-side-icon').on('click', focusTourContainer);
  // Focus tour container when a cam card is clicked (everywhere)
  $('#cam-card').on('click', focusTourContainer);
  // Focus tour container when a minimize icon is clicked
  $('.minimize').on('click', focusTourContainer);

  let resize_timeout;
  // adjust floor plan canvas size on window resize
  window.addEventListener('resize', () => {
    // do not resize canvas, if window resize still in progress
    if (resize_timeout) {
      clearTimeout(resize_timeout);
      return;
    }
    // reszie after 0.5s
    setTimeout(resizeFloorPlan, 500);
  });
}
