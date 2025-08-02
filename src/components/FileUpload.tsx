import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage, FileCode } from 'lucide-react';
import { useViewerStore } from '../store/viewerStore';
import { fileLoader } from '../services/fileLoader';

interface FileUploadProps {
  type: 'image' | 'mask';
}

export const FileUpload: React.FC<FileUploadProps> = ({ type }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { setImageFile, setMaskFile, setLoading, setError } = useViewerStore();

  const handleFileLoad = async (fileOrFiles: File | FileList | File[]) => {
    try {
      setLoading(true);
      setError(null);
      let files: File[] = [];
      if (fileOrFiles instanceof FileList) {
        files = Array.from(fileOrFiles);
      } else if (Array.isArray(fileOrFiles)) {
        files = fileOrFiles;
      } else if (fileOrFiles instanceof File) {
        files = [fileOrFiles];
      }
      if (files.length === 1) {
        console.debug('Single file upload:', files[0]);
        const loadedFile = await fileLoader.loadFile(files[0]);
        if (type === 'image') {
          await setImageFile(loadedFile);
        } else {
          setMaskFile(loadedFile);
        }
      } else if (files.length > 1) {
        console.debug('Multi-file/folder upload:', files.map(f => f.name));
        const loadedFile = await fileLoader.loadImageStack(files);
        if (type === 'image') {
          await setImageFile(loadedFile);
        } else {
          setMaskFile(loadedFile);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileLoad(files);
    }
  }, [handleFileLoad]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileLoad(files);
    }
  }, [handleFileLoad]);

  const clearFile = useCallback(() => {
    if (type === 'image') {
      setImageFile(null);
    } else {
      setMaskFile(null);
    }
  }, [type, setImageFile, setMaskFile]);

  const { imageFile, maskFile } = useViewerStore();
  const currentFile = type === 'image' ? imageFile : maskFile;

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {currentFile ? (
          <div className="file-info">
            <div className="file-icon">
              {type === 'image' ? <FileImage size={24} /> : <FileCode size={24} />}
            </div>
            <div className="file-details">
              <div className="file-name">{currentFile.filename}</div>
              <div className="file-dimensions">
                {currentFile.data.dimensions.join(' × ')}
              </div>
              <div className="file-type">{currentFile.fileType.toUpperCase()}</div>
            </div>
            <button 
              className="clear-button"
              onClick={clearFile}
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <Upload size={32} />
            <h3>{type === 'image' ? 'Load Image' : 'Load Mask'}</h3>
            <p>Drag and drop a file, multiple files, or a folder here, or use the buttons below</p>
            <div className="supported-formats">
              <small>
                Supported formats: .nii, .nii.gz, .npy, .dcm, .dicom, .png, .jpg
              </small>
            </div>
            {/* Browse Files Button */}
            <input
              type="file"
              accept=".nii,.nii.gz,.npy,.dcm,.dicom,.png,.jpg,.jpeg"
              onChange={handleFileInput}
              style={{ display: 'none' }}
              id={`file-input-files-${type}`}
              multiple
            />
            <label htmlFor={`file-input-files-${type}`} className="browse-button" style={{ marginRight: 8 }}>
              Browse Files
            </label>
            {/* Browse Folder Button */}
            <input
              type="file"
              accept=".nii,.nii.gz,.npy,.dcm,.dicom,.png,.jpg,.jpeg"
              onChange={handleFileInput}
              style={{ display: 'none' }}
              id={`file-input-folder-${type}`}
              multiple
              // @ts-ignore: webkitdirectory is non-standard but supported in Chrome/Edge
              webkitdirectory="true"
              directory="true"
            />
            <label htmlFor={`file-input-folder-${type}`} className="browse-button">
              Browse Folder
            </label>
          </div>
        )}
      </div>
    </div>
  );
}; 