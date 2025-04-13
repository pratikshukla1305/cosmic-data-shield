
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Upload, Eye, Camera } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface IdCardProps {
  idImage: File | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCapture: () => void;
  onPreview: () => void;
  title: string;
  inputId: string;
  isProcessing?: boolean;
}

const IdCard: React.FC<IdCardProps> = ({
  idImage,
  onUpload,
  onCapture,
  onPreview,
  title,
  inputId,
  isProcessing = false
}) => {
  return (
    <div className="grid gap-4">
      <Label htmlFor={inputId}>{title}</Label>
      <div className="flex gap-2">
        <input
          type="file"
          id={inputId}
          className="hidden"
          accept="image/*"
          onChange={onUpload}
        />
        <Button asChild variant="outline" className="flex-1">
          <Label htmlFor={inputId} className="cursor-pointer">
            {idImage ? (
              <><Check className="mr-2 h-4 w-4" />{idImage.name}</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />Upload</>
            )}
          </Label>
        </Button>
        <Button 
          variant="outline" 
          onClick={onCapture}
          className="flex-1"
        >
          <Camera className="mr-2 h-4 w-4" />
          Capture
        </Button>
      </div>
      {idImage && (
        <div className="relative">
          <img
            src={URL.createObjectURL(idImage)}
            alt={`${title} Preview`}
            className="mt-2 rounded-md"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute top-2 right-2 bg-white" 
            onClick={onPreview}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default IdCard;
