/**
 * @desc Seed public course materials for testing.
 * All content is based on publicly available software engineering
 * knowledge — no copyrighted material. Safe for academic demo use.
 * Run: node data/seedPublicMaterials.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const Course = require('../models/Course')
const CourseMaterial = require('../models/CourseMaterial')
const User = require('../models/User')
const connectDB = require('../config/db')

const runSeed = async () => {
  try {
    await connectDB()

    const course = await Course.findOne({ isActive: true })
    if (!course) {
      console.log('No active course found')
      process.exit(0)
    }

    const uploader = await User.findOne({ role: { $in: ['instructor', 'admin'] } })
    if (!uploader) {
      console.log('No instructor or admin user found')
      process.exit(0)
    }

    const existing = await CourseMaterial.countDocuments({
      courseId: course._id,
      fileName: { $regex: /seed/i }
    })
    if (existing > 0) {
      console.log('Materials already seeded, skipping')
      process.exit(0)
    }

    const base = {
      courseId:           course._id,
      uploadedBy:         uploader._id,
      fileType:           'txt',
      isProcessed:        true,
      isVisibleToStudents: true,
      processingError:    null,
      // Placeholder GridFS ID — seeded materials have no real file upload
      gridfsId:           new mongoose.Types.ObjectId()
    }

    const materials = [
      {
        ...base,
        title:    'JavaScript Async Patterns Guide',
        fileName: 'javascript-async-patterns-seed.txt',
        fileSize: 2400,
        gridfsId: new mongoose.Types.ObjectId(),
        extractedText: `
JavaScript Async Patterns and Error Handling

Asynchronous programming is fundamental to JavaScript
development. The three main patterns are callbacks,
Promises, and async/await.

CALLBACKS
Callbacks are functions passed as arguments to other
functions. They were the original async pattern but
lead to callback hell when nested deeply.

PROMISES
Promises represent a value that may be available now
or in the future. Use .then() for success and
.catch() for errors. Promises can be chained.
Promise.all() runs multiple promises in parallel.

ASYNC/AWAIT
Async/await is syntactic sugar over Promises.
Always wrap await calls in try/catch blocks.
Async functions always return a Promise.
Use try/catch for error handling in async functions.

ERROR HANDLING BEST PRACTICES
Always use try/catch with async/await.
Return consistent error objects from API routes.
Use HTTP status codes correctly — 400 for client
errors, 401 for unauthorized, 403 for forbidden,
404 for not found, 500 for server errors.
Log errors with enough context for debugging.
Never expose stack traces to the client.

REST API DESIGN
Use nouns not verbs for endpoints — /users not /getUsers.
Use HTTP methods correctly — GET reads, POST creates,
PATCH updates, DELETE removes.
Return appropriate status codes with every response.
Use pagination for list endpoints.
Validate all input before processing.
`
      },
      {
        ...base,
        title:    'MongoDB and Database Design Guide',
        fileName: 'mongodb-database-design-seed.txt',
        fileSize: 2200,
        gridfsId: new mongoose.Types.ObjectId(),
        extractedText: `
MongoDB Database Design for Web Applications

MongoDB is a document-oriented NoSQL database.
Documents are stored as BSON — Binary JSON.
Collections group related documents together.

SCHEMA DESIGN PRINCIPLES
Design schemas based on how data is accessed.
Embed related data that is always read together.
Reference data that is updated independently.
Avoid deeply nested documents — keep schemas flat.
Use indexes on fields that are frequently queried.

MONGOOSE ODM
Mongoose provides schema validation for MongoDB.
Define schemas with types, required fields, defaults.
Use virtual fields for computed properties.
Middleware (pre/post hooks) run before or after operations.
Always handle Mongoose validation errors.

MONGODB INDEXES
Indexes speed up read queries but slow down writes.
Create compound indexes for queries on multiple fields.
Use sparse indexes for optional fields.
The _id field is automatically indexed.
Run explain() to check if queries use indexes.

GRIDFS FOR FILE STORAGE
GridFS splits large files into chunks.
Each chunk is stored as a separate document.
Files up to any size can be stored.
Stream files directly from GridFS to HTTP response.
Store file metadata separately from binary data.

AGGREGATION PIPELINE
Use aggregation for complex data transformations.
$match filters documents early in the pipeline.
$group calculates totals and averages.
$lookup performs joins between collections.
$project shapes the output documents.
`
      },
      {
        ...base,
        title:    'React Frontend Development Guide',
        fileName: 'react-frontend-development-seed.txt',
        fileSize: 2100,
        gridfsId: new mongoose.Types.ObjectId(),
        extractedText: `
React Frontend Development Best Practices

React is a JavaScript library for building user
interfaces using a component-based architecture.

COMPONENT DESIGN
Keep components small and focused on one task.
Separate UI components from data-fetching logic.
Use props for component configuration.
Use state for values that change over time.
Lift state up to the nearest common ancestor.

HOOKS
useState manages local component state.
useEffect handles side effects like API calls.
useContext shares data without prop drilling.
useCallback memoizes functions to prevent rerenders.
useMemo caches expensive computed values.
Custom hooks extract reusable stateful logic.

STATE MANAGEMENT
Keep state as close to where it is used as possible.
Context API works for global state like auth.
Avoid overusing global state — prefer local state.
Normalize complex data structures in state.

PERFORMANCE
Use React.memo to prevent unnecessary rerenders.
Lazy load routes and heavy components.
Use virtualization for long lists.
Profile with React DevTools before optimizing.
Avoid anonymous functions in JSX props.

AXIOS AND API CALLS
Use axios interceptors for auth headers.
Handle loading, error, and success states.
Cancel requests on component unmount.
Use a central API module not fetch in components.
Add retry logic for transient failures.
`
      },
      {
        ...base,
        title:    'Software Engineering Project Structure',
        fileName: 'software-engineering-project-seed.txt',
        fileSize: 2300,
        gridfsId: new mongoose.Types.ObjectId(),
        extractedText: `
Software Engineering Project Structure and Best Practices

A well-structured software project is easier to
maintain, test, and scale over time.

PROJECT STRUCTURE
Separate concerns — frontend, backend, database layers.
Group files by feature not by type.
Keep configuration in environment variables.
Document your setup steps in a README.
Use .gitignore to exclude sensitive files.

VERSION CONTROL WITH GIT
Write clear commit messages in imperative mood.
Use conventional commits — feat fix docs style.
Branch for new features — merge when complete.
Never commit sensitive data like API keys.
Tag releases with semantic versioning.

AUTHENTICATION AND SECURITY
Hash passwords with bcrypt before storing.
Use JWT tokens for stateless authentication.
Validate and sanitize all user input.
Rate limit authentication endpoints.
Use HTTPS in production — never HTTP.
Store secrets in environment variables.

TESTING STRATEGIES
Unit tests verify individual functions work correctly.
Integration tests verify components work together.
End-to-end tests verify complete user flows.
Test error cases not just happy paths.
Use Postman or similar tools for API testing.

DEPLOYMENT
Use environment-specific configuration files.
Automate deployment with CI/CD pipelines.
Monitor error rates and response times.
Use health check endpoints for monitoring.
Have a rollback plan before deploying to production.
`
      },
      {
        ...base,
        title:    'System Design and Architecture Guide',
        fileName: 'system-design-architecture-seed.txt',
        fileSize: 2000,
        gridfsId: new mongoose.Types.ObjectId(),
        extractedText: `
System Design and Architecture for Web Applications

System design involves making high-level decisions
about how software components are organized and
how they communicate.

THREE-TIER ARCHITECTURE
Presentation layer handles the user interface.
Application layer contains business logic and APIs.
Data layer manages data storage and retrieval.
Each layer communicates only with adjacent layers.
Separation of concerns makes each layer testable.

API DESIGN PATTERNS
REST uses HTTP methods and URLs to represent resources.
Use consistent naming conventions across endpoints.
Version your API — /api/v1/users not /api/users.
Return consistent response shapes from all endpoints.
Document your API endpoints clearly.

SCALABILITY CONSIDERATIONS
Design for failure — assume any component can fail.
Use caching to reduce database load.
Separate read and write operations when load is high.
Use message queues for async background processing.
Monitor and alert on key performance metrics.

DATA MODELING
Identify entities and their relationships early.
Design for the queries your application needs.
Normalize to reduce duplication, denormalize for speed.
Plan for data growth from the beginning.
Back up data regularly and test restoration.

CAPSTONE PROJECT CONSIDERATIONS
Start with a minimal working version — add features later.
Document your architecture decisions and why you made them.
Test your application end-to-end before submitting.
Make sure your README explains how to run the project.
Include example data so reviewers can test immediately.
`
      }
    ]

    const inserted = await CourseMaterial.insertMany(materials)
    console.log('Seeded', inserted.length, 'materials')
    console.log('Course:', course.title)

  } catch (err) {
    console.error('Seed error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

runSeed()
