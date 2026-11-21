import { callLlama3Bedrock } from './src/utils/llm';

async function test() {
  try {
    const response = await callLlama3Bedrock("Hello, Usher!");
    console.log("Response:", response);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
