self.addEventListener('message', async e => {
  const url = e.data.url;
  const scene = e.data.scene;

  let blob;
  try {
    const response = await fetch(url);
    blob = await response.blob();
  } catch (err) {
    console.error(err.message);
  }

  // Send the image data
  self.postMessage({
    scene: scene,
    blob: blob,
  });
});
