import {
  getElementById,
  querySelector
} from '../shared/utils.js';


$(function () {

  // Enable tooltips
  $('[data-toggle="tooltip"]').tooltip();

  // Hide tooltips on click
  $('[data-toggle="tooltip"]').on('click', function (e) {
    $(this).tooltip('hide');
  });


  // step 3
  const stepThree = getElementById('step-3');
  const tourContainer = getElementById('tour-container');
  const camCard = getElementById('cam-card');
  const camSideIcon = getElementById('cam-side-icon');
  const minCamBtn = querySelector('#cam-card .minimize');
  const hangUpIcon = getElementById('hang-up');
  const endTour = getElementById('end-tour');
  // Step 4
  const stepFour = getElementById('step-4');


  setTimeout(() => {
    stepThree.style.zIndex = 0;
    stepThree.style.opacity = 1;
    tourContainer.focus();
  }, 500);


  // minimize cam UI
  minCamBtn.addEventListener('click', () => {
    camCard.style.left = '-400px';
    camSideIcon.style.left = '10px';
  });
  // maximize cam UI
  camSideIcon.addEventListener('click', () => {
    camSideIcon.style.left = '-50px';
    camCard.style.left = '10px';
  });


  // End Tour Confirmation
  hangUpIcon.addEventListener('click', () => {
    $('#confirm-end-tour-modal').modal();
  });

  // End Tour
  endTour.addEventListener('click', () => {
    stepThree.style.opacity = 0;
    stepFour.style.display = 'block';

    setTimeout(() => {
      stepThree.style.zIndex = -1;
      stepFour.style.opacity = 1;
    }, 500)
  });


  window.onresize = function (e) {
    stepThree.scrollTop = 0;
  };


});
