import z from 'zod';

export const BranchSchema = z.object({
    branchName: z.string().min(1, "Branch Name is required"),
});

export const DepartmentSchema = z.object({
    departmentName: z.string().min(1, "Department Name is required"),
});