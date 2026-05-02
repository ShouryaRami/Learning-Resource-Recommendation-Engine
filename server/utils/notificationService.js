/**
 * @desc Notification service.
 * Sends email notifications for key system events.
 * All functions are fire-and-forget — errors are logged
 * but never re-thrown so a failed email never breaks the caller.
 */
const { sendMail } = require('../config/mailer')

/**
 * @desc Notify student when enrollment is approved
 * @param {{ fullName: string, email: string }} student
 * @param {{ title: string, code: string }} course
 */
const notifyEnrollmentApproved = async (student, course) => {
  try {
    await sendMail(
      student.email,
      `Enrollment Approved — ${course.title}`,
      `
        <div style="font-family:Arial,sans-serif;
          max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#C7A84F">Enrollment Approved</h2>
          <p>Hi ${student.fullName},</p>
          <p>Your enrollment in <strong>${course.title}
          (${course.code})</strong> has been approved.</p>
          <p>You now have access to course materials,
          recommendations, and the AI assistant for
          this course.</p>
          <p style="margin-top:24px;color:#666;font-size:13px">
            UMBC Learn — Learning Resource Recommendation Engine
          </p>
        </div>
      `
    )
  } catch (err) {
    console.error('notifyEnrollmentApproved error:', err.message)
  }
}

/**
 * @desc Notify student when enrollment is rejected
 * @param {{ fullName: string, email: string }} student
 * @param {{ title: string }} course
 */
const notifyEnrollmentRejected = async (student, course) => {
  try {
    await sendMail(
      student.email,
      `Enrollment Update — ${course.title}`,
      `
        <div style="font-family:Arial,sans-serif;
          max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#C7A84F">Enrollment Update</h2>
          <p>Hi ${student.fullName},</p>
          <p>Your enrollment request for
          <strong>${course.title}</strong>
          was not approved at this time.</p>
          <p>Please contact your instructor if you
          have any questions.</p>
          <p style="margin-top:24px;color:#666;font-size:13px">
            UMBC Learn — Learning Resource Recommendation Engine
          </p>
        </div>
      `
    )
  } catch (err) {
    console.error('notifyEnrollmentRejected error:', err.message)
  }
}

/**
 * @desc Notify student when project pitch is approved
 * @param {{ fullName: string, email: string }} student
 * @param {{ title: string }} project
 */
const notifyProjectApproved = async (student, project) => {
  try {
    await sendMail(
      student.email,
      `Project Approved — ${project.title}`,
      `
        <div style="font-family:Arial,sans-serif;
          max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#C7A84F">Project Approved</h2>
          <p>Hi ${student.fullName},</p>
          <p>Your project <strong>${project.title}</strong>
          has been approved.</p>
          <p>You can now view your personalized
          recommendations and learning path for
          this project.</p>
          <p style="margin-top:24px;color:#666;font-size:13px">
            UMBC Learn — Learning Resource Recommendation Engine
          </p>
        </div>
      `
    )
  } catch (err) {
    console.error('notifyProjectApproved error:', err.message)
  }
}

/**
 * @desc Notify student when project pitch is rejected
 * @param {{ fullName: string, email: string }} student
 * @param {{ title: string }} project
 * @param {string} feedback - Instructor feedback text (optional)
 */
const notifyProjectRejected = async (student, project, feedback) => {
  try {
    await sendMail(
      student.email,
      `Project Update — ${project.title}`,
      `
        <div style="font-family:Arial,sans-serif;
          max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#C7A84F">Project Update</h2>
          <p>Hi ${student.fullName},</p>
          <p>Your project <strong>${project.title}</strong>
          was not approved at this time.</p>
          ${feedback ? `
          <p><strong>Instructor feedback:</strong></p>
          <p style="background:#f5f5f5;padding:12px;
            border-radius:4px">${feedback}</p>
          ` : ''}
          <p>You may revise and resubmit your pitch.</p>
          <p style="margin-top:24px;color:#666;font-size:13px">
            UMBC Learn — Learning Resource Recommendation Engine
          </p>
        </div>
      `
    )
  } catch (err) {
    console.error('notifyProjectRejected error:', err.message)
  }
}

/**
 * @desc Notify enrolled students when new material is uploaded
 * @param {Array<{ fullName: string, email: string }>} students
 * @param {{ title: string, code: string }} course
 * @param {string} materialName - Title of the uploaded material
 */
const notifyNewMaterial = async (students, course, materialName) => {
  try {
    for (const student of students) {
      await sendMail(
        student.email,
        `New Material — ${course.title}`,
        `
          <div style="font-family:Arial,sans-serif;
            max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#C7A84F">New Course Material</h2>
            <p>Hi ${student.fullName},</p>
            <p>A new material has been added to
            <strong>${course.title}</strong>:</p>
            <p style="background:#f5f5f5;padding:12px;
              border-radius:4px;font-weight:bold">
              ${materialName}
            </p>
            <p>Log in to view the material and updated
            recommendations.</p>
            <p style="margin-top:24px;color:#666;font-size:13px">
              UMBC Learn — Learning Resource Recommendation Engine
            </p>
          </div>
        `
      )
    }
  } catch (err) {
    console.error('notifyNewMaterial error:', err.message)
  }
}

module.exports = {
  notifyEnrollmentApproved,
  notifyEnrollmentRejected,
  notifyProjectApproved,
  notifyProjectRejected,
  notifyNewMaterial
}
