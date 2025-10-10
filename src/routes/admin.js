import express from 'express';
import { listUsers, deleteUser } from '../controllers/admin-controller.js'
const router = express.Router();
import requireAuthCookie from '../middlewares/requireAuthCookie.js'
import requireRole from '../middlewares/requireRole.js'
import validateCSRF from '../middlewares/validateCSRF.js'
import { UserRepository } from '../models/user.js';

router.get('/admin', requireAuthCookie, requireRole('ADMIN'), (req, res) => {
    if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(24).toString('hex');
    }
    const users = UserRepository.listAll();
    const csrf = req.session?.csrfToken;
    res.render('admin', {users, csrf });
})

router.get('/admin/users', requireAuthCookie, requireRole('ADMIN'), listUsers);
router.delete('/admin/users/:id', requireAuthCookie, requireRole('ADMIN'), validateCSRF ,deleteUser);

export default router