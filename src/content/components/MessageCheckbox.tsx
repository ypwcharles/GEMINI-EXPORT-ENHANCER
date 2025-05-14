import React from 'react';

interface MessageCheckboxProps {
  messageId: string;
  isChecked: boolean;
  onChange: (messageId: string, checked: boolean) => void;
  label?: string; // Optional label like "Select message"
}

const MessageCheckbox: React.FC<MessageCheckboxProps> = ({
  messageId,
  isChecked,
  onChange,
  label,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(messageId, event.target.checked);
  };

  return (
    <div className="gemini-enhancer-multiselect-checkbox-container flex items-center p-1 mr-2 my-1 bg-transparent">
      <input
        type="checkbox"
        id={`gemini-enhancer-checkbox-${messageId}`}
        checked={isChecked}
        onChange={handleChange}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        aria-label={label || `Select message ${messageId}`}
      />
      {label && (
        <label
          htmlFor={`gemini-enhancer-checkbox-${messageId}`}
          className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default MessageCheckbox; 