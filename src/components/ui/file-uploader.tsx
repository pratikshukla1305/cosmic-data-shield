
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Check } from "lucide-react";

interface FileUploaderProps {
  id: string;
  label?: string;
  description?: string;
  onFileSelected: (file: File | null) => void;
  accept?: string;
  progress?: number;
}

export const FileUploader = ({
  id,
  label,
  description,
  onFileSelected,
  accept = "image/*",
  progress = 0,
}: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    onFileSelected(selectedFile);
  };

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
  );
};
