// Error Handler Middleware to catch and respond to errors
const errorHandler = (err, req, res, next) => {
    console.error(err.stack) // Log the error stack to the console for debugging
    // Send a response with the error status and message
    res.status(500).send({
        error: 'Something went wrong!',
        message: err.message || 'Internal Server Error' // Include error message if available
    })
}
module.exports = errorHandler