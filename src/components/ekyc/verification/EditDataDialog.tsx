
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EditDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  dialogType: "idNumber" | "name" | "dob";
  value: string;
  onChange: (value: string) => void;
}

const EditDataDialog: React.FC<EditDataDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  dialogType,
  value,
  onChange
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {dialogType === "idNumber" ? "ID Number" : dialogType === "name" ? "Name" : "Date of Birth"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={value}
            onChange={handleInputChange}
            placeholder={`Enter ${dialogType === "idNumber" ? "ID Number" : dialogType === "name" ? "Name" : "Date of Birth"}`}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDataDialog;
