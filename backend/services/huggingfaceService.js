const { HfInference } = require('@huggingface/inference');

const HF_MODEL = process.env.HF_MODEL || 'tiiuae/falcon-7b-instruct';
const hf = new HfInference({ apiKey: process.env.HUGGINGFACE_API_KEY });

async function analyzeResumeWithHuggingFace(prompt) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key missing');
  }

  const response = await hf.textGeneration({
    model: HF_MODEL,
    inputs: prompt,
    parameters: {
      max_new_tokens: 800,
      temperature: 0.2,
      top_p: 0.9,
      repetition_penalty: 1.05,
      return_full_text: false,
    },
  });

  if (!response) {
    throw new Error('Empty response from Hugging Face');
  }

  if (Array.isArray(response)) {
    return response[0]?.generated_text || '';
  }

  return response.generated_text || response?.text || '';
}

async function extractTextViaHuggingFace(fileBuffer, mimeType = 'image/jpeg') {
  if (!process.env.HUGGINGFACE_API_KEY) {
    return { unavailable: true, reason: 'Hugging Face API key missing' };
  }

  try {
    // Use TrOCR model for OCR - this should work with HF Inference API
    const response = await hf.imageToText({
      model: 'microsoft/trocr-base-printed',
      data: fileBuffer,
    });

    if (response && response.generated_text) {
      return { text: response.generated_text };
    }

    return { unavailable: true, reason: 'No text extracted from image' };
  } catch (error) {
    console.error('Hugging Face OCR Error:', error.message);
    // If TrOCR fails, try a fallback captioning model
    try {
      console.log('Trying fallback captioning model for OCR...');
      const fallbackResponse = await hf.imageToText({
        model: 'Salesforce/blip-image-captioning-large',
        data: fileBuffer,
      });

      if (fallbackResponse && fallbackResponse.generated_text) {
        return { text: fallbackResponse.generated_text };
      }
    } catch (fallbackError) {
      console.error('Hugging Face fallback OCR Error:', fallbackError.message);
    }

    return { unavailable: true, reason: error.message };
  }
}

module.exports = { analyzeResumeWithHuggingFace, extractTextViaHuggingFace };
