const recordBtn = document.getElementById('record-btn');
const waveformCanvas = document.getElementById('waveform');
const canvasCtx = waveformCanvas.getContext('2d');

let audioContext;
let analyser;
let mediaStreamSource;

let mediaRecorder;
let audioChunks = [];

recordBtn.addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordBtn.innerText = 'Record';
  } else {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');

        try {
          const response = await fetch('http://localhost:3000/create-event', {
            method: 'POST',
            body: formData
          });
          const result = await response.json();
          alert(result.message);
        } catch (error) {
          console.error('Error:', error);
          alert('Failed to create event.');
        }

        audioChunks = [];
      };

      mediaRecorder.start();
      recordBtn.innerText = 'Stop';
    } else {
      alert('getUserMedia not supported on your browser!');
    }
  }
});

function startRecording() {
  recordBtn.style.display = 'none';
  waveformCanvas.style.display = 'block';

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      mediaStreamSource = audioContext.createMediaStreamSource(stream);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      mediaStreamSource.connect(analyser);

      drawWaveform();
    })
    .catch(function(err) {
      console.error('Error accessing microphone:', err);
    });
}

function drawWaveform() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  canvasCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);

  function draw() {
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#00bfa6'; // Waveform color
    canvasCtx.beginPath();

    const sliceWidth = waveformCanvas.width * 1.0 / bufferLength;
    let x = 0;

    for(let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * waveformCanvas.height / 2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
    canvasCtx.stroke();
  };

  draw();
}
