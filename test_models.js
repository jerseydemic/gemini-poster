const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' }); 

// Try .env if .env.local doesn't exist or key is missing
if (!process.env.GEMINI_API_KEY) {
    require('dotenv').config();
}

async function listAllModels() {
  try {
      // Using fetch to hit the API directly to list models if SDK is tricky
      const apiKey = process.env.GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      
      if (data.models) {
          console.log("Available Models:");
          data.models.forEach(m => {
              if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                  console.log(`- ${m.name}`);
              }
          });
      } else {
          console.log("No models found or error:", data);
      }
  } catch (error) {
      console.error("Error listing models:", error);
  }
}

listAllModels();
