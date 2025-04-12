
import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Check, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FileUploaderProps {
  id: string;
  label?: string;
  description?: string;
  onFileSelected: (file: File | null) => void;
  accept?: string;
  progress?: number;
  allowCapture?: boolean;
  captureLabel?: string;
}

export const FileUploader = ({
  id,
  label,
  description,
  onFileSelected,
  accept = "image/*",
  progress = 0,
  allowCapture = true,
  captureLabel = "ID Document",
}: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    onFileSelected(selectedFile);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      // Fall back to upload tab if camera access fails
      setActiveTab("upload");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to file
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `captured_${Date.now()}.jpg`;
            const capturedFile = new File([blob], fileName, { type: 'image/jpeg' });
            
            setFile(capturedFile);
            onFileSelected(capturedFile);
            
            // Stop the camera after capture
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  React.useEffect(() => {
    // Start camera if capture tab is active
    if (activeTab === "capture" && !isCameraActive) {
      startCamera();
    } else if (activeTab !== "capture" && isCameraActive) {
      stopCamera();
    }
    
    // Cleanup on component unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab]);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-base font-medium">
            {label}
          </Label>
          {progress === 100 && <Check className="h-5 w-5 text-green-500" />}
        </div>
      )}
      
      {description && <p className="text-sm text-gray-500">{description}</p>}

      {file ? (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-sm text-gray-500">
              {Math.round(file.size / 1024)} KB
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">
              {progress === 100 ? "Completed" : "Uploading..."}
            </span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                onFileSelected(null);
              }}
              className="h-auto p-0 text-xs text-red-500 hover:text-red-700 hover:bg-transparent"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {allowCapture ? (
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="capture">Capture</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-4">
                <Input
                  type="file"
                  id={id}
                  className="hidden"
                  accept={accept}
                  onChange={handleFileChange}
                />
                <label
                  htmlFor={id}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Click to upload {captureLabel}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </label>
              </TabsContent>
              
              <TabsContent value="capture" className="mt-4">
                <div className="relative">
                  <div className="rounded-md overflow-hidden bg-black aspect-video">
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    onClick={captureImage}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center"
                    disabled={!isCameraActive}
                  >
                    <Camera className="h-6 w-6" />
                  </Button>
                  
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <p className="text-center mt-2 text-sm text-gray-500">
                    Position {captureLabel} in frame and click capture
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <Input
                type="file"
                id={id}
                className="hidden"
                accept={accept}
                onChange={handleFileChange}
              />
              <label
                htmlFor={id}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
