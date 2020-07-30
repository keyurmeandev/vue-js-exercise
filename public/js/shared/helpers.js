import { getElementById, querySelector } from './utils.js';


export const showLoader = () => {
  const elem = getElementById('loadingContainer');

  if (elem && elem.style.display !== 'block') {
    elem.style.display = 'block';
  }
};


export const hideLoader = () => {
  const elem = getElementById('loadingContainer');

  if (elem && elem.style.display !== 'none') {
    elem.style.display = 'none';
  }
};


export const setFloorPlanSize = (image, size) => {
  const container = getElementById('floor-plan-container');
  const canvas = getElementById('floor-plan');
  const enlargeIcon = getElementById('floor-plan-enlarge');

  if (!container || !canvas) return;

  const width = image.width;
  const height = image.height;
  canvas.width = width;
  canvas.height = height;

  switch (size) {
    case 'mini': {
      const max_width = window.innerWidth > 576 ? window.innerWidth / 3 : 150;
      const max_height = window.innerHeight / 2.5;

      const offset_bottom = window.innerHeight > 414 ? 60 : 10;
      const offset_right = 10;

      const scaleX = max_width / width;
      const scaleY = max_height / height;
      const scale = Math.min(scaleX, scaleY);

      container.style.width = `${width * scale}px`;
      container.style.height = `${height * scale}px`;
      container.style.left = `calc(100% - ${(width * scale) + offset_right}px)`;
      container.style.top = `calc(100% - ${(height * scale) + offset_bottom}px)`;
      container.style.opacity = 1;
      container.style.transform = 'rotate(0deg)';

      enlargeIcon.style.opacity = '1';
      break;
    }

    case 'full': {
      const max_width = window.innerWidth * 0.7;
      const max_height = window.innerHeight * 0.8;

      const scaleX = max_width / width;
      const scaleY = max_height / height;
      const scale = Math.min(scaleX, scaleY);

      container.style.width = `${width * scale}px`;
      container.style.height = `${height * scale}px`;
      container.style.left = `calc(50% - ${(width * scale) / 2}px)`;
      container.style.top = `calc(50% - ${(height * scale) / 2}px)`;
      container.style.opacity = 1;
      container.style.transform = 'rotate(0deg)';

      enlargeIcon.style.opacity = '0';
      break;
    }
  }
};


export const renderFloorPlan = (config, currentScene, canvas, image, scale = 0.65) => {
  const scenes = config.scenes;

  // Draw floor plan map
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);

  const width = (image.width / 18) * scale;
  const height = (image.width / 18) * scale;

  // Draw points on floor plan map, for each scene in virtual tour
  Object.keys(scenes).map(key => {
    const scene = scenes[key];

    const x = scene.floorPlanX - (width / 2);
    const y = scene.floorPlanY - (height / 2);

    const point_image = getElementById('floor-plan-point');
    const point_active_image = getElementById('floor-plan-point-active');

    if (key === currentScene) {
      context.drawImage(point_active_image, x, y, width, height);
    } else {
      context.drawImage(point_image, x, y, width, height);
    }
  });
};


export const hideFloorPlan = () => {
  const container = getElementById('floor-plan-container');

  container.style.width = '100px';
  container.style.height = '100px';
  container.style.left = '110%';
  container.style.top = '110%';
  container.style.opacity = 0;
  container.style.transform = 'rotate(135deg)';
};


export const createAndShowAlert = (type, text) => {
  const alert = document.createElement('div');
  alert.classList.add('alert', 'alert-dismissible', 'fade', 'show', `alert-${type}`);

  const alertTextNode = document.createElement('div');
  alertTextNode.classList.add('alert-text');
  alertTextNode.innerHTML = text;
  alert.append(alertTextNode);

  const alertCloseNode = document.createElement('button');
  alertCloseNode.type = 'button';
  alertCloseNode.dataset.dismiss = 'alert';
  alertCloseNode.classList.add('close');
  alertCloseNode.innerHTML = '<span aria-hidden="true">&times;</span>';
  alert.append(alertCloseNode);

  document.body.append(alert);
};


export const toggleOrientationControlButton = (has_control) => {
  const pnlm_orientation_button = document.querySelector('.pnlm-controls.pnlm-control.pnlm-orientation-button');

  if (!pnlm_orientation_button) {
    return;
  }

  if (has_control && pnlm_orientation_button.style.display !== 'block') {
    pnlm_orientation_button.style.display = 'block';
  }
  else if (!has_control && pnlm_orientation_button.style.display !== 'none') {
    pnlm_orientation_button.style.display = 'none';
  }
};


export const setPropertyName = (name) => {
  const propertyName = querySelector('#property-name h6');

  // does not exist when floor plan feature in-active
  if (!propertyName) return;

  propertyName.innerHTML = name;
};
