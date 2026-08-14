/**
 * KASU Proctoring System - Real-Time Dashboard Gateway
 * File Path: server/services/socketServices.js
 */

let ioInstance = null;

const socketServices = {
    /**
     * Initializes Socket.IO with CORS rules matching the KASU admin client
     * @param {Object} server - Node HTTP Server Instance
     */
    init(server) {
        const { Server } = require('socket.io');
        ioInstance = new Server(server, {
            cors: {
                origin: "*", 
                methods: ["GET", "POST"]
            }
        });

        ioInstance.on('connection', (socket) => {
            console.log(`🔌 [Socket.IO] Client connected: ${socket.id}`);
            
            socket.on('join_admin_room', () => {
                socket.join('admin_dashboard');
                console.log(`👁️‍🗨️ [Socket.IO] Socket ${socket.id} joined admin_dashboard`);
            });

            socket.on('disconnect', () => {
                console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
            });
        });

        return ioInstance;
    },

    /**
     * Emits events to all connected admin dashboards in real time
     * @param {string} eventName - Name of event (e.g., 'new_violation')
     * @param {Object} data - Payload containing event details
     */
    emitToAdmins(eventName, data) {
        if (ioInstance) {
            ioInstance.to('admin_dashboard').emit(eventName, data);
            console.log(`📡 [Socket.IO Emission] Broadcasted '${eventName}' to admin dashboard.`);
        } else {
            console.warn("⚠️ [Socket.IO] Emit attempted before service initialization.");
        }
    }
};

module.exports = socketServices;