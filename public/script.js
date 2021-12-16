

const demosSection = document.getElementById('demos');
const loading = document.getElementById('loading');

var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    // Hide the loading element.
    loading.style.display = 'none';
    // Show demo section now model is ready to use.
    demosSection.classList.remove('invisible');
});




/********************************************************************
// Continuously grab image from webcam stream and classify it.
********************************************************************/

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');

// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];


// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    const enableWebcamButton = document.getElementById('webcamButton');
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}


function enableFullScreenView() {
    // Show the live view on fullscreen.
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }

}

// Enable the live webcam view and start classification.
function enableCam(event) {
    if (!model) {
        console.log('Wait! Model not loaded yet.')
        return;
    }

    // Hide the button.
    event.target.classList.add('removed');


    // const supports = navigator.mediaDevices.getSupportedConstraints();
    // alert(JSON.stringify(supports));
    // if (!supports['facingMode']) {
    //     alert('This browser does not support facingMode!');
    // }


    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                if (device.kind === 'videoinput') {
                    console.log(device.kind + ": " + device.label +
                        " id = " + device.deviceId);
                }
            });
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
        });

    // getUsermedia parameters.
    let constraints = {
        video: {
            // width: { min: 1280 },
            // height: { min: 720 },
            facingMode: { exact: "environment" } // force rear camera           
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            video.srcObject = stream;
            video.addEventListener('loadeddata', predictWebcam);
            enableFullScreenView();
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
            // possibly failed because there is no rear camera.
            // so try front camera.
            // constraints = {
            //     video: {
            //         facingMode: { exact: "user" } // force front camera           
            //     }
            // };

            // navigator.mediaDevices.getUserMedia(constraints)
            //     .then(function (stream) {
            //         video.srcObject = stream;
            //         video.addEventListener('loadeddata', predictWebcam);
            //     });

        });
}


function predictWebcam() {
    // Start classifying the stream.
    model.detect(video).then(function (predictions) {
        // Remove any highlighting we did previous frame.
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        // Now lets loop through predictions and draw them to the live view if
        // they have a high confidence score.
        for (let n = 0; n < predictions.length; n++) {

            // If we are over 66% sure we are sure we classified it right, draw it!
            if (predictions[n].score > 0.50) {


                // console.log(predictions[n].class);


                const p = document.createElement('p');
                p.innerText = predictions[n].class;
                // + ' - with '
                // + Math.round(parseFloat(predictions[n].score) * 100)
                // + '% confidence.';
                // Draw in top left of bounding box outline.
                p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                    'top: ' + predictions[n].bbox[1] + 'px;' +
                    'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

                // Draw the actual bounding box.
                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
                    + predictions[n].bbox[1] + 'px; width: '
                    + predictions[n].bbox[2] + 'px; height: '
                    + predictions[n].bbox[3] + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);

                // Store drawn objects in memory so we can delete them next time around.
                children.push(highlighter);
                children.push(p);
            }
        }

        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    });
}
