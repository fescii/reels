import { createFFmpeg, fetchFile } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/esm/index.js';
export default class ShotUploader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.ffmpeg = null;
    this.initializeComponent();
  }

  async initializeComponent() {
    await this.loadFFmpeg();
    this.render();
    this.attachEventListeners();
  }

  async loadFFmpeg() {
    try {
      // Load FFmpeg from local files
      const { createFFmpeg, fetchFile } = window.FFmpeg;
      this.ffmpeg = createFFmpeg({ 
        log: true,
        corePath: '../ffmpeg/ffmpeg-core.js',
      });
      await this.ffmpeg.load();
      // Make fetchFile available to the class
      this.fetchFile = fetchFile;
    } catch (error) {
      console.error('FFmpeg loading error:', error);
      this.showError('Failed to load video processing capabilities');
    }
  }

  render() {
    this.shadowRoot.innerHTML = this.getTemplate();
  }

  attachEventListeners() {
    const container = this.shadowRoot.querySelector('.uploader-container');
    const fileInput = this.shadowRoot.querySelector('.file-input');
    const uploadButton = this.shadowRoot.querySelector('.upload-button');
    
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      container.classList.add('drag-over');
    });
    
    container.addEventListener('dragleave', () => {
      container.classList.remove('drag-over');
    });
    
    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      container.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      await this.handleFileSelect(file);
    });
    
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      await this.handleFileSelect(file);
    });
    
    const trimButton = this.shadowRoot.querySelector('.trim-button');
    trimButton.addEventListener('click', () => this.processVideo());
  }

  async handleFileSelect(file) {
    if (!file || !file.type.startsWith('video/')) {
      this.showError('Please select a valid video file');
      return;
    }

    const videoSize = file.size / (1024 * 1024); // Convert to MB
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);

    await new Promise(resolve => {
      video.onloadedmetadata = () => resolve();
    });

    const duration = video.duration;
    
    if (videoSize > 56) {
      this.showError('Video size exceeds 56MB. Please trim or compress the video.');
      this.showTrimControls(video);
      return;
    }

    if (duration > 600) { // 10 minutes in seconds
      this.showError('Video duration exceeds 10 minutes. Please trim the video.');
      this.showTrimControls(video);
      return;
    }

    await this.processVideo(file);
  }

  showError(message) {
    const errorElement = this.shadowRoot.querySelector('.error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  showTrimControls(video) {
    const trimControls = this.shadowRoot.querySelector('.trim-controls');
    const videoPreview = this.shadowRoot.querySelector('.video-preview');
    const trimSlider = this.shadowRoot.querySelector('.trim-slider');
    
    videoPreview.src = video.src;
    videoPreview.style.display = 'block';
    trimControls.style.display = 'block';
    
    trimSlider.max = video.duration;
    trimSlider.addEventListener('input', (e) => {
      const time = e.target.value;
      this.shadowRoot.querySelector('.trim-start').textContent = 
        this.formatTime(time);
    });
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async processVideo(file) {
    const progressContainer = this.shadowRoot.querySelector('.progress-container');
    const progressFill = this.shadowRoot.querySelector('.progress-fill');
    const progressText = this.shadowRoot.querySelector('.progress-text');
    
    progressContainer.style.display = 'block';
    
    try {
      // Convert to HLS (m3u8)
      const inputFileName = 'input.mp4';
      this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));
      
      await this.ffmpeg.run(
        '-i', inputFileName,
        '-hls_time', '10',
        '-hls_list_size', '0',
        '-f', 'hls',
        'output.m3u8'
      );
      
      // Read the generated files
      const m3u8Content = this.ffmpeg.FS('readFile', 'output.m3u8');
      const segments = [];
      
      // Read all generated segments
      let segmentIndex = 0;
      while (true) {
        try {
          const segmentName = `output${segmentIndex}.ts`;
          const segment = this.ffmpeg.FS('readFile', segmentName);
          segments.push({
            name: segmentName,
            data: segment
          });
          segmentIndex++;
        } catch (e) {
          break;
        }
      }
      
      // Upload to AWS
      await this.uploadToAWS(m3u8Content, segments);
      
      progressFill.style.width = '100%';
      progressText.textContent = 'Upload complete!';
      
    } catch (error) {
      this.showError('Error processing video: ' + error.message);
    }
  }

  async uploadToAWS(m3u8Content, segments) {
    // Example AWS upload implementation
    const uploadFile = async (file, fileName) => {
      const formData = new FormData();
      formData.append('file', new Blob([file]), fileName);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    };
    
    // Upload m3u8 file
    await uploadFile(m3u8Content, 'output.m3u8');
    
    // Upload segments
    for (const segment of segments) {
      await uploadFile(segment.data, segment.name);
    }
  }

  getTemplate = () => {
    return /* html */`
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    return /* html */`
      <div class="uploader-container">
        <div class="upload-icon">📤</div>
        <h3>Upload Video</h3>
        <p>Drag & drop your video here or click to select</p>
        <input type="file" class="file-input" accept="video/*">
        <button class="upload-button">Select Video</button>
        
        <div class="error-message"></div>
        
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <p class="progress-text">0%</p>
        </div>
        
        <video class="video-preview" controls></video>
        
        <div class="trim-controls">
          <h4>Trim Video</h4>
          <input type="range" class="trim-slider" min="0" max="100" value="0">
          <p>Start: <span class="trim-start">0:00</span> End: <span class="trim-end">0:00</span></p>
          <button class="upload-button trim-button">Trim & Process</button>
        </div>
      </div>
    `;
  }

  getStyles = () => {
    return /* css */`
      <style>
          :host {
            display: block;
            font-family: Arial, sans-serif;
          }
          
          .uploader-container {
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            background: #f9f9f9;
            margin: 20px;
            transition: all 0.3s ease;
          }
          
          .uploader-container.drag-over {
            border-color: #2196f3;
            background: #e3f2fd;
          }
          
          .upload-icon {
            font-size: 48px;
            color: #666;
            margin-bottom: 10px;
          }
          
          .file-input {
            display: none;
          }
          
          .upload-button {
            background: #2196f3;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
          }
          
          .upload-button:hover {
            background: #1976d2;
          }
          
          .progress-container {
            margin: 20px 0;
            display: none;
          }
          
          .progress-bar {
            width: 100%;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
          }
          
          .progress-fill {
            height: 100%;
            background: #4caf50;
            width: 0%;
            transition: width 0.3s ease;
          }
          
          .error-message {
            color: #f44336;
            margin: 10px 0;
            display: none;
          }
          
          .video-preview {
            max-width: 100%;
            margin: 20px 0;
            display: none;
          }
          
          .trim-controls {
            display: none;
            margin: 20px 0;
          }
          
          .trim-slider {
            width: 100%;
            margin: 10px 0;
          }
      </style>
    `;
  }
}