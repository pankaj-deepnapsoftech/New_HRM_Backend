import Project from '../models/ProjectModel.js';

export const getAllProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const projectDetails = await Project.find()
            .skip(skip)
            .limit(limit)
            .populate({ path: 'manager', select: 'fname' })
            .populate({ path: 'members', select: 'fname' });

        res.status(200).json({
            statusCode: 200,
            data: {
                projectDetails,
                currentPage: page,
            },
            message: 'Paginated project details',
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch projects',
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

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete project',
            error: error.message,
        });
    }
};
