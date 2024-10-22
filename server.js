import express, {response} from 'express';
import multer from 'multer';
import {OpenAIWrapper} from './utils/openai.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';

dotenv.config();

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

async function main() {
    const app = express();
    const port = process.env.PORT || 3000;
    const oai = new OpenAIWrapper();

    oai.setModel('gpt-4o-mini');
    oai.setRemember(true);

    app.use(express.json({limit: '50mb'}));

    // Serve static files from the 'public' directory
    app.use(express.static(path.join(__dirname, 'public')));

    // Serve static HTML file and CSS
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'htmls/recorder.html'));
    });

    // Handle audio upload and Whisper API call
    app.post('/whisper', upload.single('audio'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({error: 'No file uploaded'});
            }

            const filePath = './uploads/audio.mp3'; // File path to save the audio
            const audioBuffer = req.file.buffer; // Multer stores file in buffer

            // Step 1: Save the audio buffer to a file
            fs.writeFileSync(filePath, audioBuffer);

            // Step 2: Send the file to OpenAI Whisper API using createReadStream

            const transcription = await oai.whisper(
                fs.createReadStream(filePath)
            );

            // Step 3: Clean up the temporary file (optional)
            fs.unlinkSync(filePath);
            let prompt = [
                {
                    role: 'user',
                    content: transcription
                }
            ];
            const response = await oai.getCompletion(prompt);
            res.json({transcription, response});
        } catch (error) {
            console.error('Error processing transcription:', error.message);
            res.status(500).json({
                error: `An error occurred: ${error.message}`
            });
        }
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

main().catch(console.error);
