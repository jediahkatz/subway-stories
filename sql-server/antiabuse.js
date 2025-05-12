const fs = require('fs').promises;
const path = require('path');
const rateLimit = require('express-rate-limit');
const { MemoryStore } = require('express-rate-limit');

class AntiAbuseSystem {
    constructor() {
        this.suspiciousIPs = new Map();
        this.BLOCK_THRESHOLD = 15; // Increased from 5 to 15 rapid requests
        this.BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms
        this.SUSPICIOUS_INTERVAL = 8 * 1000; // Decreased from 15s to 8s - requests faster than 8 seconds apart are suspicious
        this.BURST_WINDOW = 60 * 1000; // 1 minute window to track bursts
        this.BURST_ALLOWANCE = 5; // Allow 5 bursts before considering for blocking
        this.STORAGE_PATH = path.join(__dirname, 'blocked-ips.json');
        this.CLEANUP_INTERVAL = 10 * 60 * 1000; // Clean up every 10 minutes
        this.NON_BLOCKED_TTL = 30 * 60 * 1000; // Remove non-blocked IPs after 30 minutes of inactivity
        
        // Load previously blocked IPs on startup
        this.loadBlockedIPs();
        
        // More frequent cleanup
        setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    }

    async loadBlockedIPs() {
        try {
            const data = await fs.readFile(this.STORAGE_PATH, 'utf8');
            const blockedIPs = JSON.parse(data);
            const now = Date.now();
            
            // Only load IPs that are still within their block duration
            Object.entries(blockedIPs).forEach(([ip, data]) => {
                if (now - data.blockTime < this.BLOCK_DURATION) {
                    this.suspiciousIPs.set(ip, {
                        ...data,
                        blocked: true
                    });
                }
            });
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error loading blocked IPs:', error);
            }
        }
    }

    async saveBlockedIPs() {
        const blockedIPs = {};
        for (const [ip, data] of this.suspiciousIPs.entries()) {
            if (data.blocked) {
                blockedIPs[ip] = {
                    ...data,
                    lastRequest: data.lastRequest,
                    blockTime: data.blockTime
                };
            }
        }
        
        try {
            await fs.writeFile(this.STORAGE_PATH, JSON.stringify(blockedIPs, null, 2));
        } catch (error) {
            console.error('Error saving blocked IPs:', error);
        }
    }

    cleanup() {
        const now = Date.now();
        let cleanupCount = 0;
        for (const [ip, data] of this.suspiciousIPs.entries()) {
            if (data.blocked) {
                // Clean up expired blocks
                if (now - data.blockTime > this.BLOCK_DURATION) {
                    this.suspiciousIPs.delete(ip);
                    cleanupCount++;
                }
            } else {
                // Clean up non-blocked IPs that haven't been seen in a while
                if (now - data.lastRequest > this.NON_BLOCKED_TTL) {
                    this.suspiciousIPs.delete(ip);
                    cleanupCount++;
                }
            }
        }
        if (cleanupCount > 0) {
            console.log(`Cleaned up ${cleanupCount} IP entries`);
            this.saveBlockedIPs();
        }

        // Log memory usage every hour
        if (now % (60 * 60 * 1000) < this.CLEANUP_INTERVAL) {
            const usage = process.memoryUsage();
            console.log('Memory usage:', {
                heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
                ipCount: this.suspiciousIPs.size
            });
        }
    }

    getClientIP(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (!forwarded) return req.connection.remoteAddress;
        return forwarded.split(',')[0].trim();
    }

    createMiddleware() {
        // Single rate limit for all endpoints
        const rateLimiter = rateLimit({
            windowMs: 60 * 1000,
            max: 60, // 60 requests per minute
            message: 'Too many requests, please try again later',
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => this.isIPBlocked(this.getClientIP(req)),
            store: new MemoryStore()
        });

        // Main anti-abuse middleware
        const antiAbuseMiddleware = async (req, res, next) => {
            const ip = this.getClientIP(req);
            const now = Date.now();

            // Check if IP is blocked
            if (this.isIPBlocked(ip)) {
                const error = new Error('IP has been blocked due to suspicious activity');
                error.status = 403;
                return next(error);
            }

            if (!this.suspiciousIPs.has(ip)) {
                this.suspiciousIPs.set(ip, {
                    lastRequest: now,
                    count: 1,
                    blocked: false,
                    firstRequest: now,
                    burstCount: 0,
                    lastBurst: 0,
                    rapidRequestsInWindow: 1
                });
                return next();
            }

            const ipData = this.suspiciousIPs.get(ip);
            const timeSinceLastRequest = now - ipData.lastRequest;

            // Reset burst count if outside burst window
            if (now - ipData.lastBurst > this.BURST_WINDOW) {
                ipData.burstCount = 0;
                ipData.rapidRequestsInWindow = 1;
            }

            // Check for suspicious rapid requests
            if (timeSinceLastRequest < this.SUSPICIOUS_INTERVAL) {
                ipData.rapidRequestsInWindow++;
                
                // If we hit the rapid request threshold, count it as a burst
                if (ipData.rapidRequestsInWindow >= 5) {
                    ipData.burstCount++;
                    ipData.lastBurst = now;
                    ipData.rapidRequestsInWindow = 0;
                    
                    // Only block if we see repeated bursts
                    if (ipData.burstCount >= this.BURST_ALLOWANCE) {
                        // Additional check: are bursts happening consistently?
                        const avgTimeBetweenBursts = (now - ipData.firstRequest) / ipData.burstCount;
                        if (avgTimeBetweenBursts < this.BURST_WINDOW) {
                            ipData.blocked = true;
                            ipData.blockTime = now;
                            console.log(`Blocking suspicious IP: ${ip} due to consistent rapid bursts`);
                            await this.saveBlockedIPs();
                            const error = new Error('IP has been blocked due to suspicious activity');
                            error.status = 403;
                            return next(error);
                        }
                    }
                }
            } else {
                // Not a rapid request, gradually decrease the rapid request count
                ipData.rapidRequestsInWindow = Math.max(0, ipData.rapidRequestsInWindow - 1);
            }

            ipData.lastRequest = now;
            this.suspiciousIPs.set(ip, ipData);
            next();
        };

        return {
            rateLimiter,
            antiAbuseMiddleware
        };
    }

    isIPBlocked(ip) {
        const data = this.suspiciousIPs.get(ip);
        if (!data || !data.blocked) return false;
        
        // Check if block duration has expired
        if (Date.now() - data.blockTime > this.BLOCK_DURATION) {
            this.suspiciousIPs.delete(ip);
            return false;
        }
        return true;
    }
}

module.exports = new AntiAbuseSystem(); 