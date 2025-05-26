import React, { useRef } from 'react'; // Removed useEffect, useState
import {
  PhotoIcon as ImgIcon,
  ArrowDownTrayIcon as DownloadIcon,
  DocumentDuplicateIcon as CopyIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// Assuming shadcn/ui components are imported like this:
// YOU MUST ENSURE THESE PATHS ARE CORRECT FOR YOUR PROJECT AND COMPONENTS ARE INSTALLED
// e.g., run: npx shadcn-ui@latest add button checkbox label
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface SelectionActionBarProps {
  selectedCount: number;
  onCopyImage: () => void;
  onDownloadImage: () => void;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onToggleSelectAll: () => void;
  areAllSelected: boolean;
  onClose: () => void;
}

// Reusable component for the circular action buttons in the middle
const ShadcnCircularActionButton: React.FC<{
  onClick: () => void;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  title?: string;
}> = ({ onClick, label, icon: Icon, disabled, title }) => (
  <div 
    className="flex flex-col items-center"
    // style={{ width: '5rem', flexShrink: 0 }} // width can be managed by container gap or min-w if needed
  >
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className="rounded-full w-12 h-12 p-0 mb-1 flex items-center justify-center data-[disabled]:opacity-50"
    >
      <Icon className="h-6 w-6" /> 
    </Button>
    {/* Action Button Labels: Apply text-muted-foreground */}
    <span className="text-xs text-center whitespace-nowrap text-muted-foreground">
      {label}
    </span>
  </div>
);

const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  selectedCount,
  onCopyImage,
  onDownloadImage,
  onCopyMarkdown,
  onDownloadMarkdown,
  onToggleSelectAll,
  areAllSelected,
  onClose,
}) => {
  const actionBarRef = useRef<HTMLDivElement>(null);

  // Removed currentThemeStyles state
  // Removed useEffect for theme updates and MutationObserver
  // Removed useEffect for applying dynamic styles

  return (
    <div 
      ref={actionBarRef}
      // Main Container: Apply bg-background and text-foreground for opacity
      className="rounded-lg p-3 bg-background text-foreground flex items-center justify-between w-full"
      id="gemini-enhancer-selection-action-bar-shadcn"
      // Removed inline style object
    >
      {/* Left side: Select All Checkbox */}
      <div className="flex items-center mr-2 sm:mr-4 space-x-2"> {/* Adjusted margin for smaller screens */}
        <Checkbox
          id="gemini-enhancer-select-all-checkbox-shadcn"
          checked={areAllSelected}
          onCheckedChange={(checkedState: boolean | 'indeterminate') => {
            if (typeof checkedState === 'boolean') {
              onToggleSelectAll();
            }
          }}
          aria-label={areAllSelected ? "取消全选" : "全选"}
        />
        <Label 
          htmlFor="gemini-enhancer-select-all-checkbox-shadcn" 
          // "全选" Label: text-card-foreground is inherited. Count span already has text-muted-foreground.
          className="text-sm font-medium cursor-pointer" 
        >
          全选 <span className="text-muted-foreground">({selectedCount})</span>
        </Label>
      </div>

      {/* Vertical Separator: Apply border-border */}
      <div className="border-l border-border h-6 self-center mx-1 sm:mx-2"></div>

      {/* Middle: Action buttons */}
      <div 
        className="flex items-center justify-center gap-2 sm:gap-3 flex-grow px-1" // Adjusted gap and added padding
        // Removed inline style object
      >
        <ShadcnCircularActionButton
          onClick={onCopyMarkdown}
          label="复制MD"
          icon={CopyIcon}
          disabled={selectedCount === 0}
          title="复制选中的消息为Markdown"
        />
        <ShadcnCircularActionButton
          onClick={onDownloadMarkdown}
          label="下载MD"
          icon={DownloadIcon}
          disabled={selectedCount === 0}
          title="下载选中的消息为Markdown文件"
        />
        <ShadcnCircularActionButton
          onClick={onCopyImage}
          label="复制图片"
          icon={ImgIcon}
          disabled={selectedCount === 0}
          title="复制选中的消息为图片"
        />
        <ShadcnCircularActionButton
          onClick={onDownloadImage}
          label="下载图片"
          icon={ImgIcon}
          disabled={selectedCount === 0}
          title="下载选中的消息为图片文件"
        />
      </div>

      {/* Right side: Close button */}
      <div className="flex items-center ml-2 sm:ml-4"> {/* Adjusted margin for smaller screens */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          title="关闭多选"
          className="rounded-full data-[disabled]:opacity-50"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default SelectionActionBar; 