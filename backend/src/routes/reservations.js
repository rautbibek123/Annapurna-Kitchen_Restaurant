const express = require('express');
const { body } = require('express-validator');
const { createReservation, getReservations, getMyReservations, updateReservationStatus, updateReservation } = require('../controllers/reservationController');
const validate = require('../middleware/validate');
const { protect, optionalProtect, authorize } = require('../middleware/auth');

const router = express.Router();

const reservationValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('date').notEmpty().withMessage('Date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('guests').notEmpty().withMessage('Number of guests is required'),
];

router.route('/')
  .post(optionalProtect, validate(reservationValidation), createReservation)
  .get(protect, authorize('admin', 'manager', 'staff'), getReservations);

router.get('/me', protect, getMyReservations);
router.put('/:id', protect, updateReservation);
router.put('/:id/status', protect, authorize('admin', 'manager', 'staff'), updateReservationStatus);

module.exports = router;
