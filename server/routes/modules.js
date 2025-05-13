const express = require('express');
const router = express.Router();
const { ModuleSystem } = require('../modules/runtime');
const { authenticateToken } = require('../middleware/auth');
const { validateModuleData } = require('../middleware/validation');

// Initialize module system
const moduleSystem = new ModuleSystem({
  runtime: {
    timeout: 5000,
    memoryLimit: 128
  },
  resources: {
    maxMemoryPerModule: 64,
    maxCpuTimePerModule: 30,
    maxDiskSpacePerModule: 100
  }
});

// Initialize module system
moduleSystem.initialize().catch(console.error);

// Get all modules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const modules = moduleSystem.getAllModules();
    res.json(modules);
  } catch (error) {
    console.error('Error getting modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get module status
router.get('/:moduleId/status', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const status = moduleSystem.getModuleStatus(moduleId);
    res.json({ status });
  } catch (error) {
    console.error('Error getting module status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Load a module
router.post('/:moduleId/load', authenticateToken, validateModuleData, async (req, res) => {
  try {
    const { moduleId } = req.params;
    await moduleSystem.loadModule(moduleId);
    res.json({ message: 'Module loaded successfully' });
  } catch (error) {
    console.error('Error loading module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unload a module
router.post('/:moduleId/unload', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    await moduleSystem.unloadModule(moduleId);
    res.json({ message: 'Module unloaded successfully' });
  } catch (error) {
    console.error('Error unloading module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reload a module
router.post('/:moduleId/reload', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    await moduleSystem.reloadModule(moduleId);
    res.json({ message: 'Module reloaded successfully' });
  } catch (error) {
    console.error('Error reloading module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get module metrics
router.get('/:moduleId/metrics', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const metrics = moduleSystem.resources.getModuleMetrics(moduleId);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting module metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system metrics
router.get('/metrics/system', authenticateToken, async (req, res) => {
  try {
    const metrics = moduleSystem.resources.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create communication channel
router.post('/:moduleId/channels', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { channelName } = req.body;
    moduleSystem.communication.createChannel(channelName, moduleId);
    res.json({ message: 'Channel created successfully' });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subscribe to channel
router.post('/:moduleId/channels/:channelName/subscribe', authenticateToken, async (req, res) => {
  try {
    const { moduleId, channelName } = req.params;
    moduleSystem.communication.subscribeToChannel(moduleId, channelName);
    res.json({ message: 'Subscribed to channel successfully' });
  } catch (error) {
    console.error('Error subscribing to channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish message to channel
router.post('/:moduleId/channels/:channelName/publish', authenticateToken, async (req, res) => {
  try {
    const { moduleId, channelName } = req.params;
    const { message } = req.body;
    moduleSystem.communication.publishMessage(moduleId, channelName, message);
    res.json({ message: 'Message published successfully' });
  } catch (error) {
    console.error('Error publishing message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 