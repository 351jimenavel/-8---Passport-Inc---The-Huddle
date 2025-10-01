import { UserRepository } from '../models/user.js';

export const listUsers = (req, res) => {
    const users = UserRepository.listAll();
    return res.json(users);
}

export const deleteUser = (req, res) => {
    const id = req.params.id;
    if (id === req.user.id){
        return res.status(400).send('Cannot delete yourself');
    }
    UserRepository.deleteById(id);
    return res.status(204).end();
}

