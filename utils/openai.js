// Class wrapper for OpenAI API
import {Readable} from 'stream';
import OpenAI from 'openai';

export class OpenAIWrapper {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OpenAI API Key');
        }
        this.openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
        this.memory = [];
        this.remember = false;
        this.system = 'You are a helpful assistant.';
        this.model = 'gpt-3.5-turbo'; // Default model, can be changed via setModel
    }

    async getCompletion(prompt, model = this.model) {
        // Add prompt to memory if "remember" is true
        if (this.remember) {
            this.memory.push(...prompt);
        } else {
            this.memory = prompt;
        }

        const messages = [{role: 'system', content: this.system}];

        // Add previous messages from memory
        for (const item of this.memory) {
            messages.push(item);
        }

        try {
            const completion = await this.openai.chat.completions.create({
                model: model,
                messages: messages
            });

            const assistantMessage = completion.choices[0].message;

            if (this.remember) {
                this.memory.push({
                    role: 'assistant',
                    content: assistantMessage.content
                });
            }

            return assistantMessage.content;
        } catch (error) {
            console.error('Error fetching completion:', error);
            throw error;
        }
    }

    async whisper(data = null) {
        try {
            if (!data) {
                throw new Error('No audio data provided');
            }

            // Use the buffer directly
            const transcription = await this.openai.audio.transcriptions.create(
                {
                    file: data, // Pass the buffer directly
                    model: 'whisper-1',
                    response_format: 'text'
                }
            );

            return transcription;
        } catch (error) {
            console.error('Error whispering:', error);
            throw error;
        }
    }

    bufferToStream(buffer) {
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null); // End the stream
        return readable;
    }

    setModel(model) {
        this.model = model;
    }

    setRemember(remember) {
        if (!remember) {
            this.memory = [];
        }
        this.remember = remember;
    }

    setSystem(system) {
        this.system = system;
    }
}
