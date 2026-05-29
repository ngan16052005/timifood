// Simulation for Shipper GPS Tracking
const activeSimulations = {};

function startSimulation(io, orderId, userId) {
    if (activeSimulations[orderId]) {
        clearInterval(activeSimulations[orderId]);
    }

    // Starting coordinate (e.g. restaurant location or random nearby location)
    // Ho Chi Minh City coordinates: 10.762622, 106.660172
    let lat = 10.762622 + (Math.random() - 0.5) * 0.05;
    let lng = 106.660172 + (Math.random() - 0.5) * 0.05;

    console.log(`Starting Shipper Simulation for Order ${orderId}`);

    activeSimulations[orderId] = setInterval(() => {
        // Move shipper slightly towards a random direction
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;

        // Broadcast to user's room and admin room
        io.to(userId).emit('shipperLocation', {
            orderId,
            lat,
            lng,
            timestamp: Date.now()
        });
        io.to('adminRoom').emit('shipperLocation', {
            orderId,
            lat,
            lng,
            timestamp: Date.now()
        });
    }, 3000); // Send update every 3 seconds
}

function stopSimulation(orderId) {
    if (activeSimulations[orderId]) {
        console.log(`Stopping Shipper Simulation for Order ${orderId}`);
        clearInterval(activeSimulations[orderId]);
        delete activeSimulations[orderId];
    }
}

module.exports = {
    startSimulation,
    stopSimulation
};
