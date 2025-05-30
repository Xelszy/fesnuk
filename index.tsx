/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const userInput = document.querySelector('#input') as HTMLTextAreaElement;
const modelOutput = document.querySelector('#output') as HTMLDivElement;
const slideshow = document.querySelector('#slideshow') as HTMLDivElement;
const error = document.querySelector('#error') as HTMLDivElement;

const additionalInstructions = `

 Use a fun story of President of Prabowo, mark zuckeberg, elon musk, doge, pepe, joe bide, jerome powell, and donald trump as a metaphor.
 Use random figure just for image, not explain.
 Search information about question before answer.
 Keep sentences short but conversational, casual, and engaging Mostyly Indonesian languange.
 DON'T REPEATING SENTENCES FOR IMAGE. Make different illustration for every single image.
 Generate a cute, minimal illustration for each sentence with black ink. 
 Soft color accept, but must have more illustration with just black and ink on white background.
 No commentary, just begin your explanation.
 Thinking before answer for hard question.
 And for end image generate give the illustration with text "Lanjut skrol fesnuk" fesnuk is slang for Facebook.
 Keep going until you're done.`;

async function addSlide(text: string, image: HTMLImageElement) {
  const slide = document.createElement('div');
  slide.className = 'slide';
  const caption = document.createElement('div') as HTMLDivElement;
  caption.innerHTML = await marked.parse(text);
  slide.append(image);
  slide.append(caption);
  slideshow.append(slide);
}

function parseError(error: string) {
  const regex = /{"error":(.*)}/gm;
  const m = regex.exec(error);
  try {
    if (!m || !m[1]) return error;
    const e = m[1];
    const err = JSON.parse(e);
    return err.message;
  } catch {
    return error;
  }
}

async function generate(message: string) {
  userInput.disabled = true;
  
  const chat = ai.chats.create({
    model: 'gemini-2.0-flash-exp',
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  modelOutput.innerHTML = '';
  slideshow.innerHTML = '';
  error.innerHTML = '';
  error.toggleAttribute('hidden', true);

  try {
    const userTurn = document.createElement('div') as HTMLDivElement;
    userTurn.innerHTML = await marked.parse(message);
    userTurn.className = 'user-turn';
    modelOutput.append(userTurn);
    userInput.value = '';

    const result = await chat.sendMessageStream({
      message: message + additionalInstructions,
    });

    let text = '';
    let img: HTMLImageElement | null = null;

    for await (const chunk of result) {
      if (!chunk.candidates) continue;
      for (const candidate of chunk.candidates) {
        if (!candidate.content) continue;
        for (const part of candidate.content.parts ?? []) {
          if (part.text) {
            text += part.text;
          } else {
            try {
              const data = part.inlineData;
              if (data) {
                img = document.createElement('img');
                img.src = `data:image/png;base64,` + data.data;
              } else {
                console.log('no data', chunk);
              }
            } catch {
              console.log('no data', chunk);
            }
          }
          if (text && img) {
            await addSlide(text, img);
            slideshow.removeAttribute('hidden');
            text = '';
            img = null;
          }
        }
      }
    }

    if (img) {
      await addSlide(text, img);
      slideshow.removeAttribute('hidden');
      text = '';
    }

  } catch (e) {
    const msg = parseError(e as string);
    error.innerHTML = `Something went wrong: ${msg}`;
    error.removeAttribute('hidden');
  }

  userInput.disabled = false;
  userInput.focus();
}




const enterButton = document.querySelector('#enterButton') as HTMLButtonElement;
enterButton.addEventListener('click', async () => {
  const message = userInput.value.trim();
  if (message) {
    await generate(message);
    userInput.value = '';
  }
});


const examples = document.querySelectorAll('#examples li');
examples.forEach((li) =>
  li.addEventListener('click', async () => {
    if (li.textContent) {
      await generate(li.textContent);
    }
  }),
);
