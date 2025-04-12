
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useReports } from '../contexts/ReportContext';
import { toast } from 'sonner';
import { analyzeVideoEvidence } from '../services/videoAnalysisService';
import { AiAnalysisResult } from '../types/report';
import { Loader2, Upload } from 'lucide-react';

export default function NewReportForm() {
  const { submitReport } = useReports();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEvidenceFiles(files);
    }
  };
  
  const handleAnalyzeVideo = async () => {
    if (evidenceFiles.length === 0) {
      toast.error("Please upload a video file first");
      return;
    }
    
    try {
      setIsAnalyzing(true);
      
      // Create object URL for the video file (for demo)
      const videoUrl = URL.createObjectURL(evidenceFiles[0]);
      
      // In a real app, you would upload this file to your server or cloud storage
      // and then pass the URL to the analyzeVideoEvidence function
      const result = await analyzeVideoEvidence(videoUrl);
      
      setAnalysisResult(result);
      toast.success("Video analysis completed");
    } catch (error) {
      console.error("Error analyzing video:", error);
      toast.error("Failed to analyze video");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !location) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Simulate file upload
      let uploadUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        // In a real app, upload files to storage and get URLs
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Mock URLs for demo
        uploadUrls = evidenceFiles.map((_, index) => 
          `https://via.placeholder.com/300x200?text=Evidence+${index + 1}`
        );
      }
      
      // Submit the report
      await submitReport({
        title,
        description,
        location,
        date: new Date().toISOString(),
        evidenceUrls: uploadUrls,
        aiAnalysisResults: analysisResult || undefined,
        crimeType: analysisResult?.crimeType
      });
      
      // Navigate to reports page
      navigate("/reports");
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Submit New Report</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title describing the incident"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of what happened"
            rows={4}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address or location where it occurred"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="evidence">Evidence Files</Label>
          <Input 
            id="evidence"
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*"
            multiple
            className="cursor-pointer"
          />
          <p className="text-sm text-gray-500">Upload images or videos related to the incident</p>
        </div>
        
        {evidenceFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Selected files: {evidenceFiles.length}</span>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <span className="text-sm">{uploadProgress}%</span>
              )}
            </div>
            <ul className="text-sm text-gray-600">
              {evidenceFiles.map((file, index) => (
                <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
              ))}
            </ul>
            
            <Button 
              type="button"
              variant="outline"
              onClick={handleAnalyzeVideo}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Video...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze Video with AI
                </>
              )}
            </Button>
          </div>
        )}
        
        {analysisResult && (
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg">AI Analysis Results</h3>
            <p className="text-sm"><span className="font-medium">Detected Crime Type:</span> {analysisResult.crimeType}</p>
            <p className="text-sm"><span className="font-medium">Confidence:</span> {Math.round((analysisResult.confidence || 0) * 100)}%</p>
            <div className="text-sm mt-2">
              <span className="font-medium">Description:</span>
              <p className="whitespace-pre-line mt-1 text-gray-700">{analysisResult.description}</p>
            </div>
          </Card>
        )}
        
        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
