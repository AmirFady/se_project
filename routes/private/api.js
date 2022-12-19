const { v4 } = require('uuid');
const db = require('../../connectors/db');
const roles = require('../../constants/roles');

module.exports = function(app) {
  // Register HTTP endpoint to get all users
  app.get('/api/v1/users', async function(req, res) {
    const results = await db.select('*').from('users');
    return res.json(results)
  });

  // Register HTTP endpoint to create new course
  app.post('/api/v1/courses', async function(req, res) {
    // Check if user already exists in the system
    const courseExists = await db.select('*').from('se_project.courses').where('code', req.body.code);
    if (!isEmpty(courseExists)) {
      return res.status(400).send('Course already exists');
    }    
    const newCourse = {
      course: req.body.course,
      code: req.body.code,
      facultyId: req.body.facultyId,
    };
    try {
      const course = await db('se_project.courses').insert(newCourse).returning('*');
      console.log(newCourse)
      return res.status(200).json(course);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not add course');
    }
  });

  // Register HTTP endpoint to drop course from enrollements
  app.put('/api/v1/courses/:courseId/drop', async function(req, res) {
    // Check if user already exists in the system
    try {
      const course = await db('se_project.enrollments').where('courseId',req.params.courseId).update('active', false);

    } catch(e){
        console.log(e);
        res.send("do not exist");
    };
});
  // Register HTTP endpoint to create new course
  app.post('/api/v1/courses', async function(req, res) {
    // Check if user already exists in the system
    const courseExists = await db.select('*').from('se_project.courses').where('code', req.body.code);
    if (!isEmpty(courseExists)) {
      return res.status(400).send('course exists');
    }
    
    const newCourse = {
      course: req.body.course,
      code: req.body.code,
      facultyId: req.body.facultyId,
    };
    try {
      const course = await db('se_project.courses').insert(newCourse).returning('*');
      console.log(newCourse)
      return res.status(200).json(course);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not add course');
    }
  });

  app.post('/api/v1/faculties/transfer', async function(req, res) {
    // Check if user already exists in the system
    const pending = await db.select('*').from('se_project.transfer_requests').where('status', "pending");

    if (!isEmpty(pending)) {
      return res.status(400).send('you already have a pending request');
    }
    
    const newrequest = {
      userId : req.body.userId,
      newFaculty: req.body.newFacultyId,
      currentfaculty: req.body.currentFacultyId,
    };
    try {
      const course = await db('se_project.courses').insert(newrequest).returning('*');
      return res.status(200).json(course);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not add request');
    }
  });

  app.get('/api/v1/faculties/:facultyId', async function(req, res) {
    
    try {
      const courses = await db.select('*').from('se_project.courses').where('facultyId', req.params.facultyId);
      return res.status(200).json(courses);
    } catch (e) {
      console.log(e.message);

      return res.status(400).send('Could not add request');
    }
  });

  app.get('/api/v1/enrollment/:courseId', async function(req, res) {
    
    try {
      const enrollment = await db.select('*').from('se_project.enrollments').where('courseId', req.params.courseId);
      return res.status(200).json(enrollment);
    } catch (e) {
      console.log(e.message);

      return res.status(400).send('Could not add request');
    }
  });

  app.put('/api/v1/enrollment/:courseId', async function(req, res) {
    const courseGrades = req.body.courseGrades
    try {
      for ( const record in courseGrades ) {
      const course = await db('se_project.enrollments')
      .where('courseId',req.params.courseId)
      .where('userId', record.userId)
      .update('grade', record.grade);
    }
      
    
      return res.status(200).json(course);
    } catch(e){
        console.log(e);
        res.send("do not exist");
    };
  });


}