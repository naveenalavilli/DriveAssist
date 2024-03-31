const demosSection = document.getElementById('demos');
const loading = document.getElementById('loading');
const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const enableWebcamButton = document.getElementById('webcamButton');

let model = undefined;
let children = [];

// Load the model.
cocoSsd.load().then((loadedModel) => {
    model = loadedModel;
    loading.style.display = 'none';
    demosSection.classList.remove('invisible');
});

// Check if webcam access is supported.
function hasGetUserMedia() {
    console.log('navigator.mediaDevices:', navigator.mediaDevices);
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Enable the live webcam view and start classification.
function enableCam() {
    if (!model) {
        console.warn('Wait! Model not loaded yet.')
        return;
    }

    // Hide the button after enabling webcam
    enableWebcamButton.classList.add('removed');

    const constraints = {
        video: { facingMode: "environment" } // Use the rear camera if possible
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    }).catch((err) => console.error(err));
}

function predictWebcam() {
    model.detect(video).then((predictions) => {
        // Clear previous highlights
        children.forEach((child) => liveView.removeChild(child));
        children = [];

        predictions.forEach((prediction) => {
            if (prediction.score > 0.5) {
                displayPrediction(prediction);
            }
        });

        window.requestAnimationFrame(predictWebcam);
    });
}

function displayPrediction(prediction) {
    // Create the container for the prediction text
    const p = document.createElement('p');
    p.innerText = prediction.class + ' - ' + Math.round(prediction.score * 100) + '%';

    // Calculate position for the text. It positions the text just below the highlighted area.
    const textTop = prediction.bbox[1] + prediction.bbox[3]; // Top position of the bounding box + height of the box
    p.style = `left: ${prediction.bbox[0]}px; top: ${textTop}px;`;

    // Create and style the highlighter box
    const highlighter = document.createElement('div');
    highlighter.setAttribute('class', 'highlighter');
    highlighter.style = `left: ${prediction.bbox[0]}px; top: ${prediction.bbox[1]}px; width: ${prediction.bbox[2]}px; height: ${prediction.bbox[3]}px;`;

    liveView.appendChild(highlighter);
    liveView.appendChild(p);

    // Keep track of created elements for later removal
    children.push(highlighter, p);
}

function displayPrediction(prediction) {
    // Assume we have a function that estimates distance based on prediction attributes
    // For demonstration, we're using a mock function that returns a static value or a simple calculation
    const distance = estimateDistance(prediction);

    // Create the container for the prediction text and distance
    const p = document.createElement('p');
    p.innerText = `${prediction.class} - ${Math.round(prediction.score * 100)}% (Distance: ${distance}m)`;

    // Calculate position for the text. It positions the text just below the highlighted area.
    const textTop = prediction.bbox[1] + prediction.bbox[3]; // Top position of the bounding box + height of the box
    p.style = `left: ${prediction.bbox[0]}px; top: ${textTop}px;`;

    // Create and style the highlighter box
    const highlighter = document.createElement('div');
    highlighter.setAttribute('class', 'highlighter');
    highlighter.style = `left: ${prediction.bbox[0]}px; top: ${prediction.bbox[1]}px; width: ${prediction.bbox[2]}px; height: ${prediction.bbox[3]}px;`;

    liveView.appendChild(highlighter);
    liveView.appendChild(p);

    // Keep track of created elements for later removal
    children.push(highlighter, p);
}

function estimateDistance(prediction) {
    // This is a placeholder for a real distance estimation function.
    // You could estimate distance based on object size, type, or other heuristics.
    // For demonstration purposes, let's return a mock value or a simple calculation.
    return (200 / prediction.bbox[2]).toFixed(2); // Mock calculation example
}

if (hasGetUserMedia()) {
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}
