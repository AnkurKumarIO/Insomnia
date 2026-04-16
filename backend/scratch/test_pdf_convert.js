const pdfImgConvert = require('pdf-img-convert');
const fs = require('fs');

async function testConversion() {
  try {
    console.log('Testing pdf-img-convert...');
    // We don't have a real PDF, so we expect a failure but let's see HOW it fails.
    // If it fails with "Command not found" or "Missing dependency", we found our problem.
    const result = await pdfImgConvert.convert('dummy.pdf');
    console.log('Result:', result);
  } catch (e) {
    console.log('Caught Error:', e.message);
  }
}

testConversion();
