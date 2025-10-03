import { string, object, array, date } from 'yup';

export const ProjectValidation = object({
    name: string().required("Please provide project's name"),
    manager: string().required('Please provide manager'),
    members: array()
        .of(string().required('Each member must be a valid user ID'))
        .min(1, 'Please select atleast 1 member for the project')
        .required('Please provide members'),
    startDate: date().required('Please provide project starting date'),
    endDate: date().required('Please provide project ending date'),
    description: string(),
});
