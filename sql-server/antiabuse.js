const fs = require('fs');
const path = require('path');

// Load the banlist
function loadBanlist() {
    try {
        const banlistPath = path.join(__dirname, 'banlist.json');
        const banlistData = fs.readFileSync(banlistPath, 'utf8');
        return JSON.parse(banlistData);
    } catch (error) {
        console.error('Error loading banlist:', error);
        return { banned_ips: [] };
    }
}

// Middleware to check if IP is banned
function checkIpBan(req, res, next) {
    const banlist = loadBanlist();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Remove IPv6 prefix if present
    const ipToCheck = clientIp.replace(/^::ffff:/, '');
    
    if (banlist.banned_ips.includes(ipToCheck)) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'Your IP address has been banned'
        });
    }
    
    next();
}

// Helper function to add an IP to the banlist
function banIp(ip) {
    try {
        const banlistPath = path.join(__dirname, 'banlist.json');
        const banlist = loadBanlist();
        
        if (!banlist.banned_ips.includes(ip)) {
            banlist.banned_ips.push(ip);
            banlist.last_updated = new Date().toISOString().split('T')[0];
            
            fs.writeFileSync(banlistPath, JSON.stringify(banlist, null, 4));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error banning IP:', error);
        return false;
    }
}

// Helper function to remove an IP from the banlist
function unbanIp(ip) {
    try {
        const banlistPath = path.join(__dirname, 'banlist.json');
        const banlist = loadBanlist();
        
        const index = banlist.banned_ips.indexOf(ip);
        if (index !== -1) {
            banlist.banned_ips.splice(index, 1);
            banlist.last_updated = new Date().toISOString().split('T')[0];
            
            fs.writeFileSync(banlistPath, JSON.stringify(banlist, null, 4));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error unbanning IP:', error);
        return false;
    }
}

module.exports = {
    checkIpBan,
    banIp,
    unbanIp
}; 