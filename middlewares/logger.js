// Logger Middleware to log details of each request
const logger = (req, res, next) => {
    const method = req.method // Get the HTTP method (GET, POST, etc.)
    const url = req.url // Get the requested URL
    const timestamp = new Date().toISOString() // Get the timestamp for the request
    // Log the details in the console
    console.log(`[${timestamp}] ${method} ${url}`)
    next() // Call next middleware or route handler
}
module.exports = logger