export const getElementById = (id) => {
  return document.getElementById(id);
};

export const querySelector = (query) => {
  return document.querySelector(query);
};

export const querySelectorAll = (query) => {
  return document.querySelectorAll(query);
};

export const removeElementById = (id) => {
  const element = document.getElementById(id);

  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
};

export const preloadImage = (src) => {
  const image = new Image();
  image.src = src;

  return image;
};

export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    }

    image.src = src;
  });
};

export const fetchAndCreateObjectURL = (url) => {
  return fetch(url)
    .then(res => res.blob())
    .then(blob => URL.createObjectURL(blob));
};

export const sortByNearestToYaw = (hotspots, yaw) => {
  for (let i = 0; i < hotspots.length - 1; i++) {
    for (let j = 1; j < hotspots.length; j++) {
      const yaw_2 = Math.abs(Math.abs(yaw) - Math.abs(hotspots[j].yaw));
      const yaw_1 = Math.abs(Math.abs(yaw) - Math.abs(hotspots[j - 1].yaw));

      if (yaw_2 < yaw_1) {
        const temp = hotspots[j - 1];
        hotspots[j - 1] = hotspots[j];
        hotspots[j] = temp;
      }
    }
  }

  return hotspots;
};
