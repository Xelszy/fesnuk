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
Use a fun story of President of Indonesia, Prabowo, mark zuckeberg, elon musk, king salman, pepe, joe bide, baden powell, and donald trump as a metaphor.
I mean the random figure is for image, not explain.
Search informatiin about before answer.
Keep sentences short but conversational, casual, and engaging Mostyly Indonesian languange.
Generate a cute, minimal illustration for each sentence with black ink. 
but most illustration is just black and ink on white background.
No commentary, just begin your explanation.
Thinking before answer for hard question.
but if there is the sentence "fesnuk" in the command, then make a picture of a big black bird that says "IMPHNEN IRENG". Just show 2 twice.
And for end image generate give the illustration with text "Lanjut skrol fesnuk".
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

  // Bikin chat baru tiap kali generate, supaya tidak akses 'history' yg private
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

userInput.addEventListener('keydown', async (e: KeyboardEvent) => {
  if (e.code === 'Enter') {
    e.preventDefault();
    const message = userInput.value;
    await generate(message);
  }
});



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
