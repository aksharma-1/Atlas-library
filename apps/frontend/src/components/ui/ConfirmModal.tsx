import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  centered?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  centered = true,
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="h-5 w-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-[#1E3A8A] dark:text-blue-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={getIcon()}
      maxWidth="sm"
      centered={centered}
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
