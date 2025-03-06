const fs = require('fs');
const path = require('path');
const express = require('express');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  // Set this to your external presentations directory (relative or absolute path)
  presentationsDir: '../markdown-presentations', 
  port: process.env.PORT || 8000,
  baseDir: __dirname
};

// Create Express app
const app = express();

// Track presentations in memory
let presentationCache = null;
const presentationMap = new Map();

// Define root route first to ensure it takes precedence
app.get('/', (req, res) => {
  res.sendFile(path.join(CONFIG.baseDir, 'dashboard.html'));
});

// Serve static files from reveal.js
app.use(express.static(CONFIG.baseDir));

// Middleware to handle access to external markdown files 
app.use('/external-md', (req, res, next) => {
  // Security check: prevent directory traversal attacks by validating path
  const requestedPath = req.path;
  const normalizedPath = path.normalize(requestedPath);
  
  if (normalizedPath.includes('..') || !normalizedPath.endsWith('.md')) {
    return res.status(403).send('Access denied');
  }
  
  // Get absolute path to presentations directory
  const presentationsDirPath = path.resolve(CONFIG.baseDir, CONFIG.presentationsDir);
  
  // Resolve the full path to the external markdown file
  const mdFilePath = path.join(presentationsDirPath, normalizedPath);
  
  // Check if file exists
  fs.access(mdFilePath, fs.constants.R_OK, (err) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    // Serve the file with absolute path
    res.sendFile(mdFilePath);
  });
});

// API endpoint to get all presentations
app.get('/api/presentations', (req, res) => {
  loadPresentations()
    .then(presentations => {
      res.json(presentations);
    })
    .catch(err => {
      console.error('Error loading presentations:', err);
      res.status(500).json({ error: 'Failed to load presentations' });
    });
});

// Route to render a specific presentation
app.get('/presentation/:id', (req, res) => {
  const presentationId = req.params.id;
  const presentation = presentationMap.get(presentationId);
  
  if (!presentation) {
    return res.status(404).send('Presentation not found');
  }
  
  // Read the template file
  fs.readFile(path.join(CONFIG.baseDir, 'presentation-template.html'), 'utf8', (err, template) => {
    if (err) {
      console.error('Error reading template:', err);
      return res.status(500).send('Error loading presentation template');
    }
    
    // Replace template placeholders
    const html = template
      .replace('{{title}}', presentation.title)
      .replace('{{markdownPath}}', `/external-md/${presentation.filename}`);
    
    res.send(html);
  });
});

// Function to load presentations from the external directory
function loadPresentations() {
  return new Promise((resolve, reject) => {
    // Use cached data if available and not older than 5 minutes
    const now = Date.now();
    if (presentationCache && (now - presentationCache.timestamp) < 300000) {
      return resolve(presentationCache.data);
    }
    
    // Clear the existing map
    presentationMap.clear();
    
    // Get absolute path to presentations directory
    const presentationsDirPath = path.resolve(CONFIG.baseDir, CONFIG.presentationsDir);
    
    // Check if directory exists
    if (!fs.existsSync(presentationsDirPath)) {
      console.warn(`Presentations directory not found: ${presentationsDirPath}`);
      fs.mkdirSync(presentationsDirPath, { recursive: true });
      return resolve([]);
    }
    
    // Read the directory
    fs.readdir(presentationsDirPath, (err, files) => {
      if (err) {
        return reject(err);
      }
      
      // Filter for markdown files
      const mdFiles = files.filter(file => file.endsWith('.md'));
      
      // Process each file
      const presentations = mdFiles.map(filename => {
        const filePath = path.join(presentationsDirPath, filename);
        const stats = fs.statSync(filePath);
        
        // Generate a title from the filename (remove extension, replace hyphens with spaces, capitalize)
        const title = filename
          .replace(/\.md$/, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, char => char.toUpperCase());
        
        // Generate a unique ID
        const id = crypto.createHash('md5').update(filename).digest('hex').slice(0, 8);
        
        const presentation = {
          id,
          title,
          filename,
          lastModified: stats.mtime.getTime()
        };
        
        // Store in the map for lookup
        presentationMap.set(id, presentation);
        
        return presentation;
      });
      
      // Sort by last modified date (newest first)
      presentations.sort((a, b) => b.lastModified - a.lastModified);
      
      // Update cache
      presentationCache = {
        timestamp: now,
        data: presentations
      };
      
      resolve(presentations);
    });
  });
}

// Start the server
app.listen(CONFIG.port, () => {
  console.log(`
  ====================================================
  🎭 Reveal.js Presentation Dashboard is running!
  ----------------------------------------------------
  🌐 Open http://localhost:${CONFIG.port} in your browser
  📁 Serving presentations from: ${path.resolve(CONFIG.baseDir, CONFIG.presentationsDir)}
  ====================================================
  `);
  
  // Initial load of presentations
  loadPresentations().catch(err => {
    console.error('Failed to load initial presentations:', err);
  });
});
