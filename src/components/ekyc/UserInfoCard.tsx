
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserInfoCardProps {
  formData: {
    fullName: string;
    email: string;
    phone?: string;
    dob?: string;
    nationality?: string;
    idType?: string;
    idNumber?: string;
    address?: string;
  };
}

const UserInfoCard = ({ formData }: UserInfoCardProps) => {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-blue-200">
            <AvatarImage
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                formData.fullName
              )}&color=3b82f6&background=dbeafe`}
              alt={formData.fullName}
            />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(formData.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{formData.fullName}</h3>
            <p className="text-gray-600">{formData.email}</p>
            {formData.phone && <p className="text-gray-600">{formData.phone}</p>}
          </div>
        </div>

        {(formData.dob || formData.nationality || formData.idNumber) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {formData.dob && (
              <div>
                <p className="text-xs text-gray-500 font-medium">Date of Birth</p>
                <p className="text-sm">{formData.dob}</p>
              </div>
            )}
            {formData.nationality && (
              <div>
                <p className="text-xs text-gray-500 font-medium">Nationality</p>
                <p className="text-sm">{formData.nationality}</p>
              </div>
            )}
            {formData.idType && (
              <div>
                <p className="text-xs text-gray-500 font-medium">ID Type</p>
                <p className="text-sm">{formData.idType}</p>
              </div>
            )}
            {formData.idNumber && (
              <div>
                <p className="text-xs text-gray-500 font-medium">ID Number</p>
                <p className="text-sm">{formData.idNumber}</p>
              </div>
            )}
            {formData.address && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 font-medium">Address</p>
                <p className="text-sm">{formData.address}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
