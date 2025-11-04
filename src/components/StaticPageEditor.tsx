'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Grid, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, IconButton, Divider, Box } from '@mui/material';
import { Color } from '@/assets/colors';
import {
  FormatBold,
  FormatItalic,
  StrikethroughS,
  Code,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Link as LinkIcon,
  LinkOff,
  Image as ImageIcon,
  Undo,
  Redo,
} from '@mui/icons-material';
import Swal from 'sweetalert2';

// Types
interface StaticPageEditorProps {
  title: string;
  initialContent: string;
  createEndpoint: string;
  hasTypeSelector?: boolean;
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  loading?: boolean;
}

interface InputFieldError {
  type?: string;
  description?: string;
}

interface ApiPayload {
  type?: string;
  description: string;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

const StaticPageEditor: React.FC<StaticPageEditorProps> = ({
  title,
  initialContent,
  createEndpoint,
  hasTypeSelector = false,
  selectedType = 'Astrologer',
  onTypeChange,
  loading: externalLoading = false,
}) => {
  const [description, setDescription] = useState<string>('');
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentFormat, setCurrentFormat] = useState<string>('Normal');
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle Input Field Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string | null) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  // Execute command
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  // Update active formats based on cursor position
  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
    });
  };

  // Handle toolbar actions
  const handleBold = () => executeCommand('bold');
  const handleItalic = () => executeCommand('italic');
  const handleUnderline = () => executeCommand('underline');
  const handleStrikethrough = () => executeCommand('strikethrough');
  
  const handleAlignLeft = () => executeCommand('justifyLeft');
  const handleAlignCenter = () => executeCommand('justifyCenter');
  const handleAlignRight = () => executeCommand('justifyRight');
  const handleAlignJustify = () => executeCommand('justifyFull');
  
  const handleBulletList = () => executeCommand('insertUnorderedList');
  const handleNumberList = () => executeCommand('insertOrderedList');
  
  const handleQuote = () => {
    executeCommand('formatBlock', 'blockquote');
    handleContentChange();
  };
  
  const handleCode = () => {
    // Get selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      // Use insertHTML to maintain undo stack
      const codeHTML = `<pre class="code-block"><code>${selectedText}</code></pre><p><br></p>`;
      document.execCommand('insertHTML', false, codeHTML);
      
      editorRef.current?.focus();
      handleContentChange();
    }
  };
  
  const handleUndo = () => executeCommand('undo');
  const handleRedo = () => executeCommand('redo');
  
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      // Add https:// if no protocol is specified
      let formattedUrl = url.trim();
      if (!formattedUrl.match(/^https?:\/\//i)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      executeCommand('createLink', formattedUrl);
      handleContentChange();
    }
  };

  const handleUnlink = () => executeCommand('unlink');

  const handleImage = () => {
    const url = prompt('Enter image URL:');
    if (url) executeCommand('insertImage', url);
  };

  // Handle format dropdown change
  const handleFormatChange = (event: SelectChangeEvent<string>) => {
    const format = event.target.value;
    setCurrentFormat(format);
    
    // Map format names to HTML tag names (without angle brackets)
    const formatMap: { [key: string]: string } = {
      'Heading 1': 'h1',
      'Heading 2': 'h2',
      'Heading 3': 'h3',
      'Heading 4': 'h4',
      'Heading 5': 'h5',
      'Heading 6': 'h6',
      'Normal': 'p',
    };
    
    const tagName = formatMap[format] || 'p';
    executeCommand('formatBlock', tagName);
    handleContentChange();
  };

  // Handle Validation
  const handleValidation = (): boolean => {
    let isValid = true;

    if (hasTypeSelector && !selectedType) {
      handleInputFieldError('type', 'Please Select type');
      isValid = false;
    }

    const strippedDescription = description.replace(/<[^>]*>/g, '').trim();
    if (!strippedDescription || description === '<p><br></p>' || description === '') {
      handleInputFieldError('description', 'Please Enter Description');
      isValid = false;
    }

    return isValid;
  };

  // Handle Submit
// Handle Submit
const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
  e.preventDefault();

  if (!handleValidation()) return;

  try {
    setSubmitting(true);
    const payload: ApiPayload = {
      description: description,
    };

    if (hasTypeSelector && selectedType) {
      payload.type = selectedType;
    }

    const response = await fetch(createEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to update data');

    const result = await response.json();
    console.log('Success:', result);
    
    await Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Updated successfully!',
      confirmButtonColor: '#3085d6',
    });
  } catch (error) {
    console.error('Error updating data:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to update. Please try again.',
      confirmButtonColor: '#d33',
    });
  } finally {
    setSubmitting(false);
  }
};

  // Handle Type Change
  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    if (onTypeChange) {
      onTypeChange(event.target.value);
    }
  };

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setDescription(content);
      if (inputFieldError.description) {
        handleInputFieldError('description', null);
      }
    }
  };

  // Update editor when initialContent changes
  useEffect(() => {
    if (initialContent !== description) {
      setDescription(initialContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent;
      }
    }
  }, [initialContent]);

  // Track selection changes to update active formats
  useEffect(() => {
    const handleSelectionChange = () => {
      if (editorRef.current?.contains(document.activeElement)) {
        updateActiveFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const getToolbarButtonStyle = (isActive: boolean = false) => ({
    padding: '6px',
    minWidth: '36px',
    height: '36px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: isActive ? '#e5e7eb' : '#fff',
    color: isActive ? '#1f2937' : '#4b5563',
    '&:hover': {
      backgroundColor: isActive ? '#d1d5db' : '#f3f4f6',
    }
  });

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#fff',
        marginBottom: '20px',
        boxShadow: '0px 0px 5px lightgrey',
        borderRadius: '10px',
      }}
    >
      <div
        style={{
          padding: '10px 0 30px 0',
          fontSize: '22px',
          fontWeight: '500',
          color: Color.black,
        }}
      >
        {title}
      </div>

      {externalLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          Loading content...
        </div>
      ) : (
        <Grid container spacing={3}>
          {hasTypeSelector && (
            <Grid item lg={12} md={12} sm={12} xs={12}>
              <FormControl fullWidth>
                <InputLabel id="select-label">
                  Select Type <span style={{ color: 'red' }}>*</span>
                </InputLabel>
                <Select
                  label="Select Type *"
                  variant="outlined"
                  fullWidth
                  name="type"
                  value={selectedType}
                  onChange={handleTypeChange}
                  error={!!inputFieldError?.type}
                  onFocus={() => handleInputFieldError('type', null)}
                >
                  <MenuItem disabled>---Select Type---</MenuItem>
                  <MenuItem value="Customer">Customer</MenuItem>
                  <MenuItem value="Astrologer">Astrologer</MenuItem>
                </Select>
              </FormControl>
              {inputFieldError?.type && (
                <div
                  style={{
                    color: '#D32F2F',
                    fontSize: '13px',
                    padding: '5px 15px 0 12px',
                    fontWeight: '500',
                  }}
                >
                  {inputFieldError?.type}
                </div>
              )}
            </Grid>
          )}

          <Grid item lg={12} md={12} sm={12} xs={12}>
            {/* Toolbar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '4px 4px 0 0',
                flexWrap: 'wrap',
              }}
            >
              {/* Text Formatting */}
              <IconButton size="small" onClick={handleBold} title="Bold" sx={getToolbarButtonStyle(activeFormats.bold)}>
                <FormatBold fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleItalic} title="Italic" sx={getToolbarButtonStyle(activeFormats.italic)}>
                <FormatItalic fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleStrikethrough} title="Strikethrough" sx={getToolbarButtonStyle(activeFormats.strikethrough)}>
                <StrikethroughS fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleCode} title="Code Block" sx={getToolbarButtonStyle()}>
                <Code fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleUnderline} title="Underline" sx={getToolbarButtonStyle(activeFormats.underline)}>
                <FormatUnderlined fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, backgroundColor: '#d1d5db' }} />

              {/* Alignment */}
              <IconButton size="small" onClick={handleAlignLeft} title="Align Left" sx={getToolbarButtonStyle()}>
                <FormatAlignLeft fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleAlignCenter} title="Align Center" sx={getToolbarButtonStyle()}>
                <FormatAlignCenter fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleAlignRight} title="Align Right" sx={getToolbarButtonStyle()}>
                <FormatAlignRight fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleAlignJustify} title="Justify" sx={getToolbarButtonStyle()}>
                <FormatAlignJustify fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, backgroundColor: '#d1d5db' }} />

              {/* Lists */}
              <IconButton size="small" onClick={handleBulletList} title="Bullet List" sx={getToolbarButtonStyle()}>
                <FormatListBulleted fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleNumberList} title="Numbered List" sx={getToolbarButtonStyle()}>
                <FormatListNumbered fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, backgroundColor: '#d1d5db' }} />

              {/* Quote */}
              <IconButton size="small" onClick={handleQuote} title="Quote" sx={getToolbarButtonStyle()}>
                <FormatQuote fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, backgroundColor: '#d1d5db' }} />

              {/* Link */}
              <IconButton size="small" onClick={handleLink} title="Insert Link" sx={getToolbarButtonStyle()}>
                <LinkIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleUnlink} title="Remove Link" sx={getToolbarButtonStyle()}>
                <LinkOff fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, backgroundColor: '#d1d5db' }} />

              {/* Image */}
              <IconButton size="small" onClick={handleImage} title="Insert Image" sx={getToolbarButtonStyle()}>
                <ImageIcon fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, backgroundColor: '#d1d5db' }} />

              {/* Format Dropdown */}
              <Select
                value={currentFormat}
                onChange={handleFormatChange}
                size="small"
                variant="outlined"
                sx={{
                  minWidth: '140px',
                  height: '36px',
                  backgroundColor: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d1d5db',
                  }
                }}
              >
                <MenuItem value="Normal" style={{ fontSize: '14px' }}>Normal</MenuItem>
                <MenuItem value="Heading 1" style={{ fontSize: '28px', fontWeight: 'bold' }}>Heading 1</MenuItem>
                <MenuItem value="Heading 2" style={{ fontSize: '24px', fontWeight: 'bold' }}>Heading 2</MenuItem>
                <MenuItem value="Heading 3" style={{ fontSize: '20px', fontWeight: 'bold' }}>Heading 3</MenuItem>
                <MenuItem value="Heading 4" style={{ fontSize: '16px', fontWeight: 'bold' }}>Heading 4</MenuItem>
                <MenuItem value="Heading 5" style={{ fontSize: '14px', fontWeight: 'bold' }}>Heading 5</MenuItem>
                <MenuItem value="Heading 6" style={{ fontSize: '12px', fontWeight: 'bold' }}>Heading 6</MenuItem>
              </Select>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, backgroundColor: '#d1d5db' }} />

              {/* Undo/Redo */}
              <IconButton size="small" onClick={handleUndo} title="Undo" sx={getToolbarButtonStyle()}>
                <Undo fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleRedo} title="Redo" sx={getToolbarButtonStyle()}>
                <Redo fontSize="small" />
              </IconButton>
            </Box>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              onMouseUp={updateActiveFormats}
              onKeyUp={updateActiveFormats}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                
                // Prevent editing inside code blocks by selecting the entire block
                if (target.closest('pre.code-block')) {
                  e.preventDefault();
                  const pre = target.closest('pre.code-block') as HTMLElement;
                  const selection = window.getSelection();
                  const range = document.createRange();
                  range.selectNode(pre);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                  return;
                }
                
                // Make links clickable with Ctrl/Cmd + Click
                if (target.tagName === 'A' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  window.open((target as HTMLAnchorElement).href, '_blank');
                }
              }}
              onFocus={() => handleInputFieldError('description', null)}
              style={{
                minHeight: '400px',
                padding: '15px',
                border: inputFieldError?.description ? '1px solid #D32F2F' : '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                backgroundColor: '#fff',
                outline: 'none',
                lineHeight: '1.6',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
              }}
              className="rich-text-editor"
            />
            {inputFieldError?.description && (
              <div
                style={{
                  color: '#D32F2F',
                  fontSize: '13px',
                  padding: '5px 15px 0 12px',
                  fontWeight: '400',
                }}
              >
                {inputFieldError?.description}
              </div>
            )}
            <div
              style={{
                color: '#6b7280',
                fontSize: '12px',
                padding: '5px 15px 0 12px',
                fontStyle: 'italic',
              }}
            >
              Tip: Hold Ctrl (or Cmd on Mac) and click on links to open them. Click on code blocks to select and delete them.
            </div>
          </Grid>

          <Grid item lg={12} md={12} sm={12} xs={12}>
            <Grid container sx={{ justifyContent: 'space-between' }}>
              <div
                onClick={handleSubmit}
                style={{
                  fontWeight: '500',
                  backgroundColor: submitting ? '#ccc' : Color.primary,
                  color: Color.white,
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  pointerEvents: submitting ? 'none' : 'auto',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </div>
            </Grid>
          </Grid>
        </Grid>
      )}
      
      {/* Add CSS for proper list and link styling */}
      <style>{`
        .rich-text-editor ul {
          list-style-type: disc;
          padding-left: 40px;
          margin: 1em 0;
        }
        
        .rich-text-editor ol {
          list-style-type: decimal;
          padding-left: 40px;
          margin: 1em 0;
        }
        
        .rich-text-editor li {
          margin: 0.5em 0;
        }
        
        .rich-text-editor a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          pointer-events: auto;
        }
        
        .rich-text-editor a:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
        
        .rich-text-editor blockquote {
          border-left: 4px solid #ccc;
          margin-left: 0;
          padding-left: 16px;
          color: #666;
          font-style: italic;
          margin: 1em 0;
        }
        
        .rich-text-editor pre {
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #ddd;
          overflow: auto;
          font-family: monospace;
          margin: 1em 0;
          cursor: default;
          position: relative;
        }
        
        .rich-text-editor pre.code-block {
          user-select: all;
        }
        
        .rich-text-editor pre.code-block::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .rich-text-editor code {
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        
        .rich-text-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        .rich-text-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        
        .rich-text-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        .rich-text-editor h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1em 0;
        }
        
        .rich-text-editor h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
        }
        
        .rich-text-editor h6 {
          font-size: 0.67em;
          font-weight: bold;
          margin: 2em 0;
        }
      `}</style>
    </div>
  );
};

export default StaticPageEditor;