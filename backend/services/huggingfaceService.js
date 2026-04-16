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
    // Use a vision-capable model for OCR - TrOCR is better for OCR than BLIP
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
    return { unavailable: true, reason: error.message };
  }
}

module.exports = { analyzeResumeWithHuggingFace, extractTextViaHuggingFace };
