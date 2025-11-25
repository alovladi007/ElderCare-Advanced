const express = require('express');
const router = express.Router();
const SmartDevice = require('../models/SmartDevice');
const Room = require('../models/Room');
const Scene = require('../models/Scene');
const Automation = require('../models/Automation');
const DeviceEvent = require('../models/DeviceEvent');

// Simple auth middleware (to be enhanced later)
const auth = (req, res, next) => {
  // For now, accept all requests; add JWT verification later
  req.user = { _id: 'demo-user-id' }; // Demo user
  next();
};

// ===== ROOMS =====

// Get all rooms for a home
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ home: req.user._id }).sort({ order: 1 });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new room
router.post('/rooms', auth, async (req, res) => {
  try {
    const room = await Room.create({ ...req.body, home: req.user._id });
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a room
router.put('/rooms/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, home: req.user._id },
      req.body,
      { new: true }
    );
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a room
router.delete('/rooms/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ _id: req.params.id, home: req.user._id });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DEVICES =====

// Get all devices for a home
router.get('/devices', auth, async (req, res) => {
  try {
    const { room, type, online } = req.query;
    const query = { home: req.user._id };

    if (room) query.room = room;
    if (type) query.type = type;
    if (online !== undefined) query.online = online === 'true';

    const devices = await SmartDevice.find(query).populate('room');
    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single device
router.get('/devices/:id', auth, async (req, res) => {
  try {
    const device = await SmartDevice.findOne({ _id: req.params.id, home: req.user._id }).populate('room');
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new device
router.post('/devices', auth, async (req, res) => {
  try {
    const device = await SmartDevice.create({ ...req.body, home: req.user._id });
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update device state
router.patch('/devices/:id/state', auth, async (req, res) => {
  try {
    const device = await SmartDevice.findOne({ _id: req.params.id, home: req.user._id });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const previousState = { ...device.state.toObject() };

    // Update state
    Object.keys(req.body).forEach(key => {
      device.state[key] = req.body[key];
    });
    device.lastSeen = new Date();
    await device.save();

    // Log event
    await DeviceEvent.create({
      device: device._id,
      home: req.user._id,
      eventType: 'state_change',
      previousState,
      newState: device.state,
      triggeredBy: 'user',
      user: req.user._id
    });

    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a device
router.delete('/devices/:id', auth, async (req, res) => {
  try {
    const device = await SmartDevice.findOneAndDelete({ _id: req.params.id, home: req.user._id });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SCENES =====

// Get all scenes
router.get('/scenes', auth, async (req, res) => {
  try {
    const scenes = await Scene.find({ home: req.user._id }).populate('actions.device');
    res.json({ success: true, data: scenes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new scene
router.post('/scenes', auth, async (req, res) => {
  try {
    const scene = await Scene.create({ ...req.body, home: req.user._id });
    res.status(201).json({ success: true, data: scene });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Execute a scene
router.post('/scenes/:id/execute', auth, async (req, res) => {
  try {
    const scene = await Scene.findOne({ _id: req.params.id, home: req.user._id }).populate('actions.device');
    if (!scene) return res.status(404).json({ success: false, message: 'Scene not found' });

    // Execute each action
    for (const action of scene.actions) {
      const device = await SmartDevice.findById(action.device);
      if (device) {
        const previousState = { ...device.state.toObject() };

        // Apply action state
        Object.keys(action.state).forEach(key => {
          if (action.state[key] !== undefined) {
            device.state[key] = action.state[key];
          }
        });
        device.lastSeen = new Date();
        await device.save();

        // Log event
        await DeviceEvent.create({
          device: device._id,
          home: req.user._id,
          eventType: 'state_change',
          previousState,
          newState: device.state,
          triggeredBy: 'scene',
          scene: scene._id,
          user: req.user._id
        });
      }

      // Apply delay if specified
      if (action.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, action.delay));
      }
    }

    // Update scene execution stats
    scene.executionCount += 1;
    scene.lastExecuted = new Date();
    await scene.save();

    res.json({ success: true, message: 'Scene executed successfully', data: scene });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a scene
router.delete('/scenes/:id', auth, async (req, res) => {
  try {
    const scene = await Scene.findOneAndDelete({ _id: req.params.id, home: req.user._id });
    if (!scene) return res.status(404).json({ success: false, message: 'Scene not found' });
    res.json({ success: true, message: 'Scene deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== AUTOMATIONS =====

// Get all automations
router.get('/automations', auth, async (req, res) => {
  try {
    const automations = await Automation.find({ home: req.user._id })
      .populate('trigger.device')
      .populate('actions.device')
      .populate('actions.scene');
    res.json({ success: true, data: automations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new automation
router.post('/automations', auth, async (req, res) => {
  try {
    const automation = await Automation.create({ ...req.body, home: req.user._id });
    res.status(201).json({ success: true, data: automation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle automation enabled/disabled
router.patch('/automations/:id/toggle', auth, async (req, res) => {
  try {
    const automation = await Automation.findOne({ _id: req.params.id, home: req.user._id });
    if (!automation) return res.status(404).json({ success: false, message: 'Automation not found' });

    automation.enabled = !automation.enabled;
    await automation.save();

    res.json({ success: true, data: automation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete an automation
router.delete('/automations/:id', auth, async (req, res) => {
  try {
    const automation = await Automation.findOneAndDelete({ _id: req.params.id, home: req.user._id });
    if (!automation) return res.status(404).json({ success: false, message: 'Automation not found' });
    res.json({ success: true, message: 'Automation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== EVENTS & HISTORY =====

// Get device events/history
router.get('/events', auth, async (req, res) => {
  try {
    const { device, eventType, limit = 50 } = req.query;
    const query = { home: req.user._id };

    if (device) query.device = device;
    if (eventType) query.eventType = eventType;

    const events = await DeviceEvent.find(query)
      .populate('device')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get analytics/dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [devices, rooms, scenes, automations, recentEvents] = await Promise.all([
      SmartDevice.find({ home: req.user._id }),
      Room.find({ home: req.user._id }),
      Scene.find({ home: req.user._id }),
      Automation.find({ home: req.user._id }),
      DeviceEvent.find({ home: req.user._id }).sort({ createdAt: -1 }).limit(10).populate('device')
    ]);

    const deviceStats = {
      total: devices.length,
      online: devices.filter(d => d.online).length,
      offline: devices.filter(d => !d.online).length,
      byType: devices.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        devices: deviceStats,
        rooms: rooms.length,
        scenes: scenes.length,
        automations: {
          total: automations.length,
          enabled: automations.filter(a => a.enabled).length
        },
        recentEvents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== AI SUGGESTIONS =====

// Get automation suggestions based on usage patterns
router.get('/suggestions', auth, async (req, res) => {
  try {
    const automationEngine = require('../services/AutomationEngine');
    const suggestions = await automationEngine.getAutomationSuggestions(
      req.user._id,
      parseInt(req.query.limit) || 5
    );
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SEEDING DEMO DATA =====

router.post('/seed-demo', async (req, res) => {
  try {
    const userId = 'demo-user-id';

    // Clear existing data for demo user
    await Promise.all([
      Room.deleteMany({ home: userId }),
      SmartDevice.deleteMany({ home: userId }),
      Scene.deleteMany({ home: userId }),
      Automation.deleteMany({ home: userId }),
      DeviceEvent.deleteMany({ home: userId })
    ]);

    // Create rooms
    const livingRoom = await Room.create({ name: 'Living Room', home: userId, type: 'living_room', icon: 'sofa', order: 1 });
    const bedroom = await Room.create({ name: 'Bedroom', home: userId, type: 'bedroom', icon: 'bed', order: 2 });
    const kitchen = await Room.create({ name: 'Kitchen', home: userId, type: 'kitchen', icon: 'utensils', order: 3 });

    // Create devices
    const ceilingLight = await SmartDevice.create({
      deviceId: 'light.living.ceiling',
      name: 'Ceiling Light',
      type: 'light',
      room: livingRoom._id,
      home: userId,
      capabilities: ['on_off', 'brightness', 'color_temp'],
      state: { on: true, brightness: 80, colorTemp: 3000 },
      online: true
    });

    const bedLamp = await SmartDevice.create({
      deviceId: 'light.bedroom.lamp',
      name: 'Bed Lamp',
      type: 'light',
      room: bedroom._id,
      home: userId,
      capabilities: ['on_off', 'brightness'],
      state: { on: false, brightness: 50 },
      online: true
    });

    const thermostat = await SmartDevice.create({
      deviceId: 'thermostat.living.main',
      name: 'Main Thermostat',
      type: 'thermostat',
      room: livingRoom._id,
      home: userId,
      capabilities: ['temperature'],
      state: { temperature: 72, targetTemperature: 72 },
      online: true
    });

    const frontDoorLock = await SmartDevice.create({
      deviceId: 'lock.front.door',
      name: 'Front Door Lock',
      type: 'lock',
      room: livingRoom._id,
      home: userId,
      capabilities: ['lock', 'unlock'],
      state: { locked: true },
      online: true
    });

    // Create scenes
    await Scene.create({
      name: 'Good Morning',
      home: userId,
      icon: 'sun',
      type: 'predefined',
      actions: [
        { device: ceilingLight._id, state: { on: true, brightness: 100, colorTemp: 4000 }, delay: 0 },
        { device: thermostat._id, state: { targetTemperature: 70 }, delay: 0 },
        { device: frontDoorLock._id, state: { locked: false }, delay: 2000 }
      ],
      favorite: true
    });

    await Scene.create({
      name: 'Sleep Mode',
      home: userId,
      icon: 'moon',
      type: 'predefined',
      actions: [
        { device: ceilingLight._id, state: { on: false }, delay: 0 },
        { device: bedLamp._id, state: { on: true, brightness: 10 }, delay: 0 },
        { device: thermostat._id, state: { targetTemperature: 68 }, delay: 0 },
        { device: frontDoorLock._id, state: { locked: true }, delay: 0 }
      ],
      favorite: true
    });

    await Scene.create({
      name: 'Away Mode',
      home: userId,
      icon: 'shield',
      type: 'predefined',
      actions: [
        { device: ceilingLight._id, state: { on: false }, delay: 0 },
        { device: bedLamp._id, state: { on: false }, delay: 0 },
        { device: thermostat._id, state: { targetTemperature: 65 }, delay: 0 },
        { device: frontDoorLock._id, state: { locked: true }, delay: 0 }
      ]
    });

    // Create automations
    await Automation.create({
      name: 'Evening Lights',
      home: userId,
      enabled: true,
      type: 'time',
      trigger: {
        time: '18:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      },
      actions: [
        {
          type: 'device',
          device: ceilingLight._id,
          state: { on: true, brightness: 60, colorTemp: 2700 }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Demo data seeded successfully',
      data: {
        rooms: 3,
        devices: 4,
        scenes: 3,
        automations: 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
