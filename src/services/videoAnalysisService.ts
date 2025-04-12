
import { AiAnalysisResult } from '../types/report';

// In a real app, this would call your backend service or the model_service API
export const analyzeVideoEvidence = async (videoUrl: string): Promise<AiAnalysisResult> => {
  console.log('Analyzing video:', videoUrl);
  
  // Check if model_service is running locally
  const MODEL_SERVICE_URL = 'http://localhost:8000/analyze-video';
  
  try {
    // Attempt to call the local model service first
    const response = await fetch(MODEL_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_url: videoUrl }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Model service response:', data);
      return {
        crimeType: data.crime_type,
        confidence: data.confidence,
        description: data.description,
        objects: [],
        persons: [],
      };
    }
  } catch (error) {
    console.log('Model service not available, using fallback:', error);
    // Continue with fallback if model service is not available
  }
  
  // Fallback: simulate analysis with mock data
  return new Promise((resolve) => {
    console.log('Using fallback video analysis');
    
    // Simulate processing delay
    setTimeout(() => {
      // Random selection of crime types for demo
      const crimeTypes = ['assault', 'abuse', 'arson', 'arrest'];
      const randomIndex = Math.floor(Math.random() * crimeTypes.length);
      const crimeType = crimeTypes[randomIndex];
      
      // Mock analysis results
      const result: AiAnalysisResult = {
        crimeType,
        confidence: 0.75 + Math.random() * 0.2, // Random confidence between 0.75 and 0.95
        description: getMockCrimeDescription(crimeType),
        objects: [
          { name: 'person', confidence: 0.98, boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.4 } },
          { name: 'vehicle', confidence: 0.85, boundingBox: { x: 0.6, y: 0.5, width: 0.3, height: 0.3 } }
        ],
        persons: [
          { 
            id: '1', 
            confidence: 0.95,
            boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.4 },
            age: 35,
            gender: 'male',
            clothing: ['red jacket', 'blue jeans']
          }
        ]
      };
      
      resolve(result);
    }, 2000); // 2 second delay to simulate processing
  });
};

// Mock descriptions for crime types
const getMockCrimeDescription = (crimeType: string): string => {
  const descriptions: Record<string, string> = {
    abuse: 
      "The detected video may involve abuse-related actions.\n" +
      "Abuse can be verbal, emotional, or physical.\n" +
      "It often includes intentional harm inflicted on a victim.\n" +
      "The victim may display distress or defensive behavior.",
    
    assault: 
      "Assault involves a physical attack or aggressive encounter.\n" +
      "This may include punching, kicking, or pushing actions.\n" +
      "The victim may be seen retreating or being overpowered.\n" +
      "There is usually a visible conflict or threat present.",
    
    arson: 
      "This video likely captures an incident of arson.\n" +
      "Arson is the criminal act of intentionally setting fire.\n" +
      "You may see flames, smoke, or ignition devices.\n" +
      "Often, it targets property like buildings or vehicles.",
    
    arrest: 
      "The scene likely depicts a law enforcement arrest.\n" +
      "An arrest involves restraining a suspect or individual.\n" +
      "You may see officers using handcuffs or other tools.\n" +
      "The individual may be cooperating or resisting."
  };
  
  return descriptions[crimeType] || "No detailed description available for this content.";
};
