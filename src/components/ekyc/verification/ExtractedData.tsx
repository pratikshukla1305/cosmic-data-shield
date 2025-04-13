
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Edit } from 'lucide-react';

interface ExtractedDataProps {
  extractedData: {
    idNumber?: string;
    name?: string;
    dob?: string;
    address?: string;
    gender?: string;
  };
  onEdit: (type: "idNumber" | "name" | "dob") => void;
}

const ExtractedData: React.FC<ExtractedDataProps> = ({
  extractedData,
  onEdit
}) => {
  if (Object.keys(extractedData).length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium flex items-center">
          <Check className="h-4 w-4 mr-2 text-green-500" />
          Extracted Information
        </h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (extractedData.idNumber) {
              onEdit("idNumber");
            } else if (extractedData.name) {
              onEdit("name");
            } else if (extractedData.dob) {
              onEdit("dob");
            }
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        {extractedData.idNumber && (
          <div className="flex justify-between items-center">
            <p><span className="font-semibold">Aadhaar Number:</span> {extractedData.idNumber}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => onEdit("idNumber")}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
        {extractedData.name && (
          <div className="flex justify-between items-center">
            <p><span className="font-semibold">Name:</span> {extractedData.name}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => onEdit("name")}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
        {extractedData.dob && (
          <div className="flex justify-between items-center">
            <p><span className="font-semibold">Date of Birth:</span> {extractedData.dob}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => onEdit("dob")}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
        {extractedData.gender && (
          <p><span className="font-semibold">Gender:</span> {extractedData.gender}</p>
        )}
        {extractedData.address && (
          <p><span className="font-semibold">Address:</span> {extractedData.address}</p>
        )}
      </div>
    </div>
  );
};

export default ExtractedData;
