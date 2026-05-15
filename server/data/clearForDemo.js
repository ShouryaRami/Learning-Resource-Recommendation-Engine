/**
 * @desc Clears all transactional demo data from MongoDB.
 * Preserves: users, departments, courses, coursematerials,
 *   enrollments, coursetips (instructor content kept intact)
 * Clears: projects, savedresources, chatsessions, submissions,
 *   notifications, otps
 * Run: node server/data/clearForDemo.js
 * WARNING: Permanently deletes data — back up database first.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const db = mongoose.connection.db

  const [
    projects,
    saved,
    chats,
    submissions,
    notifications,
    otps
  ] = await Promise.all([
    db.collection('projects').deleteMany({}),
    db.collection('savedresources').deleteMany({}),
    db.collection('chatsessions').deleteMany({}),
    db.collection('submissions').deleteMany({}),
    db.collection('notifications').deleteMany({}),
    db.collection('otps').deleteMany({})
  ])

  console.log('Cleared for demo:')
  console.log(`  projects:       ${projects.deletedCount}`)
  console.log(`  savedresources: ${saved.deletedCount}`)
  console.log(`  chatsessions:   ${chats.deletedCount}`)
  console.log(`  submissions:    ${submissions.deletedCount}`)
  console.log(`  notifications:  ${notifications.deletedCount}`)
  console.log(`  otps:           ${otps.deletedCount}`)
  console.log('')
  console.log('Preserved: users, courses, enrollments, materials, tips, departments.')

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('clearForDemo error:', err.message)
  process.exit(1)
})
