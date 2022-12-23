const { truncate } = require('lodash');
const db = require('../../connectors/db');
const roles = require('../../constants/roles');
const { getSessionToken } = require('../../utils/session');

const getUser = async function(req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect('/');
  }

  const user = await db.select('*')
    .from('se_project.sessions')
    .where('token', sessionToken)
    .innerJoin('se_project.users', 'se_project.sessions.userId', 'se_project.users.uid')
    .innerJoin('se_project.roles', 'se_project.users.roleId', 'se_project.roles.id')
    .innerJoin('se_project.faculties', 'se_project.users.facultyId', 'se_project.faculties.fid')
    .first();
  
  console.log('user =>', user)
  user.isStudent = user.roleId === roles.student;
  user.isAdmin = user.roleId === roles.admin;

  return user;  
}

module.exports = function(app) {
  // Register HTTP endpoint to render /users page
  app.get('/dashboard', async function(req, res) {
    const user = await getUser(req);
    return res.render('dashboard', user);
  });

  app.get('/transcripts', async function(req, res) {
    const user = await getUser(req);
    const enrollment = await db.select('*')
    .from('se_project.enrollments')
    .where('userId', user.uid)
    .innerJoin('se_project.courses', 'se_project.enrollments.courseId', 'se_project.courses.cid');
    const grade = [await db.select('grade').from('se_project.enrollments').where('userId', user.uid)];
    const hrs = [await db.select('').from('se_project.enrollments').where('userId', user.uid)];
    for(const i=0; i<grade.length-1; i++){
      if(grade[i]=='a'){
      

      }
    }
    return res.render('transcripts', { ...user,enrollment });
  });

// Register HTTP endpoint to render /courses page
  app.get('/transfer', async function(req, res) {
  const user = await getUser(req);
  const faculties = await db.select('*').from('se_project.faculties')
  const pendingrequest = await db.select('*')
  .from('se_project.transfer_requests')
  .where('status', "pending")
  .innerJoin('se_project.faculties', 'se_project.faculties.fid', 'se_project.transfer_requests.newFacultyId')
 const requests = await db.select('*')
 .from('se_project.transfer_requests')
 .innerJoin('se_project.faculties', 'se_project.faculties.fid', 'se_project.transfer_requests.newFacultyId')
  return res.render('transfer-requests', { ...user, requests, faculties, pendingrequest });
});

  
  // Register HTTP endpoint to render /courses page
  app.get('/courses', async function(req, res) {
    const user = await getUser(req);
    const courses = await db.select('*')
    .from('se_project.enrollments')
    .where('userId', user.uid)
    .where('active',true)
    .innerJoin('se_project.courses','se_project.courses.cid','se_project.enrollments.courseId')
    return res.render('courses', { ...user, courses });
  });


  
  // Register HTTP endpoint to render /courses page
  app.get('/manage/transfers', async function(req, res) {
    const user = await getUser(req);
    const requests = await db.select('*')
    .from('se_project.transfer_requests').where('status',"pending")
    .innerJoin('se_project.faculties', 'se_project.faculties.fid', 'se_project.transfer_requests.newFacultyId')
    .innerJoin('se_project.users','se_project.users.uid','se_project.transfer_requests.userId')

    return res.render('manage-requests', { requests, user });
  });

  // Register HTTP endpoint to render /courses page
  app.get('/manage/grades', async function(req, res) {
    const user = await getUser(req);
    const courseId = req.query.courseId || false;
    const courses = await db.select('*')
    .from('se_project.courses');
    const enrollment_query = db.select('*').from('se_project.enrollments')
    .innerJoin('se_project.users', 'se_project.enrollments.userId', 'se_project.users.uid');
    if(courseId) {
      enrollment_query.where('courseId',courseId);
    };
    const enrollment = await enrollment_query;
    return res.render('manage-grades', { ...user, enrollment, courseId, courses });
  });

  // Register HTTP endpoint to render /courses page
  app.get('/manage/courses', async function(req, res) {
    const user = await getUser(req);
    const facultyId = req.query.facultyId || false;
    const courses = await db.select('*')
    .from('se_project.courses')
    const faculty = await db.select('*')
    .from('se_project.faculties')
    const course_query = db.select('*').from('se_project.courses')
    .innerJoin('se_project.faculties', 'se_project.courses.facultyId', 'se_project.faculties.fid');
    if(facultyId) {
      course_query.where('facultyId',facultyId);
    };
    const course = await course_query;
    return res.render('manage-courses', { ...user, facultyId, course, faculty, courses });
  });
    // Register HTTP endpoint to render /courses page
    app.get('/manage/courses/edit', async function(req, res) {
      const courseId = req.query.courseId;
      const user = await getUser(req);
      const course = await db.select('*')
      .from('se_project.courses')
      .where("cid", courseId);
      const faculty = await db.select('*')
      .from('se_project.faculties');
      return res.render('edit-courses', { ...user, course, faculty });
    });

};
