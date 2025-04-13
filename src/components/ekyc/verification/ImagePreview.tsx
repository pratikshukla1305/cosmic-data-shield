
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  previewType: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  isOpen,
  onClose,
  imageFile,
  previewType
}) => {
  if (!imageFile) return null;
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-full" side="right">
        <SheetHeader>
          <SheetTitle>
            {previewType === 'idFront' ? 'ID Front' : previewType === 'idBack' ? 'ID Back' : 'Selfie'} Preview
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <img 
            src={URL.createObjectURL(imageFile)} 
            alt={`${previewType} Preview`}
            className="w-full h-auto rounded-md"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ImagePreview;
