import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ThesisRecord {
  id: number;
  barcode: string;
  thesis_title: string;
  authors: string[];
  department: string;
  publication_year: number;
}

interface EditThesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  thesis: ThesisRecord | null;
  onSave: (updatedThesis: Partial<ThesisRecord>) => Promise<void>;
}

const EditThesisModal: React.FC<EditThesisModalProps> = ({
  isOpen,
  onClose,
  thesis,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    thesis_title: '',
    authors: [''],
    department: '',
    publication_year: new Date().getFullYear(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (thesis) {
      setFormData({
        thesis_title: thesis.thesis_title || '',
        authors: thesis.authors || [''],
        department: thesis.department || '',
        publication_year: thesis.publication_year || new Date().getFullYear(),
      });
    }
  }, [thesis]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'publication_year' ? parseInt(value) || 0 : value,
    }));
  };

  const handleAuthorChange = (index: number, value: string) => {
    const newAuthors = [...formData.authors];
    newAuthors[index] = value;
    setFormData((prev) => ({
      ...prev,
      authors: newAuthors,
    }));
  };

  const addAuthor = () => {
    setFormData((prev) => ({
      ...prev,
      authors: [...prev.authors, ''],
    }));
  };

  const removeAuthor = (index: number) => {
    if (formData.authors.length > 1) {
      const newAuthors = formData.authors.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        authors: newAuthors,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesis) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: thesis.id,
        ...formData,
        authors: formData.authors.filter((author) => author.trim() !== ''),
      });
      onClose();
    } catch (error) {
      console.error('Error updating thesis:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!thesis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Thesis Information</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={thesis.barcode}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thesis_title">Thesis Title</Label>
            <Textarea
              id="thesis_title"
              name="thesis_title"
              value={formData.thesis_title}
              onChange={handleInputChange}
              rows={3}
              required
              placeholder="Enter thesis title"
            />
          </div>

          <div className="space-y-2">
            <Label>Authors</Label>
            {formData.authors.map((author, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={author}
                  onChange={(e) => handleAuthorChange(index, e.target.value)}
                  placeholder={`Author ${index + 1}`}
                  required
                />
                {formData.authors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuthor(index)}
                    className="px-3 py-1 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addAuthor}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Another Author
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              placeholder="Enter department"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publication_year">Publication Year</Label>
            <Input
              id="publication_year"
              name="publication_year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.publication_year}
              onChange={handleInputChange}
              required
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditThesisModal;
