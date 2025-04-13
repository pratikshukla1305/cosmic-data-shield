
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { createWorker } from 'tesseract.js';

interface ExtractedData {
  idNumber?: string;
  name?: string;
  dob?: string;
  address?: string;
  gender?: string;
}

export const useDocumentProcessor = (formData?: any) => {
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<any>(null);

  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/- ',
        });
        workerRef.current = worker;
        console.log("Tesseract worker initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Tesseract worker:", error);
        toast({
          title: "OCR Initialization Failed",
          description: "There was a problem setting up the text recognition system.",
          variant: "destructive"
        });
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const extractDataFromAadhaar = async (idImage: File) => {
    if (!workerRef.current) {
      toast({
        title: "OCR Not Ready",
        description: "Please wait for the OCR system to initialize.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      toast({
        title: "Processing Aadhaar Card",
        description: "We're extracting information from your ID. This may take a moment..."
      });

      const imageUrl = URL.createObjectURL(idImage);
      
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(imageUrl);
          setIsProcessing(false);
          throw new Error("Could not get canvas context");
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 127;
          const newValue = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = newValue;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const enhancedImage = canvas.toDataURL('image/png');
        
        try {
          const result = await workerRef.current.recognize(enhancedImage);
          
          const ocrText = result.data.text;
          console.log('OCR extracted text:', ocrText);
          
          const extracted: ExtractedData = {};
          
          // Process text to extract Aadhaar details
          const aadhaarPatterns = [
            /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
            /\b(\d{4}-\d{4}-\d{4})\b/,
            /\b(\d{12})\b/,
            // Additional patterns
          ];
          
          let aadhaarMatch = null;
          for (const pattern of aadhaarPatterns) {
            aadhaarMatch = ocrText.match(pattern);
            if (aadhaarMatch) {
              console.log("Found Aadhaar pattern match:", aadhaarMatch[0]);
              break;
            }
          }
          
          if (aadhaarMatch) {
            // Process Aadhaar number
            let aadhaarNumber = aadhaarMatch[0];
            if (aadhaarMatch.length > 1) {
              aadhaarNumber = aadhaarMatch[1];
            }
            
            aadhaarNumber = aadhaarNumber.replace(/[^0-9]/g, '');
            
            if (aadhaarNumber.length === 12) {
              aadhaarNumber = aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
              extracted.idNumber = aadhaarNumber;
            }
            
            // Extract other information like DOB, name, etc.
            const dobPattern = /\b(DOB|Date\s+of\s+Birth|Birth\s+Date)[\s:]+(\d{2}[/.-]\d{2}[/.-]\d{4})\b/i;
            const dobMatch = ocrText.match(dobPattern);
            if (dobMatch && dobMatch.length > 2) {
              extracted.dob = dobMatch[2];
            }
            
            const namePattern = /Name\s*[:]?\s*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i;
            const nameMatch = ocrText.match(namePattern);
            if (nameMatch && nameMatch.length > 1) {
              extracted.name = nameMatch[1];
            }
            
            // Set gender if found
            if (ocrText.match(/\b(male|MALE)\b/i)) {
              extracted.gender = 'Male';
            } else if (ocrText.match(/\b(female|FEMALE)\b/i)) {
              extracted.gender = 'Female';
            }
            
            // Extract address
            const addressMatch = ocrText.match(/Address\s*[:]?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
            if (addressMatch && addressMatch.length > 1) {
              extracted.address = addressMatch[1].trim();
            }
            
            setExtractedData(extracted);
            
            toast({
              title: "Data Extracted",
              description: "We've successfully extracted information from your Aadhaar card."
            });
          } else {
            console.log("No Aadhaar number found in:", ocrText);
            toast({
              title: "Extraction Issue",
              description: "We couldn't identify an Aadhaar number. Please ensure the image is clear and try again.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('OCR recognition error:', error);
          toast({
            title: "Recognition Failed",
            description: "There was a problem processing the image. Please try a clearer image.",
            variant: "destructive"
          });
        } finally {
          URL.revokeObjectURL(imageUrl);
          setIsProcessing(false);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setIsProcessing(false);
        toast({
          title: "Image Load Error",
          description: "Failed to load the image. Please try a different file.",
          variant: "destructive"
        });
      };
      
      img.src = imageUrl;
    } catch (error) {
      console.error('OCR extraction error:', error);
      setIsProcessing(false);
      toast({
        title: "Extraction Failed",
        description: "We encountered an error while processing your ID. Please try again with a clearer image.",
        variant: "destructive"
      });
    }
  };

  return {
    extractedData,
    setExtractedData,
    isProcessing,
    extractDataFromAadhaar
  };
};
