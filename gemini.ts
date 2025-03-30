import { GoogleGenerativeAI } from "@google/generative-ai";

// Google Gemini API setup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to analyze legal cases
export async function analyzeLegalCase(caseText: string, language: 'en' | 'hi' = 'en'): Promise<string> {
  try {
    // Select model and start chat
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = language === 'en' 
      ? `As a legal expert focused on Indian law, analyze this case and provide:
         1. Case summary
         2. Relevant legal sections that apply
         3. Potential precedents and similar cases
         4. Legal interpretation and advice
         
         Case details: ${caseText}`
      : `भारतीय कानून पर केंद्रित एक कानूनी विशेषज्ञ के रूप में, इस मामले का विश्लेषण करें और प्रदान करें:
         1. केस का सारांश
         2. लागू होने वाली प्रासंगिक कानूनी धाराएं
         3. संभावित उदाहरण और समान मामले
         4. कानूनी व्याख्या और सलाह
         
         केस विवरण: ${caseText}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return language === 'en'
      ? "Sorry, there was an error analyzing this case. Please try again later."
      : "क्षमा करें, इस मामले का विश्लेषण करने में एक त्रुटि हुई थी। कृपया बाद में पुनः प्रयास करें।";
  }
}

// Function to analyze legal documents (from image or PDF)
export async function analyzeLegalDocument(fileData: Buffer, language: 'en' | 'hi' = 'en'): Promise<string> {
  try {
    // Use multimodal model for document analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Convert file to base64
    const base64Image = fileData.toString('base64');

    // Configure prompt based on language
    const prompt = language === 'en'
      ? "Analyze this legal document. Extract the key information, identify relevant laws and sections, summarize the main arguments, and provide legal insights."
      : "इस कानूनी दस्तावेज़ का विश्लेषण करें। मुख्य जानकारी निकालें, प्रासंगिक कानूनों और धाराओं की पहचान करें, मुख्य तर्कों का सारांश दें, और कानूनी अंतर्दृष्टि प्रदान करें।";

    // Call the multimodal model with image data
    // Detect mime type from the first few bytes
    let mimeType = "image/jpeg"; // Default
    
    // Check for PDF file signature
    if (fileData[0] === 0x25 && fileData[1] === 0x50 && fileData[2] === 0x44 && fileData[3] === 0x46) {
      mimeType = "application/pdf";
    } 
    // Check for PNG file signature
    else if (fileData[0] === 0x89 && fileData[1] === 0x50 && fileData[2] === 0x4E && fileData[3] === 0x47) {
      mimeType = "image/png";
    }
    // Check for JPEG file signature (there are several possible signatures)
    else if (fileData[0] === 0xFF && fileData[1] === 0xD8) {
      mimeType = "image/jpeg";
    }
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    return language === 'en' 
      ? "Sorry, there was an error analyzing this document. Please try again later."
      : "क्षमा करें, इस दस्तावेज़ का विश्लेषण करने में एक त्रुटि हुई थी। कृपया बाद में पुनः प्रयास करें।";
  }
}