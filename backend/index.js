const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// DepHealthVisualizer - License & Dependency Health Visualizer
// Made by prady

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// In-memory storage for audit results (in production, use database)
const auditResults = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'dep-health-visualizer-backend'
  });
});

// Analyze dependencies from uploaded package.json
app.post('/api/analyze', upload.single('packageJson'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No package.json file uploaded' });
    }

    const packageJsonPath = req.file.path;
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (!dependencies || Object.keys(dependencies).length === 0) {
      return res.status(400).json({ error: 'No dependencies found in package.json' });
    }

    // Analyze dependencies
    const auditId = uuidv4();
    const results = await analyzeDependencies(dependencies);

    // Store results
    auditResults.set(auditId, {
      id: auditId,
      timestamp: new Date().toISOString(),
      totalDependencies: Object.keys(dependencies).length,
      results: results
    });

    // Clean up uploaded file
    await fs.unlink(packageJsonPath);

    res.json({
      auditId,
      summary: {
        totalDependencies: Object.keys(dependencies).length,
        analyzedDependencies: results.length,
        averageHealthScore: results.reduce((sum, dep) => sum + dep.health_score, 0) / results.length
      },
      results: results.slice(0, 10) // Return first 10 results
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze dependencies' });
  }
});

// Analyze GitHub repository
app.post('/api/analyze/github', async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Extract owner and repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }

    const [, owner, repo] = match;

    // Fetch package.json from GitHub
    const packageJsonUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/package.json`;
    const response = await fetch(packageJsonUrl);

    if (!response.ok) {
      return res.status(404).json({ error: 'Could not find package.json in repository' });
    }

    const packageJson = await response.json();
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (!dependencies || Object.keys(dependencies).length === 0) {
      return res.status(400).json({ error: 'No dependencies found in repository' });
    }

    // Analyze dependencies
    const auditId = uuidv4();
    const results = await analyzeDependencies(dependencies);

    // Store results
    auditResults.set(auditId, {
      id: auditId,
      timestamp: new Date().toISOString(),
      repository: `${owner}/${repo}`,
      totalDependencies: Object.keys(dependencies).length,
      results: results
    });

    res.json({
      auditId,
      repository: `${owner}/${repo}`,
      summary: {
        totalDependencies: Object.keys(dependencies).length,
        analyzedDependencies: results.length,
        averageHealthScore: results.reduce((sum, dep) => sum + dep.health_score, 0) / results.length
      },
      results: results.slice(0, 10)
    });

  } catch (error) {
    console.error('GitHub analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze GitHub repository' });
  }
});

// Get audit report
app.get('/api/reports/:auditId', (req, res) => {
  const { auditId } = req.params;
  const report = auditResults.get(auditId);

  if (!report) {
    return res.status(404).json({ error: 'Audit report not found' });
  }

  res.json(report);
});

// Export audit report
app.get('/api/export/:auditId', (req, res) => {
  const { auditId } = req.params;
  const report = auditResults.get(auditId);

  if (!report) {
    return res.status(404).json({ error: 'Audit report not found' });
  }

  const exportData = {
    audit_id: report.id,
    timestamp: report.timestamp,
    repository: report.repository || 'uploaded-package.json',
    summary: {
      total_dependencies: report.totalDependencies,
      analyzed_dependencies: report.results.length,
      average_health_score: report.results.reduce((sum, dep) => sum + dep.health_score, 0) / report.results.length,
      license_breakdown: getLicenseBreakdown(report.results),
      health_distribution: getHealthDistribution(report.results)
    },
    dependencies: report.results
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="audit-${auditId}.json"`);
  res.json(exportData);
});

// Dependency analysis function
async function analyzeDependencies(dependencies) {
  const results = [];

  for (const [name, version] of Object.entries(dependencies)) {
    try {
      const healthData = await analyzePackageHealth(name, version);
      results.push(healthData);
    } catch (error) {
      console.warn(`Failed to analyze ${name}:`, error.message);
      // Add basic info for failed packages
      results.push({
        dependency: name,
        version: version,
        license: 'Unknown',
        last_release: null,
        health_score: 3.0,
        error: 'Analysis failed'
      });
    }
  }

  return results.sort((a, b) => b.health_score - a.health_score);
}

// Analyze individual package health
async function analyzePackageHealth(packageName, version) {
  try {
    // Fetch package info from npm registry
    const registryUrl = `https://registry.npmjs.org/${packageName}`;
    const response = await fetch(registryUrl);

    if (!response.ok) {
      throw new Error('Package not found');
    }

    const packageData = await response.json();
    const latestVersion = packageData['dist-tags']?.latest || 'latest';
    const latestInfo = packageData.versions[latestVersion];

    // Calculate health score based on various factors
    let healthScore = 5.0; // Base score

    // License factor (0-2 points)
    const license = latestInfo.license || 'Unknown';
    if (license === 'MIT' || license === 'ISC' || license === 'BSD-3-Clause') {
      healthScore += 2;
    } else if (license === 'Apache-2.0') {
      healthScore += 1.5;
    } else if (license === 'Unknown' || !license) {
      healthScore -= 1;
    }

    // Maintenance factor (0-2 points)
    const lastRelease = new Date(packageData.time?.modified || packageData.time?.created);
    const daysSinceLastRelease = (Date.now() - lastRelease.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastRelease < 30) {
      healthScore += 2;
    } else if (daysSinceLastRelease < 180) {
      healthScore += 1;
    } else if (daysSinceLastRelease > 365) {
      healthScore -= 1;
    }

    // Popularity factor (0-1 points)
    const weeklyDownloads = packageData.downloads || 0;
    if (weeklyDownloads > 1000000) {
      healthScore += 1;
    } else if (weeklyDownloads > 100000) {
      healthScore += 0.5;
    }

    // Clamp score between 0 and 10
    healthScore = Math.max(0, Math.min(10, healthScore));

    return {
      dependency: packageName,
      version: version,
      license: license,
      last_release: lastRelease.toISOString().split('T')[0],
      health_score: Math.round(healthScore * 10) / 10,
      maintainers: packageData.maintainers?.length || 0,
      downloads: weeklyDownloads,
      repository: packageData.repository?.url || null
    };

  } catch (error) {
    // Return basic info if analysis fails
    return {
      dependency: packageName,
      version: version,
      license: 'Unknown',
      last_release: null,
      health_score: 3.0,
      error: error.message
    };
  }
}

// Helper functions for export data
function getLicenseBreakdown(results) {
  const breakdown = {};
  results.forEach(dep => {
    const license = dep.license || 'Unknown';
    breakdown[license] = (breakdown[license] || 0) + 1;
  });
  return breakdown;
}

function getHealthDistribution(results) {
  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
  results.forEach(dep => {
    const score = dep.health_score;
    if (score >= 8) distribution.excellent++;
    else if (score >= 6) distribution.good++;
    else if (score >= 4) distribution.fair++;
    else distribution.poor++;
  });
  return distribution;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Create uploads directory
fs.mkdir('uploads', { recursive: true }).catch(() => {});

// Start server
app.listen(PORT, () => {
  console.log(`🔍 Dependency Health Visualizer API running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`👨‍💻 Made by prady`);
});

module.exports = app;