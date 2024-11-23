import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { tools } from "@/app/api/genia/tools/index";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);


const generationConfig = {
  temperature: 0.5,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Act as an accountant assistant, you will help me to record my money transactions.\nI share the transactions with you either as a text description or an invoice picture.\n\n### INSTRUCTIONS ###\n- If I provide a text describing the transaction, it will follow the following pattern: 'DESCRIPTION by AMOUNT, ACCOUNT'.\n- If the provided a text and it is not clear or is not a valid transaction, you must report the error.\n- If the provided an image, but it is not clear or is not a valid invoice, you must report the error.\n- In any case, you must use the available tools to record the transactions.\n### INSTRUCTIONS ###\n\n\n",
  tools,
	generationConfig,
  toolConfig: {functionCallingConfig: {mode: "ANY"}},
});

function getPart(description, picture){
	if (description){
		return description;
	}

	const [header, base64] = picture.split(",");
	// const mimeType = header.match(/data:(.*);/)[1];
	const mimeType = header.match(/\w+\/\w+/)[0];

	return [
		"Generate trasnsaction from the invoice picture",
		{
			inlineData:{
				mimeType,
				data: base64,
			}
	}]
}


export async function extractData(description, picture) {
	console.log("hola extractdata")
	const requestContent = getPart(description, picture);

  const result = await model.generateContent(requestContent);
	console.log(result)
	console.log(result.candidates)
  for(const candidate of result.response.candidates) {
    for(const part of candidate.content.parts) {
      if(part.functionCall) {
        return part.functionCall.args;
      }
    }
  }
}