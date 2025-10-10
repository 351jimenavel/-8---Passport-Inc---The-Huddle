import express from 'express';
import { listUsers, deleteUser } from '../controllers/admin-controller.js'
const router = express.Router();
import requireAuthCookie from '../middlewares/requireAuthCookie.js'
import requireRole from '../middlewares/requireRole.js'
import validateCSRF from '../middlewares/validateCSRF.js'

router.get('/admin/users', requireAuthCookie, requireRole('ADMIN'), listUsers);
router.delete('/admin/users/:id', requireAuthCookie, requireRole('ADMIN'), validateCSRF ,deleteUser);

export default router