// import { StatusCodes } from 'http-status-codes';
// import Project from '../models/ProjectModel.js';
// import { AsyncHandler } from '../utils/AsyncHandler.js';
// import { BadRequestError } from '../utils/CustomError.js';

// export const createProjects = AsyncHandler(async (req, res) => {
//   const result = await Project.create({...req.body});

//   if (!result) {
//     throw BadRequestError("Couldn't create project", "createProjectsHandler");
//   }

//   return res.status(StatusCodes.CREATED).json({
//     success: true,
//     message: "Project created successfully",
//     data: result,
//   });
// });

// export const getAllProjectsWithPagination = AsyncHandler(async (req, res) => {
// 	let { page=1, limit=10 } = req.query;

// 	// convert to numbers
// 	page = parseInt(page);
// 	limit = parseInt(limit);

// 	const skip = (page - 1) * limit;

// 	// fetch paginated employees
// 	const [projects, total] = await Promise.all([
// 		Project.find()
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1 }),
//     Project.countDocuments()
// 	]);

//   const totalPages = Math.ceil(total / limit);

//   return res.status(StatusCodes.OK).send({
//     success: true,
//     message: "project list retrieved successfully",
//     data: projects,
//     pagination: {
//       total,
//       page,
//       totalPages,
//       limit
//     }
//   });
// });



import Project from '../models/projectModel.js';

export const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

   
    const projectDetails = await Project.find()
      .skip(skip)
      .limit(limit)
      .populate({ path: 'manager', select: 'fullName' })
      .populate({ path: 'members', select: 'fullName' });



    res.status(200).json({
      statusCode: 200,
      data: {
        projectDetails,
        currentPage: page,
      },
      message: "All project details",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message,
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


