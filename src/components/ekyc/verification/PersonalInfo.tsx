
import React from 'react';
import { Label } from '@/components/ui/label';

interface PersonalInfoProps {
  formData: {
    fullName: string;
    dob: string;
    nationality: string;
    idType: string;
    idNumber: string;
    address: string;
    phone: string;
    email: string;
  };
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({ formData }) => {
  if (!formData) return null;
  
  return (
    <div className="mt-8 pt-6 border-t">
      <h3 className="text-lg font-semibold mb-4">Your Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm text-gray-500">Full Name</Label>
          <p className="font-medium">{formData.fullName}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Date of Birth</Label>
          <p className="font-medium">{formData.dob}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Nationality</Label>
          <p className="font-medium">{formData.nationality}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">ID Type</Label>
          <p className="font-medium">{formData.idType.replace('_', ' ')}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">ID Number</Label>
          <p className="font-medium">{formData.idNumber}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Phone</Label>
          <p className="font-medium">{formData.phone}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Email</Label>
          <p className="font-medium">{formData.email}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Address</Label>
          <p className="font-medium">{formData.address}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
