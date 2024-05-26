const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
app.use(bodyParser.json());

const oAuth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);
oAuth2Client.setCredentials({ refresh_token: 'YOUR_REFRESH_TOKEN' });

const upload = multer({ dest: 'uploads/' });

app.post('/create-event', upload.single('file'), async (req, res) => {
  const audioFile = req.file;

  try {
    // Send audio file to NLP service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFile.path));

    const nlpResponse = await axios.post('http://localhost:5000/process-voice', formData, {
      headers: formData.getHeaders()
    });

    const { title, date, time } = nlpResponse.data;

    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Invalid event details' });
    }

    // Convert date and time to a proper DateTime format
    const eventDateTime = new Date(`${date} ${time}`);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const event = {
      summary: title,
      start: { dateTime: eventDateTime, timeZone: 'America/Los_Angeles' },
      end: { dateTime: new Date(eventDateTime.getTime() + 3600000).toISOString(), timeZone: 'America/Los_Angeles' }
    };

    await calendar.events.insert({ calendarId: 'primary', resource: event });
    res.json({ message: 'Event created successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event.', error });
  } finally {
    fs.unlinkSync(audioFile.path); // Clean up uploaded file
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
