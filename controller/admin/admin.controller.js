import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma.js";
import { superAdminDetailsSchema } from "../../utils/validation.js";

const adminLogin