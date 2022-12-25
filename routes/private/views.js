const { truncate } = require('lodash');
const db = require('../../connectors/db');
const roles = require('../../constants/roles');
const { getSessionToken } = require('../../utils/session');

const getUser = async function (req) {
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

module.exports = function (app) {

  app.get('/dashboard', async function (req, res) {
    const user = await getUser(req);
    return res.render('dashboard', user);
  });

  app.get('/transfer', async function (req, res) {
    const user = await getUser(req);
    const faculties = await db.select('*')
      .from('se_project.faculties');
    const pendingrequest = await db.select('*')
      .from('se_project.transfer_requests')
      .where('status', "pending")
      .innerJoin('se_project.faculties', 'se_project.faculties.fid', 'se_project.transfer_requests.newFacultyId');
    const requests = await db.select('*', 'tr.userId', 'se_project.users.firstName', 'se_project.users.lastName', 'newFac.faculty as nf', 'oldFac.faculty as of', 'tr.status', 'tr.request_date')
      .from('se_project.transfer_requests as tr')
      .where('status', "pending")
      .innerJoin('se_project.users', 'se_project.users.uid', 'tr.userId')
      .innerJoin('se_project.faculties as newFac', 'newFac.fid', 'tr.newFacultyId',)
      .innerJoin('se_project.faculties as oldFac', 'oldFac.fid', 'tr.currentFacultyId',);
    return res.render('transfer-requests', { ...user, requests, faculties, pendingrequest });
  });

  app.get('/courses', async function (req, res) {
    const user = await getUser(req);
    const courses = await db.select('*')
      .from('se_project.enrollments')
      .where('userId', user.uid)
      .where('active', true)
      .innerJoin('se_project.courses', 'se_project.courses.cid', 'se_project.enrollments.courseId');
    return res.render('courses', { ...user, courses });
  });

  app.get('/manage/transfers', async function (req, res) {
    const user = await getUser(req);
    const requests = await db.select('*', 'tr.userId', 'se_project.users.firstName', 'se_project.users.lastName', 'newFac.faculty as nf', 'oldFac.faculty as of', 'tr.status', 'tr.request_date')
      .from('se_project.transfer_requests as tr')
      .where('status', "pending")
      .innerJoin('se_project.users', 'se_project.users.uid', 'tr.userId')
      .innerJoin('se_project.faculties as newFac', 'newFac.fid', 'tr.newFacultyId',)
      .innerJoin('se_project.faculties as oldFac', 'oldFac.fid', 'tr.currentFacultyId',);
    return res.render('manage-requests', { requests, ...user });
  });

  app.get('/manage/grades', async function (req, res) {
    const user = await getUser(req);
    const courseId = req.query.courseId || false;
    const courses = await db.select('*')
      .from('se_project.courses');
    const enrollment_query = db.select('*').from('se_project.enrollments')
      .innerJoin('se_project.users', 'se_project.enrollments.userId', 'se_project.users.uid');
    if (courseId) {
      enrollment_query.where('courseId', courseId);
    };
    const enrollment = await enrollment_query;
    return res.render('manage-grades', { ...user, enrollment, courseId, courses });
  });

  app.get('/manage/courses', async function (req, res) {
    const user = await getUser(req);
    const facultyId = req.query.facultyId || false;
    const courses = await db.select('*')
      .from('se_project.courses');
    const faculty = await db.select('*')
      .from('se_project.faculties');
    const course_query = db.select('*').from('se_project.courses')
      .innerJoin('se_project.faculties', 'se_project.courses.facultyId', 'se_project.faculties.fid');
    if (facultyId) {
      course_query.where('facultyId', facultyId);
    };
    const course = await course_query;
    return res.render('manage-courses', { ...user, facultyId, course, faculty, courses });
  });

  app.get('/manage/courses/edit', async function (req, res) {
    const courseId = req.query.courseId;
    const user = await getUser(req);
    const course = await db.select('*')
      .from('se_project.courses')
      .where("cid", courseId)
      .innerJoin('se_project.faculties', 'se_project.courses.facultyId', 'se_project.faculties.fid');
    return res.render('edit-courses', { ...user, course });
  });

  app.get('/transcripts', async function (req, res) {
    const user = await getUser(req);
    const enrollment = await db.select('*')
      .from('se_project.enrollments')
      .where('userId', user.uid)
      .where('active', true)
      .innerJoin('se_project.courses', 'se_project.enrollments.courseId', 'se_project.courses.cid');
    const gr = await db.select('grade', 'credit hours as cr')
      .from('se_project.enrollments')
      .where('userId', user.uid)
      .where('active', true)
      .innerJoin('se_project.courses', 'se_project.enrollments.courseId', 'se_project.courses.cid');
    var a = 0;
    var c = 0;
    for (let i = 0; i < gr.length; i++) {

      if (gr[i].grade == 'A+') {
        c += gr[i].cr;
        a += 0.7 * gr[i].cr;
      }
      else if (gr[i].grade == 'A') {
        c += gr[i].cr;
        a += 1 * gr[i].cr;
      }
      else if (gr[i].grade == 'A-') {
        c += gr[i].cr;
        a += 1.3 * gr[i].cr;
      }
      else if (gr[i].grade == 'B+') {
        c += gr[i].cr;
        a += 1.7 * gr[i].cr;
      }
      else if (gr[i].grade == 'B') {
        c += gr[i].cr;
        a += 2 * gr[i].cr;
      }
      else if (gr[i].grade == 'B-') {
        c += gr[i].cr;
        a += 2.3 * gr[i].cr;
      }
      else if (gr[i].grade == 'C+') {
        c += gr[i].cr;
        a += 2.7 * gr[i].cr;
      }
      else if (gr[i].grade == 'C') {
        c += gr[i].cr;
        a += 3 * gr[i].cr;
      }
      else if (gr[i].grade == 'C-') {
        c += gr[i].cr;
        a += 3.3 * gr[i].cr;
      }
      else if (gr[i].grade == 'D+') {
        c += gr[i].cr;
        a += 3.7 * gr[i].cr;
      }
      else if (gr[i].grade == 'D') {
        c += gr[i].cr;
        a += 4 * gr[i].cr;
      }
      else if (gr[i].grade == 'F') {
        c += gr[i].cr;
        a += 5 * gr[i].cr;
      }
    }
    var gpa = a / c;
    gpa = Number(gpa).toFixed(2);
    return res.render('transcripts', { ...user, enrollment, gpa });
  });

};
