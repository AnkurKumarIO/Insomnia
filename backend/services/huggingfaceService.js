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

module.exports = { analyzeResumeWithHuggingFace };
