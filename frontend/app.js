const recordBtn = document.getElementById('record-btn');

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
