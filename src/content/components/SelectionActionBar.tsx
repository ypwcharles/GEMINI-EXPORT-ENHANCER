import React, { useEffect, useRef, useState } from 'react';
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
    style={{ width: '5rem', flexShrink: 0 }}
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
    <span className="text-xs text-center whitespace-nowrap">
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
  const [currentThemeStyles, setCurrentThemeStyles] = useState({ 
    backgroundColor: '#FFFFFF', 
    color: '#202124', 
    mutedColor: '#5F6368', 
    borderColor: '#DADCE0' 
  });

  useEffect(() => {
    const updateThemeStyles = () => {
      if (actionBarRef.current) {
        const docEl = document.documentElement;
        const bodyStyle = window.getComputedStyle(document.body);
        
        // 使用更健壮的暗色模式检测逻辑
        const isDarkMode = docEl.getAttribute('dark') === 'true' ||
                           docEl.classList.contains('dark') ||
                           (bodyStyle.backgroundColor && 
                            parseInt(bodyStyle.backgroundColor.split('(')[1] || '0') < 128 && // Ensure there's a value before parseInt
                            !bodyStyle.backgroundColor.includes('rgba(0, 0, 0, 0)') // Ensure not fully transparent
                           );

        const rootStyle = getComputedStyle(docEl);
        const cardBg = rootStyle.getPropertyValue('--card').trim();
        const cardFg = rootStyle.getPropertyValue('--card-foreground').trim();
        const mutedFg = rootStyle.getPropertyValue('--muted-foreground').trim();
        const border = rootStyle.getPropertyValue('--border').trim();

        let newStyles = { 
          backgroundColor: isDarkMode ? '#2D2E30' : '#FFFFFF',
          color: isDarkMode ? '#E8EAED' : '#202124',
          mutedColor: isDarkMode ? '#9AA0A6' : '#5F6368',
          borderColor: isDarkMode ? '#5F6368' : '#DADCE0'
        };

        if (cardBg) newStyles.backgroundColor = cardBg;
        if (cardFg) newStyles.color = cardFg;
        if (mutedFg) newStyles.mutedColor = mutedFg;
        if (border) newStyles.borderColor = border;
        
        setCurrentThemeStyles(newStyles);
      }
    };

    updateThemeStyles();

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'dark' || mutation.attributeName === 'style')) {
          // Observe class, dark attribute on html, or style on body (for background color check)
          updateThemeStyles();
          break; // Found a relevant mutation, no need to check others
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'dark'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] }); // For body background changes

    return () => observer.disconnect();

  }, []);

  useEffect(() => {
    // Apply dynamically determined styles
    if (actionBarRef.current) {
      actionBarRef.current.style.backgroundColor = currentThemeStyles.backgroundColor;
      actionBarRef.current.style.color = currentThemeStyles.color;
      
      const labelElement = actionBarRef.current.querySelector(
        'label[for="gemini-enhancer-select-all-checkbox-shadcn"]'
      ) as HTMLLabelElement;
      if (labelElement) {
        labelElement.style.color = currentThemeStyles.color;
        const countSpan = labelElement.querySelector('span');
        if (countSpan) {
          countSpan.style.color = currentThemeStyles.mutedColor;
        }
      }

      const actionButtonLabels = actionBarRef.current.querySelectorAll('.flex.flex-col.items-center > span');
      actionButtonLabels.forEach(span => {
        (span as HTMLElement).style.color = currentThemeStyles.mutedColor;
      });

      const actionButtonIcons = actionBarRef.current.querySelectorAll('.flex.flex-col.items-center button svg');
      actionButtonIcons.forEach(svgIcon => {
        (svgIcon as HTMLElement).style.color = currentThemeStyles.color;
      });
      
      const closeButtonIcon = actionBarRef.current.querySelector('button[title="关闭多选"] svg');
      if (closeButtonIcon) {
        (closeButtonIcon as HTMLElement).style.color = currentThemeStyles.color;
      }

      const separator = actionBarRef.current.querySelector('.border-l') as HTMLDivElement;
      if (separator) {
        separator.style.borderColor = currentThemeStyles.borderColor;
      }
    }
  }, [currentThemeStyles]);

  return (
    <div 
      ref={actionBarRef}
      className="rounded-lg p-3"
      id="gemini-enhancer-selection-action-bar-shadcn"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        // backgroundColor and color are now set by the second useEffect via currentThemeStyles state
      }}
    >
      {/* Left side: Select All Checkbox */}
      <div className="flex items-center mr-4 space-x-2">
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
          className="text-sm font-medium cursor-pointer"
        >
          全选 <span className="text-muted-foreground">({selectedCount})</span>
        </Label>
      </div>

      {/* Vertical Separator */}
      <div className="border-l h-6 self-center mx-1 sm:mx-2"></div>

      {/* Middle: Action buttons */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flexGrow: 1
        }}
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
      <div className="flex items-center ml-4">
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