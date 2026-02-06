import { GoogleGenAI } from "@google/genai";
import type { ExtractedData } from "../types.ts";

const EXTRACTION_PROMPT = `You are an expert OCR and data extraction assistant. Analyze this Alipay transaction screenshot and extract the following fields into a JSON object.

Required fields:
1. "date" - Transaction date and time (format: YYYY-MM-DD HH:mm:ss if possible)
2. "amount" - Transaction amount in CNY (numeric string, e.g., "128.00"). Use negative for refunds.
3. "merchant" - Merchant/store name
4. "productName" - Product or service description
5. "status" - Transaction status (e.g., "交易成功", "退款成功", "待付款")
6. "paymentMethod" - Payment method used (e.g., "余额宝", "花呗", "银行卡")
7. "transactionId" - Transaction/order ID number

Rules:
- Return ONLY a valid JSON object, no markdown, no explanation.
- If a field is not visible or not applicable, use an empty string "".
- For amount, extract only the numeric value without currency symbol.
- Keep Chinese characters as-is for status, merchant, and product names.

Example output:
{"date":"2024-03-15 14:30:22","amount":"89.90","merchant":"星巴克","productName":"拿铁咖啡 大杯","status":"交易成功","paymentMethod":"花呗","transactionId":"2024031522001423456789"}`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseJsonResponse(text: string): ExtractedData {
  let cleaned = text.trim();

  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }

  const jsonObjMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonObjMatch) {
    cleaned = jsonObjMatch[0];
  }

  const parsed = JSON.parse(cleaned);

  return {
    date: String(parsed.date || ""),
    amount: String(parsed.amount || ""),
    merchant: String(parsed.merchant || ""),
    productName: String(parsed.productName || ""),
    status: String(parsed.status || ""),
    paymentMethod: String(parsed.paymentMethod || ""),
    transactionId: String(parsed.transactionId || ""),
  };
}

export async function extractDataFromImage(
  apiKey: string,
  file: File
): Promise<ExtractedData> {
  const genAI = new GoogleGenAI({ apiKey });

  const base64Data = await fileToBase64(file);

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: [
      {
        role: "user",
        parts: [
          { text: EXTRACTION_PROMPT },
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
        ],
      },
    ],
  });

  const text = response.text ?? "";
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  return parseJsonResponse(text);
}
