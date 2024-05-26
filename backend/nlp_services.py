from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restful import Api, Resource
import spacy
import speech_recognition as sr
from pydub import AudioSegment
import os

app = Flask(__name__)
CORS(app)
api = Api(app)
nlp = spacy.load("en_core_web_sm")

class ProcessVoice(Resource):
    def post(self):
        # Save the uploaded file
        audio_file = request.files['file']
        audio_path = os.path.join('temp', 'audio.wav')
        audio_file.save(audio_path)

        # Convert audio to text
        recognizer = sr.Recognizer()
        audio = AudioSegment.from_wav(audio_path)
        audio.export(audio_path, format='wav')
        with sr.AudioFile(audio_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)

        # Process text with NLP
        doc = nlp(text)
        event_details = {
            "title": None,
            "date": None,
            "time": None
        }
        # Simple parsing logic (extend as needed)
        for ent in doc.ents:
            if (ent.label_ == "EVENT"):
                event_details["title"] = ent.text
            elif (ent.label_ == "DATE"):
                event_details["date"] = ent.text
            elif (ent.label_ == "TIME"):
                event_details["time"] = ent.text

        return jsonify(event_details)

api.add_resource(ProcessVoice, '/process-voice')

if __name__ == '__main__':
    if not os.path.exists('temp'):
        os.makedirs('temp')
    app.run(port=5000)
