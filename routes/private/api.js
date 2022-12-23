const { v4 } = require('uuid');
const { isEmpty } = require('lodash');
const db = require('../../connectors/db');
const roles = require('../../constants/roles');

module.exports = function (app) {

  app.put('/api/v1/courses/:courseId/drop', async function (req, res) {
    try {
      const course = await db('se_project.enrollments')
        .where('courseId', req.params.courseId)
        .where('userId', req.body.userId)
        .update('active', false);
      console.log(course);
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
      return res.status(200).json(course);
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
      return res.status(200).json(update);
    } catch (e) {
      console.log(e);
      res.send("do not exist");
      return res.status(400);
    };
  });

  app.get('/api/v1/enrollment/:courseId', async function (req, res) {
    try {
      const enrollment = await db.select('*').from('se_project.enrollments').where('courseId', req.params.courseId);
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
      return res.status(200);
    } catch (e) {
      console.log(e);
      res.send("could not update");
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
      const courses = await db.select('*')
        .from('se_project.courses')
        .where('cid', req.body.courseId)
        .delete("courses");
      return res.status(200).json(courses);
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