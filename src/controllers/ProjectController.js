//projectcontroller.js 

import Project from '../models/projectModel.js';

export const getAllProjects = async (req, res) => {
  try {
    const projectDetails = await Project.find()
      .populate({ path: 'manager', select: 'fname' }) 
      .populate({ path: 'members', select: 'fname' });

    res.status(200).json({
      statusCode: 200,
      data: {
        projectDetails,
        totalProjects: projectDetails.length,
      },
      message: "All project details"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message
    });
  }
};

export const createProjects = async (req, res) => {
  try {
   

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (err) {
     
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: err.message,
    });
  }
};


