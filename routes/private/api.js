const { v4 } = require('uuid');
const { isEmpty } = require('lodash');
const db = require('../../connectors/db');
const roles = require('../../constants/roles');
const innerJoin = require('inner-join');

module.exports = function (app) {

  app.put('/api/v1/courses/:courseId/drop', async function (req, res) {
    try {
      const course = await db('se_project.enrollments')
        .where('courseId', req.params.courseId)
        .where('userId', req.body.userId)
        .update('active', false);
      return res.status(200).send('dropped');
    } catch (e) {
      console.log(e);
      res.send("could not drop course");
      return res.status(400);
    };
  });

  app.post('/api/v1/faculties/transfer', async function (req, res) {
    const pending = await db.select('*')
      .from('se_project.transfer_requests')
      .where('userId', req.body.userId)
      .where('status', "pending");
    if (!isEmpty(pending)) {
      return res.status(400).send("you already have a pending request");
    }
    const newrequest = {
      userId: req.body.userId,
      newFacultyId: req.body.newFacultyId,
      currentFacultyId: req.body.currentFacultyId,
    };
    try {
      const course = await db('se_project.transfer_requests').insert(newrequest);
      return res.status(200).send("request added");
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not add request");
    }
  });

  app.post('/api/v1/transfers/:transferId', async function (req, res) {
    try {
      const update = await db('se_project.transfer_requests')
        .where('tid', req.params.transferId)
        .update('status', req.body.action);
      const transfer = await db('se_project.users')
        .where('uid', req.body.userId)
        .update('facultyId', req.body.newFacultyId);

      const courses = await db.select('cid')
        .from('se_project.courses')
        .where('facultyId', req.body.newFacultyId);
      console.log(courses.length);

      for (let i = 0; i < courses.length; i++) {
        const newenrollment = {
          'userId': req.body.userId,
          'courseId': courses[i].cid,
          'active': true,
        };
        const user = await db('se_project.enrollments').insert(newenrollment).returning('*');
      }



      return res.status(200).send("request accepted");
    } catch (e) {
      console.log(e);
      res.send("request rejected");
      return res.status(400);
    };
  });

  app.get('/api/v1/enrollment/:courseId', async function (req, res) {
    try {
      const enrollment = await db.select('*').from('se_project.enrollments').where('courseId', req.params.courseId)
      .innerJoin('se_project.users', 'se_project.enrollments.userId', 'se_project.users.uid');
      return res.status(200).json(enrollment);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not add request');
    }
  });

  app.put('/api/v1/enrollment/:courseId', async function (req, res) {
    try {
      const course = await db('se_project.enrollments')
        .where('courseId', req.params.courseId)
        .where('userId', req.body.userId)
        .update('grade', req.body.grade);
      return res.status(200).alert("successfully updated grades");
    } catch (e) {
      console.log(e);
      res.send("could not update grades");
    };
  });

  app.get('/api/v1/faculties/:facultyId', async function (req, res) {
    try {
      const courses = await db.select('*')
        .from('se_project.courses')
        .where('facultyId', req.params.facultyId);
      return res.status(200).json(courses);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("could not retrieve courses");
    }
  });

  app.delete('/api/v1/courses/:courseId', async function (req, res) {
    try {
      const deletecourses = await db.select('*')
        .from('se_project.courses')
        .where('cid', req.body.courseId)
        .delete("cid");
      const deleteenrollments = await db.select('*')
        .from('se_project.enrollments')
        .where('courseId', req.body.courseId)
        .delete("courseId");
      return res.status(200).json(deletecourses);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not delete course");
    }
  });

  app.put('/api/v1/courses/:courseId', async function (req, res) {
    try {
      const update = await db.select('*')
        .from('se_project.courses')
        .where('cid', req.params.courseId)
        .update('course', req.body.name)
        .update('code', req.body.code)
        .update('credit hours', req.body.hours);
      return res.status(200).json(update);
    } catch (e) {
      console.log(e);
      res.send("could not update");
    };
  });

}